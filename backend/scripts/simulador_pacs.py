#!/usr/bin/env python3
"""
Utilitário de Testes e Simulação DICOM
Permite testar o PACS (local ou na nuvem) sem depender de aparelhos médicos reais.

Uso:
  1. Testar Ping DICOM (C-ECHO):
     python simulador_pacs.py --echo --host 127.0.0.1 --port 11112

  2. Enviar Imagem Sintética de Teste (C-STORE):
     python simulador_pacs.py --send --host 127.0.0.1 --port 11112 --patient "TESTE AUTOMATICO"

  3. Inspecionar Metadados de um Arquivo DICOM:
     python simulador_pacs.py --inspect caminho/arquivo.dcm
"""

import sys
import argparse
import datetime
import uuid
import numpy as np
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.uid import generate_uid, ExplicitVRLittleEndian
from pynetdicom import AE, VerificationPresentationContexts, StoragePresentationContexts
from pynetdicom.sop_class import CTImageStorage


def gerar_dicom_sintetico(patient_name="PACIENTE TESTE", patient_id="TEST001", modality="CT"):
    """Gera um arquivo DICOM sintético válido em memória com imagem de gradiente."""
    file_meta = FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = CTImageStorage
    file_meta.MediaStorageSOPInstanceUID = generate_uid()
    file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    file_meta.ImplementationClassUID = generate_uid()

    ds = Dataset()
    ds.file_meta = file_meta
    ds.is_little_endian = True
    ds.is_implicit_VR = False

    # Metadados do Paciente
    ds.PatientName = patient_name
    ds.PatientID = patient_id
    ds.PatientBirthDate = "19850101"
    ds.PatientSex = "M"

    # Metadados do Estudo e Série
    ds.StudyInstanceUID = generate_uid()
    ds.SeriesInstanceUID = generate_uid()
    ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
    ds.SOPClassUID = CTImageStorage
    ds.Modality = modality
    ds.SeriesNumber = 1
    ds.InstanceNumber = 1
    ds.StudyDate = datetime.date.today().strftime("%Y%m%d")
    ds.StudyTime = datetime.datetime.now().strftime("%H%M%S")
    ds.StudyDescription = "Exame de Teste Sintetico"
    ds.SeriesDescription = f"Serie de Teste {modality}"

    # Imagem Sintética (128x128 pixels em escala de cinza)
    rows, cols = 128, 128
    ds.Rows = rows
    ds.Columns = cols
    ds.BitsAllocated = 16
    ds.BitsStored = 12
    ds.HighBit = 11
    ds.PixelRepresentation = 0
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.PixelSpacing = [1.0, 1.0]

    # Cria padrão circular sintético
    x = np.linspace(-1, 1, cols)
    y = np.linspace(-1, 1, rows)
    xx, yy = np.meshgrid(x, y)
    circle = (xx**2 + yy**2 < 0.6).astype(np.uint16) * 1000
    ds.PixelData = circle.tobytes()

    return ds


def ping_dicom(host, port, aet):
    """Executa um C-ECHO contra o servidor DICOM."""
    print(f"📡 Disparando Ping DICOM (C-ECHO) para {host}:{port} (AE: {aet})...")
    ae = AE(ae_title=b"SIMULADOR_SCU")
    ae.add_requested_context("1.2.840.10008.1.1")  # Verification SOP Class

    assoc = ae.associate(host, port, ae_title=aet.encode())
    if assoc.is_established:
        status = assoc.send_c_echo()
        if status and status.Status == 0x0000:
            print("✅ [SUCESSO] Servidor DICOM respondeu ao C-ECHO com status 0x0000 (OK)!")
        else:
            print(f"⚠️ Servidor respondeu com status: {status}")
        assoc.release()
    else:
        print("❌ [FALHA] Não foi possível conectar ao servidor DICOM.")


def enviar_dicom(host, port, aet, patient_name):
    """Envia um dataset sintético para o servidor DICOM via C-STORE."""
    ds = gerar_dicom_sintetico(patient_name=patient_name)
    print(f"🚀 Enviando imagem DICOM de teste ({patient_name}) para {host}:{port} (AE: {aet})...")

    ae = AE(ae_title=b"SIMULADOR_SCU")
    ae.add_requested_context(CTImageStorage, ExplicitVRLittleEndian)

    assoc = ae.associate(host, port, ae_title=aet.encode())
    if assoc.is_established:
        status = assoc.send_c_store(ds)
        if status and status.Status == 0x0000:
            print(f"✅ [SUCESSO] Exame '{patient_name}' gravado com sucesso no PACS!")
        else:
            print(f"⚠️ Servidor retornou status: {status}")
        assoc.release()
    else:
        print("❌ [FALHA] Associação rejeitada ou servidor inacessível.")


def inspecionar_arquivo(caminho):
    """Lê e exibe os metadados principais de um arquivo .dcm local."""
    from pydicom import dcmread
    try:
        ds = dcmread(caminho)
        print("=" * 60)
        print(f"📄 Metadados do Arquivo: {caminho}")
        print("=" * 60)
        print(f"Paciente    : {getattr(ds, 'PatientName', 'N/A')}")
        print(f"ID Paciente : {getattr(ds, 'PatientID', 'N/A')}")
        print(f"Sexo        : {getattr(ds, 'PatientSex', 'N/A')}")
        print(f"Modalidade  : {getattr(ds, 'Modality', 'N/A')}")
        print(f"Estudo UID  : {getattr(ds, 'StudyInstanceUID', 'N/A')}")
        print(f"Série UID   : {getattr(ds, 'SeriesInstanceUID', 'N/A')}")
        print(f"SOP UID     : {getattr(ds, 'SOPInstanceUID', 'N/A')}")
        print(f"Sintaxe     : {getattr(ds.file_meta, 'TransferSyntaxUID', 'N/A')}")
        if hasattr(ds, 'NumberOfFrames'):
            print(f"Frames      : {ds.NumberOfFrames}")
        print("=" * 60)
    except Exception as e:
        print(f"❌ Erro ao ler arquivo DICOM: {e}")


def main():
    parser = argparse.ArgumentParser(description="Simulador e Utilitário DICOM PACS")
    parser.add_argument("--echo", action="store_true", help="Executa ping DICOM (C-ECHO)")
    parser.add_argument("--send", action="store_true", help="Envia imagem de teste (C-STORE)")
    parser.add_argument("--inspect", type=str, help="Caminho do arquivo .dcm para inspecionar")
    parser.add_argument("--host", default="127.0.0.1", help="Host do servidor DICOM (padrão: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=11112, help="Porta do servidor DICOM (padrão: 11112)")
    parser.add_argument("--aet", default="PACS_ENTERPRISE", help="AE Title do servidor DICOM")
    parser.add_argument("--patient", default="PACIENTE TESTE AUTOMATICO", help="Nome do paciente para envio de teste")

    args = parser.parse_args()

    if args.inspect:
        inspecionar_arquivo(args.inspect)
    elif args.send:
        enviar_dicom(args.host, args.port, args.aet, args.patient)
    elif args.echo:
        ping_dicom(args.host, args.port, args.aet)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
