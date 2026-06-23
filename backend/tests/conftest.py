import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database import Base
from app.main import app
from app.core.dependencies import get_db
from app.services.ai_service import ai_service

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestAsyncSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    connection = await test_engine.connect()
    transaction = await connection.begin()
    async with AsyncSession(bind=connection, expire_on_commit=False) as session:
        yield session
    await transaction.rollback()
    await connection.close()


@pytest.fixture(autouse=True)
def override_dependencies(db):
    async def _get_db():
        yield db
    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.clear()

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    # We use httpx AsyncClient for async FastAPI integration tests
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# Mock Groq AI API calls during testing to run locally and save tokens
@pytest.fixture(autouse=True)
def mock_ai_service(monkeypatch):
    async def mock_get_response(history, case):
        return "Bệnh nhân AI phản hồi: tôi cảm thấy răng đau buốt."
        
    async def mock_get_streaming_response(history, case):
        yield "Bệnh nhân AI phản hồi: "
        yield "tôi cảm thấy "
        yield "răng đau buốt."

    monkeypatch.setattr(ai_service, "get_response", mock_get_response)
    monkeypatch.setattr(ai_service, "get_streaming_response", mock_get_streaming_response)
