FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . /app/

# Expose ports: 8000 for FastAPI API, 11112 for DICOM SCP
EXPOSE 8000
EXPOSE 11112

# Run backend application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
