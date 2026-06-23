import os
import sys
import json
import asyncio

# Add the backend folder to the system path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database import AsyncSessionLocal, engine, Base
from app.models.case import ClinicalCase

async def seed():
    # Path to diseases.json in the parent folder
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(os.path.dirname(backend_dir), "data", "diseases.json")
    
    if not os.path.exists(json_path):
        print(f"Error: diseases.json not found at {json_path}")
        return

    print("Creating tables if they do not exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print(f"Reading clinical cases from {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
        cases_data = json.load(f)


    async with AsyncSessionLocal() as db:
        for item in cases_data:
            case_code = item["id"]
            
            # Check if case already exists in DB
            result = await db.execute(select(ClinicalCase).filter(ClinicalCase.case_code == case_code))
            existing_case = result.scalars().first()
            
            patient = item.get("patient", {})
            patient_info = {
                "name": patient.get("name", "Bệnh nhân ẩn danh"),
                "age": int(patient.get("age", 30)),
                "gender": patient.get("gender", "Nam"),
                "complaint": patient.get("complaint", ""),
                "medical_history": patient.get("medical_history", "Không có tiền sử đặc biệt.")
            }

            # Normalize assets/images/path to be static served path
            image_url = item.get("image_url", "")
            if image_url.startswith("assets/images/"):
                # E.g., assets/images/ENDO_01.jpg -> /static/images/ENDO_01.jpg
                image_url = image_url.replace("assets/images/", "/static/images/")
            elif image_url.startswith("assets/"):
                image_url = image_url.replace("assets/", "/static/")

            case_dict = {
                "case_code": case_code,
                "category": item.get("category", "Tổng quát"),
                "name": item.get("name", "Ca lâm sàng chưa đặt tên"),
                "patient_info": patient_info,
                "ai_persona": item.get("ai_persona", ""),
                "clinical_logic": item.get("logic", "") or item.get("clinical_logic", ""),
                "diagnosis": item.get("diagnosis", ""),
                "explanation": item.get("explanation", ""),
                "image_url": image_url,
                "is_active": True
            }

            if existing_case:
                print(f"[UPDATE] Updating case: {case_code} - {case_dict['name']}")
                for key, val in case_dict.items():
                    setattr(existing_case, key, val)
            else:
                print(f"[CREATE] Creating case: {case_code} - {case_dict['name']}")
                new_case = ClinicalCase(**case_dict)
                db.add(new_case)
        
        await db.commit()
    print("Seeding complete successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
