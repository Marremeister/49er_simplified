"""PyTest configuration and fixtures."""
import asyncio
from datetime import date
from typing import AsyncGenerator
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.domain.entities.user import User
from app.domain.entities.session import SailingSession
from app.domain.entities.equipment import Equipment
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.session_repository import ISessionRepository
from app.domain.repositories.equipment_repository import IEquipmentRepository
from app.infrastructure.database.connection import Base
from app.infrastructure.security.password_hasher import PasswordHasher


# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)


# Mock repositories
@pytest.fixture
def mock_user_repository():
    """Mock user repository for unit tests."""
    return AsyncMock(spec=IUserRepository)


@pytest.fixture
def mock_session_repository():
    """Mock session repository for unit tests."""
    return AsyncMock(spec=ISessionRepository)


@pytest.fixture
def mock_equipment_repository():
    """Mock equipment repository for unit tests."""
    return AsyncMock(spec=IEquipmentRepository)


@pytest.fixture
def mock_password_hasher():
    """Mock password hasher for unit tests."""
    hasher = AsyncMock(spec=PasswordHasher)
    hasher.hash_password.return_value = "hashed_password"
    hasher.verify_password.return_value = True
    return hasher


# Test data fixtures
@pytest.fixture
def sample_user():
    """Sample user entity for tests."""
    return User(
        id=uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="hashed_password",
        is_active=True
    )


@pytest.fixture
def sample_session():
    """Sample sailing session for tests."""
    return SailingSession(
        id=uuid4(),
        date=date(2024, 1, 15),
        location="San Francisco Bay",
        wind_speed_min=10.0,
        wind_speed_max=15.0,
        wave_type="Choppy",
        wave_direction="NW",
        hours_on_water=3.5,
        performance_rating=4,
        notes="Good session",
        created_by=uuid4()
    )


@pytest.fixture
def sample_equipment():
    """Sample equipment for tests."""
    return Equipment(
        id=uuid4(),
        name="Competition Mainsail",
        type="Mainsail",
        manufacturer="North Sails",
        model="3Di RAW 760",
        purchase_date=date(2023, 6, 1),
        notes="Race sail",
        active=True,
        owner_id=uuid4()
    )


# Database fixtures for integration tests
@pytest_asyncio.fixture
async def async_db_engine():
    """Create async database engine for tests."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest_asyncio.fixture
async def async_db_session(async_db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create async database session for tests."""
    async_session = async_sessionmaker(
        async_db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()