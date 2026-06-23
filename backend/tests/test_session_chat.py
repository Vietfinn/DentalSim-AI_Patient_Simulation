import pytest
from uuid import UUID
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.case import ClinicalCase
from app.models.session import PracticeSession, ChatMessage
from app.models.user import User

@pytest.fixture
async def seeded_data(db: AsyncSession, client: AsyncClient) -> dict:
    # 1. Register and Login a student
    user_data = {
        "email": "dentist@dentalsim.edu.vn",
        "password": "password123",
        "full_name": "Bác sĩ thực tập A",
        "role": "student",
        "university": "Đại học Y Dược",
        "graduation_year": 2026
    }
    await client.post("/api/auth/register", json=user_data)
    
    login_res = await client.post(
        "/api/auth/login",
        json={"email": "dentist@dentalsim.edu.vn", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Add a clinical case
    case = ClinicalCase(
        case_code="ENDO_01",
        category="Nội Nha",
        name="Viêm tủy không hồi phục",
        patient_info={
            "name": "Nguyễn Văn Nam",
            "age": 34,
            "gender": "Nam",
            "complaint": "Đau buốt răng dữ dội",
            "medical_history": "Không có tiền sử."
        },
        ai_persona="Cáu gắt.",
        clinical_logic="Đau lan thái dương.",
        diagnosis="Viêm tủy không hồi phục",
        explanation="Dấu hiệu tủy viêm không hồi phục.",
        image_url="/static/images/ENDO_01.jpg",
        is_active=True
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)

    return {
        "headers": headers,
        "case_id": case.id,
        "case": case
    }

@pytest.mark.asyncio
async def test_create_session(client: AsyncClient, seeded_data: dict, db: AsyncSession):
    headers = seeded_data["headers"]
    case_id = seeded_data["case_id"]

    response = await client.post(
        "/api/sessions",
        json={"case_id": str(case_id)},
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "in_progress"
    assert data["message_count"] == 0
    
    # Verify the first message (complaint) was automatically seeded
    result = await db.execute(
        select(ChatMessage).filter(ChatMessage.session_id == UUID(data["id"])).order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    assert len(messages) == 1
    assert messages[0].role == "assistant"
    assert "Đau buốt răng dữ dội" in messages[0].content

@pytest.mark.asyncio
async def test_chat_message_flow(client: AsyncClient, seeded_data: dict, db: AsyncSession):
    headers = seeded_data["headers"]
    case_id = seeded_data["case_id"]

    # Start session
    session_res = await client.post(
        "/api/sessions",
        json={"case_id": str(case_id)},
        headers=headers
    )
    session_id = session_res.json()["id"]

    # Send message to chat (triggers SSE stream)
    chat_res = await client.post(
        f"/api/sessions/{session_id}/chat",
        json={"content": "Chào anh, anh đau từ khi nào?"},
        headers=headers
    )
    assert chat_res.status_code == 200
    assert "text/event-stream" in chat_res.headers["content-type"]

    # Consume the SSE response stream
    body = b""
    async for chunk in chat_res.aiter_bytes():
        body += chunk
    
    stream_content = body.decode("utf-8")
    assert "data: " in stream_content
    assert "done" in stream_content or "chunk" in stream_content

    # Verify user message and AI assistant response were saved in the DB
    result = await db.execute(
        select(ChatMessage)
        .filter(ChatMessage.session_id == UUID(session_id))
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    # 1 seeded + 1 user + 1 assistant = 3 messages total
    assert len(messages) == 3
    assert messages[1].role == "user"
    assert messages[1].content == "Chào anh, anh đau từ khi nào?"
    assert messages[2].role == "assistant"
    assert "đau buốt" in messages[2].content

@pytest.mark.asyncio
async def test_diagnose_flow_correct(client: AsyncClient, seeded_data: dict, db: AsyncSession):
    headers = seeded_data["headers"]
    case_id = seeded_data["case_id"]

    # Start session
    session_res = await client.post(
        "/api/sessions",
        json={"case_id": str(case_id)},
        headers=headers
    )
    session_id = session_res.json()["id"]

    # Submit correct diagnosis
    diag_res = await client.post(
        f"/api/sessions/{session_id}/diagnose",
        json={"diagnosis": "Viêm tủy không hồi phục"},
        headers=headers
    )
    assert diag_res.status_code == 200
    data = diag_res.json()
    assert data["is_correct"] is True
    assert data["correct_diagnosis"] == "Viêm tủy không hồi phục"
    assert "Dấu hiệu tủy viêm" in data["explanation"]

    # Verify session status is updated to diagnosed_correct
    session_db = await db.get(PracticeSession, UUID(session_id))
    assert session_db.status == "diagnosed_correct"
    assert session_db.user_diagnosis == "Viêm tủy không hồi phục"
    assert session_db.finished_at is not None
    assert session_db.duration_seconds >= 0

@pytest.mark.asyncio
async def test_diagnose_flow_wrong(client: AsyncClient, seeded_data: dict, db: AsyncSession):
    headers = seeded_data["headers"]
    case_id = seeded_data["case_id"]

    # Start session
    session_res = await client.post(
        "/api/sessions",
        json={"case_id": str(case_id)},
        headers=headers
    )
    session_id = session_res.json()["id"]

    # Submit wrong diagnosis
    diag_res = await client.post(
        f"/api/sessions/{session_id}/diagnose",
        json={"diagnosis": "Viêm tủy có hồi phục"},
        headers=headers
    )
    assert diag_res.status_code == 200
    data = diag_res.json()
    assert data["is_correct"] is False
    assert session_res.json()["status"] == "in_progress" # original session status before diagnostic call

    # Verify session status is updated to diagnosed_wrong
    session_db = await db.get(PracticeSession, UUID(session_id))
    assert session_db.status == "diagnosed_wrong"

@pytest.mark.asyncio
async def test_dashboard_stats_and_leaderboard(client: AsyncClient, seeded_data: dict):
    headers = seeded_data["headers"]
    case_id = seeded_data["case_id"]

    # Start and finish two sessions: one correct, one wrong
    s1 = await client.post("/api/sessions", json={"case_id": str(case_id)}, headers=headers)
    await client.post(f"/api/sessions/{s1.json()['id']}/diagnose", json={"diagnosis": "Viêm tủy không hồi phục"}, headers=headers)

    s2 = await client.post("/api/sessions", json={"case_id": str(case_id)}, headers=headers)
    await client.post(f"/api/sessions/{s2.json()['id']}/diagnose", json={"diagnosis": "Sâu răng"}, headers=headers)

    # 1. Fetch dashboard stats
    stats_res = await client.get("/api/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_completed"] == 2
    assert stats["correct_count"] == 1
    assert stats["accuracy_rate"] == 50.0

    # 2. Fetch leaderboard
    leader_res = await client.get("/api/dashboard/leaderboard", headers=headers)
    assert leader_res.status_code == 200
    leader = leader_res.json()
    assert len(leader) >= 1
    assert leader[0]["full_name"] == "Bác sĩ thực tập A"
    assert leader[0]["total_completed"] == 2
    assert leader[0]["correct_count"] == 1
