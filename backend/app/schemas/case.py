from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class PatientInfo(BaseModel):
    name: str
    age: int
    gender: str
    complaint: str
    medical_history: Optional[str] = "Không có tiền sử bệnh lý đặc biệt."

class ClinicalCaseBase(BaseModel):
    case_code: str
    category: str
    name: str
    patient_info: PatientInfo
    image_url: Optional[str] = None

class ClinicalCaseCreate(ClinicalCaseBase):
    ai_persona: str
    clinical_logic: str
    diagnosis: str
    explanation: str

class ClinicalCaseResponse(ClinicalCaseBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Extended model for admin / seeding validation
class ClinicalCaseFullResponse(ClinicalCaseResponse):
    ai_persona: str
    clinical_logic: str
    diagnosis: str
    explanation: str

    class Config:
        from_attributes = True
