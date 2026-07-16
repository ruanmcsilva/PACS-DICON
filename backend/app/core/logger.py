import logging
import sys

def setup_logging():
    """
    Configures standard logging for the application.
    DICOM operations and server connections can be noisy, so we set a standard format.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Disable overly verbose loggers (e.g., from some third party libs if needed)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
