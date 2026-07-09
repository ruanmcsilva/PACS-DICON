from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.auth.router import router as auth_router
from app.pacs.router import router as pacs_router
from app.dicomweb.router import router as dicomweb_router
from app.core.logger import setup_logging
from app.core.storage import init_minio_bucket
from app.core.database import engine, Base
from app.dicom.server import start_dicom_server_in_background
from app.core.queue.consumer import start_consumer
import asyncio
# Import models to ensure they are registered with SQLAlchemy Base before create_all
from app.pacs.models import Patient, Study, Series, Instance, Annotation, Report

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Setup Logging
    setup_logging()
    logger = logging.getLogger("api.lifespan")
    logger.info("Starting up PACS/DICOM Enterprise...")

    # 2. Init MinIO Bucket
    init_minio_bucket()

    # 3. Create Database Tables (if not exist)
    async with engine.begin() as conn:
        logger.info("Ensuring database tables exist...")
        await conn.run_sync(Base.metadata.create_all)
    
    # 4. Start DICOM Server (SCP) in background
    dicom_thread = start_dicom_server_in_background()
    
    # 5. Start RabbitMQ Background Worker
    consumer_task = asyncio.create_task(start_consumer())
    
    yield # App is running
    
    logger.info("Shutting down PACS/DICOM Enterprise...")
    consumer_task.cancel()
    # Clean up can be added here (e.g. stop DICOM server if supported)

app = FastAPI(
    title="PACS/DICOM API",
    description="API for Professional PACS/DICOM Platform",
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True},
    lifespan=lifespan
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

class CrossOriginResourcePolicyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        return response

app.add_middleware(CrossOriginResourcePolicyMiddleware)

app.include_router(auth_router, prefix="/api/core/auth", tags=["Core - Auth"])
app.include_router(pacs_router, prefix="/api/pacs", tags=["PACS - Core"])
app.include_router(dicomweb_router, prefix="/api/dicom-web", tags=["DICOMWeb"])

from fastapi.responses import FileResponse

@app.get("/test-viewer")
def test_viewer():
    return FileResponse("test_viewer.html")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "PACS/DICOM System is running with DICOM SCP in background"}

