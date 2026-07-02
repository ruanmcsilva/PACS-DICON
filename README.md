# Projeto PACS/DICOM

Este repositório contém a base do projeto PACS/DICOM com FastAPI e React.

## Como Executar e Testar Localmente

Siga os passos abaixo para subir a aplicação inteira em sua máquina. Você precisará de 3 terminais separados.

### 1. Subir a Infraestrutura (Banco de Dados, Redis, RabbitMQ, MinIO)
Abra um terminal na pasta raiz do projeto (`/home/ruan/Documentos/PACS-DICOm`) e execute:
```bash
docker-compose up -d
```
*Isso vai baixar as imagens (se necessário) e rodar os containers em segundo plano.*

### 2. Rodar o Backend (FastAPI)
Abra um novo terminal. Navegue até a pasta `backend`, crie um ambiente virtual, instale as dependências e inicie o servidor:

```bash
cd /home/ruan/Documentos/PACS-DICOm/backend

# Crie e ative um ambiente virtual (recomendado)
python3 -m venv venv
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o backend
uvicorn app.main:app --reload
```
*A API estará rodando em: `http://localhost:8000`. Você pode acessar o Swagger/Documentação em `http://localhost:8000/docs`.*

### 3. Rodar o Frontend (React + Vite)
Abra um terceiro terminal. Navegue até a pasta `frontend` e inicie o servidor de desenvolvimento:

```bash
cd /home/ruan/Documentos/PACS-DICOm/frontend

# Inicie o React
npm run dev
```
*O frontend estará rodando em: `http://localhost:5173` (ou a porta que o Vite indicar).*

## Credenciais Padrões Atuais
- **Swagger/API Login**: Usuário: `admin` | Senha: `admin` (mockado temporariamente no código).
- **PostgreSQL**: Usuário: `pacsuser` | Senha: `pacspassword`
- **RabbitMQ**: `localhost:15672` | Usuário: `pacsuser` | Senha: `pacspassword`
- **MinIO**: `localhost:9001` | Usuário: `minioadmin` | Senha: `minioadmin`
# PACS-DICON
