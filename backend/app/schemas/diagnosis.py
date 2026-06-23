from pydantic import BaseModel

class DiagnosisSubmit(BaseModel):
    diagnosis: str

class DiagnosisResultResponse(BaseModel):
    is_correct: bool
    correct_diagnosis: str
    explanation: str
