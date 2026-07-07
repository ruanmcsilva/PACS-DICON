# 2. PACS Enterprise Architecture Document (PEAD)

Este documento é a visão consolidada da engenharia de software do PACS Enterprise. Ele documenta a arquitetura adotada, o design de componentes (DDD) e as integrações, baseando todo o desenvolvimento em 25 volumes lógicos.

---

## Índice dos 25 Volumes da Arquitetura

| Volume | Domínio / Componente | Descrição / Status Técnico |
| :--- | :--- | :--- |
| **01** | Visão Geral | Projeto definido: Plataforma web-based híbrida (DICOM/REST) escalável. |
| **02** | Arquitetura Geral | Baseada em 12 domínios independentes (Core, DICOM, PACS, Viewer, etc). |
| **03** | Backend | FastAPI (Python) com Uvicorn. APIs assíncronas de alta performance. |
| **04** | Frontend | React, TypeScript e Vite. Interface Premium para Worklist e Viewer. |
| **05** | Banco de Dados | PostgreSQL com SQLAlchemy (asyncpg). Estrutura completa de tabelas DICOM. |
| **06** | Storage | MinIO (Object Storage S3-compatible). Substitui storage em disco tradicional. |
| **07** | DICOM (SCP) | `pynetdicom`. Implementação de Association, C-ECHO, C-STORE, C-FIND, C-MOVE. |
| **08** | DICOMWeb (REST) | Implementação de rotas QIDO-RS (buscas JSON) e WADO-RS (download DICOM). |
| **09** | PACS Engine | Processamento de Metadados via RabbitMQ. Hierarchy and routing base construída. |
| **10** | Viewer | Inteface WebGL renderizada via Cornerstone3D. (*Em desenvolvimento*) |
| **11** | Ferramentas de Medição | *Não iniciado* |
| **12** | MPR / MIP / VR | *Não iniciado* |
| **13** | Annotations | *Não iniciado* |
| **14** | Reports (Laudos) | *Não iniciado* |
| **15** | Search Engine | *Não iniciado* |
| **16** | Exportação | *Não iniciado* |
| **17** | Importação | *Não iniciado* |
| **18** | Integrações (HL7/FHIR) | *Não iniciado* |
| **19** | Inteligência Artificial | *Não iniciado* |
| **20** | Infraestrutura Core | Configurada via `docker-compose.yml`. |
| **21** | Docker de Produção | *Não iniciado* |
| **22** | DevOps (CI/CD) | *Não iniciado* |
| **23** | Testes (TDD/E2E) | *Não iniciado* |
| **24** | Segurança | *Não iniciado* |
| **25** | Manual do Desenvolvedor| Este conjunto de documentos e Roadmap em `docs/pead/`. |

---

## Detalhamento de Volumes Essenciais

### Volume 01: Visão Geral e DDD
O escopo do projeto abrange o ciclo de vida completo de imagens médicas, desde a recepção (C-STORE), armazenamento híbrido (Metadados no Postgres, Pixels no MinIO), até a distribuição para a web (WADO-RS).

O sistema segue a filosofia de **Domain-Driven Design (DDD)** focado na escalabilidade, subdividido em 12 pastas/escopos:
1. **Core:** Logs, Configurações, Segurança, Mensageria.
2. **DICOM:** Servidor C-STORE/C-FIND.
3. **PACS:** Modelagem de Banco, Archive e Rotas.
4. **Viewer:** Renderização via Cornerstone.
5. **Report:** Módulo clínico de laudos.
6. **(Outros módulos listados no índice)**

**Stack Tecnológica:**
- **API Gateway:** Nginx
- **Front:** React/Vite/Cornerstone3D
- **Back:** FastAPI/Python/pynetdicom
- **DB/Cache/Fila:** PostgreSQL, Redis, RabbitMQ
- **Object Storage:** MinIO

### Volume 07: O Motor DICOM (C-ECHO/STORE/FIND/MOVE)
O coração da integração médica (Service Class Provider). Roda de forma não bloqueante usando `threading` junto com o FastAPI, ouvindo a porta `11112`.
- **C-STORE:** Ao receber um `.dcm`, o arquivo é depositado no MinIO imediatamente com base no `SOPInstanceUID`. O backend responde *Success* rapidamente e **envia uma mensagem para o RabbitMQ**. Um processo de background faz o parse da imagem (`pydicom`) e popula o banco de dados. Isso previne engarrafamento de rede (network timeout).
- **C-FIND / C-MOVE:** Permite que modalidades e visualizadores antigos se conectem e requisitem imagens via banco PostgreSQL, entregando os objetos fisicamente pela rede.

### Volume 08: O Motor DICOMWeb (QIDO-RS / WADO-RS)
Para servir o Front-end moderno sem onerar o C-MOVE, as APIs REST foram implementadas em `/api/dicom-web/`:
- O **QIDO-RS** pesquisa `Studies`, `Series` e `Instances` no banco de dados e converte magicamente os modelos do SQLAlchemy para o formato nativo `application/dicom+json` exigido por clients modernos.
- O **WADO-RS** devolve o streaming binário do arquivo buscando-o diretamente no bucket MinIO.
