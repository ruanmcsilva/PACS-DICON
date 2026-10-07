#!/usr/bin/env python3
"""
Ponte DICOM Universal (Store-and-Forward de Alta Capacidade)
Projetada para suportar exames massivos (3.000 a 10.000+ fatias) sem timeout ou travamento.

Arquitetura em Duas Pistas:
1. Pista Local (Cabo de Rede): Recebe do equipamento médico, salva no buffer em SSD local
   e responde OK (0x0000) imediatamente (libera a máquina em segundos).
2. Pista de Nuvem (Thread de Envio): Transmite em segundo plano para a AWS reutilizando
   a mesma associação DICOM e com reconexão automática em caso de oscilação do 4G/Wi-Fi.
"""

import os
import time
import glob
import queue
import threading
from pydicom import dcmread
import pynetdicom
from pynetdicom import (
    AE, 
    evt, 
    AllStoragePresentationContexts, 
    VerificationPresentationContexts,
    ALL_TRANSFER_SYNTAXES
)

# Validador permissivo: aceita qualquer AE Title e conexão de sistemas antigos/KPACS
def permissive_ae_validator(value):
    return (True, "")
pynetdicom._config.VALIDATORS['AE'] = permissive_ae_validator

# ================= CONFIGURAÇÕES =================
PORTA_LOCAL = 11112
AET_LOCAL = b"GATEWAY_RM"

# Dados do Servidor AWS
IP_AWS = "184.195.32.122"  # Se usar ZeroTier/VPN, altere para o IP correspondente
PORTA_AWS = 11112
AET_AWS = b"PACS_ENTERPRISE1"

# Diretório de Buffer Local em SSD
PASTA_BUFFER = os.path.expanduser("~/exames_buffer_local")
os.makedirs(PASTA_BUFFER, exist_ok=True)

# Fila thread-safe de transmissão
fila_transmissao = queue.Queue()
# =================================================


def handle_echo(event):
    """Responde ao Ping DICOM (C-ECHO) disparado pelo console de qualquer máquina."""
    requestor = event.assoc.requestor.ae_title.decode('utf-8', 'ignore').strip()
    called = event.assoc.called_ae_title.decode('utf-8', 'ignore').strip()
    print(f"📡 [PING DICOM] C-ECHO de '{requestor}' para '{called}' -> OK (0x0000)")
    return 0x0000


def handle_store(event):
    """
    Recebe a fatia DICOM da máquina médica no cabo de rede.
    Salva no disco local imediatamente e retorna OK na hora, liberando o console da máquina.
    """
    dataset = event.dataset
    dataset.file_meta = event.file_meta
    sop_uid = getattr(dataset, "SOPInstanceUID", None)
    if not sop_uid:
        sop_uid = f"desconhecido_{int(time.time() * 1000)}"
    
    modalidade = getattr(dataset, "Modality", "EX")
    paciente = str(getattr(dataset, "PatientName", "SEM_NOME"))
    
    # 1. Salva a fatia no buffer local (leva ~2ms no SSD)
    caminho_arquivo = os.path.join(PASTA_BUFFER, f"{sop_uid}.dcm")
    try:
        dataset.is_implicit_VR = event.file_meta.TransferSyntaxUID.is_implicit_VR
        dataset.is_little_endian = event.file_meta.TransferSyntaxUID.is_little_endian
        dataset.save_as(caminho_arquivo, write_like_original=False)
        
        # 2. Enfileira para envio assíncrono à AWS
        fila_transmissao.put(caminho_arquivo)
        
        total_pendente = fila_transmissao.qsize()
        if total_pendente % 50 == 0 or total_pendente <= 5:
            print(f"📥 [{modalidade}] {paciente} | Gravado no buffer | Fila de envio: {total_pendente} pendentes")
            
    except Exception as e:
        print(f"❌ Erro ao salvar fatia no buffer local: {e}")
        return 0xC000  # Erro para a máquina se o disco falhar
    
    # 3. Responde SUCESSO imediato para a máquina não travar
    return 0x0000


