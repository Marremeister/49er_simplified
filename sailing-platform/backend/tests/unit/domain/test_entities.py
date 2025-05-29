"""Unit tests for domain entities."""
import pytest
from datetime import date, datetime
from uuid import uuid4

from app.domain.entities.user import User
from app.domain.entities.session import SailingSession
from app.domain.entities.equipment import Equipment, EquipmentSettings


class TestUserEntity:
    """Test User domain entity."""

    def test_user_creation_valid(self):
        """Test creating a valid user."""
        user = User(
            email="john@example.com",
            username="johndoe",
            hashed_password="hashed_password"
        )

        assert user.email == "john@example.com"
        assert user.username == "johndoe"
        assert user.is_active is True
        assert isinstance(user.id, type(uuid4()))
        assert isinstance(user.created_at, datetime)

    def test_user_email_validation(self):
        """Test user email validation."""
        # Invalid email - no @ symbol
        with pytest.raises(ValueError, match="Invalid email format"):
            User(
                email="invalid-email",
                username="johndoe",
                hashed_password="hashed"
            )

        # Empty email
        with pytest.raises(ValueError, match="Invalid email format"):
            User(
                email="",
                username="johndoe",
                hashed_password="hashed"
            )

        # Email too long
        with pytest.raises(ValueError, match="Email too long"):
            User(
                email="a" * 250 + "@example.com",
                username="johndoe",
                hashed_password="hashed"
            )

    def test_user_username_validation(self):
        """Test username validation."""
        # Too short
        with pytest.raises(ValueError, match="Username must be at least 3 characters"):
            User(
                email="john@example.com",
                username="ab",
                hashed_password="hashed"
            )

        # Too long
        with pytest.raises(ValueError, match="Username too long"):
            User(
                email="john@example.com",
                username="a" * 51,
                hashed_password="hashed"
            )

        # Invalid characters
        with pytest.raises(ValueError, match="Username can only contain"):
            User(
                email="john@example.com",
                username="john@doe",
                hashed_password="hashed"
            )

    def test_user_deactivate_activate(self):
        """Test user activation/deactivation."""
        user = User(
            email="john@example.com",
            username="johndoe",
            hashed_password="hashed"
        )

        assert user.is_active is True
        assert user.can_login() is True

        user.deactivate()
        assert user.is_active is False
        assert user.can_login() is False

        user.activate()
        assert user.is_active is True
        assert user.can_login() is True

    def test_user_update_email(self):
        """Test updating user email."""
        user = User(
            email="old@example.com",
            username="johndoe",
            hashed_password="hashed"
        )

        # Valid update
        user.update_email("new@example.com")
        assert user.email == "new@example.com"

        # Invalid update - should rollback
        with pytest.raises(ValueError):
            user.update_email("invalid-email")
        assert user.email == "new@example.com"  # Should not change


