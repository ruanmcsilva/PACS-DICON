from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.auth.router import router as auth_router
from app.pacs.patient.router import router as patient_router

app = FastAPI(
    title="PACS/DICOM API",
    description="API for Professional PACS/DICOM Platform",
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True}
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/core/auth", tags=["Core - Auth"])
app.include_router(patient_router, prefix="/api/pacs/patients", tags=["PACS - Patients"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
