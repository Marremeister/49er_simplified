"""Unit tests for domain services."""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from app.domain.services.auth_service import AuthService
from app.domain.services.session_service import SessionService
from app.domain.services.equipment_service import EquipmentService
from app.domain.entities.user import User
from app.domain.entities.session import SailingSession
from app.domain.entities.equipment import Equipment


class TestAuthService:
    """Test AuthService domain service."""

    @pytest.mark.asyncio
    async def test_register_user_success(self, mock_user_repository, mock_password_hasher):
        """Test successful user registration."""
        # Setup
        mock_user_repository.exists_by_email.return_value = False
        mock_user_repository.exists_by_username.return_value = False
        mock_user_repository.create.return_value = User(
            id=uuid4(),
            email="new@example.com",
            username="newuser",
            hashed_password="hashed_password"
        )

        service = AuthService(mock_user_repository, mock_password_hasher)

        # Execute
        user = await service.register_user(
            email="new@example.com",
            username="newuser",
            password="password123"
        )

        # Assert
        assert user.email == "new@example.com"
        assert user.username == "newuser"
        mock_password_hasher.hash_password.assert_called_once_with("password123")
        mock_user_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_register_user_email_exists(self, mock_user_repository, mock_password_hasher):
        """Test registration with existing email."""
        # Setup
        mock_user_repository.exists_by_email.return_value = True

        service = AuthService(mock_user_repository, mock_password_hasher)

        # Execute & Assert
        with pytest.raises(ValueError, match="Email already registered"):
            await service.register_user(
                email="existing@example.com",
                username="newuser",
                password="password123"
            )

    @pytest.mark.asyncio
    async def test_register_user_username_exists(self, mock_user_repository, mock_password_hasher):
        """Test registration with existing username."""
        # Setup
        mock_user_repository.exists_by_email.return_value = False
        mock_user_repository.exists_by_username.return_value = True

        service = AuthService(mock_user_repository, mock_password_hasher)

        # Execute & Assert
        with pytest.raises(ValueError, match="Username already taken"):
            await service.register_user(
                email="new@example.com",
                username="existinguser",
                password="password123"
            )

    @pytest.mark.asyncio
    async def test_register_user_weak_password(self, mock_user_repository, mock_password_hasher):
        """Test registration with weak password."""
        # Setup
        mock_user_repository.exists_by_email.return_value = False
        mock_user_repository.exists_by_username.return_value = False

        service = AuthService(mock_user_repository, mock_password_hasher)

        # Test short password
        with pytest.raises(ValueError, match="at least 6 characters"):
            await service.register_user(
                email="new@example.com",
                username="newuser",
                password="12345"
            )

        # Test all numbers
        with pytest.raises(ValueError, match="cannot be all numbers"):
            await service.register_user(
                email="new@example.com",
                username="newuser",
                password="123456"
            )

        # Test all letters
        with pytest.raises(ValueError, match="must contain at least one number"):
            await service.register_user(
                email="new@example.com",
                username="newuser",
                password="password"
            )

    @pytest.mark.asyncio
    async def test_authenticate_user_success(self, mock_user_repository, mock_password_hasher, sample_user):
        """Test successful user authentication."""
        # Setup
        sample_user.is_active = True
        mock_user_repository.get_by_username.return_value = sample_user
        mock_password_hasher.verify_password.return_value = True

        service = AuthService(mock_user_repository, mock_password_hasher)

        # Execute
        user = await service.authenticate_user("testuser", "password123")

        # Assert
        assert user is not None
        assert user.username == "testuser"
        mock_password_hasher.verify_password.assert_called_once_with(
            "password123", sample_user.hashed_password
        )

    @pytest.mark.asyncio
    async def test_authenticate_user_not_found(self, mock_user_repository, mock_password_hasher):
        """Test authentication with non-existent user."""
        # Setup
        mock_user_repository.get_by_username.return_value = None

        service = AuthService(mock_user_repository, mock_password_hasher)

        # Execute
        user = await service.authenticate_user("nonexistent", "password123")

        # Assert
        assert user is None
        mock_password_hasher.verify_password.assert_not_called()

    @pytest.mark.asyncio
    async def test_authenticate_user_inactive(self, mock_user_repository, mock_password_hasher, sample_user):
        """Test authentication with inactive user."""
        # Setup
        sample_user.is_active = False
        mock_user_repository.get_by_username.return_value = sample_user

        service = AuthService(mock_user_repository, mock_password_hasher)

        # Execute
        user = await service.authenticate_user("testuser", "password123")

        # Assert
        assert user is None

    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self, mock_user_repository, mock_password_hasher, sample_user):
        """Test authentication with wrong password."""
        # Setup
        mock_user_repository.get_by_username.return_value = sample_user
        mock_password_hasher.verify_password.return_value = False

        service = AuthService(mock_user_repository, mock_password_hasher)

        # Execute
        user = await service.authenticate_user("testuser", "wrongpassword")

        # Assert
        assert user is None


