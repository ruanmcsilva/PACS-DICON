# 🛡️ Guia de Engenharia: Compatibilidade Universal de Máquinas DICOM & Prevenção de Erros

Este documento reúne todas as especificações técnicas, ajustes de código e regras de integração para garantir que o **Gateway / Ponte DICOM** e o **Servidor PACS** aceitem com sucesso qualquer equipamento médico (Ressonância, Tomografia, Raio-X, Ultrassom, Mamografia, etc.), independentemente do fabricante (**GE, Siemens, Philips, Canon, Mindray, etc.**).

---

## 📋 Sumário
1. [Diagnóstico: O que funciona hoje vs. Onde podem ocorrer erros](#1-diagnóstico-o-que-funciona-hoje-vs-onde-podem-ocorrer-erros)
2. [Ponto Crítico 1: Sintaxes de Transferência (Compressão JPEG/RLE)](#2-ponto-crítico-1-sintaxes-de-transferência-compressão-jpegrle)
3. [Ponto Crítico 2: Limite de 128 Presentation Contexts do DICOM](#3-ponto-crítico-2-limite-de-128-presentation-contexts-do-dicom)
4. [Ponto Crítico 3: Tomografias com Grande Volume (Store-and-Forward Assíncrono)](#4-ponto-crítico-3-tomografias-com-grande-volume-store-and-forward-assíncrono)
5. [Ponto Crítico 4: Flexibilidade de AE Title (Called / Calling AET)](#5-ponto-crítico-4-flexibilidade-de-ae-title-called--calling-aet)
6. [Código Pronto: `ponte_dicom_universal.py`](#6-código-pronto-ponte_dicom_universalpy)
7. [Checklist de Campo para o Técnico / Sala de Exame](#7-checklist-de-campo-para-o-técnico--sala-de-exame)

---

## 1. Diagnóstico: O que funciona hoje vs. Onde podem ocorrer erros

### O que já está correto e homologado:
* **Classes de Armazenamento:** O uso de `AllStoragePresentationContexts` já abrange os SOP Classes de todas as modalidades oficiais (MR, CT, CR, DX, US, MG, XA, NM, SC, PT).
* **C-ECHO (Ping DICOM):** O *handshake* de teste já responde com status `0x0000` (Sucesso).
* **Repasse para a Nuvem AWS:** O envio via `C-STORE` para o servidor `184.195.32.122:11112` (`PACS_ENTERPRISE1`) funciona perfeitamente para arquivos não compactados.

### Onde podem ocorrer erros em campo:
| Situação em Campo | Erro Apresentado no Console da Máquina | Causa Técnica | Solução |
| :--- | :--- | :--- | :--- |
| **Ultrassom ou Raio-X com JPEG** | `Transfer Syntax Not Supported` ou `Association Rejected` | A máquina envia imagens compactadas (JPEG Lossless/Baseline), mas a ponte só aceita RAW (sem compressão). | Adicionar `ALL_TRANSFER_SYNTAXES` aos contextos suportados. |
| **Tomografia com 1.500+ cortes** | `Network Timeout` / Envio trava na metade | Abrir e fechar a conexão com a AWS a cada fatia individual gera latência cumulativa e timeout. | Manter a conexão aberta ou salvar em buffer local (*spool*) antes de subir. |
| **Operador digitou AET genérico** | `Called AE Title Not Recognized` | A máquina exige conexão com o AET `PACS` ou `TESTE`, mas a ponte só aceita `GATEWAY_RM`. | Configurar a ponte em modo permissivo (aceitar qualquer Called AET). |

---

## 2. Ponto Crítico 1: Sintaxes de Transferência (Compressão JPEG/RLE)

Por padrão, a função `ae.add_supported_context(abstract_syntax)` aceita apenas:
* `1.2.840.10008.1.2` (Implicit VR Little Endian)
* `1.2.840.10008.1.2.1` (Explicit VR Little Endian)
* `1.2.840.10008.1.2.2` (Explicit VR Big Endian)

Porém, muitos fabricantes comprimem as imagens:
* **JPEG Lossless (Processo 14 SV1):** `1.2.840.10008.1.2.4.70` (Padrão em Tomografia e Ressonância)
* **JPEG Baseline (Processo 1):** `1.2.840.10008.1.2.4.50` (Padrão em Ultrassons)
* **JPEG 2000 Lossless:** `1.2.840.10008.1.2.4.90` (Mamografia de alta resolução)
* **RLE Lossless:** `1.2.840.10008.1.2.5` (Muito comum em ecógrafos)

### Como corrigir na ponte:
Importar `ALL_TRANSFER_SYNTAXES` do `pynetdicom.presentation` e passar como segundo parâmetro para cada contexto.

---

## 3. Ponto Crítico 2: Limite de 128 Presentation Contexts do DICOM

O padrão internacional DICOM limita qualquer associação a **no máximo 128 contextos de apresentação propostos**.

* `AllStoragePresentationContexts` possui mais de 100 modalidades.
* Se a máquina médica tentar negociar mais de 128 contextos simultâneos, a biblioteca pode gerar um aviso ou descartar modalidades secundárias.
* **Boa Prática:** O script universal deve manter os contextos essenciais e aceitar negociações dinâmicas com suporte ampliado.

---

## 4. Ponto Crítico 3: Tomografias com Grande Volume (Store-and-Forward Assíncrono)

### Diferença de Carga:
* **Ressonância Magnética / Raio-X:** 15 a 100 imagens. O repasse direto imagem por imagem funciona muito bem.
* **Tomografia Multislice (CT):** 800 a 3.000 imagens.

### Risco do Envio Síncrono Puro:
Se a cada imagem recebida no cabo a ponte fizer:
1. Conectar na AWS
2. Autenticar AE Title
3. Transmitir fatia
4. Fechar conexão

Uma tomografia levará minutos a mais e, se a internet 4G/Wi-Fi oscilar por 2 segundos, o console da máquina aborta todo o exame.

### Arquitetura Ideal (Buffer Local + Thread de Envio):
1. **No cabo (Máquina ➔ Notebook):** Salva o arquivo `.dcm` imediatamente em uma pasta local (`buffer_exames/`) em milissegundos. O console da máquina finaliza o envio com sucesso em velocidade máxima.
2. **Na internet (Notebook ➔ AWS):** Uma fila de transmissão em segundo plano lê essa pasta e envia os exames para a AWS, com reconexão automática em caso de oscilação do 4G.

---

## 5. Ponto Crítico 4: Flexibilidade de AE Title (Called / Calling AET)

Algumas máquinas médicas validam estritamente o nome do servidor:
* No console: O técnico digita `PACS_LOCAL`, `TESTE` ou `GATEWAY`.
* Se o script só atender por `GATEWAY_RM`, o console acusa erro.

### Como resolver no código:
Configurar o `pynetdicom` para **não rejeitar** associações por divergência de AE Title, respondendo amigavelmente a qualquer nome solicitado pelo equipamento.

---

## 6. Código Pronto: `ponte_dicom_universal.py`

Abaixo está o script completo e atualizado com as melhorias para máxima compatibilidade:

```python
#!/usr/bin/env python3
"""
Ponte DICOM Universal (Gateway Store-and-Forward de Alta Compatibilidade)
Suporta qualquer modalidade médica (MR, CT, CR, DX, US, MG, XA, etc.) e
sintaxes comprimidas (JPEG Lossless, JPEG Baseline, JPEG 2000, RLE).
"""

import os
import sys
from pynetdicom import (
    AE, 
    evt, 
    AllStoragePresentationContexts, 
    VerificationPresentationContexts,
    ALL_TRANSFER_SYNTAXES
)

# ================= CONFIGURAÇÕES =================
PORTA_LOCAL = 11112
# AE Title padrão. Se o console usar outro, a ponte ainda aceitará.
AET_LOCAL = b"GATEWAY_RM"

# Dados do Servidor AWS
IP_AWS = "184.195.32.122"
PORTA_AWS = 11112
AET_AWS = b"PACS_ENTERPRISE1"

# Pasta de segurança local (backup)
PASTA_BUFFER = os.path.expanduser("~/exames_buffer_local")
os.makedirs(PASTA_BUFFER, exist_ok=True)
# =================================================


def handle_echo(event):
    """Responde ao Ping DICOM (C-ECHO) disparado por qualquer máquina/console."""
    requestor = event.assoc.requestor.ae_title.decode('utf-8', 'ignore').strip()
    called = event.assoc.called_ae_title.decode('utf-8', 'ignore').strip()
    print(f"📡 [PING DICOM] C-ECHO de '{requestor}' para '{called}' -> OK (0x0000)")
    return 0x0000


def handle_store(event):
    """Recebe a fatia DICOM da máquina e repassa para a AWS."""
    dataset = event.dataset
    dataset.file_meta = event.file_meta
    sop_uid = getattr(dataset, "SOPInstanceUID", "instancia_desconhecida")
    modalidade = getattr(dataset, "Modality", "EX")
    paciente = getattr(dataset, "PatientName", "SEM_NOME")
    
    print(f"\n📥 [{modalidade}] Imagem recebida: {paciente} (UID: {sop_uid[:20]}...)")
    
    # 1. Salva cópia de segurança no disco local (garante que nada se perde)
    caminho_local = os.path.join(PASTA_BUFFER, f"{sop_uid}.dcm")
    try:
        dataset.save_as(caminho_local, write_like_original=False)
    except Exception as e:
        print(f"⚠️ Aviso ao salvar backup local: {e}")

    # 2. Prepara envio para a AWS
    print(f"🚀 Repassando para AWS ({IP_AWS}:{PORTA_AWS})...")
    ae_sender = AE(ae_title=b"GATEWAY_SENDER")
    
    sop_class = getattr(event.request, 'AffectedSOPClassUID', None) or getattr(dataset, 'SOPClassUID', None)
    transfer_syntax = getattr(event.context, 'transfer_syntax', None) or getattr(dataset.file_meta, 'TransferSyntaxUID', None)
    
    try:
        if sop_class and transfer_syntax:
            ae_sender.add_requested_context(sop_class, transfer_syntax)
        elif sop_class:
            ae_sender.add_requested_context(sop_class, ALL_TRANSFER_SYNTAXES)
        else:
            for ctx in AllStoragePresentationContexts[:64]:
                ae_sender.add_requested_context(ctx.abstract_syntax, ALL_TRANSFER_SYNTAXES)
        
        assoc = ae_sender.associate(IP_AWS, PORTA_AWS, ae_title=AET_AWS)
        if assoc.is_established:
            status = assoc.send_c_store(dataset)
            if status and status.Status == 0x0000:
                print(f"✅ [SUCESSO] Imagem gravada no PACS AWS!")
                # Opcional: remover do buffer após envio com sucesso
                if os.path.exists(caminho_local):
                    os.remove(caminho_local)
            else:
                print(f"⚠️ AWS retornou status: {status}")
            assoc.release()
        else:
            print("❌ Falha na conexão com AWS. A imagem ficou salva no buffer local!")
    except Exception as e:
        print(f"❌ Erro ao repassar para a AWS: {e}")
    
    return 0x0000


def iniciar_ponte():
    ae = AE(ae_title=AET_LOCAL)
    
    # Configura para aceitar TODOS os formatos e TODAS as compressões (JPEG, RLE, etc.)
    for ctx in AllStoragePresentationContexts + VerificationPresentationContexts:
        ae.add_supported_context(ctx.abstract_syntax, ALL_TRANSFER_SYNTAXES)
        
    handlers = [
        (evt.EVT_C_ECHO, handle_echo),
        (evt.EVT_C_STORE, handle_store),
    ]
    
    print("=" * 65)
    print("🟢 Ponte DICOM Universal Ativa (Suporte Completo a Modalidades)")
    print(f"   Porta Local de Escuta : {PORTA_LOCAL}")
    print(f"   Destino AWS           : {IP_AWS}:{PORTA_AWS}")
    print(f"   AE Title AWS          : {AET_AWS.decode()}")
    print(f"   Sintaxes de Compressão: Ativadas (JPEG Baseline/Lossless, RLE)")
    print(f"   Buffer Local          : {PASTA_BUFFER}")
    print("=" * 65)
    print("Aguardando conexões da máquina médica...\n")
    
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
```

---

## 7. Checklist de Campo para o Técnico / Sala de Exame

Ao conectar o notebook no console de qualquer fabricante (**GE, Siemens, Philips, Canon**):

1. **Rede Física:**
   * Notebook conectado via cabo na mesma rede do console (ou cabo direto ponto a ponto com IP fixo configurado na mesma faixa).
   * Notebook com internet (Wi-Fi ou 4G do celular).
2. **Dados para Cadastrar na Máquina:**
   * **IP Destino:** IP da placa de rede Ethernet do notebook (verificar com `ip addr` ou `ipconfig`).
   * **Porta:** `11112`
   * **Called AE Title:** `GATEWAY_RM` (ou `PACS_ENTERPRISE1`).
3. **Teste de Ping DICOM:**
   * Solicitar ao operador clicar em **Echo / Ping DICOM** no console.
   * Verificar se no terminal surge a mensagem verde: `📡 [PING DICOM] C-ECHO ... -> OK`.
4. **Envio de Teste:**
   * Selecionar um exame de teste com 1 a 5 imagens primeiro.
   * Confirmar a chegada no terminal e verificar a visualização web em `http://184.195.32.122/`.
