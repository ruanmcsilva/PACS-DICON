import json
import logging
import asyncio
from typing import Optional
import aio_pika
from app.core.config import settings

logger = logging.getLogger(__name__)

QUEUE_NAME = "pacs_metadata_queue"

class RabbitMQPublisher:
    """
    Gerenciador de publicação persistente no RabbitMQ.
    Mantém uma única conexão e canal abertos, eliminando overhead TCP/AMQP
    e permitindo publicar milhares de imagens por segundo sem exaustão de conexões.
    """
    def __init__(self):
        self.connection: Optional[aio_pika.RobustConnection] = None
        self.channel: Optional[aio_pika.RobustChannel] = None
        self.main_loop: Optional[asyncio.AbstractEventLoop] = None

    async def connect(self):
        """Inicializa a conexão persistente e captura o loop principal."""
        try:
            self.main_loop = asyncio.get_running_loop()
        except RuntimeError:
            self.main_loop = None

        if self.connection and not self.connection.is_closed:
            return

        try:
            logger.info("Iniciando conexão persistente com RabbitMQ para publicador...")
            self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            self.channel = await self.connection.channel()
            # Garante que a fila existe
            await self.channel.declare_queue(QUEUE_NAME, durable=True)
            logger.info("Publicador RabbitMQ conectado com sucesso.")
        except Exception as e:
            logger.error(f"Falha ao conectar publicador no RabbitMQ: {e}")
            self.connection = None
            self.channel = None

    async def close(self):
        """Fecha a conexão limpa ao encerrar a aplicação."""
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Conexão do publicador RabbitMQ encerrada.")

    async def publish(self, file_name: str, temp_path: str = None):
        """Publica mensagem usando o canal persistente já aberto."""
        # Se por algum motivo o canal caiu, reconecta
        if not self.channel or self.channel.is_closed:
            await self.connect()

        payload = {"file_name": file_name}
        if temp_path:
            payload["temp_path"] = temp_path
        message_body = json.dumps(payload).encode('utf-8')

        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body=message_body,
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key=QUEUE_NAME
        )
        logger.debug(f"Tarefa enfileirada no RabbitMQ: {file_name}")

rabbitmq_publisher = RabbitMQPublisher()

async def publish_metadata_task(file_name: str, temp_path: str = None):
    """Função assíncrona padrão para uso em rotas FastAPI."""
    try:
        await rabbitmq_publisher.publish(file_name, temp_path)
    except Exception as e:
        logger.error(f"Erro ao publicar tarefa assíncrona para {file_name}: {e}")

def publish_metadata_task_sync(file_name: str, temp_path: str = None):
    """
    Função síncrona thread-safe para uso em threads de C-STORE (pynetdicom).
    Não abre conexão nova nem cria novo event loop: despacha a tarefa
    diretamente no loop principal onde a conexão persistente vive.
    """
    try:
        if rabbitmq_publisher.main_loop and rabbitmq_publisher.main_loop.is_running():
            future = asyncio.run_coroutine_threadsafe(
                rabbitmq_publisher.publish(file_name, temp_path),
                rabbitmq_publisher.main_loop
            )
            # Aguarda a confirmação de enfileiramento (leva menos de 1ms)
            future.result(timeout=5)
        else:
            # Fallback se o loop ainda não tiver sido inicializado
            asyncio.run(publish_metadata_task(file_name, temp_path))
    except Exception as e:
        logger.error(f"Erro ao publicar tarefa DICOM (sync) para {file_name}: {e}")
