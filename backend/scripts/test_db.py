import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.pacs.models import Patient, Study, Series, Instance

async def get_all():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Patient.patient_name, Series.id, Instance.id)
            .select_from(Patient)
            .join(Study)
            .join(Series)
            .join(Instance)
        )
        for row in result:
            print(f"Patient: {row[0]}, Series: {row[1]}, Instance: {row[2]}")

asyncio.run(get_all())
