import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE series ADD COLUMN IF NOT EXISTS video_path VARCHAR;"))
            print("Column video_path checked/added successfully")
        except Exception as e:
            print("Error on video_path:", e)
            
        try:
            await conn.execute(text("ALTER TABLE patients ALTER COLUMN patient_sex TYPE VARCHAR(16);"))
            print("Column patient_sex expanded to VARCHAR(16) successfully")
        except Exception as e:
            print("Error on patient_sex:", e)

asyncio.run(migrate())
