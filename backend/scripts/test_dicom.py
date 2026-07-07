import sys
from pynetdicom import AE, debug_logger
from pynetdicom.sop_class import Verification, PatientRootQueryRetrieveInformationModelFind
from pydicom.dataset import Dataset

# Habilita logs da pynetdicom para debug se necessário
# debug_logger()

SERVER_IP = "127.0.0.1"
SERVER_PORT = 11112

def test_echo():
    print("Enviando C-ECHO para o servidor...")
    ae = AE(ae_title=b'TEST_SCU')
    ae.add_requested_context(Verification)
    
    assoc = ae.associate(SERVER_IP, SERVER_PORT, ae_title=b'PACS_ENTERPRISE')
    if assoc.is_established:
        status = assoc.send_c_echo()
        if status:
            print(f"✅ C-ECHO bem-sucedido! Status: 0x{status.Status:04x}")
        else:
            print("❌ C-ECHO falhou (Conexão encerrada ou time out)")
        assoc.release()
        return True
    else:
        print("❌ C-ECHO falhou. Servidor rejeitou ou não está rodando.")
        return False

def test_find():
    print("\nEnviando C-FIND (Nível de Estudo) para o servidor...")
    ae = AE(ae_title=b'TEST_SCU')
    ae.add_requested_context(PatientRootQueryRetrieveInformationModelFind)
    
    assoc = ae.associate(SERVER_IP, SERVER_PORT, ae_title=b'PACS_ENTERPRISE')
    if assoc.is_established:
        # Montar a Query
        ds = Dataset()
        ds.QueryRetrieveLevel = 'STUDY'
        ds.PatientID = '' 
        ds.PatientName = ''
        ds.StudyInstanceUID = ''
        ds.StudyDate = ''
        
        responses = assoc.send_c_find(ds, PatientRootQueryRetrieveInformationModelFind)
        count = 0
        for (status, identifier) in responses:
            if status:
                if status.Status in (0xFF00, 0xFF01):
                    count += 1
                    name = getattr(identifier, 'PatientName', 'Desconhecido')
                    pid = getattr(identifier, 'PatientID', 'Sem ID')
                    print(f"🔍 Encontrado Estudo {count}: Paciente {name} (ID: {pid})")
                elif status.Status == 0x0000:
                    print(f"✅ C-FIND finalizado com sucesso! Total de resultados: {count}")
                else:
                    print(f"⚠️ C-FIND finalizou com status: 0x{status.Status:04x}")
            else:
                print("❌ Conexão abortada ou timeout.")
                
        assoc.release()
    else:
        print("❌ C-FIND falhou. Associação rejeitada.")

if __name__ == "__main__":
    if test_echo():
        test_find()
