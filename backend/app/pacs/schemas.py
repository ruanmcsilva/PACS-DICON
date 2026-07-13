from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
from datetime import date, time, datetime
from uuid import UUID

# --- PATIENT ---
class PatientBase(BaseModel):
    patient_id: str
    patient_name: Optional[str] = None
    patient_sex: Optional[str] = None
    patient_birth_date: Optional[date] = None

class PatientResponse(PatientBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)

# --- INSTANCE ---
class InstanceBase(BaseModel):
    sop_instance_uid: str
    sop_class_uid: str
    instance_number: Optional[int] = None
    file_path: str

class InstanceResponse(InstanceBase):
    id: UUID
    series_id: UUID

    model_config = ConfigDict(from_attributes=True)

# --- SERIES ---
class SeriesBase(BaseModel):
    series_instance_uid: str
    modality: str
    series_number: Optional[int] = None
    series_description: Optional[str] = None

class SeriesResponse(SeriesBase):
    id: UUID
    study_id: UUID

    model_config = ConfigDict(from_attributes=True)

# --- STUDY ---
class StudyBase(BaseModel):
    study_instance_uid: str
    study_date: Optional[date] = None
    study_time: Optional[time] = None
    accession_number: Optional[str] = None
    study_description: Optional[str] = None

class StudyResponse(StudyBase):
    id: UUID
    patient_id: UUID
    patient: Optional[PatientResponse] = None
    series_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# --- ANNOTATION ---
class AnnotationCreate(BaseModel):
    data: Any # JSONB accepts any valid JSON structure

class AnnotationResponse(AnnotationCreate):
    id: UUID
    series_id: UUID

    model_config = ConfigDict(from_attributes=True)

# --- REPORT ---
class ReportCreate(BaseModel):
    content: str
    status: str = "DRAFT"

class ReportResponse(ReportCreate):
    id: UUID
    study_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReportExportRequest(BaseModel):
    content: str
    key_images: List[str] = [] # List of base64 encoded images

# --- INTEGRATION (HL7/RIS) ---
class IntegrationPatientCreate(BaseModel):
    patient_id: str
    patient_name: str
    patient_birth_date: Optional[str] = None
    patient_sex: Optional[str] = None

class IntegrationOrderCreate(BaseModel):
    patient_id: str
    accession_number: Optional[str] = None
    study_description: str
    study_date: Optional[str] = None
