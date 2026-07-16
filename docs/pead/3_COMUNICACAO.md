# 3. Módulo de Comunicação com Dispositivos (DICOM Nodes)

Este documento descreve o plano de tarefas para implementar o gerenciamento de conectividade e comunicação do PACS com dispositivos e modalidades médicas (scanners de CT, MR, aparelhos de Raio-X, estações de visualização, etc.) cadastrados no sistema.

---

## 📋 Lista de Tarefas (To-Do List)

- [x] **Etapa 1: Modelo de Banco de Dados para Dispositivos**
  - Criar o modelo `DicomNode` em `backend/app/pacs/models.py`.
  - Campos necessários:
    - `id` (UUID, chave primária)
    - `name` (String, nome amigável do equipamento, ex: "Tomógrafo Sala 1")
    - `ae_title` (String, AE Title DICOM do dispositivo)
    - `ip_address` (String, endereço IP ou hostname)
    - `port` (Integer, porta TCP de comunicação DICOM, ex: 104)
    - `created_at` (DateTime, registro do cadastro)
  - Importar o modelo `DicomNode` em `backend/app/main.py` para permitir que o SQLAlchemy gere a tabela automaticamente.

- [x] **Etapa 2: Schemas e Rotas de CRUD no Backend**
  - Criar schemas Pydantic `DicomNodeCreate` e `DicomNodeResponse` em `backend/app/pacs/schemas.py`.
  - Criar endpoints REST em `backend/app/pacs/router.py`:
    - `GET /api/pacs/dicom-nodes` para listar os nós cadastrados.
    - `POST /api/pacs/dicom-nodes` para adicionar um novo dispositivo.
    - `DELETE /api/pacs/dicom-nodes/{node_id}` para remover um dispositivo.

- [x] **Etapa 3: Serviços de API no Frontend**
  - Implementar chamadas HTTP correspondentes no arquivo `frontend/src/pacs/services/api.ts`:
    - `getDicomNodes()`
    - `createDicomNode(node)`
    - `deleteDicomNode(nodeId)`

- [x] **Etapa 4: Tela de Gerenciamento de Dispositivos (Interface UI)**
  - Habilitar o link no Sidebar (`frontend/src/core/layout/Sidebar.tsx`) apontando para `/communication` (Comunicação/Dispositivos).
  - Desenvolver o componente `CommunicationSettings.tsx` em `frontend/src/pacs/components/` com:
    - Grid/Lista de dispositivos cadastrados com design premium glassmorphic.
    - Formulário para adicionar novos equipamentos (validação de IP e porta).
    - Botão de exclusão e indicador visual de conectividade.

- [x] **Etapa 5: Roteamento da Tela de Configurações**
  - Integrar a rota `/communication` sob `PrivateRoute` no arquivo `frontend/src/App.tsx`.
