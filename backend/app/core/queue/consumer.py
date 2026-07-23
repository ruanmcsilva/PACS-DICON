import json
import io
import logging
import asyncio
import os
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
            temp_path = body.get("temp_path")
            
            if not file_name:
                logger.error("Message received without file_name")
                return
                
            logger.info(f"Worker processing background metadata task for: {file_name}")
            
            minio_client = get_minio_client()
            dataset = None
            
            # If temp_path is provided, it came from the new optimized ingest pipeline
            if temp_path and os.path.exists(temp_path):
                # Upload to MinIO first
                file_size = os.path.getsize(temp_path)
                with open(temp_path, "rb") as f:
                    minio_client.put_object(
                        bucket_name=settings.MINIO_BUCKET_NAME,
                        object_name=file_name,
                        data=f,
                        length=file_size,
                        content_type="application/dicom"
                    )
                logger.info(f"Worker uploaded {file_name} to MinIO")
                
                # Read DICOM from local temp file
                dataset = dcmread(temp_path)
                
                # Clean up local temp file
                try:
                    os.remove(temp_path)
                except Exception as cleanup_err:
                    logger.warning(f"Failed to remove temp file {temp_path}: {cleanup_err}")
                    
            else:
                # Fallback: Fetch file from MinIO if temp_path is missing or doesn't exist
                # (e.g. for re-processing messages that were already in the queue or uploaded via HTTP endpoint)
                response = minio_client.get_object(settings.MINIO_BUCKET_NAME, file_name)
                file_bytes = io.BytesIO(response.read())
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
