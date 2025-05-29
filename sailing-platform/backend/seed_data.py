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
            ("Competition Mainsail", "Mainsail", "North Sails", "3Di RAW 760", date(2023, 6, 1)),
            ("Training Mainsail", "Mainsail", "Doyle", "Stratis ICE", date(2022, 3, 15)),
            ("Heavy Weather Jib", "Jib", "North Sails", "3Di RAW", date(2023, 6, 1)),
            ("Light Air Jib", "Jib", "Quantum", "Fusion M", date(2023, 8, 10)),
            ("Carbon Mast", "Mast", "Southern Spars", "M2", date(2021, 1, 20)),
            ("Competition Boom", "Boom", "Southern Spars", "B2", date(2021, 1, 20)),
            ("Training Rudder", "Rudder", "C-Tech", "Olympic", date(2022, 5, 1)),
            ("Race Centerboard", "Centerboard", "C-Tech", "Olympic Pro", date(2023, 2, 15))
        ]

        for user in users[1:]:  # Skip admin, add equipment to regular users
            user_equipment = []
            for i, (name, eq_type, manufacturer, model, purchase_date) in enumerate(equipment_types[:4]):
                equipment = Equipment(
                    name=f"{name} - {user.username}",
                    type=eq_type,
                    manufacturer=manufacturer,
                    model=model,
                    purchase_date=purchase_date,
                    notes=f"Equipment for {user.username}",
                    owner_id=user.id
                )
                created_eq = await equipment_repo.create(equipment)
                user_equipment.append(created_eq)
                print(f"  ✓ Created {eq_type} for {user.username}")

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
        for user in users[1:]:  # Skip admin
            # Create sessions for the past 30 days
            for days_ago in range(0, 30, 3):
                session_date = date.today() - timedelta(days=days_ago)
                location = locations[days_ago % len(locations)]
                condition = conditions[days_ago % len(conditions)]

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
                    created_by=user.id
                )

                created_session = await session_repo.create(sailing_session)
                session_count += 1

                # Add equipment settings for some sessions
                if days_ago % 6 == 0:  # Every other session
                    settings = EquipmentSettings(
                        session_id=created_session.id,
                        forestay_tension=7.5 if condition[0] > 15 else 5.0,
                        shroud_tension=6.0 if condition[0] > 15 else 4.5,
                        mast_rake=2.5 if condition[0] > 15 else 3.5,
                        jib_halyard_tension="Tight" if condition[0] > 15 else "Medium",
                        cunningham=6.0 if condition[0] > 15 else 3.0,
                        outhaul=7.0 if condition[0] > 15 else 4.0,
                        vang=8.0 if condition[0] > 15 else 5.0
                    )
                    await session_repo.create_settings(settings)

            print(f"  ✓ Created 10 sessions for {user.username}")

        # Commit all changes
        await session.commit()

        print(f"\n✅ Database seeding completed!")
        print(f"   - Users created: {len(users)}")
        print(f"   - Equipment items created: {len(users[1:]) * 4}")
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

        # Delete in correct order due to foreign keys
        await session.execute("DELETE FROM equipment_settings")
        await session.execute("DELETE FROM sessions")
        await session.execute("DELETE FROM equipment")
        await session.execute("DELETE FROM users")

        await session.commit()

    print("✅ Database cleared")


async def main():
    """Main function to run the seed script."""
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        await clear_database()
    else:
        # Clear and then seed
        await clear_database()
        await seed_database()


if __name__ == "__main__":
    asyncio.run(main())