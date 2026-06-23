import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.case import ClinicalCase

@pytest.fixture
async def auth_header(client: AsyncClient) -> dict:
    # Register & Login to get token
    user_data = {
        "email": "casetest@dentalsim.edu.vn",
        "password": "password123",
        "full_name": "Case Test User",
        "role": "student"
    }
    await client.post("/api/auth/register", json=user_data)
    
    login_res = await client.post(
        "/api/auth/login",
        json={
            "email": "casetest@dentalsim.edu.vn",
            "password": "password123"
        }
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def sample_cases(db: AsyncSession):
    case1 = ClinicalCase(
        case_code="ENDO_01",
        category="Nội Nha",
        name="Viêm tủy không hồi phục",
        patient_info={
            "name": "Nguyễn Văn Nam",
            "age": 34,
            "gender": "Nam",
            "complaint": "Đau buốt dữ dội răng hàm dưới phải, đau lan lên đầu",
            "medical_history": "Không có bệnh nền."
        },
        ai_persona="Cáu gắt, mệt mỏi.",
        clinical_logic="Đau lan thái dương, test lạnh buốt lâu.",
        diagnosis="Viêm tủy không hồi phục",
        explanation="Dựa vào triệu chứng đau lan tỏa và test lạnh dương tính kéo dài.",
        image_url="/static/images/ENDO_01.jpg",
        is_active=True
    )
    case2 = ClinicalCase(
        case_code="PERIO_01",
        category="Nha Chu",
        name="Viêm lợi",
        patient_info={
            "name": "Trương Tuấn Tú",
            "age": 19,
            "gender": "Nam",
            "complaint": "Chảy máu chân răng.",
            "medical_history": "Thở miệng."
        },
        ai_persona="Ngại ngùng.",
        clinical_logic="Chảy máu lợi viền.",
        diagnosis="Viêm lợi",
        explanation="Lợi viền sưng nề đỏ, chảy máu khi thăm khám.",
        image_url="/static/images/PERIO_01.jpg",
        is_active=True
    )
    db.add(case1)
    db.add(case2)
    await db.commit()
    return [case1, case2]

@pytest.mark.asyncio
async def test_list_cases(client: AsyncClient, sample_cases, auth_header):
    response = await client.get("/api/cases", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert {c["case_code"] for c in data} == {"ENDO_01", "PERIO_01"}
    
    # Verify secure fields are hidden in list view
    for c in data:
        assert "diagnosis" not in c
        assert "ai_persona" not in c
        assert "clinical_logic" not in c
        assert "explanation" not in c

@pytest.mark.asyncio
async def test_list_cases_filtered(client: AsyncClient, sample_cases, auth_header):
    response = await client.get("/api/cases?category=Nội Nha", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["case_code"] == "ENDO_01"

@pytest.mark.asyncio
async def test_list_categories(client: AsyncClient, sample_cases, auth_header):
    response = await client.get("/api/cases/categories", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert set(data) == {"Nội Nha", "Nha Chu"}

@pytest.mark.asyncio
async def test_get_case_detail_security(client: AsyncClient, sample_cases, auth_header):
    case_id = sample_cases[0].id
    response = await client.get(f"/api/cases/{case_id}", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["case_code"] == "ENDO_01"
    
    # CRITICAL: Verify secure fields are hidden in detail view to prevent cheating
    assert "diagnosis" not in data
    assert "ai_persona" not in data
    assert "clinical_logic" not in data
    assert "explanation" not in data
