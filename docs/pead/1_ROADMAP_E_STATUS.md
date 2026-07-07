# 1. Roadmap e Status do Projeto (PACS Enterprise)

Este documento serve como o guia principal de sincronização da equipe de desenvolvimento. Se você é um novo desenvolvedor entrando no projeto, comece lendo as orientações abaixo para entender o que já foi feito, onde estamos e o que falta construir.

---

## 🚦 Status Atual por Nível (Arquitetura DDD)

### 🏗️ NÍVEL 1 — CORE DO SISTEMA
**Status: 🟢 Fundamentalmente Construído**
O "coração" do sistema já pulsa forte. Já temos:
- **Configurações (`core.config`)**: Variáveis de ambiente lidas pelo Pydantic.
- **Banco de Dados (`database`)**: Conexão otimizada com PostgreSQL assíncrono (asyncpg).
- **Storage (`storage`)**: Conexão com o MinIO (S3 Compatible) para armazenar os arquivos físicos.
- **Background Jobs (`queue`)**: Configuração de Fila RabbitMQ e Workers (Consumer/Publisher) ativa para descarregar o processamento do servidor principal.
- *Pendente*: Configuração do Cache (Redis) para as rotas do frontend.

### 📡 NÍVEL 2 — DICOM
**Status: 🟢 MVP Construído**
- **Servidor DICOM (SCP)**: O backend (FastAPI/pynetdicom) atende na porta `11112` com o AETitle `PACS_ENTERPRISE`.
- **C-ECHO / C-STORE**: O servidor aceita pings e recebe arquivos de imagem nativamente.
- **C-FIND / C-MOVE**: O servidor responde pesquisas e envia imagens para outras estações DICOM.
- **DICOMWeb**: Foram criadas as rotas REST (`/api/dicom-web/`) para os serviços **QIDO-RS** (pesquisa json) e **WADO-RS** (download dicom).

### 🗄️ NÍVEL 3 — PACS
**Status: 🟢 Em Andamento Avançado**
- **Base de Dados**: Tabelas centrais (`Patient`, `Study`, `Series`, `Instance`) criadas com SQLAlchemy.
- **APIs REST**: Endpoints (`/api/pacs/`) criados para consumo pelo painel web.
- *Pendente*: Módulo avançado de Archiving (arquivamento de longo prazo), Roteamento Automático (encaminhar exames baseados na modalidade) e Regras de Retenção de dados.

### 🖥️ NÍVEL 4 — VIEWER (Visualizador)
**Status: 🔴 Foco Atual**
- Temos a interface do Portal feita em React (Vite) com a tela de Worklist renderizando dados que chegam da API.
- *Foco Atual*: Integrar o **Cornerstone3D** usando a recém-criada API DICOMWeb, permitindo visualizar os exames direto no navegador sem instalar nada.

### 🚀 INFRAESTRUTURA
**Status: 🟢 MVP de Produção Pronto**
- Serviços de apoio (Postgres, MinIO, Redis, RabbitMQ, Nginx) orquestrados com sucesso no `docker-compose.yml`.

---

## 🗺️ Roadmap de Transição

Histórico do desenvolvimento passo-a-passo.

### [ CONCLUÍDO ] Etapas 1 a 5: Fundações
- Setup da infra (Docker), estruturação dos 12 módulos no backend, conexão de banco e storage.
- Implementação inicial do Servidor DICOM SCP (`pynetdicom`).
- Criação do esqueleto React Premium para a Worklist.

### [ CONCLUÍDO ] Etapa 6: Processamento de Metadados em Background
- Implementação da arquitetura Producer/Consumer com RabbitMQ. O C-STORE envia o dado para o MinIO e publica um evento para que o banco PostgreSQL seja populado de forma assíncrona, evitando travamentos.

### [ CONCLUÍDO ] Etapa 7 e 8: Criação da API REST e Frontend
- FastAPI servindo dados e arquivos do PACS de forma assíncrona.
- Worklist em React (Axios) consumindo a base dinâmica do PostgreSQL.

### [ CONCLUÍDO ] Etapa 9: Query/Retrieve (C-FIND e C-MOVE)
- Implementação dos serviços padrão DICOM SCP para permitir comunicação robusta com estações tradicionais. 

### [ CONCLUÍDO ] Etapa 10: DICOMWeb (QIDO-RS e WADO-RS)
- Criação do módulo `dicomweb` com roteamento REST, permitindo a transição do mundo binário DICOM para a Web (JSON/HTTP). Mapeamento das instâncias do SQLAlchemy gerando respostas `application/dicom+json`.

### [ EM ANDAMENTO ⏳ ] Etapa 11: Integração Cornerstone3D
- **Responsável Atual**: Equipe Front-end
- **O que está sendo feito**: Plugar o Cornerstone3D no frontend React para consumir a nova rota WADO-RS (Etapa 10) e renderizar o `.dcm` diretamente no Viewport.

---

## 🛠 Como Iniciar o Desenvolvimento (Quickstart)

Você precisará de 3 terminais separados rodando na raiz do projeto (`/home/ruan/Documentos/PACS-DICOm`).

**Terminal 1: Infraestrutura (Docker)**
```bash
docker-compose up -d
```
*(Inicia PostgreSQL, Redis, RabbitMQ e MinIO)*

**Terminal 2: Backend (FastAPI)**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*(Inicia o Servidor REST em `http://localhost:8000` e o SCP DICOM na porta `11112`)*

**Terminal 3: Frontend (React)**
```bash
cd frontend
npm run dev
```
*(Inicia a interface em `http://localhost:5173`)*

**Credenciais Úteis (Local):**
- **DB PostgreSQL:** `pacsuser` / `pacspassword`
- **MinIO S3:** `minioadmin` / `minioadmin` no `localhost:9001`
- **RabbitMQ:** `pacsuser` / `pacspassword` no `localhost:15672`
