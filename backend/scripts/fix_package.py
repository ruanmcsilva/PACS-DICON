import json

path = '/home/ruan/Documentos/PACS-DICOm/frontend/node_modules/@cornerstonejs/dicom-image-loader/package.json'
with open(path, 'r') as f:
    data = json.load(f)

if 'exports' in data:
    del data['exports']

with open(path, 'w') as f:
    json.dump(data, f, indent=2)

print("Exports removed.")
