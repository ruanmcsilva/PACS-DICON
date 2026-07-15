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
from app.pacs.schemas import PatientResponse, StudyResponse, SeriesResponse, InstanceResponse, AnnotationCreate, AnnotationResponse, ReportCreate, ReportResponse, IntegrationPatientCreate, IntegrationOrderCreate, ReportExportRequest
from datetime import date
import asyncio
from fpdf import FPDF
import base64

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

@router.get("/studies/{study_id}", response_model=StudyResponse)
async def get_study(
    study_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Study).options(selectinload(Study.patient), selectinload(Study.series)).where(Study.id == study_id)
    result = await db.execute(stmt)
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    study.series_count = len(study.series) if study.series else 0
    return study


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

@router.post("/series/{series_id}/video")
async def upload_series_video(
    series_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Series).where(Series.id == series_id)
    result = await db.execute(stmt)
    series = result.scalar_one_or_none()
    
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
        
    minio_client = get_minio_client()
    file_bytes = await file.read()
    file_name = f"cine_{series_id}.webm"
    
    minio_client.put_object(
        bucket_name=settings.MINIO_BUCKET_NAME,
        object_name=file_name,
        data=io.BytesIO(file_bytes),
        length=len(file_bytes),
        content_type="video/webm"
    )
    
    series.video_path = file_name
    await db.commit()
    return {"message": "Video uploaded successfully", "video_path": file_name}

@router.get("/series/{series_id}/video")
async def get_series_video(
    series_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Series).where(Series.id == series_id)
    result = await db.execute(stmt)
    series = result.scalar_one_or_none()
    
    if not series or not series.video_path:
        raise HTTPException(status_code=404, detail="Video not found")
        
    minio_client = get_minio_client()
    try:
        response = minio_client.get_object(settings.MINIO_BUCKET_NAME, series.video_path)
        return StreamingResponse(
            response.stream(32 * 1024), 
            media_type="video/webm"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving video: {e}")

@router.delete("/series/{series_id}/video")
async def delete_series_video(
    series_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Series).where(Series.id == series_id)
    result = await db.execute(stmt)
    series = result.scalar_one_or_none()
    
    if not series or not series.video_path:
        raise HTTPException(status_code=404, detail="Video not found")
        
    minio_client = get_minio_client()
    try:
        minio_client.remove_object(settings.MINIO_BUCKET_NAME, series.video_path)
        series.video_path = None
        await db.commit()
        return {"message": "Video deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting video: {e}")

@router.get("/videos")
async def get_series_with_videos(
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Series).options(selectinload(Series.study).selectinload(Study.patient)).where(Series.video_path.is_not(None))
    result = await db.execute(stmt)
    series_list = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "modality": s.modality,
            "series_description": s.series_description,
            "video_path": s.video_path,
            "study": {
                "id": s.study.id,
                "study_date": s.study.study_date,
                "patient": {
                    "patient_name": s.study.patient.patient_name
                }
            }
        }
        for s in series_list
    ]


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

@router.get("/studies/{study_id}/report", response_model=Optional[ReportResponse])
async def get_study_report(
    study_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Report).where(Report.study_id == study_id)
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()

    # Retorna None ao invés de lançar erro 404 para não poluir o console do navegador
    # caso o estudo ainda não possua um laudo.
    return report

@router.get("/reports", response_model=List[ReportResponse])
async def get_all_reports(
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Report).order_by(Report.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/studies/{study_id}/report/export")
async def export_study_report(
    study_id: UUID,
    payload: ReportExportRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Study).options(selectinload(Study.patient)).where(Study.id == study_id)
    result = await db.execute(stmt)
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    pdf = FPDF()
    pdf.add_page()
    
    # Header
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(0, 10, "CLÍNICA RADIOLÓGICA PACS", new_x="LMARGIN", new_y="NEXT", align="C")
    
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 10, "Relatório de Exame de Imagem", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)
    
    # Patient Info
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(30, 8, "Paciente:")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 8, f"{study.patient.patient_name or 'N/A'}", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(30, 8, "Data Exame:")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 8, f"{study.study_date or 'N/A'}", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(30, 8, "Estudo ID:")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 8, f"{study.study_instance_uid}", new_x="LMARGIN", new_y="NEXT")
    
    pdf.line(10, pdf.get_y() + 2, 200, pdf.get_y() + 2)
    pdf.ln(10)
    
    # Report Content
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 10, "LAUDO MÉDICO", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    
    # Write text supporting newlines
    pdf.multi_cell(0, 6, payload.content.replace('\\n', '\n'))
    
    # Key Images
    if payload.key_images:
        pdf.add_page()
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(0, 10, "ANEXO: IMAGENS-CHAVE", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(5)
        
        for idx, b64_str in enumerate(payload.key_images):
            try:
                # Add 2 images per page roughly
                if idx > 0 and idx % 2 == 0:
                    pdf.add_page()
                    
                # Ensure correct base64 format without prefix
                if "," in b64_str:
                    header, b64_data = b64_str.split(",", 1)
                else:
                    b64_data = b64_str
                
                img_data = base64.b64decode(b64_data)
                img_stream = io.BytesIO(img_data)
                
                # FPDF2 supports BytesIO directly
                pdf.image(img_stream, w=170)
                pdf.ln(5)
            except Exception as e:
                pdf.set_font("helvetica", "", 10)
                pdf.cell(0, 10, f"Erro ao processar imagem {idx+1}: {str(e)}", new_x="LMARGIN", new_y="NEXT")

    pdf_buffer = io.BytesIO()
    # Output to bytearray directly in fpdf2
    pdf_bytes = pdf.output()
    pdf_buffer.write(pdf_bytes)
    pdf_buffer.seek(0)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=laudo_{study.patient.patient_name or 'paciente'}.pdf"
        }
    )

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
