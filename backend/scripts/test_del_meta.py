import io
from app.core.config import settings
from app.core.storage import get_minio_client
from pydicom import dcmread
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.uid import ImplicitVRLittleEndian

minio_client = get_minio_client()
objects = list(minio_client.list_objects(settings.MINIO_BUCKET_NAME))
obj = sorted(objects, key=lambda x: x.last_modified, reverse=True)[0]
response = minio_client.get_object(settings.MINIO_BUCKET_NAME, obj.object_name)
file_bytes = io.BytesIO(response.read())
dataset = dcmread(file_bytes)

# Delete Group Length
if 0x00020000 in dataset.file_meta:
    del dataset.file_meta[0x00020000]

buffer = io.BytesIO()
dataset.save_as(buffer, write_like_original=False)

buffer.seek(0)
dataset_new = dcmread(buffer)
print("New Group Length:", dataset_new.file_meta[0x00020000].value)