class TestSessionService:
    """Test SessionService domain service."""

    @pytest.mark.asyncio
    async def test_create_session_success(self, mock_session_repository):
        """Test successful session creation."""
        # Setup
        user_id = uuid4()
        session_data = {
            "date": "2024-01-15",
            "location": "SF Bay",
            "wind_speed_min": 10.0,
            "wind_speed_max": 15.0,
            "wave_type": "Choppy",
            "wave_direction": "NW",
            "hours_on_water": 3.5,
            "performance_rating": 4
        }

        expected_session = SailingSession(
            created_by=user_id,
            **session_data
        )
        mock_session_repository.create.return_value = expected_session

        service = SessionService(mock_session_repository)

        # Execute
        session = await service.create_session(user_id, session_data)

        # Assert
        assert session.location == "SF Bay"
        assert session.created_by == user_id
        mock_session_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_sessions(self, mock_session_repository, sample_session):
        """Test getting user sessions."""
        # Setup
        user_id = uuid4()
        mock_session_repository.get_by_user.return_value = [sample_session]

        service = SessionService(mock_session_repository)

        # Execute
        sessions = await service.get_user_sessions(user_id, skip=0, limit=10)

        # Assert
        assert len(sessions) == 1
        assert sessions[0] == sample_session
        mock_session_repository.get_by_user.assert_called_once_with(user_id, 0, 10)

    @pytest.mark.asyncio
    async def test_update_session_success(self, mock_session_repository, sample_session):
        """Test successful session update."""
        # Setup
        user_id = sample_session.created_by
        session_id = sample_session.id
        update_data = {"performance_rating": 5, "notes": "Updated notes"}

        mock_session_repository.get_by_id.return_value = sample_session
        mock_session_repository.update.return_value = sample_session

        service = SessionService(mock_session_repository)

        # Execute
        updated = await service.update_session(session_id, user_id, update_data)

        # Assert
        assert updated is not None
        mock_session_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_session_unauthorized(self, mock_session_repository, sample_session):
        """Test session update by non-owner."""
        # Setup
        wrong_user_id = uuid4()
        session_id = sample_session.id
        update_data = {"performance_rating": 5}

        mock_session_repository.get_by_id.return_value = sample_session

        service = SessionService(mock_session_repository)

        # Execute
        updated = await service.update_session(session_id, wrong_user_id, update_data)

        # Assert
        assert updated is None
        mock_session_repository.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_session_success(self, mock_session_repository, sample_session):
        """Test successful session deletion."""
        # Setup
        user_id = sample_session.created_by
        session_id = sample_session.id

        mock_session_repository.get_by_id.return_value = sample_session
        mock_session_repository.delete.return_value = True

        service = SessionService(mock_session_repository)

        # Execute
        success = await service.delete_session(session_id, user_id)

        # Assert
        assert success is True
        mock_session_repository.delete.assert_called_once_with(session_id)

    @pytest.mark.asyncio
    async def test_get_performance_analytics(self, mock_session_repository):
        """Test performance analytics calculation."""
        # Setup
        user_id = uuid4()
        sessions = [
            SailingSession(
                id=uuid4(),
                date="2024-01-15",
                location="SF Bay",
                wind_speed_min=20,
                wind_speed_max=25,
                wave_type="Large",
                wave_direction="NW",
                hours_on_water=2.0,
                performance_rating=3,
                created_by=user_id
            ),
            SailingSession(
                id=uuid4(),
                date="2024-01-16",
                location="SF Bay",
                wind_speed_min=5,
                wind_speed_max=8,
                wave_type="Flat",
                wave_direction="N",
                hours_on_water=3.0,
                performance_rating=5,
                created_by=user_id
            ),
            SailingSession(
                id=uuid4(),
                date="2024-01-17",
                location="Berkeley",
                wind_speed_min=12,
                wind_speed_max=15,
                wave_type="Choppy",
                wave_direction="W",
                hours_on_water=4.0,
                performance_rating=4,
                created_by=user_id
            )
        ]

        mock_session_repository.get_by_user.return_value = sessions

        service = SessionService(mock_session_repository)

        # Execute
        analytics = await service.get_performance_analytics(user_id)

        # Assert
        assert analytics["total_sessions"] == 3
        assert analytics["total_hours"] == 9.0
        assert analytics["average_performance"] == 4.0
        assert analytics["performance_by_conditions"]["heavy"] == 3.0
        assert analytics["performance_by_conditions"]["light"] == 5.0
        assert analytics["performance_by_conditions"]["medium"] == 4.0
        assert analytics["sessions_by_location"]["SF Bay"] == 2
        assert analytics["sessions_by_location"]["Berkeley"] == 1


