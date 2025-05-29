"""Seed data script to populate the database with sample data."""
import asyncio
from datetime import date, timedelta
from uuid import uuid4

from app.infrastructure.database.connection import AsyncSessionLocal, create_tables
from app.infrastructure.database.repositories.user_repository_impl import UserRepository
from app.infrastructure.database.repositories.session_repository_impl import SessionRepository
from app.infrastructure.database.repositories.equipment_repository_impl import EquipmentRepository
from app.infrastructure.security.password_hasher import PasswordHasher
from app.domain.entities.user import User
from app.domain.entities.session import SailingSession
from app.domain.entities.equipment import Equipment, EquipmentSettings


async def seed_database():
    """Seed the database with sample data."""
    print("🌱 Starting database seeding...")

    # Create tables
    await create_tables()
    print("✅ Database tables created")

    async with AsyncSessionLocal() as session:
        # Initialize repositories
        user_repo = UserRepository(session)
        session_repo = SessionRepository(session)
        equipment_repo = EquipmentRepository(session)
        password_hasher = PasswordHasher()

        # Create sample users
        print("\n👤 Creating users...")
        users = []

        # Admin user
        admin_user = User(
            email="admin@example.com",
            username="admin",
            hashed_password=password_hasher.hash_password("admin123")
        )
        admin = await user_repo.create(admin_user)
        users.append(admin)
        print(f"  ✓ Created admin user: {admin.username}")

        # Sample sailors
        sailor_data = [
            ("john@example.com", "johndoe", "John Doe"),
            ("jane@example.com", "janesailor", "Jane Sailor"),
            ("mike@example.com", "mikecrew", "Mike Crew")
        ]

        for email, username, name in sailor_data:
            user = User(
                email=email,
                username=username,
                hashed_password=password_hasher.hash_password("password123")
            )
            created_user = await user_repo.create(user)
            users.append(created_user)
            print(f"  ✓ Created user: {username}")

        # Create equipment for users
        print("\n🛠️ Creating equipment...")
        equipment_types = [
            ("Competition Mainsail", "Mainsail", "North Sails", "3Di RAW 760", date(2023, 6, 1), 120.5),
            ("Training Mainsail", "Mainsail", "Doyle", "Stratis ICE", date(2022, 3, 15), 245.0),
            ("Heavy Weather Jib", "Jib", "North Sails", "3Di RAW", date(2023, 6, 1), 98.0),
            ("Light Air Jib", "Jib", "Quantum", "Fusion M", date(2023, 8, 10), 67.5),
            ("Racing Gennaker", "Gennaker", "North Sails", "A2", date(2023, 9, 1), 45.0),
            ("Carbon Mast", "Mast", "Southern Spars", "M2", date(2021, 1, 20), 380.0),
            ("Competition Boom", "Boom", "Southern Spars", "B2", date(2021, 1, 20), 380.0),
            ("Training Rudder", "Rudder", "C-Tech", "Olympic", date(2022, 5, 1), 195.0),
            ("Race Centerboard", "Centerboard", "C-Tech", "Olympic Pro", date(2023, 2, 15), 140.0)
        ]

        for user in users[1:]:  # Skip admin, add equipment to regular users
            user_equipment = []
            for i, (name, eq_type, manufacturer, model, purchase_date, wear) in enumerate(equipment_types[:5]):
                equipment = Equipment(
                    name=f"{name} - {user.username}",
                    type=eq_type,
                    manufacturer=manufacturer,
                    model=model,
                    purchase_date=purchase_date,
                    notes=f"Equipment for {user.username}",
                    wear=wear,  # Add some wear hours
                    owner_id=user.id
                )
                created_eq = await equipment_repo.create(equipment)
                user_equipment.append(created_eq)
                print(f"  ✓ Created {eq_type} for {user.username} (wear: {wear}h)")

        # Create sailing sessions
        print("\n⛵ Creating sailing sessions...")
        locations = ["San Francisco Bay", "Berkeley Marina", "Richmond", "Alameda"]
        conditions = [
            (8, 12, "Flat", "N", 3.5, 4),  # Light conditions
            (12, 18, "Choppy", "NW", 4.0, 5),  # Medium conditions
            (18, 25, "Medium", "W", 3.0, 3),  # Heavy conditions
            (10, 15, "Choppy", "SW", 3.5, 4),  # Standard conditions
            (15, 22, "Large", "W", 2.5, 4),  # Challenging conditions
        ]

        session_count = 0
        user_equipment = {}  # Store equipment for each user

        # Get equipment for each user
        for user in users[1:]:  # Skip admin
            user_equipment[user.id] = await equipment_repo.get_by_user(user.id, active_only=True)

        for user in users[1:]:  # Skip admin
            user_eq = user_equipment[user.id]

            # Create sessions for the past 30 days
            for days_ago in range(0, 30, 3):
                session_date = date.today() - timedelta(days=days_ago)
                location = locations[days_ago % len(locations)]
                condition = conditions[days_ago % len(conditions)]

                # Select equipment for this session
                equipment_ids = []

                # Always use a mainsail and jib if available
                mainsails = [eq for eq in user_eq if eq.type == "Mainsail"]
                jibs = [eq for eq in user_eq if eq.type == "Jib"]

                if mainsails:
                    equipment_ids.append(mainsails[0].id)
                if jibs:
                    equipment_ids.append(jibs[0].id)

                # Sometimes add a gennaker (in light conditions)
                if condition[0] < 12:  # Light wind
                    gennakers = [eq for eq in user_eq if eq.type == "Gennaker"]
                    if gennakers:
                        equipment_ids.append(gennakers[0].id)

                sailing_session = SailingSession(
                    date=session_date,
                    location=location,
                    wind_speed_min=condition[0],
                    wind_speed_max=condition[1],
                    wave_type=condition[2],
                    wave_direction=condition[3],
                    hours_on_water=condition[4],
                    performance_rating=condition[5],
                    notes=f"Session on {session_date} at {location}",
                    equipment_ids=equipment_ids,  # Add equipment to session
                    created_by=user.id
                )

                created_session = await session_repo.create(sailing_session)
                session_count += 1

                # Add equipment settings for some sessions
                if days_ago % 6 == 0:  # Every other session
                    # Heavy weather settings
                    if condition[0] > 15:
                        settings = EquipmentSettings(
                            session_id=created_session.id,
                            forestay_tension=7.5,
                            shroud_tension=6.0,
                            mast_rake=2.5,
                            main_tension=7.0,
                            cap_tension=8.0,
                            cap_hole=3.0,
                            lowers_scale=6.5,
                            mains_scale=7.5,
                            pre_bend=25.0,
                            jib_halyard_tension="Tight",
                            cunningham=6.0,
                            outhaul=7.0,
                            vang=8.0
                        )
                    else:
                        # Light weather settings
                        settings = EquipmentSettings(
                            session_id=created_session.id,
                            forestay_tension=5.0,
                            shroud_tension=4.5,
                            mast_rake=3.5,
                            main_tension=4.0,
                            cap_tension=4.5,
                            cap_hole=1.0,
                            lowers_scale=4.0,
                            mains_scale=4.5,
                            pre_bend=15.0,
                            jib_halyard_tension="Medium",
                            cunningham=3.0,
                            outhaul=4.0,
                            vang=5.0
                        )
                    await session_repo.create_settings(settings)

            print(f"  ✓ Created 10 sessions for {user.username}")

        # Commit all changes
        await session.commit()

        print(f"\n✅ Database seeding completed!")
        print(f"   - Users created: {len(users)}")
        print(f"   - Equipment items created: {len(users[1:]) * 5}")
        print(f"   - Sessions created: {session_count}")
        print(f"\n🔑 Login credentials:")
        print(f"   Admin: username='admin', password='admin123'")
        print(f"   Users: username='johndoe'/'janesailor'/'mikecrew', password='password123'")


