import io
from app.core.config import settings
from app.core.storage import get_minio_client
from pydicom import dcmread

minio_client = get_minio_client()
objects = list(minio_client.list_objects(settings.MINIO_BUCKET_NAME))
obj = sorted(objects, key=lambda x: x.last_modified, reverse=True)[0]
response = minio_client.get_object(settings.MINIO_BUCKET_NAME, obj.object_name)
file_bytes = io.BytesIO(response.read())
dataset = dcmread(file_bytes)
print("File Meta:")
print(dataset.file_meta)
