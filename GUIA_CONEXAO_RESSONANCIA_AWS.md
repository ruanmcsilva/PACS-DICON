# Guia Prático: Conexão Ressonância Magnética ➔ Notebook ➔ AWS PACS

Este guia contém todo o procedimento para realizar o teste de envio de imagens de um equipamento de **Ressonância Magnética (sem internet)** para o nosso **PACS na AWS**, utilizando um **Notebook como Gateway/Ponte DICOM**.

---

## 1. Visão Geral da Arquitetura

```
+------------------------------------+
|  Console da Ressonância            |
|  (Rede Local / Sem Internet)       |
+-----------------+------------------+
                  | (Cabo de Rede Ethernet - Porta 11112)
                  v
+-----------------+------------------+
|  Seu Notebook (Ponte DICOM)        |
|  - Placa Cabo: Rede da RM          |
|  - Wi-Fi ou 4G: Internet           |
|  - Executa: ponte_dicom.py         |
+-----------------+------------------+
                  | (Internet / VPN ZeroTier - Porta 11112)
                  v
+-----------------+------------------+
|  Servidor PACS na AWS              |
|  - IP Fixo: 184.195.32.122         |
|  - Porta DICOM: 11112              |
|  - Called AET: PACS_ENTERPRISE1    |
|  - S3 Bucket: pacs-exames-teste    |
+------------------------------------+
```

---

## 2. Preparação do Notebook (Antes de ir para a sala)

### 2.1 Instalar Dependências
No terminal do notebook, execute:
```bash
pip install pynetdicom pydicom
```

### 2.2 Script da Ponte DICOM (`ponte_dicom.py`)
Salve e execute o script `ponte_dicom.py` no notebook:

```python
import os
from pynetdicom import AE, evt, AllStoragePresentationContexts, VerificationPresentationContexts

# ================= CONFIGURAÇÕES =================
PORTA_LOCAL = 11112
AET_LOCAL = b"GATEWAY_RM"

# Dados do Servidor AWS
IP_AWS = "184.195.32.122"  # Se usar ZeroTier, substitua pelo IP da VPN
PORTA_AWS = 11112
AET_AWS = b"PACS_ENTERPRISE1"
# =================================================

def handle_echo(event):
    """Responde ao Ping DICOM (C-ECHO) disparado pelo console da máquina."""
    requestor = event.assoc.requestor.ae_title.decode('utf-8', 'ignore').strip()
    print(f"📡 [PING DICOM] C-ECHO recebido com sucesso de: {requestor}")
    return 0x0000

def handle_store(event):
    """Recebe a fatia DICOM da ressonância e encaminha imediatamente para a AWS."""
    dataset = event.dataset
    dataset.file_meta = event.file_meta
    sop_uid = getattr(dataset, "SOPInstanceUID", "instancia_desconhecida")
    
    print(f"\n📥 Imagem recebida da Ressonância: {sop_uid}")
    print(f"🚀 Repassando para a AWS ({IP_AWS}:{PORTA_AWS})...")
    
    ae_sender = AE(ae_title=b"GATEWAY_SENDER")
    for ctx in AllStoragePresentationContexts:
        ae_sender.add_requested_context(ctx.abstract_syntax)
    
    assoc = ae_sender.associate(IP_AWS, PORTA_AWS, ae_title=AET_AWS)
    if assoc.is_established:
        status = assoc.send_c_store(dataset)
        if status and status.Status == 0x0000:
            print(f"✅ [SUCESSO] Imagem enviada e salva na AWS!")
        else:
            print(f"⚠️ Erro ao enviar para a AWS. Status: {status}")
        assoc.release()
    else:
        print("❌ Falha: Não foi possível conectar à AWS. Verifique a internet/VPN do notebook.")
    
    return 0x0000

def iniciar_ponte():
    ae = AE(ae_title=AET_LOCAL)
    
    for ctx in AllStoragePresentationContexts + VerificationPresentationContexts:
        ae.add_supported_context(ctx.abstract_syntax)
        
    handlers = [
        (evt.EVT_C_ECHO, handle_echo),
        (evt.EVT_C_STORE, handle_store),
    ]
    
    print(f"==================================================")
    print(f"🟢 Ponte DICOM Ativa!")
    print(f"   Escutando no cabo na porta: {PORTA_LOCAL}")
    print(f"   Repassando para a AWS: {IP_AWS}:{PORTA_AWS}")
    print(f"==================================================")
    print("Aguardando conexões da máquina de ressonância...\n")
    
    ae.start_server(("", PORTA_LOCAL), evt_handlers=handlers)

if __name__ == "__main__":
    iniciar_ponte()
```

