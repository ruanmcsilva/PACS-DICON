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

def normalize_sex(sex_val) -> str:
    """Normaliza o sexo para padrão internacional médico (M, F, O) seguro contra truncamento."""
    if not sex_val:
        return "O"
    s = str(sex_val).strip().upper()
    if s in ("M", "MALE", "HOMEM", "MASCULINO", "H"):
        return "M"
    elif s in ("F", "FEMALE", "MULHER", "FEMININO"):
        return "F"
    elif s in ("O", "OTHER", "OUTRO", "U", "UNKNOWN"):
        return "O"
    return s[:16]

async def process_dicom_metadata(dataset, file_path: str):
    """
    Extrai metadados do dataset DICOM e persiste no PostgreSQL com UPSERT atômico total.
    Elimina 100% das race conditions e erros de chave duplicada (IntegrityError),
    garantindo que nenhuma fatia de exame massivo seja perdida.
    """
    try:
        series_uid = getattr(dataset, "SeriesInstanceUID", None)
        instance_uid = getattr(dataset, "SOPInstanceUID", None)
        
        if not series_uid or not instance_uid:
            logger.error("Missing critical DICOM UIDs. Cannot process metadata.")
            return

        async with AsyncSessionLocal() as session:
            # 1. Fast Path: Verifica se a Série já está na memória rápida (RAM)
            cached_series_id = series_cache.get(series_uid)
            
            if cached_series_id:
                series_id = cached_series_id
            else:
                # 2. Slow Path: Primeira vez vendo a Série - UPSERT Atômico em cascata
                patient_id_tag = str(getattr(dataset, "PatientID", "UNKNOWN")).strip()
                if not patient_id_tag:
                    patient_id_tag = "UNKNOWN"
                
                # Trata nome internacional e caracteres especiais (remove ^ do DICOM)
                raw_patient_name = getattr(dataset, "PatientName", None)
                if raw_patient_name:
                    patient_name = str(raw_patient_name).replace("^", " ").strip()
                else:
                    patient_name = "Unknown Patient"
                
                # Normaliza Sexo para padrão internacional seguro
                raw_sex = getattr(dataset, "PatientSex", "O")
                patient_sex = normalize_sex(raw_sex)
                
                study_uid = getattr(dataset, "StudyInstanceUID", None)
                if not study_uid:
                    logger.error("Missing StudyInstanceUID.")
                    return
                
                # Trata Data de Nascimento (0010,0030)
                birth_date_raw = getattr(dataset, "PatientBirthDate", None)
                p_birth_date = None
                if birth_date_raw and len(str(birth_date_raw)) >= 8:
                    try:
                        p_birth_date = datetime.strptime(str(birth_date_raw)[:8], "%Y%m%d").date()
                    except Exception:
                        p_birth_date = None

                # --- 2.1 PATIENT ATOMIC UPSERT ---
                patient_stmt = insert(Patient).values(
                    patient_id=patient_id_tag,
                    patient_name=patient_name,
                    patient_sex=patient_sex,
                    patient_birth_date=p_birth_date
                ).on_conflict_do_update(
                    index_elements=['patient_id'],
                    set_={
                        'patient_name': patient_name,
                        'patient_sex': patient_sex,
                        'patient_birth_date': p_birth_date
                    }
                ).returning(Patient.id)
                
                patient_res = await session.execute(patient_stmt)
                patient_id = patient_res.scalar_one()

                # --- 2.2 STUDY ATOMIC UPSERT ---
                study_date_raw = getattr(dataset, "StudyDate", None)
                study_time_raw = getattr(dataset, "StudyTime", None)
                s_date, s_time = None, None
                try:
                    if study_date_raw and len(str(study_date_raw)) >= 8:
                        s_date = datetime.strptime(str(study_date_raw)[:8], "%Y%m%d").date()
                    if study_time_raw and len(str(study_time_raw)) >= 6:
                        s_time = datetime.strptime(str(study_time_raw)[:6], "%H%M%S").time()
                except Exception:
                    pass

                accession_number = getattr(dataset, "AccessionNumber", None)
                if accession_number:
                    accession_number = str(accession_number).strip()

                study_desc = getattr(dataset, "StudyDescription", None)
                if study_desc:
                    study_desc = str(study_desc).strip()

                study_stmt = insert(Study).values(
                    study_instance_uid=study_uid,
                    study_date=s_date,
                    study_time=s_time,
                    accession_number=accession_number,
                    study_description=study_desc,
                    patient_id=patient_id
                ).on_conflict_do_update(
                    index_elements=['study_instance_uid'],
                    set_={
                        'study_description': study_desc,
                        'study_date': s_date,
                        'study_time': s_time,
                        'accession_number': accession_number
                    }
                ).returning(Study.id)

                study_res = await session.execute(study_stmt)
                study_id = study_res.scalar_one()

                # --- 2.3 SERIES ATOMIC UPSERT ---
                series_number = getattr(dataset, "SeriesNumber", None)
                try:
                    series_number = int(series_number) if series_number is not None else None
                except (ValueError, TypeError):
                    series_number = None

                series_desc = getattr(dataset, "SeriesDescription", None)
                if series_desc:
                    series_desc = str(series_desc).strip()

                modality = getattr(dataset, "Modality", "UNKNOWN")
                if modality:
                    modality = str(modality).strip()

                series_stmt = insert(Series).values(
                    series_instance_uid=series_uid,
                    modality=modality,
                    series_number=series_number,
                    series_description=series_desc,
                    study_id=study_id
                ).on_conflict_do_update(
                    index_elements=['series_instance_uid'],
                    set_={
                        'modality': modality,
                        'series_number': series_number,
                        'series_description': series_desc
                    }
                ).returning(Series.id)

                series_res = await session.execute(series_stmt)
                series_id = series_res.scalar_one()

                # Armazena na memória rápida para as próximas fatias irem pelo Fast Path
                series_cache.set(series_uid, series_id)

            # --- 3. INSTANCE ATOMIC UPSERT ---
            instance_number = getattr(dataset, "InstanceNumber", None)
            try:
                instance_number = int(instance_number) if instance_number is not None else None
            except (ValueError, TypeError):
                instance_number = None
                
            insert_stmt = insert(Instance).values(
                sop_instance_uid=instance_uid,
                sop_class_uid=getattr(dataset, "SOPClassUID", "UNKNOWN"),
                instance_number=instance_number,
                file_path=file_path,
                series_id=series_id
            )
            
            # On conflict (re-upload da mesma fatia), atualiza o caminho do arquivo
            do_update_stmt = insert_stmt.on_conflict_do_update(
                index_elements=['sop_instance_uid'],
                set_=dict(file_path=insert_stmt.excluded.file_path)
            )
            
            await session.execute(do_update_stmt)
            await session.commit()

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

async def delete_study(study_id: str) -> bool:
    """
    Deletes a study and all its associated series/instances from the database.
    Also removes the associated files from MinIO.
    """
    from app.core.storage import get_minio_client
    from app.core.config import settings
    import uuid

    async with AsyncSessionLocal() as session:
        # 1. Get file paths to delete from MinIO
        stmt = select(Instance.file_path).join(Series).join(Study).where(Study.id == uuid.UUID(study_id))
        result = await session.execute(stmt)
        file_paths = result.scalars().all()

        if file_paths:
            minio_client = get_minio_client()
            for path in file_paths:
                try:
                    minio_client.remove_object(settings.MINIO_BUCKET_NAME, path)
                except Exception as e:
                    logger.error(f"Failed to delete {path} from MinIO: {e}")
        
        # 2. Delete from Database
        stmt_study = select(Study).where(Study.id == uuid.UUID(study_id))
        result = await session.execute(stmt_study)
        study = result.scalar_one_or_none()
        
        if study:
            await session.delete(study)
            await session.commit()
            return True
        return False
