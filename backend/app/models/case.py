import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON, Uuid
from sqlalchemy.orm import relationship
from app.database import Base

class ClinicalCase(Base):
    __tablename__ = "clinical_cases"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., ENDO_01
    category = Column(String(100), nullable=False)  # e.g., Nội Nha
    name = Column(String(255), nullable=False)  # e.g., Viêm tủy không hồi phục (Cấp)
    patient_info = Column(JSON, nullable=False)  # {name, age, gender, complaint, medical_history}
    ai_persona = Column(Text, nullable=False)
    clinical_logic = Column(Text, nullable=False)
    diagnosis = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    sessions = relationship("PracticeSession", back_populates="case", cascade="all, delete-orphan")
