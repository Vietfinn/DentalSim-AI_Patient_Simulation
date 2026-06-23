import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db: AsyncSession):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "teststudent@dentalsim.edu.vn",
            "password": "password123",
            "full_name": "Nguyễn Văn Sinh Viên",
            "role": "student",
            "university": "Đại học Y Dược TP.HCM",
            "graduation_year": 2027
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "teststudent@dentalsim.edu.vn"
    assert data["full_name"] == "Nguyễn Văn Sinh Viên"
    assert data["role"] == "student"
    assert "id" in data
    assert "password" not in data

    # Verify user is in DB
    result = await db.execute(select(User).filter(User.email == "teststudent@dentalsim.edu.vn"))
    user = result.scalars().first()
    assert user is not None
    assert user.full_name == "Nguyễn Văn Sinh Viên"

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    # Register once
    user_data = {
        "email": "dup@dentalsim.edu.vn",
        "password": "password123",
        "full_name": "Unique Name",
        "role": "student"
    }
    await client.post("/api/auth/register", json=user_data)

    # Register again with same email
    response = await client.post("/api/auth/register", json=user_data)
    assert response.status_code == 400
    assert "đã được đăng ký" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_json(client: AsyncClient):
    # Register user first
    user_data = {
        "email": "logintest@dentalsim.edu.vn",
        "password": "password123",
        "full_name": "Login Test",
        "role": "student"
    }
    await client.post("/api/auth/register", json=user_data)

    # Login via JSON
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "logintest@dentalsim.edu.vn",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_form(client: AsyncClient):
    # Register user first
    user_data = {
        "email": "formtest@dentalsim.edu.vn",
        "password": "password123",
        "full_name": "Form Test",
        "role": "student"
    }
    await client.post("/api/auth/register", json=user_data)

    # Login via Form (OAuth2PasswordRequestForm standard)
    response = await client.post(
        "/api/auth/token",
        data={
            "username": "formtest@dentalsim.edu.vn",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

@pytest.mark.asyncio
async def test_get_current_user_me(client: AsyncClient):
    # Register & Login
    user_data = {
        "email": "metest@dentalsim.edu.vn",
        "password": "password123",
        "full_name": "Me Test User",
        "role": "student"
    }
    await client.post("/api/auth/register", json=user_data)
    
    login_res = await client.post(
        "/api/auth/login",
        json={
            "email": "metest@dentalsim.edu.vn",
            "password": "password123"
        }
    )
    token = login_res.json()["access_token"]

    # Get /me with token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["email"] == "metest@dentalsim.edu.vn"
    assert data["full_name"] == "Me Test User"

    # Get /me without token
    bad_res = await client.get("/api/auth/me")
    assert bad_res.status_code == 401
