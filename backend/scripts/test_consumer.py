import asyncio
import io
from app.core.config import settings
from app.core.storage import get_minio_client
from app.pacs.service import process_dicom_metadata
from pydicom import dcmread

async def test():
    file_name = '1.2.826.0.1.3680043.8.498.37056123683871631130609556640071470508.dcm'
    minio_client = get_minio_client()
    response = minio_client.get_object(settings.MINIO_BUCKET_NAME, file_name)
    file_bytes = io.BytesIO(response.read())
    dataset = dcmread(file_bytes)
    await process_dicom_metadata(dataset, file_name)
    print("Done")

asyncio.run(test())