class TestSailingSessionEntity:
    """Test SailingSession domain entity."""

    def test_session_creation_valid(self):
        """Test creating a valid sailing session."""
        session = SailingSession(
            date=date(2024, 1, 15),
            location="San Francisco Bay",
            wind_speed_min=10.0,
            wind_speed_max=15.0,
            wave_type="Choppy",
            wave_direction="NW",
            hours_on_water=3.5,
            performance_rating=4,
            created_by=uuid4()
        )

        assert session.location == "San Francisco Bay"
        assert session.average_wind_speed == 12.5
        assert session.wind_range == 5.0
        assert session.is_heavy_weather() is False
        assert session.is_light_weather() is False

    def test_session_wind_speed_validation(self):
        """Test wind speed validation."""
        # Negative wind speed
        with pytest.raises(ValueError, match="cannot be negative"):
            SailingSession(
                date=date(2024, 1, 15),
                location="Test",
                wind_speed_min=-5,
                wind_speed_max=10,
                wave_type="Flat",
                wave_direction="N",
                hours_on_water=2,
                performance_rating=3,
                created_by=uuid4()
            )

        # Min > Max
        with pytest.raises(ValueError, match="cannot exceed maximum"):
            SailingSession(
                date=date(2024, 1, 15),
                location="Test",
                wind_speed_min=20,
                wind_speed_max=10,
                wave_type="Flat",
                wave_direction="N",
                hours_on_water=2,
                performance_rating=3,
                created_by=uuid4()
            )

        # Exceeds safety limit
        with pytest.raises(ValueError, match="exceeds safe sailing conditions"):
            SailingSession(
                date=date(2024, 1, 15),
                location="Test",
                wind_speed_min=50,
                wind_speed_max=65,
                wave_type="Large",
                wave_direction="N",
                hours_on_water=2,
                performance_rating=3,
                created_by=uuid4()
            )

    def test_session_performance_rating_validation(self):
        """Test performance rating validation."""
        # Too low
        with pytest.raises(ValueError, match="between 1 and 5"):
            SailingSession(
                date=date(2024, 1, 15),
                location="Test",
                wind_speed_min=10,
                wind_speed_max=15,
                wave_type="Flat",
                wave_direction="N",
                hours_on_water=2,
                performance_rating=0,
                created_by=uuid4()
            )

        # Too high
        with pytest.raises(ValueError, match="between 1 and 5"):
            SailingSession(
                date=date(2024, 1, 15),
                location="Test",
                wind_speed_min=10,
                wind_speed_max=15,
                wave_type="Flat",
                wave_direction="N",
                hours_on_water=2,
                performance_rating=6,
                created_by=uuid4()
            )

    def test_session_weather_conditions(self):
        """Test weather condition methods."""
        # Heavy weather
        heavy_session = SailingSession(
            date=date(2024, 1, 15),
            location="Test",
            wind_speed_min=20,
            wind_speed_max=25,
            wave_type="Large",
            wave_direction="N",
            hours_on_water=2,
            performance_rating=3,
            created_by=uuid4()
        )
        assert heavy_session.is_heavy_weather() is True
        assert heavy_session.is_light_weather() is False

        # Light weather
        light_session = SailingSession(
            date=date(2024, 1, 15),
            location="Test",
            wind_speed_min=5,
            wind_speed_max=7,
            wave_type="Flat",
            wave_direction="N",
            hours_on_water=2,
            performance_rating=3,
            created_by=uuid4()
        )
        assert light_session.is_heavy_weather() is False
        assert light_session.is_light_weather() is True


class TestEquipmentEntity:
    """Test Equipment domain entity."""

    def test_equipment_creation_valid(self):
        """Test creating valid equipment."""
        equipment = Equipment(
            name="Competition Mainsail",
            type="Mainsail",
            manufacturer="North Sails",
            model="3Di RAW",
            owner_id=uuid4(),
            purchase_date=date(2023, 6, 1)
        )

        assert equipment.name == "Competition Mainsail"
        assert equipment.active is True
        assert equipment.age_in_days is not None
        assert equipment.age_in_days > 0

    def test_equipment_name_validation(self):
        """Test equipment name validation."""
        # Empty name
        with pytest.raises(ValueError, match="cannot be empty"):
            Equipment(
                name="",
                type="Mainsail",
                manufacturer="North",
                model="3Di",
                owner_id=uuid4()
            )

        # Name too long
        with pytest.raises(ValueError, match="too long"):
            Equipment(
                name="a" * 101,
                type="Mainsail",
                manufacturer="North",
                model="3Di",
                owner_id=uuid4()
            )

    def test_equipment_type_validation(self):
        """Test equipment type validation."""
        with pytest.raises(ValueError, match="Equipment type must be one of"):
            Equipment(
                name="Test",
                type="InvalidType",
                manufacturer="North",
                model="3Di",
                owner_id=uuid4()
            )

    def test_equipment_retirement(self):
        """Test equipment retirement and reactivation."""
        equipment = Equipment(
            name="Old Sail",
            type="Jib",
            manufacturer="Doyle",
            model="AP",
            owner_id=uuid4()
        )

        assert equipment.active is True

        equipment.retire()
        assert equipment.active is False

        equipment.reactivate()
        assert equipment.active is True

    def test_equipment_age_calculation(self):
        """Test equipment age calculation."""
        # Equipment with purchase date
        old_date = date.today().replace(year=date.today().year - 3)
        equipment = Equipment(
            name="Old Equipment",
            type="Mast",
            manufacturer="Selden",
            model="D+",
            owner_id=uuid4(),
            purchase_date=old_date
        )

        assert equipment.age_in_days > 1000  # More than ~3 years
        assert equipment.is_old(threshold_days=1000) is True
        assert equipment.is_old(threshold_days=2000) is False

        # Equipment without purchase date
        new_equipment = Equipment(
            name="New Equipment",
            type="Boom",
            manufacturer="Selden",
            model="D+",
            owner_id=uuid4()
        )

        assert new_equipment.age_in_days is None
        assert new_equipment.is_old() is False


