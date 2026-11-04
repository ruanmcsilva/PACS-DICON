# Passos para Subir e Testar na AWS (PACS-DICOM)

Este guia contém o passo a passo enxuto e atualizado (sem precisar rodar correções manuais `sed`, pois o código já está 100% ajustado).

## 1. Iniciar a Máquina na AWS (Economizando Créditos)
1. No painel EC2 da AWS, inicie sua instância (`t3.small` ou `t3.medium`).
2. Verifique se o **Security Group** da instância tem apenas estas 3 portas abertas:
   - **Porta 22 (SSH)**
   - **Porta 80 (HTTP - Interface Web e API)**
   - **Porta 11112 (Custom TCP - Recepção DICOM SCP)**
3. **Importante para economizar créditos:** Assim que terminar a bateria de testes do dia, vá no painel EC2 e clique em **Estado da Instância -> Interromper (Stop)**. Máquina parada não consome créditos de computação!

## 2. Conectar no Servidor via SSH
No terminal do seu computador:
```bash
ssh -i ~/Documentos/Sisema-pacs-virginia.pem ubuntu@SEU_IP_AWS
```
*(Substitua `SEU_IP_AWS` pelo IP Público atual da sua instância EC2).*

## 3. Atualizar o Código e Subir o Sistema

Você tem **duas opções** na AWS:

### Opção A (Recomendada para Teste Básico / Mais Econômica — Sem custo de S3)
Usa o `docker-compose.prod.yml`, que já sobe o armazenamento (MinIO) dentro da própria máquina EC2, sem precisar configurar chaves IAM ou gastar com requisições no Amazon S3:

```bash
cd ~/PACS-DICON || cd ~/PACS-DICOm
git pull origin main
sudo docker compose -f docker-compose.prod.yml up -d --build
```

### Opção B (Usando Bucket S3 da Amazon)
Se preferir salvar no bucket S3 da AWS (requer o arquivo `.env` com `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` e `AWS_S3_BUCKET_NAME`):

```bash
cd ~/PACS-DICON || cd ~/PACS-DICOm
git pull origin main
sudo docker compose -f docker-compose.aws.yml up -d --build
```

## 4. Testar o Sistema
Assim que os containers subirem (`sudo docker ps`):
1. Acesse `http://SEU_IP_AWS` no navegador e clique em **Acessar Portal** (ou vá direto em `http://SEU_IP_AWS/login`).
2. Faça login com:
   - **Usuário:** `admin`
   - **Senha:** `admin`
3. No seu equipamento de imagem (KPACS, Ressonância, Ultrassom ou `ponte_dicom.py`), configure o destino para:
   - **IP / Host:** `SEU_IP_AWS`
   - **Porta:** `11112`
   - **Called AE Title:** `PACS_ENTERPRISE1`

