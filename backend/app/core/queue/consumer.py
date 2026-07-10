import json
import io
import logging
import asyncio
import aio_pika
from pydicom import dcmread

from app.core.config import settings
from app.core.storage import get_minio_client
from app.pacs.service import process_dicom_metadata
from app.core.queue.publisher import QUEUE_NAME

logger = logging.getLogger(__name__)

async def process_message(message: aio_pika.IncomingMessage):
    """
    Callback function that processes a RabbitMQ message.
    """
    async with message.process():
        try:
            body = json.loads(message.body.decode("utf-8"))
            file_name = body.get("file_name")
            
            if not file_name:
                logger.error("Message received without file_name")
                return
                
            logger.info(f"Worker processing background metadata task for: {file_name}")
            
            # Fetch file from MinIO
            minio_client = get_minio_client()
            response = minio_client.get_object(settings.MINIO_BUCKET_NAME, file_name)
            file_bytes = io.BytesIO(response.read())
            
            # Read DICOM
            dataset = dcmread(file_bytes)
            
            # Process metadata (DB save)
            await process_dicom_metadata(dataset, file_name)
            
            logger.info(f"Worker finished processing {file_name}")
            
        except Exception as e:
            logger.error(f"Error in background worker while processing message: {e}")

async def start_consumer():
    """
    Connects to RabbitMQ and starts listening to the queue indefinitely.
    """
    connection = None
    try:
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        channel = await connection.channel()
        
        # We set prefetch count to handle a reasonable number of concurrent tasks
        await channel.set_qos(prefetch_count=10)
        
        queue = await channel.declare_queue(QUEUE_NAME, durable=True)
        
        logger.info(f"Background worker started. Listening to queue: {QUEUE_NAME}")
        
        await queue.consume(process_message)
        
        # Keep running
        await asyncio.Future()
        
    except asyncio.CancelledError:
        logger.info("RabbitMQ consumer task cancelled.")
        raise
    except Exception as e:
        logger.error(f"Failed to start RabbitMQ consumer: {e}")
    finally:
        if connection and not connection.is_closed:
            logger.info("Closing RabbitMQ connection...")
            await connection.close()
