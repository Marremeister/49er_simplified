"""Simple API testing script to demonstrate API usage."""
import asyncio
import httpx
from datetime import date
from typing import Optional


class SailingPlatformAPI:
    """Simple API client for the Sailing Platform."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.client = httpx.AsyncClient()

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def register(self, email: str, username: str, password: str) -> dict:
        """Register a new user."""
        response = await self.client.post(
            f"{self.base_url}/api/auth/register",
            json={
                "email": email,
                "username": username,
                "password": password
            }
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        return data

    async def login(self, username: str, password: str) -> dict:
        """Login with username and password."""
        response = await self.client.post(
            f"{self.base_url}/api/auth/login",
            json={
                "username": username,
                "password": password
            }
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        return data

    async def get_current_user(self) -> dict:
        """Get current user information."""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = await self.client.get(
            f"{self.base_url}/api/auth/me",
            headers=headers
        )
        response.raise_for_status()
        return response.json()

    async def create_session(self, session_data: dict) -> dict:
        """Create a new sailing session."""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = await self.client.post(
            f"{self.base_url}/api/sessions",
            json=session_data,
            headers=headers
        )
        response.raise_for_status()
        return response.json()

    async def get_sessions(self) -> list:
        """Get all sessions for the current user."""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = await self.client.get(
            f"{self.base_url}/api/sessions",
            headers=headers
        )
        response.raise_for_status()
        return response.json()

    async def create_equipment(self, equipment_data: dict) -> dict:
        """Create new equipment."""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = await self.client.post(
            f"{self.base_url}/api/equipment",
            json=equipment_data,
            headers=headers
        )
        response.raise_for_status()
        return response.json()

    async def get_equipment(self, active_only: bool = True) -> list:
        """Get all equipment for the current user."""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = await self.client.get(
            f"{self.base_url}/api/equipment",
            params={"active_only": active_only},
            headers=headers
        )
        response.raise_for_status()
        return response.json()

    async def create_equipment_settings(self, session_id: str, settings_data: dict) -> dict:
        """Create equipment settings for a session."""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = await self.client.post(
            f"{self.base_url}/api/sessions/{session_id}/settings",
            json=settings_data,
            headers=headers
        )
        response.raise_for_status()
        return response.json()

    async def get_performance_analytics(self) -> dict:
        """Get performance analytics."""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = await self.client.get(
            f"{self.base_url}/api/sessions/analytics/performance",
            headers=headers
        )
        response.raise_for_status()
        return response.json()


async def main():
    """Run API tests."""
    api = SailingPlatformAPI()

    try:
        print("🚀 Testing Sailing Platform API\n")

        # 1. Register a new user
        print("1️⃣ Registering new user...")
        try:
            user_data = await api.register(
                email="apitest@example.com",
                username="apitest",
                password="testpass123"
            )
            print(f"   ✅ User registered: {user_data['user']['username']}")
        except httpx.HTTPStatusError:
            # User might already exist, try login
            print("   ⚠️ User already exists, logging in...")
            await api.login("apitest", "testpass123")
            print("   ✅ Logged in successfully")

        # 2. Get current user
        print("\n2️⃣ Getting current user...")
        current_user = await api.get_current_user()
        print(f"   ✅ Current user: {current_user['username']} ({current_user['email']})")

        # 3. Create equipment
        print("\n3️⃣ Creating equipment...")
        equipment_items = [
            {
                "name": "API Test Mainsail",
                "type": "Mainsail",
                "manufacturer": "North Sails",
                "model": "3Di Test",
                "purchase_date": "2024-01-01",
                "notes": "Created via API test"
            },
            {
                "name": "API Test Jib",
                "type": "Jib",
                "manufacturer": "Quantum",
                "model": "Fusion Test",
                "purchase_date": "2024-01-01"
            }
        ]

        for eq_data in equipment_items:
            equipment = await api.create_equipment(eq_data)
            print(f"   ✅ Created: {equipment['name']} ({equipment['type']})")

        # 4. List equipment
        print("\n4️⃣ Listing equipment...")
        equipment_list = await api.get_equipment()
        print(f"   ✅ Total equipment: {len(equipment_list)}")
        for eq in equipment_list:
            print(f"      - {eq['name']} ({eq['type']}) - {'Active' if eq['active'] else 'Retired'}")

        # 5. Create sailing sessions
        print("\n5️⃣ Creating sailing sessions...")
        sessions = [
            {
                "date": str(date.today()),
                "location": "API Test Bay",
                "wind_speed_min": 12,
                "wind_speed_max": 18,
                "wave_type": "Choppy",
                "wave_direction": "NW",
                "hours_on_water": 3.5,
                "performance_rating": 4,
                "notes": "Great conditions for testing"
            },
            {
                "date": str(date.today()),
                "location": "API Test Marina",
                "wind_speed_min": 8,
                "wind_speed_max": 12,
                "wave_type": "Flat",
                "wave_direction": "N",
                "hours_on_water": 4.0,
                "performance_rating": 5,
                "notes": "Light wind practice"
            }
        ]

        created_sessions = []
        for session_data in sessions:
            session = await api.create_session(session_data)
            created_sessions.append(session)
            print(f"   ✅ Created session at {session['location']} - "
                  f"Wind: {session['wind_speed_min']}-{session['wind_speed_max']} knots")

        # 6. Add equipment settings to first session
        print("\n6️⃣ Adding equipment settings...")
        settings_data = {
            "forestay_tension": 6.5,
            "shroud_tension": 5.5,
            "mast_rake": 3.0,
            "jib_halyard_tension": "Medium",
            "cunningham": 4.0,
            "outhaul": 5.0,
            "vang": 6.0
        }

        settings = await api.create_equipment_settings(
            created_sessions[0]['id'],
            settings_data
        )
        print(f"   ✅ Added settings to session: Forestay={settings['forestay_tension']}, "
              f"Mast rake={settings['mast_rake']}°")

        # 7. List sessions
        print("\n7️⃣ Listing sessions...")
        session_list = await api.get_sessions()
        print(f"   ✅ Total sessions: {len(session_list)}")
        for s in session_list[:5]:  # Show first 5
            print(f"      - {s['date']} at {s['location']} - "
                  f"Performance: {'⭐' * s['performance_rating']}")

        # 8. Get performance analytics
        print("\n8️⃣ Getting performance analytics...")
        analytics = await api.get_performance_analytics()
        print(f"   ✅ Analytics summary:")
        print(f"      - Total sessions: {analytics['total_sessions']}")
        print(f"      - Total hours: {analytics['total_hours']}")
        print(f"      - Average performance: {analytics['average_performance']:.1f}/5")

        if analytics['performance_by_conditions']:
            print("      - Performance by conditions:")
            for condition, rating in analytics['performance_by_conditions'].items():
                print(f"        • {condition}: {rating:.1f}/5")

        if analytics['sessions_by_location']:
            print("      - Sessions by location:")
            for location, count in analytics['sessions_by_location'].items():
                print(f"        • {location}: {count} sessions")

        print("\n✅ All API tests completed successfully!")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
    finally:
        await api.close()


if __name__ == "__main__":
    print("=" * 50)
    print("Sailing Platform API Test Script")
    print("=" * 50)
    print("\nMake sure the API is running at http://localhost:8000")
    print("Run with: python test_api.py\n")

    asyncio.run(main())