from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PACS/DICOM API"
    SECRET_KEY: str = "supersecretkey-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    DATABASE_URL: str = "postgresql://pacsuser:pacspassword@localhost:5432/pacs_dicom"

    class Config:
        env_file = ".env"

settings = Settings()
