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
**Status: 🟢 Concluído**
- Interface do Portal em React renderizando a Worklist com dados em tempo real.
- Visualização de imagens DICOM 2D via Cornerstone3D com ferramentas de medição (Régua, Ângulo, HU, ROI).
- Reconstrução tridimensional Multiplanar (MPR) nos eixos Axial, Sagital e Coronal, além de renderizações volumétricas avançadas (VR e MIP).

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

### [ CONCLUÍDO ] Etapa 11: Integração Cornerstone3D
- Renderização base no frontend React consumindo a API WADO-RS concluída e Web Workers operacionais.

### [ CONCLUÍDO ] Etapa 12: Ferramentas de Medição (Volume 11)
- Implementação da barra de ferramentas (Toolbar) com controles de Pan, Zoom, W/L.
- Integração das ferramentas clínicas: Régua, Ângulo, Sonda HU e ROI Retangular.

### [ CONCLUÍDO ] Etapa 13: Study Browser (Painel de Séries)
- Migração da rota baseada em Série para Estudo.
- Criação de Sidebar inteligente que lista todas as séries disponíveis.
- Navegação dinâmica e recarregamento limpo da Engine do Cornerstone3D.

### [ CONCLUÍDO ] Etapa 14: Persistência de Anotações (Volume 13)
- Tabela `annotations` no PostgreSQL salva dados de ferramentas usando tipo `JSONB`.
- Frontend serializa e desserializa o estado do `annotationManager` automaticamente via rotas REST.

### [ CONCLUÍDO ] Etapa 15: Módulo de Laudos (Volume 14)
- Criação da tabela `reports` associada ao `Study`.
- Novo painel lateral direito no Viewer contendo um editor de texto com suporte a status "Rascunho/Finalizado".

### [ CONCLUÍDO ] Etapa 16: Busca Avançada e Exportação (Volumes 15 e 16)
- **Search Engine:** Barra de filtros na Worklist e queries dinâmicas no backend (`ILIKE` no PostgreSQL) para Nome, ID e Data.
- **Exportação (PDF):** Utilização da API nativa do navegador (`window.print`) vinculada a uma página invisível de relatório gerada via React.

### [ CONCLUÍDO ] Etapa 17: Importação via Web (Volume 17)
- **Backend:** Rota `POST /upload` que aceita múltiplos arquivos DICOM, salva no MinIO e enfileira no RabbitMQ.
- **Frontend:** Botão "Importar DICOM" na Worklist com modal Drag and Drop para enviar arquivos diretamente pelo navegador, democratizando o acesso.

### [ CONCLUÍDO ] Etapa 18: Integrações de Agendamento (Volume 18)
- **Backend:** Rotas REST (`/integration/patient` e `/integration/order`) construídas para simular recebimento de mensagens HL7 ADT e ORM.
- **Frontend:** A Worklist agora suporta a renderização de "Estudos Vazios" identificando-os visualmente com a tag "⏳ Aguardando Imagens...".

### [ CONCLUÍDO ] Etapa 19: Inteligência Artificial (Volume 19)
- **Backend:** Endpoint simulador de IA (`/ai-draft`) que aguarda processamento e gera um Rascunho Clínico com base no exame.
- **Frontend:** Integração do botão ✨ "Gerar Pré-laudo com I.A." no Viewer que bloqueia a interface com um spinner e preenche magicamente a caixa de laudos.

### [ CONCLUÍDO ] Etapa 20: Módulo de Autenticação / Login (Volume 20)
- **Backend:** Proteção global do `pacs/router.py` usando JWT Bearer Tokens (`Depends(get_current_user)`).
- **Frontend:** Implementação de `Login.tsx`, interceptores Axios para injeção de token e rotas privadas (`PrivateRoute`) no React.

### [ CONCLUÍDO ] Etapas 21 a 24: Produção, Testes e Segurança (Volumes 21 a 24)
- **Docker de Produção (Volume 21):** Criados `Dockerfile` multi-stage para backend e frontend, configurando um ambiente isolado com `docker-compose.prod.yml` e proxy reverso otimizado com `nginx.prod.conf`.
- **DevOps (CI/CD) (Volume 22):** Pipeline automatizado via GitHub Actions (`ci.yml`) para executar validação sintática (linting) e testes a cada modificação na base de código.
- **Testes (TDD/E2E) (Volume 23):** Estruturação do Pytest no backend (`backend/tests/`) validando serviços REST (health, login, token) e handlers do motor DICOM.
- **Segurança (Volume 24):** Bloqueio de chave JWT padrão de desenvolvimento em produção e padronização do código HTTP 401 Unauthorized para sessões inválidas.

### [ CONCLUÍDO ] Etapa 25: Reconstrução Multiplanar e Visualização 3D (Volume 12)
- **Modos MPR/3D:** Implementação de grade de visualização 2x2 com planos Axial, Sagital e Coronal reconstruídos tridimensionalmente no Cornerstone3D.
- **VR & MIP:** Adicionado suporte para renderização tridimensional de volume (Volume Rendering) e projeção de intensidade máxima (MIP) com controle de visualização integrado na Toolbar.

### [ CONCLUÍDO ] Etapa 26: Módulo de Segmentação 3D
- **Frontend:** Configuração de estado de segmentação e instanciamento de "Labelmaps" no Cornerstone3D para viabilizar a ferramenta de Pincel (`BrushTool`).
- **Recursos:** Permitir colorir e demarcar volumes anatômicos (tumores, órgãos) nos cortes tomográficos.

