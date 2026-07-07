import urllib.request
import json

try:
    url = "https://unpkg.com/@cornerstonejs/dicom-image-loader@5.1.4/?meta"
    response = urllib.request.urlopen(url, timeout=5)
    data = json.loads(response.read())
    
    def print_files(node, path=""):
        if node["type"] == "file":
            print(f"{path}/{node['path']}")
        elif node["type"] == "directory":
            for child in node["files"]:
                print_files(child, path)
                
    print_files(data)
except Exception as e:
    print(f"Error: {e}")
