from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.storage import get_minio_client
from app.core.queue.publisher import publish_metadata_task
from app.core.config import settings
import io
import uuid
from app.core.auth.deps import get_current_user

from app.pacs.models import Patient, Study, Series, Instance, Annotation, Report
from app.pacs.schemas import PatientResponse, StudyResponse, SeriesResponse, InstanceResponse, AnnotationCreate, AnnotationResponse, ReportCreate, ReportResponse, IntegrationPatientCreate, IntegrationOrderCreate
from datetime import date
import asyncio

router = APIRouter(dependencies=[Depends(get_current_user)])

# --- PATIENTS ---
@router.get("/patients", response_model=List[PatientResponse])
async def get_patients(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    # current_user: dict = Depends(get_current_user) # Uncomment to protect route
):
    stmt = select(Patient).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/patients/{patient_id}/studies", response_model=List[StudyResponse])
async def get_patient_studies(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Study).options(selectinload(Study.patient)).where(Study.patient_id == patient_id)
    result = await db.execute(stmt)
    return result.scalars().all()

# --- STUDIES ---
@router.get("/studies", response_model=List[StudyResponse])
async def get_studies(
    patient_name: Optional[str] = None,
    patient_id: Optional[str] = None,
    study_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Study).join(Study.patient).options(selectinload(Study.patient), selectinload(Study.series))
    
    if patient_name:
        stmt = stmt.where(Patient.patient_name.ilike(f"%{patient_name}%"))
    if patient_id:
        stmt = stmt.where(Patient.patient_id.ilike(f"%{patient_id}%"))
    if study_date:
        stmt = stmt.where(Study.study_date == study_date)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    studies = result.scalars().all()
    
    for study in studies:
        study.series_count = len(study.series) if study.series else 0
        
    return studies

@router.get("/studies/{study_id}/series", response_model=List[SeriesResponse])
async def get_study_series(
    study_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Series).where(Series.study_id == study_id)
    result = await db.execute(stmt)
    return result.scalars().all()

# --- SERIES ---
@router.get("/series/{series_id}/instances", response_model=List[InstanceResponse])
async def get_series_instances(
    series_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Instance).where(Instance.series_id == series_id).order_by(Instance.instance_number)
    result = await db.execute(stmt)
    return result.scalars().all()