async def clear_database():
    """Clear all data from the database."""
    print("🗑️ Clearing database...")

    async with AsyncSessionLocal() as session:
        # Import models to ensure they're registered
        from app.infrastructure.database.models import User, Session, Equipment, EquipmentSettings
        from sqlalchemy import text

        # Try to delete from each table, but ignore if table doesn't exist
        tables_to_clear = [
            "equipment_settings",
            "session_equipment",
            "sessions",
            "equipment",
            "users"
        ]

        for table in tables_to_clear:
            try:
                await session.execute(text(f"DELETE FROM {table}"))
                await session.commit()
            except Exception as e:
                # Table doesn't exist, that's ok
                await session.rollback()
                continue

    print("✅ Database cleared")


async def main():
    """Main function to run the seed script."""
    import sys
    import os

    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        # Just clear if explicitly requested
        await clear_database()
    else:
        # Check if database file exists
        db_file = "sailing_platform.db"
        if os.path.exists(db_file):
            print(f"Database file {db_file} exists")
            try:
                # Try to clear existing data
                await clear_database()
            except Exception as e:
                print(f"Could not clear database: {e}")
                print("Creating fresh tables...")
        else:
            print(f"No existing database found at {db_file}")

        # Always seed the database
        await seed_database()


if __name__ == "__main__":
    asyncio.run(main())