class TestEquipmentService:
    """Test EquipmentService domain service."""

    @pytest.mark.asyncio
    async def test_create_equipment_success(self, mock_equipment_repository):
        """Test successful equipment creation."""
        # Setup
        user_id = uuid4()
        equipment_data = {
            "name": "New Mainsail",
            "type": "Mainsail",
            "manufacturer": "North Sails",
            "model": "3Di",
            "purchase_date": "2024-01-01"
        }

        expected_equipment = Equipment(
            owner_id=user_id,
            **equipment_data
        )
        mock_equipment_repository.create.return_value = expected_equipment

        service = EquipmentService(mock_equipment_repository)

        # Execute
        equipment = await service.create_equipment(user_id, equipment_data)

        # Assert
        assert equipment.name == "New Mainsail"
        assert equipment.owner_id == user_id
        mock_equipment_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_retire_equipment_success(self, mock_equipment_repository, sample_equipment):
        """Test successful equipment retirement."""
        # Setup
        user_id = sample_equipment.owner_id
        equipment_id = sample_equipment.id

        mock_equipment_repository.get_by_id.return_value = sample_equipment
        mock_equipment_repository.retire.return_value = True

        service = EquipmentService(mock_equipment_repository)

        # Execute
        success = await service.retire_equipment(equipment_id, user_id)

        # Assert
        assert success is True
        mock_equipment_repository.retire.assert_called_once_with(equipment_id)

    @pytest.mark.asyncio
    async def test_retire_equipment_unauthorized(self, mock_equipment_repository, sample_equipment):
        """Test equipment retirement by non-owner."""
        # Setup
        wrong_user_id = uuid4()
        equipment_id = sample_equipment.id

        mock_equipment_repository.get_by_id.return_value = sample_equipment

        service = EquipmentService(mock_equipment_repository)

        # Execute
        success = await service.retire_equipment(equipment_id, wrong_user_id)

        # Assert
        assert success is False
        mock_equipment_repository.retire.assert_not_called()

    @pytest.mark.asyncio
    async def test_get_equipment_statistics(self, mock_equipment_repository):
        """Test equipment statistics calculation."""
        # Setup
        user_id = uuid4()
        equipment_list = [
            Equipment(
                id=uuid4(),
                name="Main 1",
                type="Mainsail",
                manufacturer="North",
                model="3Di",
                owner_id=user_id,
                active=True,
                purchase_date="2023-01-01"
            ),
            Equipment(
                id=uuid4(),
                name="Main 2",
                type="Mainsail",
                manufacturer="Doyle",
                model="Stratis",
                owner_id=user_id,
                active=False,
                purchase_date="2020-01-01"
            ),
            Equipment(
                id=uuid4(),
                name="Jib 1",
                type="Jib",
                manufacturer="North",
                model="3Di",
                owner_id=user_id,
                active=True,
                purchase_date="2024-01-01"
            )
        ]

        mock_equipment_repository.get_by_user.return_value = equipment_list

        service = EquipmentService(mock_equipment_repository)

        # Execute
        stats = await service.get_equipment_statistics(user_id)

        # Assert
        assert stats["total_equipment"] == 3
        assert stats["active_equipment"] == 2
        assert stats["retired_equipment"] == 1
        assert stats["equipment_by_type"]["Mainsail"] == 2
        assert stats["equipment_by_type"]["Jib"] == 1
        assert stats["oldest_equipment"] == "Main 2"
        assert stats["newest_equipment"] == "Jib 1"