from minio import Minio
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize MinIO client
minio_client = Minio(
    settings.MINIO_SERVER,
    access_key=settings.MINIO_ROOT_USER,
    secret_key=settings.MINIO_ROOT_PASSWORD,
    secure=settings.MINIO_SECURE
)

def init_minio_bucket():
    """
    Ensure the DICOM images bucket exists upon startup.
    """
    try:
        found = minio_client.bucket_exists(settings.MINIO_BUCKET_NAME)
        if not found:
            minio_client.make_bucket(settings.MINIO_BUCKET_NAME)
            logger.info(f"Bucket '{settings.MINIO_BUCKET_NAME}' created successfully.")
        else:
            logger.info(f"Bucket '{settings.MINIO_BUCKET_NAME}' already exists.")
    except Exception as e:
        logger.error(f"Error initializing MinIO bucket: {e}")

def get_minio_client() -> Minio:
    return minio_client
