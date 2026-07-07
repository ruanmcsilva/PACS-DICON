from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.storage import get_minio_client
from app.core.config import settings
from app.core.auth.deps import get_current_user

from app.pacs.models import Patient, Study, Series, Instance
from app.pacs.schemas import PatientResponse, StudyResponse, SeriesResponse, InstanceResponse

router = APIRouter()

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
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Study).options(selectinload(Study.patient)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

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
