import asyncio
from sqlalchemy import delete
from app.core.database import AsyncSessionLocal
from app.pacs.models import Patient

async def delete_patient():
    async with AsyncSessionLocal() as db:
        await db.execute(delete(Patient).where(Patient.patient_name == 'TESTE^DICOMWEB'))
        await db.commit()
        print("Deleted TESTE^DICOMWEB")

asyncio.run(delete_patient())
