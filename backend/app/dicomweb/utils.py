from app.pacs.models import Study, Series, Instance, Patient
from typing import Dict, Any

def format_study_dicom_json(study: Study, patient: Patient) -> Dict[str, Any]:
    """
    Formata um Study e Patient no padrão DICOMWeb application/dicom+json.
    """
    return {
        # PatientName
        "00100010": {
            "vr": "PN",
            "Value": [{"Alphabetic": patient.patient_name}] if patient and patient.patient_name else []
        },
        # PatientID
        "00100020": {
            "vr": "LO",
            "Value": [patient.patient_id] if patient and patient.patient_id else []
        },
        # StudyDate
        "00080020": {
            "vr": "DA",
            "Value": [study.study_date.strftime("%Y%m%d")] if study.study_date else []
        },
        # StudyTime
        "00080030": {
            "vr": "TM",
            "Value": [study.study_time.strftime("%H%M%S")] if study.study_time else []
        },
        # AccessionNumber
        "00080050": {
            "vr": "SH",
            "Value": [study.accession_number] if study.accession_number else []
        },
        # StudyDescription
        "00081030": {
            "vr": "LO",
            "Value": [study.study_description] if study.study_description else []
        },
        # StudyInstanceUID
        "0020000D": {
            "vr": "UI",
            "Value": [study.study_instance_uid]
        }
    }

def format_series_dicom_json(series: Series) -> Dict[str, Any]:
    """
    Formata uma Series no padrão DICOMWeb application/dicom+json.
    """
    return {
        # Modality
        "00080060": {
            "vr": "CS",
            "Value": [series.modality] if series.modality else []
        },
        # SeriesDescription
        "0008103E": {
            "vr": "LO",
            "Value": [series.series_description] if series.series_description else []
        },
        # SeriesInstanceUID
        "0020000E": {
            "vr": "UI",
            "Value": [series.series_instance_uid]
        },
        # SeriesNumber
        "00200011": {
            "vr": "IS",
            "Value": [str(series.series_number)] if series.series_number is not None else []
        }
    }

def format_instance_dicom_json(instance: Instance, wado_url: str = None) -> Dict[str, Any]:
    """
    Formata uma Instance no padrão DICOMWeb application/dicom+json.
    """
    data = {
        # SOPClassUID
        "00080016": {
            "vr": "UI",
            "Value": [instance.sop_class_uid] if instance.sop_class_uid else []
        },
        # SOPInstanceUID
        "00080018": {
            "vr": "UI",
            "Value": [instance.sop_instance_uid]
        },
        # InstanceNumber
        "00200013": {
            "vr": "IS",
            "Value": [str(instance.instance_number)] if instance.instance_number is not None else []
        }
    }
    
    # RetrieveURL (WADO-RS Endpoint) - Tag 00081190
    if wado_url:
        data["00081190"] = {
            "vr": "UR",
            "Value": [wado_url]
        }
        
    return data
