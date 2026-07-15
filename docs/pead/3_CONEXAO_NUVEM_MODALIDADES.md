# Integração de Modalidades Médicas (Equipamentos) via Internet para PACS na Nuvem

Este documento detalha o desafio arquitetural e as soluções padrão de mercado para conectar equipamentos geradores de imagens (Tomógrafos, Ressonâncias Magnéticas, Raios-X) localizados em clínicas a um servidor PACS hospedado na nuvem (AWS, Google Cloud, Azure, etc.).

---

## ⚠️ 1. O Problema: O Protocolo DICOM Clássico na Internet Aberta

O protocolo padrão de envio de imagens (DICOM C-STORE, utilizando a porta `11112` ou `104`) foi projetado na década de 1990 com foco em **redes locais (LAN)** hospitalares seguras.

**A limitação técnica:**
Por padrão, a transmissão DICOM envia os dados (imagens e metadados) **em texto claro**, ou seja, sem nenhuma camada de criptografia.

**O risco jurídico e de segurança:**
Se abrirmos a porta `11112` do nosso servidor na nuvem pública e a máquina de ressonância enviar os dados diretamente pela internet, qualquer roteador ou provedor de internet no meio do caminho poderia interceptar a comunicação. Isso configuraria um vazamento de dados sensíveis de saúde, violando frontalmente legislações severas como a **LGPD (Lei Geral de Proteção de Dados)** no Brasil e a **HIPAA** nos EUA.

---

## 🛠️ 2. As 3 Soluções de Arquitetura de Redes

Para resolver o problema e garantir criptografia de ponta a ponta na transmissão pela internet, o mercado utiliza as seguintes abordagens:

### Opção A: Túnel VPN (Virtual Private Network) Site-to-Site
*A solução mais comum e mais rápida de implementar na maioria das clínicas.*

- **Como funciona:** Um roteador configurado com VPN é instalado na clínica (junto ao equipamento). Ele estabelece uma conexão criptografada contínua com a nuvem (Virtual Private Cloud). 
- **A Mágica:** Para o software do Tomógrafo/Ressonância, o servidor PACS na nuvem recebe um IP interno falso (ex: `192.168.1.50`). A máquina acha que o servidor está na sala ao lado e envia na porta `11112` usando o DICOM clássico. A rede local encapsula, criptografa e envia pela internet de forma transparente.
- **Vantagens:** 
  - Zero alteração no código do nosso backend (FastAPI/pynetdicom).
  - Zero necessidade de mexer nas configurações complexas dos equipamentos.
- **Desvantagens:**
  - Custo e manutenção do hardware (roteador) na ponta do cliente.

### Opção B: DICOM Gateway (Roteador de Borda Local)
*A solução mais escalável, moderna e preferida por healthtechs (Software as a Service).*

- **Como funciona:** Instala-se um pequeno software (um serviço em segundo plano) em um computador qualquer dentro da clínica. Esse software atua como um "mini-PACS" local.
- **O fluxo:**
  1. O equipamento envia a imagem rápido para esse Gateway na mesma rede local.
  2. O Gateway comprime a imagem e empacota com criptografia forte.
  3. O Gateway envia a imagem para a nossa nuvem utilizando protocolos web modernos e criptografados, como **HTTPS**, **API REST** ou **DICOMWeb (WADO-RS/STOW-RS)**, muitas vezes validando via JWT (Token).
- **Vantagens:**
  - Resistência à queda de internet: se a internet da clínica cair, o Gateway enfileira as imagens no HD local e envia quando a internet voltar.
  - Dispensa aquisição de roteadores VPN complexos.
- **Desvantagens:**
  - Requer o desenvolvimento de um pequeno client (software executável) para rodar no Windows/Linux das clínicas.

### Opção C: DICOM nativo sobre TLS
*A solução puramente teórica/moderna, mas dolorosa na prática.*

- **Como funciona:** O próprio protocolo DICOM prevê suporte à criptografia ativando a camada TLS (a mesma do HTTPS). A máquina de ressonância e o servidor PACS configuram uma troca de certificados digitais.
- **Vantagens:**
  - Conexão direta e segura da máquina para a nuvem. Sem hardwares ou softwares intermediários.
- **Desvantagens:**
  - Instalar certificados SSL/TLS em máquinas de ressonância antigas ou equipamentos travados pelos fabricantes (Siemens, GE, Philips) muitas vezes exige a contratação de técnicos dessas marcas e envolve custos altos e licenças bloqueadas. Na prática, quase nenhuma clínica faz isso.

---

## 🎯 3. Estratégia Recomendada para o Projeto

Para a fase MVP (Produto Mínimo Viável) e para as provas de conceito (PoC):

1. **A abordagem será a Opção A (VPN).** 
2. Nosso sistema já está perfeitamente apto para isso. Basta configurar a infraestrutura de rede AWS/Google Cloud para fechar o túnel com as clínicas.
3. Quando o sistema crescer e se tornar um SaaS com dezenas de clínicas clientes, o ideal será evoluir para a **Opção B (DICOM Gateway)** para reduzir a fricção de instalação em novos hospitais.
