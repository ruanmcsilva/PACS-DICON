import asyncio
import os
import uuid
import io
import logging
from pynetdicom import events
from pydicom.filewriter import write_file_meta_info

from app.core.config import settings
from app.core.storage import get_minio_client
from app.pacs.service import query_dicom_find, get_instances_for_move
from app.core.queue.publisher import publish_metadata_task
from pydicom import dcmread

logger = logging.getLogger(__name__)

def handle_echo(event):
    """
    Handler for C-ECHO (Verification Service).
    Returns a success status.
    """
    requestor = event.assoc.requestor
    logger.info(f"Received C-ECHO request from {requestor.ae_title} ({requestor.address})")
    return 0x0000 # Success status

def handle_store(event):
    """
    Handler for C-STORE (Storage Service).
    Receives DICOM dataset and saves it to MinIO.
    """
    dataset = event.dataset
    dataset.file_meta = event.file_meta
    
    # Try to get SOP Instance UID to use as file name
    sop_instance_uid = getattr(dataset, "SOPInstanceUID", str(uuid.uuid4()))
    file_name = f"{sop_instance_uid}.dcm"
    
    requestor = event.assoc.requestor
    logger.info(f"Received C-STORE request from {requestor.ae_title} for Instance {sop_instance_uid}")
    
    try:
        # Save dataset to a local temporary file to quickly release the association
        # The background worker will handle MinIO upload and DB insertion
        temp_dir = "/tmp/dicom_ingest"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, file_name)
        
        # Write the dataset itself (pydicom save_as handles preamble, DICM and file_meta)
        dataset.is_implicit_VR = event.file_meta.TransferSyntaxUID.is_implicit_VR
        dataset.is_little_endian = event.file_meta.TransferSyntaxUID.is_little_endian
        dataset.save_as(temp_path, write_like_original=False)
        
        logger.info(f"Successfully stored {file_name} in temporary local storage.")
        
        # Publish task to RabbitMQ for asynchronous processing
        asyncio.run(publish_metadata_task(file_name, temp_path))
        
        return 0x0000 # Success status

    except Exception as e:
        logger.error(f"Error handling C-STORE request: {e}")
        return 0xC000 # Error status: Cannot Understand

def handle_find(event):
    """
    Handler for C-FIND (Query Service).
    Queries the database and yields DICOM datasets.
    """
    ds = event.identifier
    logger.info(f"Received C-FIND request. QueryRetrieveLevel: {getattr(ds, 'QueryRetrieveLevel', 'UNKNOWN')}")
    
    try:
        # Run async DB query in sync context
        results = asyncio.run(query_dicom_find(ds))
        
        for match in results:
            # Yield Pending Status (0xFF00) and the matching dataset
            yield (0xFF00, match)
            
        logger.info(f"C-FIND completed successfully. Yielded {len(results)} matches.")
        # Final success
        return (0x0000, None)
        
    except Exception as e:
        logger.error(f"Error handling C-FIND request: {e}")
        return (0xC000, None)


# Temporary static mapping for known AE Titles.
# In a real system, this would be queried from an 'admin.dicom_nodes' DB table.
DESTINATION_MAP = {
    b"RADIANT": ("192.168.1.100", 11112),
    b"OSIRIX": ("192.168.1.101", 11112),
    b"HOROS": ("192.168.1.102", 11112),
    b"STORE_SCP": ("127.0.0.1", 11113),
}

def handle_move(event):
    """
    Handler for C-MOVE (Retrieve Service).
    Finds instances, negotiates with destination, and yields them to be sent.
    """
    dest_aet = event.request.MoveDestination
    logger.info(f"Received C-MOVE request. Destination AE: {dest_aet.decode('utf-8', 'ignore') if isinstance(dest_aet, bytes) else dest_aet}")
    
    # 1. Map AE Title to IP/Port
    if dest_aet not in DESTINATION_MAP:
        logger.error(f"Unknown Move Destination: {dest_aet}")
        yield (0xA801, None) # Refused: Move Destination Unknown
        return
        
    addr, port = DESTINATION_MAP[dest_aet]
    
    # 2. Yield Destination info so pynetdicom can open the association
    yield (addr, port)
    
    # 3. Find requested instances paths in MinIO
    ds = event.identifier
    try:
        file_paths = asyncio.run(get_instances_for_move(ds))
    except Exception as e:
        logger.error(f"Database error during C-MOVE: {e}")
        yield (0xC000, None)
        return
        
    if not file_paths:
        logger.warning("C-MOVE request yielded 0 matches.")
        yield (0x0000, None)
        return
        
    # 4. Yield number of matches
    yield len(file_paths)
    
    # 5. Fetch from MinIO and yield each dataset
    minio_client = get_minio_client()
    for file_path in file_paths:
        try:
            # Download file from MinIO to memory
            response = minio_client.get_object(settings.MINIO_BUCKET_NAME, file_path)
            # Read bytes and load into pydicom
            file_bytes = io.BytesIO(response.read())
            dicom_dataset = dcmread(file_bytes)
            
            # Yield Pending Status and dataset
            yield (0xFF00, dicom_dataset)
        except Exception as e:
            logger.error(f"Failed to retrieve/send file {file_path} during C-MOVE: {e}")
            # Could yield a warning/failure for this sub-operation, but pynetdicom handles exceptions internally.
            
    logger.info(f"C-MOVE completed successfully. Sent {len(file_paths)} instances.")
    return
