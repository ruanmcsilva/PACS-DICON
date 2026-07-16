import sys
import uuid
import datetime
from pynetdicom import AE, debug_logger
from pynetdicom.sop_class import CTImageStorage
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.uid import generate_uid, ImplicitVRLittleEndian

# Habilita logs para ver a negociação DICOM acontecendo
# debug_logger()

SERVER_IP = "127.0.0.1"
SERVER_PORT = 11112
SERVER_AET = b"PACS_ENTERPRISE"
MY_AET = b"MODALITY_TEST"

import os
from pydicom import dcmread

def get_real_dicoms():
    """Lê os arquivos reais do usuário."""
    files = [
        "c:/Users/Felipe/Downloads/PACS-DICON/frontend/http_test.dcm",
        "c:/Users/Felipe/Downloads/PACS-DICON/backend/scripts/downloaded_test.dcm"
    ]
    
    datasets = []
    for filepath in files:
        if os.path.exists(filepath):
            ds = dcmread(filepath)
            # Garantir paciente único para o teste de hoje
            ds.PatientName = "TESTE^WEASIS"
            ds.PatientID = "WEASIS123"
            
            # Se não tiver File Meta, crie um básico
            if not hasattr(ds, 'file_meta') or ds.file_meta is None:
                ds.ensure_file_meta()
            
            datasets.append(ds)
        else:
            print(f"⚠️ Arquivo não encontrado: {filepath}")
    return datasets

def send_image():
    datasets = get_real_dicoms()
    if not datasets:
        print("[ERROR] Nenhum arquivo encontrado em ~/Downloads.")
        return
        
    print(f"Preparando {len(datasets)} imagem(ns) reais para envio...")
    
    for dataset in datasets:
        print(f"Conectando ao PACS ({SERVER_IP}:{SERVER_PORT}) como {MY_AET.decode()} para enviar a instância {dataset.SOPInstanceUID}...")
        ae = AE(ae_title=MY_AET)
        ae.add_requested_context(CTImageStorage)
        
        # O pynetdicom pode exigir a classe de SOP correta (os testes do weasis podem ser MR ou CR)
        # Vamos tentar adicionar a SOP Class específica do dataset se não for CT
        try:
            ae.add_requested_context(dataset.SOPClassUID)
        except:
            pass
            
        assoc = ae.associate(SERVER_IP, SERVER_PORT, ae_title=SERVER_AET)
        
        if assoc.is_established:
            print("Conexão estabelecida! Enviando exame (C-STORE)...")
            status = assoc.send_c_store(dataset)
            
            if status:
                print(f"[OK] Exame enviado com sucesso! Status DICOM: 0x{status.Status:04x}")
            else:
                print("[ERROR] Falha ao enviar o exame (Conexão encerrada ou timeout).")
                
            assoc.release()
        else:
            print("[ERROR] Não foi possível conectar ao servidor PACS. Verifique se ele está rodando.")

if __name__ == "__main__":
    send_image()
