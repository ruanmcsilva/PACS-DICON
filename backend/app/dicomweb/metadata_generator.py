import json
import pydicom
from pydicom.dataset import Dataset
from pydicom.dataelem import DataElement

def dicom_to_json(ds: Dataset) -> dict:
    """
    Converts a pydicom Dataset to DICOMweb JSON format.
    """
    json_ds = ds.to_json_dict()
    # Ensure pixel data (7FE0,0010) is excluded as per WADO-RS metadata rules
    if "7FE00010" in json_ds:
        del json_ds["7FE00010"]
    return json_ds

def generate_multipart_related_response(dicom_bytes: bytes, frame_number: int, boundary: str = "myboundary") -> bytes:
    """
    Wraps DICOM pixel data bytes into a multipart/related response.
    For simplicity, since we only have single-frame instances in this PACS so far,
    we just read the whole file, extract the pixel data, and wrap it.
    """
    try:
        ds = pydicom.dcmread(pydicom.filebase.DicomBytesIO(dicom_bytes))
        pixel_data = ds.PixelData
        
        response = f"--{boundary}\r\n".encode("utf-8")
        response += b"Content-Type: application/octet-stream\r\n\r\n"
        response += pixel_data
        response += f"\r\n--{boundary}--\r\n".encode("utf-8")
        return response
    except Exception as e:
        # Fallback to returning the entire file as application/dicom in multipart
        response = f"--{boundary}\r\n".encode("utf-8")
        response += b"Content-Type: application/dicom\r\n\r\n"
        response += dicom_bytes
        response += f"\r\n--{boundary}--\r\n".encode("utf-8")
        return response
