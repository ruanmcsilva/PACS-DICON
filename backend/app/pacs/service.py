import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
from collections import OrderedDict

from app.pacs.models import Patient, Study, Series, Instance
from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

# --- In-Memory Cache for High-Volume Ingest ---
class SeriesCache:
    def __init__(self, capacity: int = 2000):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, series_uid: str):
        if series_uid not in self.cache:
            return None
        self.cache.move_to_end(series_uid)
        return self.cache[series_uid]

    def set(self, series_uid: str, series_id):
        self.cache[series_uid] = series_id
        self.cache.move_to_end(series_uid)
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

series_cache = SeriesCache(capacity=2000)
# ----------------------------------------------

async def process_dicom_metadata(dataset, file_path: str):
    """
    Extracts metadata from a DICOM dataset and persists it to the PostgreSQL database.
    Optimized for massive ingest using in-memory caching and Postgres UPSERT.
    """
    try:
        series_uid = getattr(dataset, "SeriesInstanceUID", None)
        instance_uid = getattr(dataset, "SOPInstanceUID", None)
        
        if not series_uid or not instance_uid:
            logger.error("Missing critical DICOM UIDs. Cannot process metadata.")
            return

        async with AsyncSessionLocal() as session:
            # 1. Fast Path: Check if Series is already cached
            cached_series_id = series_cache.get(series_uid)
            
            if cached_series_id:
                # We already processed this series recently, skip Patient, Study, Series checks
                series_id = cached_series_id
            else:
                # Slow Path: First time seeing this Series, do the full hierarchical insert
                patient_id_tag = getattr(dataset, "PatientID", "UNKNOWN")
                patient_name = str(getattr(dataset, "PatientName", "Unknown Patient"))
                patient_sex = getattr(dataset, "PatientSex", "O")
                study_uid = getattr(dataset, "StudyInstanceUID", None)
                
                if not study_uid:
                    logger.error("Missing StudyInstanceUID.")
                    return
                
                # Patient
                stmt_patient = select(Patient).where(Patient.patient_id == patient_id_tag)
                result = await session.execute(stmt_patient)
                patient = result.scalar_one_or_none()
                
                if not patient:
                    patient = Patient(
                        patient_id=patient_id_tag,
                        patient_name=patient_name,
                        patient_sex=patient_sex
                    )
                    session.add(patient)
                    await session.flush()
                    
                # Study
                stmt_study = select(Study).where(Study.study_instance_uid == study_uid)
                result = await session.execute(stmt_study)
                study = result.scalar_one_or_none()
                
                if not study:
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
                    
                # Series
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
                    
                series_id = series.id
                # Add to cache for subsequent instances
                series_cache.set(series_uid, series_id)

            # 2. Instance Insertion (Optimized with Postgres UPSERT)
            instance_number = getattr(dataset, "InstanceNumber", None)
            try:
                instance_number = int(instance_number) if instance_number else None
            except (ValueError, TypeError):
                instance_number = None
                
            insert_stmt = insert(Instance).values(
                sop_instance_uid=instance_uid,
                sop_class_uid=getattr(dataset, "SOPClassUID", "UNKNOWN"),
                instance_number=instance_number,
                file_path=file_path,
                series_id=series_id
            )
            
            # On conflict (re-upload of same instance), just update the file_path
            do_update_stmt = insert_stmt.on_conflict_do_update(
                index_elements=['sop_instance_uid'],
                set_=dict(file_path=insert_stmt.excluded.file_path)
            )
            
            await session.execute(do_update_stmt)
            await session.commit()
            
            # Reduce logging noise for high-volume ingest
            # logger.info(f"Metadata for instance {instance_uid} processed successfully.")

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
                ds.StudyInstanceUID = db_study.study_instance_uid
                ds.StudyDate = db_study.study_date.strftime("%Y%m%d") if db_study.study_date else ""
                ds.StudyTime = db_study.study_time.strftime("%H%M%S") if db_study.study_time else ""
                ds.AccessionNumber = db_study.accession_number or ""
                ds.StudyDescription = db_study.study_description or ""
                
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
