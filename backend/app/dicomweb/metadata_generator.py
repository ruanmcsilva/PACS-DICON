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
        
    # INJECT File Meta Information: Transfer Syntax UID (0002,0010)
    # Cornerstone3D dicom-image-loader requires this to know how to decode the WADO-RS frames!
    if hasattr(ds, 'file_meta') and 'TransferSyntaxUID' in ds.file_meta:
        json_ds["00020010"] = {
            "vr": "UI",
            "Value": [str(ds.file_meta.TransferSyntaxUID)]
        }
        
    return json_ds

def generate_multipart_related_response(dicom_bytes: bytes, frame_number: int, boundary: str = "myboundary", transfer_syntax: str = "1.2.840.10008.1.2") -> bytes:
    """
    Wraps DICOM pixel data bytes into a multipart/related response.
    For simplicity, since we only have single-frame instances in this PACS so far,
    we just read the whole file, extract the pixel data, and wrap it.
    """
    try:
        ds = pydicom.dcmread(pydicom.filebase.DicomBytesIO(dicom_bytes))
        pixel_data = ds.PixelData
        
        response = f"--{boundary}\r\n".encode("utf-8")
        response += f"Content-Type: application/octet-stream; transfer-syntax={transfer_syntax}\r\n\r\n".encode("utf-8")
        response += pixel_data
        response += f"\r\n--{boundary}--\r\n".encode("utf-8")
        return response
    except Exception as e:
        # Fallback to returning the entire file as application/dicom in multipart
        response = f"--{boundary}\r\n".encode("utf-8")
        response += f"Content-Type: application/dicom; transfer-syntax={transfer_syntax}\r\n\r\n".encode("utf-8")
        response += dicom_bytes
        response += f"\r\n--{boundary}--\r\n".encode("utf-8")
        return response
