"""Integration tests for repository implementations."""
import pytest
from datetime import date
from uuid import uuid4

from app.domain.entities.user import User
from app.domain.entities.session import SailingSession
from app.domain.entities.equipment import Equipment, EquipmentSettings
from app.infrastructure.database.repositories.user_repository_impl import UserRepository
from app.infrastructure.database.repositories.session_repository_impl import SessionRepository
from app.infrastructure.database.repositories.equipment_repository_impl import EquipmentRepository


class TestUserRepository:
    """Test UserRepository implementation with real database."""

    @pytest.mark.asyncio
    async def test_create_and_get_user(self, async_db_session):
        """Test creating and retrieving a user."""
        # Setup
        repository = UserRepository(async_db_session)
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password="hashed_password"
        )

        # Create
        created_user = await repository.create(user)
        assert created_user.id is not None
        assert created_user.email == "test@example.com"

        # Get by ID
        retrieved = await repository.get_by_id(created_user.id)
        assert retrieved is not None
        assert retrieved.email == created_user.email
        assert retrieved.username == created_user.username

        # Get by email
        by_email = await repository.get_by_email("test@example.com")
        assert by_email is not None
        assert by_email.id == created_user.id

        # Get by username
        by_username = await repository.get_by_username("testuser")
        assert by_username is not None
        assert by_username.id == created_user.id

    @pytest.mark.asyncio
    async def test_update_user(self, async_db_session):
        """Test updating a user."""
        # Setup
        repository = UserRepository(async_db_session)
        user = User(
            email="old@example.com",
            username="testuser",
            hashed_password="hashed_password"
        )

        # Create
        created = await repository.create(user)

        # Update
        created.email = "new@example.com"
        created.is_active = False
        updated = await repository.update(created)

        # Verify
        assert updated.email == "new@example.com"
        assert updated.is_active is False

        # Check persistence
        retrieved = await repository.get_by_id(created.id)
        assert retrieved.email == "new@example.com"
        assert retrieved.is_active is False

    @pytest.mark.asyncio
    async def test_delete_user(self, async_db_session):
        """Test deleting a user."""
        # Setup
        repository = UserRepository(async_db_session)
        user = User(
            email="delete@example.com",
            username="deleteuser",
            hashed_password="hashed_password"
        )

        # Create
        created = await repository.create(user)
        user_id = created.id

        # Delete
        success = await repository.delete(user_id)
        assert success is True

        # Verify deletion
        retrieved = await repository.get_by_id(user_id)
        assert retrieved is None

        # Delete non-existent
        success = await repository.delete(uuid4())
        assert success is False

    @pytest.mark.asyncio
    async def test_exists_methods(self, async_db_session):
        """Test existence check methods."""
        # Setup
        repository = UserRepository(async_db_session)
        user = User(
            email="exists@example.com",
            username="existsuser",
            hashed_password="hashed_password"
        )

        # Initially doesn't exist
        assert await repository.exists_by_email("exists@example.com") is False
        assert await repository.exists_by_username("existsuser") is False

        # Create user
        await repository.create(user)

        # Now exists
        assert await repository.exists_by_email("exists@example.com") is True
        assert await repository.exists_by_username("existsuser") is True

        # Non-existent still returns False
        assert await repository.exists_by_email("other@example.com") is False
        assert await repository.exists_by_username("otheruser") is False

    @pytest.mark.asyncio
    async def test_list_all_users(self, async_db_session):
        """Test listing all users with pagination."""
        # Setup
        repository = UserRepository(async_db_session)

        # Create multiple users
        for i in range(5):
            user = User(
                email=f"user{i}@example.com",
                username=f"user{i}",
                hashed_password="hashed_password"
            )
            await repository.create(user)

        # List all
        all_users = await repository.list_all()
        assert len(all_users) >= 5

        # Test pagination
        page1 = await repository.list_all(skip=0, limit=2)
        assert len(page1) == 2

        page2 = await repository.list_all(skip=2, limit=2)
        assert len(page2) == 2

        # Ensure different pages
        page1_ids = {u.id for u in page1}
        page2_ids = {u.id for u in page2}
        assert page1_ids.isdisjoint(page2_ids)


