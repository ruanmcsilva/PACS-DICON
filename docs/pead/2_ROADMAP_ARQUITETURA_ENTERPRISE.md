# Roadmap de Escalabilidade e Arquitetura Enterprise (Pós-MVP)

Este documento mapeia todas as sugestões arquiteturais para o futuro do PACS, com foco em transformar o atual Monolito Modular (MVP) em uma arquitetura de Microsserviços e Domain-Driven Design (DDD), ideal para altíssima escalabilidade.

---

## 🏗 Fase 1: Refatoração de Camadas (Domain-Driven Design)

### [ PENDENTE ] Etapa 1: Implementação do Padrão Repository
- **Objetivo:** Desacoplar a lógica de banco de dados da lógica de negócios.
- **Tarefas:**
  - Criar a camada `Repository` para centralizar as consultas SQL do SQLAlchemy.
  - Remover dependências diretas de banco (ex: `AsyncSession`) das rotas e serviços.

### [ PENDENTE ] Etapa 2: Separação em Camadas Limpas (Clean Architecture)
- **Objetivo:** Estruturar o fluxo de dados no modelo corporativo.
- **Estrutura Alvo:**
  - `Router` (Recebe a requisição HTTP/DICOM)
  - `Application` (Casos de uso e orquestração)
  - `Domain` (Regras de negócio puras e modelos)
  - `Infrastructure` (Banco de dados, Filas, MinIO, Integrações)
  - `Repository` (Acesso a dados)

---

## 🔌 Fase 2: Expansão dos Protocolos DICOM (SCU/SCP)

### [ PENDENTE ] Etapa 3: Separação Completa de Serviços DICOM
- **Objetivo:** Desmembrar o servidor DICOM atual para suportar tanto o recebimento (SCP) quanto o envio e consulta ativa (SCU) para outros hospitais/PACS.
- **Tarefas:**
  - **Storage:** Separar `Storage SCP` (Receber imagens) e implementar `Storage SCU` (Enviar imagens para outros nós).
  - **Query:** Isolar `Query SCP` (Responder buscas) e implementar `Query SCU` (Buscar exames em outros servidores).
  - **Move:** Isolar `Move SCP` (Processar transferências) e implementar `Move SCU` (Solicitar transferência de exames).
  - **Echo:** Manter `Echo SCP` e implementar `Echo SCU` (Testar conexão com outros nós).

---

## 🚀 Fase 3: Transição para Microsserviços (Microservices)

### [ PENDENTE ] Etapa 4: Desmembramento do Backend (Core Services)
- **Objetivo:** Dividir as responsabilidades principais em serviços independentes.
- **Microsserviços a criar:**
  - `gateway/` (API Gateway para roteamento de requisições)
  - `dicom-server/` (Servidor DICOM TCP/IP nativo)
  - `dicomweb/` (Servidor DICOMWeb RESTful QIDO/WADO)
  - `storage/` (Gerenciamento exclusivo do MinIO e discos)
  - `viewer/` (Serviço de suporte ao frontend Cornerstone)

### [ PENDENTE ] Etapa 5: Desmembramento de Entidades Clínicas
- **Objetivo:** Cada entidade clínica deve ter seu próprio serviço, banco e API.
- **Microsserviços a criar:**
  - `patient-service/` (Dados demográficos e históricos)
  - `study-service/` (Gestão de estudos e metadados)
  - `series-service/` (Gestão de séries e agrupamentos)
  - `instance-service/` (Gestão das instâncias/fatias individuais)

### [ PENDENTE ] Etapa 6: Microsserviços de Apoio e Ferramentas
- **Objetivo:** Isolar recursos adicionais do PACS.
- **Microsserviços a criar:**
  - `worklist/` (Integração DICOM Modality Worklist)
  - `routing/` (Regras de roteamento automático de exames)
  - `archive/` (Gerenciamento de arquivamento a longo prazo / Glacier)
  - `thumbnail/` (Serviço exclusivo para gerar miniaturas)
  - `report/` (Motor de laudos e templates PDF)
  - `measurements/` (Armazenamento de anotações e medições)

### [ PENDENTE ] Etapa 7: Microsserviços de Operação e Integração
- **Objetivo:** Monitoramento, segurança e IA.
- **Microsserviços a criar:**
  - `audit/` (Trilha de auditoria e logs HIPAA compliance)
  - `notification/` (Webhooks, emails e SMS)
  - `ai/` (Integração e orquestração de algoritmos de inteligência artificial)
  - `jobs/` (Workers de processamento em lote)
  - `monitoring/` (Métricas de saúde e APM)
  - `backup/` (Rotinas de backup automatizadas)
  - `integration/` (Integração HL7 e APIs externas)

---

## 🔍 Fase 4: Auditoria Técnica (Consultoria de Arquitetura)

### [ PENDENTE ] Etapa 8: Auditoria de Código e Infraestrutura
- **Objetivo:** Revisão profunda antes da migração para microsserviços.
- **Foco da Análise:**
  - Revisão linha a linha (Classes, Funções, Rotas).
  - Análise de índices e gargalos no Banco de Dados.
  - Performance de renderização no Cornerstone.
  - Segurança e otimização do Servidor DICOM e DICOMWeb.
  - Gestão de Docker, Filas (RabbitMQ) e Armazenamento (MinIO).
- **Entregáveis Esperados:**
  - Relatório apontando o que está excelente.
  - Mapeamento de potenciais débitos técnicos (riscos futuros).
  - Lista de refatorações críticas pré-crescimento.
