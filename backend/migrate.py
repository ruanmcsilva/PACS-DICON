import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE series ADD COLUMN video_path VARCHAR;"))
            print("Column added successfully")
        except Exception as e:
            print("Error or already exists:", e)

asyncio.run(migrate())
