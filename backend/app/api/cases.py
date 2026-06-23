from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct
from typing import List, Optional
from uuid import UUID
from app.core.dependencies import get_db, get_current_user
from app.models.case import ClinicalCase
from app.schemas.case import ClinicalCaseResponse
from app.models.user import User

router = APIRouter(prefix="/api/cases", tags=["cases"])

@router.get("", response_model=List[ClinicalCaseResponse])
async def list_cases(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ClinicalCase).filter(ClinicalCase.is_active == True)
    if category:
        query = query.filter(ClinicalCase.category == category)
        
    result = await db.execute(query)
    cases = result.scalars().all()
    return cases

@router.get("/categories", response_model=List[str])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(distinct(ClinicalCase.category)).filter(ClinicalCase.is_active == True))
    categories = result.scalars().all()
    return [c for c in categories if c]

@router.get("/{case_id}", response_model=ClinicalCaseResponse)
async def get_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ClinicalCase).filter(ClinicalCase.id == case_id))
    case = result.scalars().first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy ca bệnh này"
        )
    return case
