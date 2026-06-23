from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional, AsyncGenerator
from uuid import UUID
from datetime import datetime, timezone
import json
import asyncio

from app.core.dependencies import get_db, get_current_user
from app.models.session import PracticeSession, ChatMessage
from app.models.case import ClinicalCase
from app.models.user import User
from app.schemas.chat import (
    PracticeSessionCreate,
    PracticeSessionResponse,
    PracticeSessionDetailResponse,
    ChatMessageCreate,
    ChatMessageResponse
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("", response_model=PracticeSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: PracticeSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if case exists
    result = await db.execute(select(ClinicalCase).filter(ClinicalCase.id == payload.case_id))
    case = result.scalars().first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy ca bệnh này"
        )

    # Create new session
    session = PracticeSession(
        user_id=current_user.id,
        case_id=case.id,
        status="in_progress",
        message_count=0
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Seed the first message from the patient based on their complaint
    complaint = case.patient_info.get("complaint", "Chào bác sĩ, tôi đến khám răng.")
    first_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=f"Chào bác sĩ. {complaint}"
    )
    db.add(first_msg)
    await db.commit()

    # Fetch session with case info
    result = await db.execute(
        select(PracticeSession)
        .options(selectinload(PracticeSession.case))
        .filter(PracticeSession.id == session.id)
    )
    return result.scalars().first()

@router.get("", response_model=List[PracticeSessionResponse])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(PracticeSession)
        .options(selectinload(PracticeSession.case))
        .filter(PracticeSession.user_id == current_user.id)
        .order_by(desc(PracticeSession.started_at))
    )
    return result.scalars().all()

@router.get("/{session_id}", response_model=PracticeSessionDetailResponse)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(PracticeSession)
        .options(selectinload(PracticeSession.case), selectinload(PracticeSession.messages))
        .filter(PracticeSession.id == session_id, PracticeSession.user_id == current_user.id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy phiên thực hành này"
        )
    return session

@router.get("/{session_id}/history", response_model=List[ChatMessageResponse])
async def get_session_history(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify session belongs to user
    session_res = await db.execute(
        select(PracticeSession).filter(PracticeSession.id == session_id, PracticeSession.user_id == current_user.id)
    )
    if not session_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy phiên thực hành này"
        )

    result = await db.execute(
        select(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    return result.scalars().all()

@router.post("/{session_id}/chat")
async def chat_with_patient(
    session_id: UUID,
    payload: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch session and check authorization
    session_res = await db.execute(
        select(PracticeSession)
        .options(selectinload(PracticeSession.case))
        .filter(PracticeSession.id == session_id, PracticeSession.user_id == current_user.id)
    )
    session = session_res.scalars().first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy phiên thực hành này"
        )

    if session.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phiên thực hành này đã kết thúc. Bạn không thể nhắn thêm."
        )

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=payload.content
    )
    db.add(user_msg)
    
    # Increment message count
    session.message_count += 1
    await db.commit()

    # Get history of session for context (limit to last 12 messages for optimized token usage)
    history_res = await db.execute(
        select(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(desc(ChatMessage.created_at))
        .limit(12)
    )
    history_messages = list(reversed(history_res.scalars().all()))
    
    # Format messages to expected AI input structure
    ai_history = [{"role": msg.role, "content": msg.content} for msg in history_messages]

    # Create event stream generator
    async def event_generator() -> AsyncGenerator[str, None]:
        full_response = []
        try:
            async for chunk in ai_service.get_streaming_response(ai_history, session.case):
                full_response.append(chunk)
                # Yield in SSE standard: data: <content>\n\n
                yield f"data: {json.dumps({'chunk': chunk}, ensure_ascii=False)}\n\n"
                # Small sleep to yield to event loop
                await asyncio.sleep(0.01)
                
            # Stream finished, save response to database
            final_content = "".join(full_response)
            if final_content:
                # We need a new session context here or use the existing active session
                # because the generator might run in a separate context thread-wise
                assistant_msg = ChatMessage(
                    session_id=session_id,
                    role="assistant",
                    content=final_content
                )
                db.add(assistant_msg)
                await db.commit()
                yield f"data: {json.dumps({'status': 'done'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
