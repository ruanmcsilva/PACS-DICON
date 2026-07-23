from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import warnings

class Settings(BaseSettings):
    # App Config
    ENV: str = "development" # "development", "production", "testing"
    PROJECT_NAME: str = "PACS-DICOM Enterprise"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Postgres Database Config (from docker-compose)
    POSTGRES_USER: str = "pacsuser"
    POSTGRES_PASSWORD: str = "pacspassword"
    POSTGRES_SERVER: str = "localhost" # 'db' when running in docker
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "pacs_dicom"
    
    @property
    def async_database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # MinIO (S3 Compatible) Config
    MINIO_ROOT_USER: str = "minioadmin"
    MINIO_ROOT_PASSWORD: str = "minioadmin"
    MINIO_SERVER: str = "localhost:9000" # 'minio:9000' when in docker
    MINIO_SECURE: bool = False
    MINIO_BUCKET_NAME: str = "dicom-images"

    # DICOM Server Config
    DICOM_AETITLE: str = "PACS_ENTERPRISE1"
    DICOM_PORT: int = 11112

    # RabbitMQ Settings
    RABBITMQ_URL: str = "amqp://pacsuser:pacspassword@localhost:5672/"

    # Auth Config
    SECRET_KEY: str = "super_secret_key_for_jwt_tokens_in_dev_env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    @model_validator(mode="after")
    def validate_security(self) -> 'Settings':
        if self.ENV == "production" and self.SECRET_KEY == "super_secret_key_for_jwt_tokens_in_dev_env":
            raise ValueError(
                "SECURITY ERROR: The default SECRET_KEY cannot be used in a production environment. "
                "Please configure a secure SECRET_KEY in your environment variables or .env file."
            )
        elif self.SECRET_KEY == "super_secret_key_for_jwt_tokens_in_dev_env":
            warnings.warn(
                "Using default SECRET_KEY for JWT. This is only acceptable in development/test environments.",
                UserWarning
            )
        return self

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

settings = Settings()
