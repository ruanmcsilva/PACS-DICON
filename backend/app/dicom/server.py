import logging
import threading
import pynetdicom
from pynetdicom import AE, evt, AllStoragePresentationContexts, VerificationPresentationContexts, QueryRetrievePresentationContexts

# Override strict DICOM validation to accept connections from old systems (like KPACS)
# that incorrectly pad strings with null bytes (\x00) instead of spaces.
def permissive_ae_validator(value):
    return (True, "")
pynetdicom._config.VALIDATORS['AE'] = permissive_ae_validator

from app.core.config import settings
from app.dicom.handlers import handle_echo, handle_store, handle_find, handle_move

logger = logging.getLogger(__name__)

class DicomServer:
    def __init__(self):
        self.ae = AE(ae_title=settings.DICOM_AETITLE)
        
        # We want to support all storage types (CT, MR, CR, Ultrasound, etc.)
        self.ae.supported_contexts = AllStoragePresentationContexts
        
        # We also want to support verification (C-ECHO)
        for context in VerificationPresentationContexts:
            self.ae.add_supported_context(context.abstract_syntax)
            
        # Add support for Query/Retrieve (C-FIND, C-MOVE)
        for context in QueryRetrievePresentationContexts:
            self.ae.add_supported_context(context.abstract_syntax)

        # Bind event handlers
        self.handlers = [
            (evt.EVT_C_ECHO, handle_echo),
            (evt.EVT_C_STORE, handle_store),
            (evt.EVT_C_FIND, handle_find),
            (evt.EVT_C_MOVE, handle_move),
        ]
        
        self.server = None

    def start(self):
        """
        Starts the DICOM SCP server in a non-blocking way.
        """
        logger.info(f"Starting DICOM Server (SCP) on port {settings.DICOM_PORT} with AETitle '{settings.DICOM_AETITLE}'...")
        try:
            self.server = self.ae.start_server(
                ("", settings.DICOM_PORT), 
                block=False, 
                evt_handlers=self.handlers
            )
        except Exception as e:
            logger.error(f"Failed to start DICOM Server: {e}")

    def stop(self):
        """
        Stops the DICOM SCP server.
        """
        if self.server:
            logger.info("Stopping DICOM Server...")
            self.server.shutdown()
            self.server = None

# Create a singleton instance
dicom_scp = DicomServer()

def start_dicom_server_in_background():
    """
    Helper function to launch the DICOM server.
    Call this function when the FastAPI app starts up.
    """
    dicom_scp.start()
    return None
