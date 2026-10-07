# Passos para Retomar os Testes na AWS (PACS-DICOM)

Este guia contém os comandos necessários para você continuar amanhã com a máquina `t3.medium`.

## 1. Iniciar a Máquina na AWS
Se a máquina estiver parada, vá no painel EC2, certifique-se de que ela está como **t3.medium** e clique em **Iniciar Instância**.

## 2. Conectar no Servidor
No terminal do seu computador, conecte-se via SSH:
```bash
ssh -i ~/Documentos/Sisema-pacs-virginia.pem ubuntu@3.237.198.141
```
*(Substitua `3.237.198.141` pelo Endereço IP Público da sua nova máquina na AWS Virginia caso mude ao reiniciar).*

## 3. Corrigir as URLs e Subir o Frontend
Assim que estiver logado na AWS (`ubuntu@ip-172...`), copie e cole o bloco de comandos abaixo. 
Isso vai corrigir o erro de login e recompilar a interface web muito mais rápido com a máquina t3.medium.

```bash
cd ~/PACS-DICON

sed -i "s|baseURL: 'http://localhost:8000/api'|baseURL: '/api'|g" frontend/src/core/api/axios.ts
sed -i "s|REACT_APP_API_URL || 'http://localhost:8000/api'|REACT_APP_API_URL || '/api'|g" frontend/src/pacs/services/api.ts
sed -i 's|const baseUrl = "http://localhost:8000";|const baseUrl = window.location.origin;|g' frontend/src/pacs/components/SeriesThumbnail.tsx
sed -i 's|const baseUrl = "http://localhost:8000";|const baseUrl = window.location.origin;|g' frontend/src/pacs/components/Viewer.tsx
sed -i 's|fetch(`http://localhost:8000/api/pacs/studies/${studyId}/report/export`|fetch(`/api/pacs/studies/${studyId}/report/export`|g' frontend/src/pacs/components/Viewer.tsx

sudo docker compose -f docker-compose.aws.yml build frontend
sudo docker compose -f docker-compose.aws.yml up -d frontend
```

## 4. Testar o Sistema
Assim que o comando acima terminar:
1. Acesse `http://3.236.185.28` no seu navegador.
2. Faça login com o usuário **`admin`** e senha **`admin`**.
3. No seu software/equipamento de imagem (KPACS, Ressonância, etc.), configure o envio para:
   - **IP / Host:** `3.236.185.28`
   - **Porta:** `11112`
   - **AETitle:** `PACS_ENTERPRISE1`