class TestEquipmentSettingsEntity:
    """Test EquipmentSettings domain entity."""

    def test_settings_creation_valid(self):
        """Test creating valid equipment settings."""
        settings = EquipmentSettings(
            session_id=uuid4(),
            forestay_tension=7.5,
            shroud_tension=6.0,
            mast_rake=2.5,
            jib_halyard_tension="Medium",
            cunningham=4.0,
            outhaul=5.0,
            vang=6.0
        )

        assert settings.forestay_tension == 7.5
        assert settings.jib_halyard_tension == "Medium"
        assert settings.is_heavy_weather_setup() is False
        assert settings.is_light_weather_setup() is False

    def test_settings_tension_validation(self):
        """Test tension value validation."""
        # Tension too low
        with pytest.raises(ValueError, match="must be between 0 and 10"):
            EquipmentSettings(
                session_id=uuid4(),
                forestay_tension=-1,
                shroud_tension=6.0,
                mast_rake=2.5,
                jib_halyard_tension="Medium",
                cunningham=4.0,
                outhaul=5.0,
                vang=6.0
            )

        # Tension too high
        with pytest.raises(ValueError, match="must be between 0 and 10"):
            EquipmentSettings(
                session_id=uuid4(),
                forestay_tension=11,
                shroud_tension=6.0,
                mast_rake=2.5,
                jib_halyard_tension="Medium",
                cunningham=4.0,
                outhaul=5.0,
                vang=6.0
            )

    def test_settings_mast_rake_validation(self):
        """Test mast rake validation."""
        # Too far forward
        with pytest.raises(ValueError, match="between -5 and 30 degrees"):
            EquipmentSettings(
                session_id=uuid4(),
                forestay_tension=7.0,
                shroud_tension=6.0,
                mast_rake=-10,
                jib_halyard_tension="Medium",
                cunningham=4.0,
                outhaul=5.0,
                vang=6.0
            )

        # Too far back
        with pytest.raises(ValueError, match="between -5 and 30 degrees"):
            EquipmentSettings(
                session_id=uuid4(),
                forestay_tension=7.0,
                shroud_tension=6.0,
                mast_rake=35,
                jib_halyard_tension="Medium",
                cunningham=4.0,
                outhaul=5.0,
                vang=6.0
            )

    def test_settings_weather_setup_detection(self):
        """Test weather setup detection."""
        # Heavy weather setup
        heavy_settings = EquipmentSettings(
            session_id=uuid4(),
            forestay_tension=8.5,
            shroud_tension=8.0,
            mast_rake=1.0,
            jib_halyard_tension="Tight",
            cunningham=7.5,
            outhaul=8.0,
            vang=8.5
        )
        assert heavy_settings.is_heavy_weather_setup() is True
        assert heavy_settings.is_light_weather_setup() is False

        # Light weather setup
        light_settings = EquipmentSettings(
            session_id=uuid4(),
            forestay_tension=3.0,
            shroud_tension=3.5,
            mast_rake=4.0,
            jib_halyard_tension="Loose",
            cunningham=2.0,
            outhaul=3.0,
            vang=2.5
        )
        assert light_settings.is_heavy_weather_setup() is False
        assert light_settings.is_light_weather_setup() is True