# --- INSTANCES / DICOM FILES ---
@router.get("/instances/{instance_id}/file")
async def get_instance_file(
    instance_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the physical DICOM file (.dcm) from MinIO for the requested instance.
    This is what Cornerstone3D will consume (simulating WADO-RS or simple file download).
    """
    stmt = select(Instance).where(Instance.id == instance_id)
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()

    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    minio_client = get_minio_client()
    try:
        # Get data as a stream from MinIO
        response = minio_client.get_object(settings.MINIO_BUCKET_NAME, instance.file_path)
        content_length = response.headers.get('Content-Length')
        
        headers = {
            "Content-Disposition": f"attachment; filename={instance.file_path.split('/')[-1]}"
        }
        if content_length:
            headers["Content-Length"] = str(content_length)
        
        # Stream the file back to the client
        return StreamingResponse(
            response.stream(32 * 1024), 
            media_type="application/dicom",
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving file from MinIO: {e}")

# --- ANNOTATIONS ---
@router.post("/series/{series_id}/annotations", response_model=AnnotationResponse)
async def save_series_annotations(
    series_id: UUID,
    payload: AnnotationCreate,
    db: AsyncSession = Depends(get_db)
):
    # Check if series exists
    stmt = select(Series).where(Series.id == series_id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Series not found")
        
    # Check if annotation already exists for this series
    stmt_ann = select(Annotation).where(Annotation.series_id == series_id)
    result_ann = await db.execute(stmt_ann)
    existing_annotation = result_ann.scalar_one_or_none()
    
    if existing_annotation:
        # Update existing
        existing_annotation.data = payload.data
        await db.commit()
        await db.refresh(existing_annotation)
        return existing_annotation
    else:
        # Create new
        new_annotation = Annotation(series_id=series_id, data=payload.data)
        db.add(new_annotation)
        await db.commit()
        await db.refresh(new_annotation)
        return new_annotation

@router.get("/series/{series_id}/annotations", response_model=AnnotationResponse)
async def get_series_annotations(
    series_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Annotation).where(Annotation.series_id == series_id)
    result = await db.execute(stmt)
    annotation = result.scalar_one_or_none()
    
    if not annotation:
        raise HTTPException(status_code=404, detail="No annotations found for this series")
        
    return annotation

# --- REPORTS ---
@router.post("/studies/{study_id}/report", response_model=ReportResponse)
async def save_study_report(
    study_id: UUID,
    payload: ReportCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Study).where(Study.id == study_id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Study not found")

    stmt_rep = select(Report).where(Report.study_id == study_id)
    result_rep = await db.execute(stmt_rep)
    existing_report = result_rep.scalar_one_or_none()

    if existing_report:
        existing_report.content = payload.content
        existing_report.status = payload.status
        await db.commit()
        await db.refresh(existing_report)
        return existing_report
    else:
        new_report = Report(study_id=study_id, content=payload.content, status=payload.status)
        db.add(new_report)
        await db.commit()
        await db.refresh(new_report)
        return new_report

@router.get("/studies/{study_id}/report", response_model=ReportResponse)
async def get_study_report(
    study_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Report).where(Report.study_id == study_id)
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="No report found for this study")

    return report

# --- ARTIFICIAL INTELLIGENCE ---
@router.post("/studies/{study_id}/ai-draft", response_model=ReportResponse)
async def generate_ai_draft(
    study_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    # Verify study exists
    stmt = select(Study).where(Study.id == study_id)
    result = await db.execute(stmt)
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    # Simulate heavy ML inference (Loading weights, processing DICOM pixels)
    await asyncio.sleep(2)
    
    ai_text = (
        "ANÁLISE PRELIMINAR GERADA POR INTELIGÊNCIA ARTIFICIAL (v1.0)\n\n"
        "Achados Principais:\n"
        "- Estruturas anatômicas aparentemente preservadas e dentro dos limites da normalidade.\n"
        "- Não foram detectadas consolidações ou opacidades sugestivas de lesões agudas no algoritmo de triagem.\n"
        "- Ausência de sinais conclusivos de fraturas ou deslocamentos evidentes no atual field of view.\n\n"
        "Conclusão da I.A.:\n"
        "Exame de triagem com baixa probabilidade de achados críticos urgentes.\n\n"
        "** IMPORTANTE: Este é um texto de rascunho gerado por aprendizado de máquina. A revisão por um médico radiologista qualificado é obrigatória antes da emissão do laudo final. **"
    )

    # Check if report already exists to update it, or create a new one
    stmt_report = select(Report).where(Report.study_id == study_id)
    result_report = await db.execute(stmt_report)
    report = result_report.scalar_one_or_none()
    
    if report:
        report.content = ai_text
        report.status = "DRAFT"
    else:
        report = Report(
            study_id=study_id,
            content=ai_text,
            status="DRAFT"
        )
        db.add(report)
        
    await db.commit()
    await db.refresh(report)
    return report

# --- UPLOAD ---
@router.post("/upload")
async def upload_dicom_files(
    files: List[UploadFile] = File(...)
):
    minio_client = get_minio_client()
    uploaded_count = 0
    
    for file in files:
        if not file.filename.lower().endswith(".dcm"):
            continue
            
        file_bytes = await file.read()
        file_name = f"web_{uuid.uuid4()}.dcm"
        
        # Upload to MinIO
        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET_NAME,
            object_name=file_name,
            data=io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type="application/dicom"
        )
        
        # Publish task to RabbitMQ for asynchronous processing
        await publish_metadata_task(file_name)
        uploaded_count += 1
        
    if uploaded_count == 0:
        raise HTTPException(status_code=400, detail="No valid .dcm files provided")
        
    return {"message": f"Successfully uploaded and queued {uploaded_count} files"}

# --- INTEGRATION (HL7/RIS) ---
@router.post("/integration/patient", response_model=PatientResponse)
async def integrate_patient(
    payload: IntegrationPatientCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Patient).where(Patient.patient_id == payload.patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    
    if patient:
        patient.patient_name = payload.patient_name
        if payload.patient_birth_date: patient.patient_birth_date = payload.patient_birth_date
        if payload.patient_sex: patient.patient_sex = payload.patient_sex
    else:
        patient = Patient(
            patient_id=payload.patient_id,
            patient_name=payload.patient_name,
            patient_birth_date=payload.patient_birth_date,
            patient_sex=payload.patient_sex
        )
        db.add(patient)
        
    await db.commit()
    await db.refresh(patient)
    return patient

@router.post("/integration/order", response_model=StudyResponse)
async def integrate_order(
    payload: IntegrationOrderCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Patient).where(Patient.patient_id == payload.patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found. Register patient first.")
        
    study = Study(
        patient_id=patient.id,
        study_instance_uid=str(uuid.uuid4()), # Generate UID for the order
        study_date=payload.study_date or date.today().strftime("%Y%m%d"),
        study_description=payload.study_description,
        accession_number=payload.accession_number
    )
    
    db.add(study)
    await db.commit()
    await db.refresh(study)
    
    # Reload with patient relation to satisfy response model
    stmt_load = select(Study).options(selectinload(Study.patient)).where(Study.id == study.id)
    res = await db.execute(stmt_load)
    study_loaded = res.scalar_one()
    
    return study_loaded
