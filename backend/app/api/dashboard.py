from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, not_, case
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any
from uuid import UUID

from app.core.dependencies import get_db, get_current_user
from app.models.session import PracticeSession
from app.models.case import ClinicalCase
from app.models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_user_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all completed sessions for this user
    result = await db.execute(
        select(PracticeSession)
        .options(selectinload(PracticeSession.case))
        .filter(
            PracticeSession.user_id == current_user.id,
            PracticeSession.status.in_(["diagnosed_correct", "diagnosed_wrong"])
        )
    )
    sessions = result.scalars().all()

    total_completed = len(sessions)
    correct_count = sum(1 for s in sessions if s.status == "diagnosed_correct")
    accuracy_rate = (correct_count / total_completed * 100) if total_completed > 0 else 0.0

    avg_messages = (sum(s.message_count for s in sessions) / total_completed) if total_completed > 0 else 0.0
    avg_duration = (sum(s.duration_seconds for s in sessions) / total_completed) if total_completed > 0 else 0.0

    # Specialty category breakdown
    category_stats = {}
    for s in sessions:
        if not s.case:
            continue
        cat = s.case.category
        if cat not in category_stats:
            category_stats[cat] = {"total": 0, "correct": 0}
        category_stats[cat]["total"] += 1
        if s.status == "diagnosed_correct":
            category_stats[cat]["correct"] += 1

    category_breakdown = []
    for cat, stats in category_stats.items():
        rate = (stats["correct"] / stats["total"] * 100) if stats["total"] > 0 else 0.0
        category_breakdown.append({
            "category": cat,
            "total": stats["total"],
            "correct": stats["correct"],
            "accuracy_rate": round(rate, 1)
        })

    return {
        "total_completed": total_completed,
        "correct_count": correct_count,
        "accuracy_rate": round(accuracy_rate, 1),
        "avg_messages": round(avg_messages, 1),
        "avg_duration_seconds": int(avg_duration),
        "category_breakdown": category_breakdown
    }

@router.get("/leaderboard")
async def get_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Aggregate stats per user
    # Count completed, count correct
    query = (
        select(
            User.id,
            User.full_name,
            User.university,
            User.graduation_year,
            func.count(PracticeSession.id).label("total_sessions"),
            func.sum(
                case(
                    (PracticeSession.status == "diagnosed_correct", 1),
                    else_=0
                )
            ).label("correct_sessions")
        )
        .join(PracticeSession, User.id == PracticeSession.user_id)
        .filter(PracticeSession.status.in_(["diagnosed_correct", "diagnosed_wrong"]))
        .group_by(User.id)
        .order_by(desc("correct_sessions"), desc("total_sessions"))
        .limit(20)
    )

    result = await db.execute(query)
    rows = result.all()

    leaderboard = []
    for idx, row in enumerate(rows):
        total = row.total_sessions or 0
        correct = row.correct_sessions or 0
        accuracy = (correct / total * 100) if total > 0 else 0.0
        leaderboard.append({
            "rank": idx + 1,
            "user_id": row.id,
            "full_name": row.full_name,
            "university": row.university,
            "graduation_year": row.graduation_year,
            "total_completed": total,
            "correct_count": correct,
            "accuracy_rate": round(accuracy, 1)
        })

    return leaderboard
