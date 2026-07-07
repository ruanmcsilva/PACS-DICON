import io
from app.core.config import settings
from app.core.storage import get_minio_client
from pydicom import dcmread

minio_client = get_minio_client()
objects = list(minio_client.list_objects(settings.MINIO_BUCKET_NAME))
if not objects:
    print("Bucket empty")
    exit(0)

# Get the latest object
obj = sorted(objects, key=lambda x: x.last_modified, reverse=True)[0]
print("File:", obj.object_name)

response = minio_client.get_object(settings.MINIO_BUCKET_NAME, obj.object_name)
file_bytes = io.BytesIO(response.read())

with open('downloaded_test.dcm', 'wb') as f:
    f.write(file_bytes.getvalue())
    
dataset = dcmread(file_bytes)
print("Transfer Syntax:", dataset.file_meta.TransferSyntaxUID.name)
print("Is Implicit VR:", dataset.is_implicit_VR)