class TestSessionRepository:
    """Test SessionRepository implementation with real database."""

    @pytest.mark.asyncio
    async def test_create_and_get_session(self, async_db_session):
        """Test creating and retrieving a session."""
        # Setup
        repository = SessionRepository(async_db_session)
        user_id = uuid4()
        session = SailingSession(
            date=date(2024, 1, 15),
            location="SF Bay",
            wind_speed_min=10.0,
            wind_speed_max=15.0,
            wave_type="Choppy",
            wave_direction="NW",
            hours_on_water=3.5,
            performance_rating=4,
            created_by=user_id
        )

        # Create
        created = await repository.create(session)
        assert created.id is not None
        assert created.location == "SF Bay"

        # Get by ID
        retrieved = await repository.get_by_id(created.id)
        assert retrieved is not None
        assert retrieved.wind_speed_min == 10.0
        assert retrieved.wave_type == "Choppy"

    @pytest.mark.asyncio
    async def test_get_sessions_by_user(self, async_db_session):
        """Test getting sessions by user."""
        # Setup
        repository = SessionRepository(async_db_session)
        user1_id = uuid4()
        user2_id = uuid4()

        # Create sessions for different users
        for i in range(3):
            session1 = SailingSession(
                date=date(2024, 1, i + 1),
                location="Location 1",
                wind_speed_min=10.0,
                wind_speed_max=15.0,
                wave_type="Flat",
                wave_direction="N",
                hours_on_water=2.0,
                performance_rating=3,
                created_by=user1_id
            )
            await repository.create(session1)

            session2 = SailingSession(
                date=date(2024, 1, i + 1),
                location="Location 2",
                wind_speed_min=15.0,
                wind_speed_max=20.0,
                wave_type="Choppy",
                wave_direction="W",
                hours_on_water=3.0,
                performance_rating=4,
                created_by=user2_id
            )
            await repository.create(session2)

        # Get user1 sessions
        user1_sessions = await repository.get_by_user(user1_id)
        assert len(user1_sessions) == 3
        assert all(s.created_by == user1_id for s in user1_sessions)

        # Get user2 sessions
        user2_sessions = await repository.get_by_user(user2_id)
        assert len(user2_sessions) == 3
        assert all(s.created_by == user2_id for s in user2_sessions)

    @pytest.mark.asyncio
    async def test_get_sessions_by_date_range(self, async_db_session):
        """Test getting sessions within date range."""
        # Setup
        repository = SessionRepository(async_db_session)
        user_id = uuid4()

        # Create sessions across different dates
        dates = [
            date(2024, 1, 10),
            date(2024, 1, 15),
            date(2024, 1, 20),
            date(2024, 1, 25)
        ]

        for d in dates:
            session = SailingSession(
                date=d,
                location="Test Location",
                wind_speed_min=10.0,
                wind_speed_max=15.0,
                wave_type="Flat",
                wave_direction="N",
                hours_on_water=2.0,
                performance_rating=3,
                created_by=user_id
            )
            await repository.create(session)

        # Get sessions in range
        start = date(2024, 1, 12)
        end = date(2024, 1, 22)

        in_range = await repository.get_by_date_range(user_id, start, end)
        assert len(in_range) == 2
        assert all(start <= s.date <= end for s in in_range)

    @pytest.mark.asyncio
    async def test_session_with_equipment_settings(self, async_db_session):
        """Test session with equipment settings."""
        # Setup
        repository = SessionRepository(async_db_session)
        user_id = uuid4()

        # Create session
        session = SailingSession(
            date=date(2024, 1, 15),
            location="Test Location",
            wind_speed_min=10.0,
            wind_speed_max=15.0,
            wave_type="Choppy",
            wave_direction="NW",
            hours_on_water=3.0,
            performance_rating=4,
            created_by=user_id
        )
        created_session = await repository.create(session)

        # Initially no settings
        result = await repository.get_with_settings(created_session.id)
        assert result is not None
        session_retrieved, settings = result
        assert session_retrieved.id == created_session.id
        assert settings is None

        # Create settings
        equipment_settings = EquipmentSettings(
            session_id=created_session.id,
            forestay_tension=7.5,
            shroud_tension=6.0,
            mast_rake=2.5,
            jib_halyard_tension="Medium",
            cunningham=4.0,
            outhaul=5.0,
            vang=6.0
        )
        created_settings = await repository.create_settings(equipment_settings)
        assert created_settings.session_id == created_session.id

        # Get with settings
        result = await repository.get_with_settings(created_session.id)
        session_with_settings, settings = result
        assert settings is not None
        assert settings.forestay_tension == 7.5
        assert settings.jib_halyard_tension == "Medium"

        # Get settings by session
        settings_only = await repository.get_settings_by_session(created_session.id)
        assert settings_only is not None
        assert settings_only.id == created_settings.id


