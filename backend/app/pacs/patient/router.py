from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.pacs.patient.model import Patient
from app.pacs.patient.schema import PatientResponse, PatientCreate
from app.core.auth.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[PatientResponse])
def read_patients(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients

@router.post("/", response_model=PatientResponse)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_patient = db.query(Patient).filter(Patient.patient_id == patient.patient_id).first()
    if db_patient:
        raise HTTPException(status_code=400, detail="Patient already registered")
    
    # Use model_dump in pydantic v2 instead of dict()
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient
