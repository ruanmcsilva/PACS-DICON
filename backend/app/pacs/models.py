import uuid
from sqlalchemy import Column, String, Date, Time, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, unique=True, index=True, nullable=False) # DICOM Patient ID (0010,0020)
    patient_name = Column(String, nullable=True) # (0010,0010)
    patient_sex = Column(String(1), nullable=True) # (0010,0040)
    patient_birth_date = Column(Date, nullable=True) # (0010,0030)

    # Relationship to Study
    studies = relationship("Study", back_populates="patient", cascade="all, delete-orphan")

class Study(Base):
    __tablename__ = "studies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    study_instance_uid = Column(String, unique=True, index=True, nullable=False) # (0020,000D)
    study_date = Column(Date, nullable=True) # (0008,0020)
    study_time = Column(Time, nullable=True) # (0008,0030)
    accession_number = Column(String, index=True, nullable=True) # (0008,0050)
    study_description = Column(String, nullable=True) # (0008,1030)
    
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="studies")
    series = relationship("Series", back_populates="study", cascade="all, delete-orphan")

class Series(Base):
    __tablename__ = "series"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_instance_uid = Column(String, unique=True, index=True, nullable=False) # (0020,000E)
    modality = Column(String, index=True, nullable=False) # (0008,0060) e.g., CT, MR, CR
    series_number = Column(Integer, nullable=True) # (0020,0011)
    series_description = Column(String, nullable=True) # (0008,103E)
    
    study_id = Column(UUID(as_uuid=True), ForeignKey("studies.id"), nullable=False)

    # Relationships
    study = relationship("Study", back_populates="series")
    instances = relationship("Instance", back_populates="series", cascade="all, delete-orphan")

class Instance(Base):
    __tablename__ = "instances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sop_instance_uid = Column(String, unique=True, index=True, nullable=False) # (0008,0018)
    sop_class_uid = Column(String, nullable=False) # (0008,0016)
    instance_number = Column(Integer, nullable=True) # (0020,0013)
    file_path = Column(String, nullable=False) # Path inside MinIO, e.g., dicom-images/<uuid>.dcm
    
    series_id = Column(UUID(as_uuid=True), ForeignKey("series.id"), nullable=False)

    # Relationships
    series = relationship("Series", back_populates="instances")