### [ CONCLUÍDO ] Etapa 27: Sincronização Avançada de MPR (Crosshairs & Sync)
- **Frontend:** Implementar `Synchronizers` do Cornerstone3D para conectar propriedades de câmera, nível de janela (W/L) e zoom através dos viewports Axiais, Sagitais e Coronais.
- **Ferramentas:** Ativar a ferramenta `CrosshairsTool` para permitir navegação tridimensional sincronizada em tempo real clicando em qualquer corte MPR.

### [ CONCLUÍDO ] Etapa 28: Thumbnails (Miniaturas) na Lista de Séries
- **Frontend:** Atualizar o componente `<SeriesList>` para renderizar a fatia central de cada série utilizando o Cornerstone.
- **Recursos:** Facilitar a identificação visual rápida de diferentes séries (ex: cortes ósseos vs tecidos moles).

### [ CONCLUÍDO ] Etapa 29: Exportação de Laudo (PDF) com Imagens-Chave
- **Frontend:** Adicionar ferramenta de "Câmera" para capturar screenshots (Imagens-chave) da visualização atual com anotações e medições.
- **Backend:** Serviço de geração de PDF estruturado que mescla o texto do Rascunho Clínico com as imagens capturadas para criar o documento final.

### [ CONCLUÍDO ] Etapa 30: Sincronização Dinâmica (DicomWeb / WADO-RS)
- **Infraestrutura:** Transição do modelo `wadouri` para transmissões orientadas a metadados (`WADO-RS`). Implementado endpoints `/metadata` e `/frames` no backend usando pydicom e multipart/related.
- **Recursos:** Carregamento ultra rápido via streaming assíncrono para exames massivos, exibindo imagens progressivamente usando `wadors:` no frontend.

### [ CONCLUÍDO ] Etapa 31: MPR Oblíquo (Ferramenta Avançada)
- **Frontend:** Atualizada a configuração do `CrosshairsTool` para habilitar manipulação mobile e rotação livre dos eixos.
- **Recursos:** Habilitadas reconstruções MPR oblíquas duplas, essenciais para ortopedia e neurocirurgia através do arrasto dos eixos nos viewports ortogonais.

### [ PENDENTE ] Fase 4: Integração de Rede DICOM (Comunicação com Aparelhos)

Para atender ao cliente e realizar os testes práticos de rede (IP, Porta, AETitle), iniciaremos o desenvolvimento destas etapas:

#### [ PENDENTE ] Etapa 32: Validação do DICOM Listener e Handshake (C-ECHO)
- **Objetivo:** Garantir que o PACS consiga responder a "Pings" (C-ECHO) vindos dos equipamentos médicos (Modalidades) na rede do hospital.
- **Backend:** 
  - Confirmar a inicialização do SCP (Service Class Provider) via `pynetdicom` rodando estavelmente em uma porta específica (ex: `11112`).
  - Fixar o identificador `AETitle` do servidor (ex: `PACS_ENTERPRISE`).
  - Adicionar logs detalhados de handshake para auditar IPs de origem.

#### [ PENDENTE ] Etapa 33: Recepção Definitiva de Arquivos (C-STORE SCP)
- **Objetivo:** Configurar o sistema para aceitar e guardar as imagens que o aparelho médico "empurrar" durante um exame real.
- **Backend:** 
  - Implementar o handler do evento `evt.EVT_C_STORE` na biblioteca.
  - Gravar os dados binários do DICOM recebido em um arquivo físico temporário assim que chegarem.
  - Enviar resposta de sucesso (Status `0x0000`) imediata para o aparelho não dar *timeout*.

#### [ PENDENTE ] Etapa 34: Pipeline Assíncrono de Processamento (Fila)
- **Objetivo:** Não travar o servidor quando a máquina mandar milhares de imagens simultâneas (ex: Tomografia).
- **Backend / Workers:** 
  - Após receber o DICOM (Etapa 33), enviar uma mensagem para a fila (RabbitMQ) informando que um arquivo novo chegou.
  - O "Worker" (consumidor em background) irá ler a imagem, extrair os dados do paciente/estudo, salvar permanentemente no storage (MinIO) e registrar tudo no banco de dados (PostgreSQL).
  - Assim, a imagem recém-recebida aparece instantaneamente na lista de pacientes (Worklist) do sistema Web.

#### [ PENDENTE ] Etapa 35: Painel de Monitoramento de Tráfego (Frontend)
- **Objetivo:** Fornecer feedback visual das integrações em andamento (essencial para técnicos e clientes).
- **Frontend:** 
  - Criar aba "Logs de Conexão DICOM".
  - Listar transferências ativas (Ex: "Recebendo imagens do aparelho de Tomografia da Sala 1").

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
*(Inicia o Servidor REST em `http://localhost:3000` e o SCP DICOM na porta `11112`)*

**Terminal 3: Frontend (React)**
```bash
cd frontend
npm run dev
```
*(Inicia a interface em `http://localhost:5173`)*

**Login e Senhas:**
- Login: admin
- Senha: password   

**Credenciais Úteis (Local):**
- **DB PostgreSQL:** `pacsuser` / `pacspassword`
- **MinIO S3:** `minioadmin` / `minioadmin` no `localhost:9001`
- **RabbitMQ:** `pacsuser` / `pacspassword` no `localhost:15672`
