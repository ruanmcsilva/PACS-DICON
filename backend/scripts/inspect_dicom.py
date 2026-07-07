import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
import pydicom
import io
import sys

from app.core.config import settings
from app.pacs.models import Instance
from app.core.storage import get_minio_client

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    series_id = "d698f3a6-5093-4469-b926-d800bcc35e9e"
    
    async with async_session() as db:
        stmt = select(Instance).where(Instance.series_id == series_id)
        result = await db.execute(stmt)
        instances = result.scalars().all()
        
        if not instances:
            print("No instances found for this series.")
            return
            
        print(f"Found {len(instances)} instances.")
        inst = instances[0]
        print(f"File path: {inst.file_path}")
        
        # Download from MinIO
        minio_client = get_minio_client()
        try:
            response = minio_client.get_object(settings.MINIO_BUCKET_NAME, inst.file_path)
            file_bytes = response.read()
            print(f"File size: {len(file_bytes)} bytes")
            
            # Read DICOM
            ds = pydicom.dcmread(io.BytesIO(file_bytes))
            print(f"Transfer Syntax UID: {ds.file_meta.TransferSyntaxUID}")
            print(f"Photometric Interpretation: {ds.PhotometricInterpretation if 'PhotometricInterpretation' in ds else 'N/A'}")
            print(f"Rows: {ds.Rows if 'Rows' in ds else 'N/A'}")
            print(f"Columns: {ds.Columns if 'Columns' in ds else 'N/A'}")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
