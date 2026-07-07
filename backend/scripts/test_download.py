import urllib.request
import time

url = "http://localhost:8000/api/pacs/instances/4a0d5b8b-7055-49ee-a55a-4583453065d1/file"
print(f"Fetching {url}...")

try:
    start_time = time.time()
    response = urllib.request.urlopen(url, timeout=5.0)
    data = response.read()
    
    print(f"Status: {response.status}")
    print(f"Content-Length header: {response.headers.get('content-length')}")
    print(f"Actual downloaded bytes: {len(data)}")
    
    if response.headers.get('content-length') != str(len(data)):
        print("MISMATCH IN CONTENT-LENGTH!")
    else:
        print("Content-Length matches actual downloaded bytes.")
    print(f"Time taken: {time.time() - start_time:.2f} seconds")
except Exception as e:
    print(f"Error during download: {e}")

