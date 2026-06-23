from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime, timezone

from app.core.dependencies import get_db, get_current_user
from app.models.session import PracticeSession
from app.models.user import User
from app.schemas.diagnosis import DiagnosisSubmit, DiagnosisResultResponse

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("/{session_id}/diagnose", response_model=DiagnosisResultResponse)
async def submit_diagnosis(
    session_id: UUID,
    payload: DiagnosisSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch session with case info
    result = await db.execute(
        select(PracticeSession)
        .options(selectinload(PracticeSession.case))
        .filter(PracticeSession.id == session_id, PracticeSession.user_id == current_user.id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy phiên thực hành này"
        )

    if session.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phiên thực hành này đã kết thúc chẩn đoán"
        )

    case = session.case
    user_guess = payload.diagnosis.strip()
    correct_diagnosis = case.diagnosis.strip()

    # Compare case-insensitive and ignore double spaces or exact match
    is_correct = user_guess.lower() == correct_diagnosis.lower()

    # Update session status
    session.status = "diagnosed_correct" if is_correct else "diagnosed_wrong"
    session.user_diagnosis = user_guess
    finished_at = datetime.now(timezone.utc)
    session.finished_at = finished_at
    
    # Calculate duration (handling potential naive/aware mismatch for SQLite vs PostgreSQL)
    started_at = session.started_at
    if started_at.tzinfo is None:
        duration = (finished_at.replace(tzinfo=None) - started_at).total_seconds()
    else:
        duration = (finished_at - started_at).total_seconds()
        
    session.duration_seconds = max(0, int(duration))


    await db.commit()

    return DiagnosisResultResponse(
        is_correct=is_correct,
        correct_diagnosis=case.diagnosis,
        explanation=case.explanation
    )
