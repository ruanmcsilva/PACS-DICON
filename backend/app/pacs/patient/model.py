from sqlalchemy import Column, String, Integer, Date, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=False) # DICOM PatientID
    patient_name = Column(String, index=True)
    patient_birth_date = Column(Date, nullable=True)
    patient_sex = Column(String(1), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
