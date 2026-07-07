from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import os

from app.core.database import get_db
from app.core.storage import get_minio_client
from app.core.config import settings

from app.pacs.models import Study, Series, Instance, Patient
from app.dicomweb.utils import format_study_dicom_json, format_series_dicom_json, format_instance_dicom_json

router = APIRouter()

# --- QIDO-RS: Search ---

@router.get("/studies")
async def search_studies(
    request: Request,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    QIDO-RS Search for Studies.
    Returns application/dicom+json list of studies.
    """
    # Em uma implementação avançada, leríamos os query params do request (ex: PatientID, StudyDate) para filtrar
    stmt = select(Study).options(selectinload(Study.patient)).limit(limit)
    result = await db.execute(stmt)
    studies = result.scalars().all()
    
    response_data = []
    for study in studies:
        response_data.append(format_study_dicom_json(study, study.patient))
        
    return JSONResponse(content=response_data, media_type="application/dicom+json")

@router.get("/studies/{study_uid}/series")
async def search_series(
    study_uid: str,
    db: AsyncSession = Depends(get_db)
):
    """
    QIDO-RS Search for Series in a Study.
    """
    stmt = select(Series).join(Study).where(Study.study_instance_uid == study_uid)
    result = await db.execute(stmt)
    series_list = result.scalars().all()
    
    response_data = []
    for series in series_list:
        response_data.append(format_series_dicom_json(series))
        
    return JSONResponse(content=response_data, media_type="application/dicom+json")

@router.get("/studies/{study_uid}/series/{series_uid}/instances")
async def search_instances(
    request: Request,
    study_uid: str,
    series_uid: str,
    db: AsyncSession = Depends(get_db)
):
    """
    QIDO-RS Search for Instances in a Series.
    """
    stmt = select(Instance).join(Series).where(Series.series_instance_uid == series_uid)
    result = await db.execute(stmt)
    instances = result.scalars().all()
    
    base_url = str(request.base_url).rstrip("/")
    
    response_data = []
    for instance in instances:
        # Construct the WADO-RS Retrieve URL for this instance
        wado_url = f"{base_url}/api/dicom-web/studies/{study_uid}/series/{series_uid}/instances/{instance.sop_instance_uid}"
        response_data.append(format_instance_dicom_json(instance, wado_url))
        
    return JSONResponse(content=response_data, media_type="application/dicom+json")

# --- WADO-RS: Retrieve ---

@router.get("/studies/{study_uid}/series/{series_uid}/instances/{instance_uid}")
async def retrieve_instance(
    study_uid: str,
    series_uid: str,
    instance_uid: str,
    db: AsyncSession = Depends(get_db)
):
    """
    WADO-RS Retrieve Instance.
    Returns the DICOM Part 10 file directly (application/dicom).
    Note: A strict WADO-RS implementation might wrap this in multipart/related.
    For simplicity and wide compatibility with Cornerstone loaders (like cornerstoneWADOImageLoader),
    returning the raw file as application/dicom is often sufficient for single instance requests.
    """
    stmt = select(Instance).where(Instance.sop_instance_uid == instance_uid)
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
        
    minio_client = get_minio_client()
    try:
        response = minio_client.get_object(settings.MINIO_BUCKET_NAME, instance.file_path)
        
        # A true WADO-RS for multiple files would use multipart/related. 
        # For a single instance, we can just return application/dicom or use multipart.
        # Let's use application/dicom.
        return StreamingResponse(
            response.stream(32 * 1024), 
            media_type="application/dicom"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving file from MinIO: {e}")