class TestEquipmentRepository:
    """Test EquipmentRepository implementation with real database."""

    @pytest.mark.asyncio
    async def test_create_and_get_equipment(self, async_db_session):
        """Test creating and retrieving equipment."""
        # Setup
        repository = EquipmentRepository(async_db_session)
        user_id = uuid4()
        equipment = Equipment(
            name="Test Mainsail",
            type="Mainsail",
            manufacturer="North Sails",
            model="3Di",
            owner_id=user_id,
            purchase_date=date(2023, 6, 1)
        )

        # Create
        created = await repository.create(equipment)
        assert created.id is not None
        assert created.name == "Test Mainsail"

        # Get by ID
        retrieved = await repository.get_by_id(created.id)
        assert retrieved is not None
        assert retrieved.manufacturer == "North Sails"
        assert retrieved.active is True

    @pytest.mark.asyncio
    async def test_get_equipment_by_user(self, async_db_session):
        """Test getting equipment by user."""
        # Setup
        repository = EquipmentRepository(async_db_session)
        user1_id = uuid4()
        user2_id = uuid4()

        # Create equipment for user1
        equipment1 = Equipment(
            name="User1 Mainsail",
            type="Mainsail",
            manufacturer="North",
            model="3Di",
            owner_id=user1_id,
            active=True
        )
        equipment2 = Equipment(
            name="User1 Jib",
            type="Jib",
            manufacturer="Doyle",
            model="AP",
            owner_id=user1_id,
            active=False  # Retired
        )
        await repository.create(equipment1)
        await repository.create(equipment2)

        # Create equipment for user2
        equipment3 = Equipment(
            name="User2 Mast",
            type="Mast",
            manufacturer="Selden",
            model="D+",
            owner_id=user2_id,
            active=True
        )
        await repository.create(equipment3)

        # Get all equipment for user1
        user1_all = await repository.get_by_user(user1_id, active_only=False)
        assert len(user1_all) == 2

        # Get only active equipment for user1
        user1_active = await repository.get_by_user(user1_id, active_only=True)
        assert len(user1_active) == 1
        assert user1_active[0].name == "User1 Mainsail"

        # Get equipment for user2
        user2_equipment = await repository.get_by_user(user2_id)
        assert len(user2_equipment) == 1
        assert user2_equipment[0].owner_id == user2_id

    @pytest.mark.asyncio
    async def test_get_equipment_by_type(self, async_db_session):
        """Test getting equipment by type."""
        # Setup
        repository = EquipmentRepository(async_db_session)
        user_id = uuid4()

        # Create different types of equipment
        mainsail1 = Equipment(
            name="Main 1",
            type="Mainsail",
            manufacturer="North",
            model="3Di",
            owner_id=user_id
        )
        mainsail2 = Equipment(
            name="Main 2",
            type="Mainsail",
            manufacturer="Doyle",
            model="Stratis",
            owner_id=user_id
        )
        jib = Equipment(
            name="Jib 1",
            type="Jib",
            manufacturer="North",
            model="3Di",
            owner_id=user_id
        )

        await repository.create(mainsail1)
        await repository.create(mainsail2)
        await repository.create(jib)

        # Get by type
        mainsails = await repository.get_by_type(user_id, "Mainsail")
        assert len(mainsails) == 2
        assert all(e.type == "Mainsail" for e in mainsails)

        jibs = await repository.get_by_type(user_id, "Jib")
        assert len(jibs) == 1
        assert jibs[0].name == "Jib 1"

    @pytest.mark.asyncio
    async def test_retire_and_reactivate_equipment(self, async_db_session):
        """Test retiring and reactivating equipment."""
        # Setup
        repository = EquipmentRepository(async_db_session)
        equipment = Equipment(
            name="Test Equipment",
            type="Mainsail",
            manufacturer="North",
            model="3Di",
            owner_id=uuid4(),
            active=True
        )

        # Create
        created = await repository.create(equipment)
        assert created.active is True

        # Retire
        success = await repository.retire(created.id)
        assert success is True

        # Verify retirement
        retired = await repository.get_by_id(created.id)
        assert retired.active is False

        # Reactivate
        success = await repository.reactivate(created.id)
        assert success is True

        # Verify reactivation
        reactivated = await repository.get_by_id(created.id)
        assert reactivated.active is True

    @pytest.mark.asyncio
    async def test_update_equipment(self, async_db_session):
        """Test updating equipment."""
        # Setup
        repository = EquipmentRepository(async_db_session)
        equipment = Equipment(
            name="Old Name",
            type="Mainsail",
            manufacturer="Old Manufacturer",
            model="Old Model",
            owner_id=uuid4()
        )

        # Create
        created = await repository.create(equipment)

        # Update
        created.name = "New Name"
        created.manufacturer = "New Manufacturer"
        created.notes = "Updated notes"

        updated = await repository.update(created)
        assert updated.name == "New Name"
        assert updated.manufacturer == "New Manufacturer"
        assert updated.notes == "Updated notes"

        # Verify persistence
        retrieved = await repository.get_by_id(created.id)
        assert retrieved.name == "New Name"