---

## 3. Na Sala do Exame (Procedimento Físico e Rede)

1. **Conexão com a Internet:**
   * Conecte o notebook ao Wi-Fi local ou ative o ponto de acesso 4G do celular.
2. **Conexão com a Ressonância:**
   * Plugue o cabo de rede Ethernet do notebook na porta de rede/switch da sala da máquina.
3. **Identificar o IP da Placa Cabeada:**
   * Abra o terminal do notebook e rode:
     ```bash
     ip addr show
     ```
   * Verifique o IP da interface Ethernet (ex: `eth0`, `enp3s0`):
     * Exemplo: `192.168.1.150`
   * *Atenção:* Se o cabo for direto no console (sem DHCP), configure um IP estático na mesma faixa da ressonância (ex: se o console for `192.168.1.10`, use `192.168.1.11` com máscara `255.255.255.0`).

---

## 4. Configuração no Console da Ressonância (Com o Técnico)

Peça ao operador/técnico para abrir as configurações DICOM (**DICOM Nodes / Storage Destinations**):

* **Nome / AE Title do Equipamento:** `RM_CONSOLE` (ou o que já estiver na máquina)
* **Novo Destino:**
  * **Nome / Descrição:** `TESTE_NUVEM`
  * **IP de Destino:** IP da placa de rede Ethernet do seu notebook (ex: `192.168.1.150`)
  * **Porta:** `11112`
  * **Called AE Title:** `GATEWAY_RM` (ou `PACS_ENTERPRISE1`)

### Teste de Validação Prévia (Ping DICOM):
1. Inicie o script `python ponte_dicom.py` no notebook.
2. Peça ao técnico para clicar em **"Echo"** ou **"Ping DICOM"** no console.
3. No seu terminal aparecerá:
   `📡 [PING DICOM] C-ECHO recebido com sucesso de: RM_CONSOLE`
4. Na tela do equipamento aparecerá: **Echo Successful / OK**.

---

## 5. Envio do Exame e Visualização na Web

1. O técnico seleciona o paciente ou estudo no console e clica em **Enviar / Transferir** para o destino `TESTE_NUVEM`.
2. O terminal do notebook mostrará o progresso de cada imagem:
   ```
   📥 Imagem recebida da Ressonância: 1.3.12.2.1107.5.2...
   🚀 Repassando para a AWS (184.195.32.122:11112)...
   ✅ [SUCESSO] Imagem enviada e salva na AWS!
   ```
3. Acesse o sistema pelo navegador:
   * **URL:** `http://184.195.32.122`
   * **Login:** `admin` / `admin`
4. Atualize a Worklist: o paciente e as imagens já estarão disponíveis no **Viewer DICOM**.

---

## 6. Dados de Referência Rápida

| Parâmetro | Valor |
| :--- | :--- |
| **IP do Servidor AWS (Elastic IP)** | `184.195.32.122` |
| **Porta DICOM SCP** | `11112` |
| **Called AE Title do Servidor AWS** | `PACS_ENTERPRISE1` |
| **Bucket S3** | `pacs-exames-teste` |
| **Usuário do Sistema Web** | `admin` |
| **Senha do Sistema Web** | `admin` |
