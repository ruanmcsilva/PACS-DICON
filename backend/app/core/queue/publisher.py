import json
import logging
import aio_pika
from app.core.config import settings

logger = logging.getLogger(__name__)

QUEUE_NAME = "pacs_metadata_queue"

async def publish_metadata_task(file_name: str, temp_path: str = None):
    """
    Publish a message to RabbitMQ indicating a new DICOM file needs metadata extraction.
    """
    try:
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()
            
            # Ensure the queue exists
            queue = await channel.declare_queue(QUEUE_NAME, durable=True)
            
            payload = {"file_name": file_name}
            if temp_path:
                payload["temp_path"] = temp_path
            message_body = json.dumps(payload).encode('utf-8')
            
            await channel.default_exchange.publish(
                aio_pika.Message(
                    body=message_body,
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                ),
                routing_key=QUEUE_NAME
            )
            logger.info(f"Published task to queue '{QUEUE_NAME}' for file: {file_name}")
            
    except Exception as e:
        logger.error(f"Failed to publish to RabbitMQ: {e}")
