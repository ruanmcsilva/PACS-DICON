import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.pacs.models import Patient, Study, Series, Instance
from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

async def process_dicom_metadata(dataset, file_path: str):
    """
    Extracts metadata from a DICOM dataset and persists it to the PostgreSQL database.
    """
    try:
        # Extrair metadados principais (usando getattr seguro)
        patient_id = getattr(dataset, "PatientID", "UNKNOWN")
        patient_name = str(getattr(dataset, "PatientName", "Unknown Patient"))
        patient_sex = getattr(dataset, "PatientSex", "O")
        
        study_uid = getattr(dataset, "StudyInstanceUID", None)
        series_uid = getattr(dataset, "SeriesInstanceUID", None)
        instance_uid = getattr(dataset, "SOPInstanceUID", None)
        
        if not study_uid or not series_uid or not instance_uid:
            logger.error("Missing critical DICOM UIDs. Cannot process metadata.")
            return

        async with AsyncSessionLocal() as session:
            # 1. Patient
            stmt_patient = select(Patient).where(Patient.patient_id == patient_id)
            result = await session.execute(stmt_patient)
            patient = result.scalar_one_or_none()
            
            if not patient:
                patient = Patient(
                    patient_id=patient_id,
                    patient_name=patient_name,
                    patient_sex=patient_sex
                )
                session.add(patient)
                await session.flush() # Para gerar o patient.id
                
            # 2. Study
            stmt_study = select(Study).where(Study.study_instance_uid == study_uid)
            result = await session.execute(stmt_study)
            study = result.scalar_one_or_none()
            
            if not study:
                # Tratar Data e Hora (simplificado)
                study_date_raw = getattr(dataset, "StudyDate", None)
                study_time_raw = getattr(dataset, "StudyTime", None)
                
                s_date, s_time = None, None
                try:
                    if study_date_raw and len(study_date_raw) >= 8:
                        s_date = datetime.strptime(study_date_raw[:8], "%Y%m%d").date()
                    if study_time_raw and len(study_time_raw) >= 6:
                        s_time = datetime.strptime(study_time_raw[:6], "%H%M%S").time()
                except ValueError:
                    pass

                study = Study(
                    study_instance_uid=study_uid,
                    study_date=s_date,
                    study_time=s_time,
                    accession_number=getattr(dataset, "AccessionNumber", None),
                    study_description=getattr(dataset, "StudyDescription", None),
                    patient_id=patient.id
                )
                session.add(study)
                await session.flush()
                
            # 3. Series
            stmt_series = select(Series).where(Series.series_instance_uid == series_uid)
            result = await session.execute(stmt_series)
            series = result.scalar_one_or_none()
            
            if not series:
                series_number = getattr(dataset, "SeriesNumber", None)
                try:
                    series_number = int(series_number) if series_number else None
                except (ValueError, TypeError):
                    series_number = None
                    
                series = Series(
                    series_instance_uid=series_uid,
                    modality=getattr(dataset, "Modality", "UNKNOWN"),
                    series_number=series_number,
                    series_description=getattr(dataset, "SeriesDescription", None),
                    study_id=study.id
                )
                session.add(series)
                await session.flush()
                
            # 4. Instance
            stmt_instance = select(Instance).where(Instance.sop_instance_uid == instance_uid)
            result = await session.execute(stmt_instance)
            instance = result.scalar_one_or_none()
            
            if not instance:
                instance_number = getattr(dataset, "InstanceNumber", None)
                try:
                    instance_number = int(instance_number) if instance_number else None
                except (ValueError, TypeError):
                    instance_number = None
                    
                instance = Instance(
                    sop_instance_uid=instance_uid,
                    sop_class_uid=getattr(dataset, "SOPClassUID", "UNKNOWN"),
                    instance_number=instance_number,
                    file_path=file_path,
                    series_id=series.id
                )
                session.add(instance)
            else:
                # Update file_path in case it was re-uploaded or path changed
                instance.file_path = file_path
                
            await session.commit()
            logger.info(f"Metadata for instance {instance_uid} processed successfully.")

    except Exception as e:
        logger.error(f"Error processing DICOM metadata: {e}")

from pydicom.dataset import Dataset

