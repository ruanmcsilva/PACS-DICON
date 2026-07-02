# PACS Enterprise Architecture Document (PEAD)
## Volume 01 - Visão Geral do Sistema

### 1. Objetivo
O objetivo deste projeto é construir uma plataforma PACS/DICOM (Picture Archiving and Communication System / Digital Imaging and Communications in Medicine) de nível Enterprise. O sistema visa receber, processar, armazenar e disponibilizar imagens médicas de forma eficiente, escalável e segura.

### 2. Escopo
O escopo abrange o ciclo de vida completo de imagens médicas:
- **Recepção**: Suporte a protocolos DICOM padrão (C-STORE, C-ECHO) via DICOM Server (SCP).
- **Armazenamento**: Gestão híbrida com PostgreSQL (metadados estruturados) e MinIO/Object Storage (instâncias DICOM puras e compactadas).
- **Recuperação e Visualização**: Fornecimento via DICOMweb (WADO-RS) e visualização de alta performance web-based com Cornerstone3D.
- **Gerenciamento**: Módulos para Laudos (Reports), Anotações, Medições Avançadas (MPR/MIP) e Ferramentas Administrativas.

### 3. Arquitetura DDD (Domain-Driven Design)
Para garantir isolamento, manutenibilidade e alta coesão, a plataforma é dividida em 12 níveis de domínio independentes:

1. **Core**: Configurações globais, Logs, Autenticação e Eventos.
2. **DICOM**: Manipulação de conexões, C-STORE, C-FIND e WADO.
3. **PACS**: Gestão de Patient, Study, Series, Instance e Archive.
4. **Viewer**: Viewport, Ferramentas, Annotations e MPR.
5. **Report**: Criação, Assinatura e Templates de Laudos.
6. **Search**: Mecanismo avançado de busca de exames e metadados.
7. **Import**: Importação local (USB, Folder, ZIP) com validação.
8. **Export**: Exportação para DICOMDIR, PDF e Imagens.
9. **Integration**: Webhooks, HL7 e APIs para HIS/RIS/EMR.
10. **Monitoring**: Jobs, Filas e Métricas de saúde.
11. **Admin**: Configuração de AEs, Instituições e Permissões.
12. **Future**: Laboratório isolado para integrações de IA e Segmentação.

### 4. Stack Tecnológica
A infraestrutura será baseada nas seguintes tecnologias:
- **API Gateway / Proxy**: Nginx
- **Frontend**: React, TypeScript, Vite, Cornerstone3D
- **Backend / API**: FastAPI, Python, SQLAlchemy, pydicom, pynetdicom
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis
- **Message Broker**: RabbitMQ
- **Armazenamento de Arquivos**: MinIO (S3 Compatible)
- **Containerização**: Docker e Docker Compose
