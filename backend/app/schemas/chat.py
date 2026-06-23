from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.schemas.case import ClinicalCaseResponse

class ChatMessageBase(BaseModel):
    role: str  # user, assistant, system
    content: str

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(ChatMessageBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class PracticeSessionBase(BaseModel):
    case_id: UUID

class PracticeSessionCreate(PracticeSessionBase):
    pass

class PracticeSessionResponse(BaseModel):
    id: UUID
    case_id: UUID
    status: str
    user_diagnosis: Optional[str] = None
    message_count: int
    duration_seconds: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    case: Optional[ClinicalCaseResponse] = None

    class Config:
        from_attributes = True

class PracticeSessionDetailResponse(PracticeSessionResponse):
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True