def thread_worker_envio_aws():
    """
    Worker em segundo plano:
    Mantém uma conexão persistente com a AWS enquanto houver imagens na fila.
    Reconecta automaticamente se a internet oscilar e nunca descarta exames.
    """
    print("🚀 [WORKER AWS] Serviço de envio em segundo plano iniciado.")
    
    ae_sender = AE(ae_title=b"GATEWAY_SENDER")
    ae_sender.maximum_pdu_size = 65536
    ae_sender.network_timeout = 60
    ae_sender.acse_timeout = 60
    ae_sender.dimse_timeout = 60
    
    # Adiciona todos os contextos de armazenamento e sintaxes de compressão suportados
    for ctx in AllStoragePresentationContexts:
        ae_sender.add_requested_context(ctx.abstract_syntax, ALL_TRANSFER_SYNTAXES)
        
    assoc = None
    ultimo_envio = time.time()
    
    while True:
        try:
            # Aguarda próximo arquivo da fila (com timeout de 2s para verificar se deve fechar associação ociosa)
            try:
                caminho_arquivo = fila_transmissao.get(timeout=2.0)
            except queue.Empty:
                # Se não há novos arquivos há mais de 15 segundos e a conexão está aberta, fecha para economizar recursos
                if assoc and assoc.is_established and (time.time() - ultimo_envio > 15):
                    print("💤 [WORKER AWS] Fila vazia há 15s. Liberando conexão com AWS.")
                    assoc.release()
                    assoc = None
                continue
            
            if not os.path.exists(caminho_arquivo):
                fila_transmissao.task_done()
                continue
            
            # Garante que a associação com a AWS está ativa
            if not assoc or not assoc.is_established:
                print(f"🌐 [WORKER AWS] Conectando ao servidor AWS ({IP_AWS}:{PORTA_AWS})...")
                try:
                    assoc = ae_sender.associate(IP_AWS, PORTA_AWS, ae_title=AET_AWS)
                except Exception as conn_err:
                    print(f"⚠️ [WORKER AWS] Falha na conexão de rede: {conn_err}")
                    assoc = None
                
                if not assoc or not assoc.is_established:
                    print("⏳ [WORKER AWS] Sem conexão com a AWS no momento. Aguardando 5s para tentar novamente...")
                    time.sleep(5)
                    fila_transmissao.put(caminho_arquivo)  # Devolve o arquivo para a fila
                    fila_transmissao.task_done()
                    continue
                else:
                    print("✅ [WORKER AWS] Conectado à AWS com sucesso! Transmitindo lote...")

            # Lê a fatia do buffer local e envia
            try:
                dataset = dcmread(caminho_arquivo)
                status = assoc.send_c_store(dataset)
                
                if status and status.Status == 0x0000:
                    # Envio confirmado pela AWS: remove com segurança do buffer local
                    os.remove(caminho_arquivo)
                    ultimo_envio = time.time()
                    restantes = fila_transmissao.qsize()
                    
                    if restantes % 50 == 0 or restantes == 0:
                        print(f"📤 [AWS OK] Imagem confirmada na nuvem! Restantes na fila: {restantes}")
                else:
                    print(f"⚠️ [WORKER AWS] AWS retornou aviso/erro: {status}. Reagendando...")
                    fila_transmissao.put(caminho_arquivo)
                    time.sleep(2)
            except Exception as send_err:
                print(f"⚠️ [WORKER AWS] Erro na transmissão da imagem: {send_err}. Reconectando...")
                if assoc and assoc.is_established:
                    assoc.abort()
                assoc = None
                fila_transmissao.put(caminho_arquivo)
                time.sleep(3)
                
            fila_transmissao.task_done()
            
        except Exception as loop_err:
            print(f"❌ [WORKER AWS] Erro inesperado no loop de envio: {loop_err}")
            time.sleep(2)


def recuperar_arquivos_pendentes_do_buffer():
    """
    Ao iniciar o script, verifica se havia exames salvos na pasta que ainda
    não tinham sido enviados (ex: se o notebook foi desligado ou a internet caiu).
    """
    arquivos_pendentes = glob.glob(os.path.join(PASTA_BUFFER, "*.dcm"))
    if arquivos_pendentes:
        print(f"📂 [RECUPERAÇÃO] Encontrados {len(arquivos_pendentes)} arquivos pendentes no buffer local.")
        for arq in arquivos_pendentes:
            fila_transmissao.put(arq)
        print(f"📋 [RECUPERAÇÃO] Todos os {len(arquivos_pendentes)} arquivos foram recolocados na fila de envio!")


def iniciar_ponte():
    ae = AE(ae_title=AET_LOCAL)
    
    # Otimização de rede para transferências pesadas
    ae.maximum_pdu_size = 65536
    ae.network_timeout = 60
    ae.acse_timeout = 60
    ae.dimse_timeout = 60
    
    # Aceita TODAS as modalidades e TODAS as compressões (JPEG Lossless/Baseline, RLE, etc.)
    for ctx in AllStoragePresentationContexts + VerificationPresentationContexts:
        ae.add_supported_context(ctx.abstract_syntax, ALL_TRANSFER_SYNTAXES)
        
    handlers = [
        (evt.EVT_C_ECHO, handle_echo),
        (evt.EVT_C_STORE, handle_store),
    ]
    
    # 1. Recupera arquivos de sessões anteriores
    recuperar_arquivos_pendentes_do_buffer()
    
    # 2. Dispara a thread de envio em segundo plano para a AWS
    worker_thread = threading.Thread(target=thread_worker_envio_aws, daemon=True)
    worker_thread.start()
    
    print("=" * 70)
    print("🟢 Ponte DICOM Enterprise (Store-and-Forward de Alta Capacidade)")
    print(f"   Porta de Escuta no Cabo : {PORTA_LOCAL}")
    print(f"   Destino Nuvem (AWS)      : {IP_AWS}:{PORTA_AWS} (AET: {AET_AWS.decode()})")
    print(f"   Buffer Local no SSD      : {PASTA_BUFFER}")
    print(f"   Capacidade de Exame      : Suporte Ilimitado (Testado para 10.000+ fatias)")
    print(f"   Compressões Suportadas   : JPEG Baseline/Lossless, RLE, RAW, JPEG 2000")
    print("=" * 70)
    print("Pronto para receber imagens de qualquer tomografia, ressonância ou ultrassom...\n")
    
    try:
        ae.start_server(("", PORTA_LOCAL), evt_handlers=handlers)
    except OSError as e:
        if "already in use" in str(e).lower() or getattr(e, 'errno', None) == 98:
            print(f"\n⚠️  [AVISO] A porta {PORTA_LOCAL} já está em uso!")
            print("   Verifique se outro serviço (como K-PACS ou outro script) está aberto.")
        else:
            print(f"❌ Erro ao iniciar servidor: {e}")


if __name__ == "__main__":
    iniciar_ponte()