async def query_dicom_find(query_dataset: Dataset) -> list[Dataset]:
    """
    Handles C-FIND queries.
    Parses the query_dataset, queries the database, and returns a list of matching pydicom.Dataset objects.
    """
    qr_level = getattr(query_dataset, 'QueryRetrieveLevel', 'STUDY').upper()
    results = []

    async with AsyncSessionLocal() as session:
        if qr_level == 'PATIENT':
            stmt = select(Patient)
            if 'PatientID' in query_dataset and query_dataset.PatientID:
                stmt = stmt.where(Patient.patient_id == query_dataset.PatientID)
            if 'PatientName' in query_dataset and query_dataset.PatientName:
                search_name = str(query_dataset.PatientName).replace('*', '%')
                stmt = stmt.where(Patient.patient_name.ilike(search_name))
                
            db_results = await session.execute(stmt)
            for db_patient in db_results.scalars():
                ds = Dataset()
                ds.PatientID = db_patient.patient_id
                ds.PatientName = db_patient.patient_name
                ds.PatientSex = db_patient.patient_sex
                ds.QueryRetrieveLevel = qr_level
                ds.RetrieveAETitle = "PACS_SERVER"
                results.append(ds)
                
        elif qr_level == 'STUDY':
            stmt = select(Study).join(Patient)
            if 'PatientID' in query_dataset and query_dataset.PatientID:
                stmt = stmt.where(Patient.patient_id == query_dataset.PatientID)
            if 'PatientName' in query_dataset and query_dataset.PatientName:
                search_name = str(query_dataset.PatientName).replace('*', '%')
                stmt = stmt.where(Patient.patient_name.ilike(search_name))
            if 'StudyInstanceUID' in query_dataset and query_dataset.StudyInstanceUID:
                stmt = stmt.where(Study.study_instance_uid == query_dataset.StudyInstanceUID)
            if 'AccessionNumber' in query_dataset and query_dataset.AccessionNumber:
                stmt = stmt.where(Study.accession_number == query_dataset.AccessionNumber)

            db_results = await session.execute(stmt)
            for db_study in db_results.scalars():
                ds = Dataset()
                # Required Study Level keys
                ds.StudyInstanceUID = db_study.study_instance_uid
                ds.StudyDate = db_study.study_date.strftime("%Y%m%d") if db_study.study_date else ""
                ds.StudyTime = db_study.study_time.strftime("%H%M%S") if db_study.study_time else ""
                ds.AccessionNumber = db_study.accession_number or ""
                ds.StudyDescription = db_study.study_description or ""
                
                # We need to await or eager load patient info, but here we used join.
                # Since we didn't use joinedload, we can't safely access db_study.patient synchronously if not loaded.
                # Actually, let's just use selectinload or joinedload for safety, but since we joined, let's fix it.
                ds.QueryRetrieveLevel = qr_level
                ds.RetrieveAETitle = "PACS_SERVER"
                results.append(ds)

        elif qr_level == 'SERIES':
            stmt = select(Series).where(Series.study_id == select(Study.id).where(Study.study_instance_uid == query_dataset.StudyInstanceUID).scalar_subquery())
            if 'SeriesInstanceUID' in query_dataset and query_dataset.SeriesInstanceUID:
                stmt = stmt.where(Series.series_instance_uid == query_dataset.SeriesInstanceUID)

            db_results = await session.execute(stmt)
            for db_series in db_results.scalars():
                ds = Dataset()
                ds.SeriesInstanceUID = db_series.series_instance_uid
                ds.Modality = db_series.modality
                ds.SeriesNumber = db_series.series_number
                ds.SeriesDescription = db_series.series_description or ""
                ds.QueryRetrieveLevel = qr_level
                ds.RetrieveAETitle = "PACS_SERVER"
                results.append(ds)
                
    return results

async def get_instances_for_move(query_dataset: Dataset) -> list[str]:
    """
    Finds the file paths in MinIO for the requested UIDs during C-MOVE.
    """
    qr_level = getattr(query_dataset, 'QueryRetrieveLevel', 'STUDY').upper()
    file_paths = []
    
    async with AsyncSessionLocal() as session:
        if qr_level == 'STUDY':
            study_uid = getattr(query_dataset, 'StudyInstanceUID', None)
            if not study_uid: return []
            
            stmt = select(Instance.file_path).join(Series).join(Study).where(Study.study_instance_uid == study_uid)
            result = await session.execute(stmt)
            file_paths = result.scalars().all()
            
        elif qr_level == 'SERIES':
            series_uid = getattr(query_dataset, 'SeriesInstanceUID', None)
            if not series_uid: return []
            
            stmt = select(Instance.file_path).join(Series).where(Series.series_instance_uid == series_uid)
            result = await session.execute(stmt)
            file_paths = result.scalars().all()
            
        elif qr_level == 'IMAGE':
            sop_uid = getattr(query_dataset, 'SOPInstanceUID', None)
            if not sop_uid: return []
            
            stmt = select(Instance.file_path).where(Instance.sop_instance_uid == sop_uid)
            result = await session.execute(stmt)
            file_paths = result.scalars().all()
            
    return file_paths
