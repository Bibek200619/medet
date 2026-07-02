from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_phone_auth_session_lifecycle() -> None:
    sign_in = client.post(
        "/auth/phone",
        json={"name": "Anita", "phone": "+91 90000 00000"},
    )

    assert sign_in.status_code == 200
    session = sign_in.json()
    assert session["user"]["name"] == "Anita"
    assert session["user"]["phone"] == "+91 90000 00000"
    assert session["user"]["provider"] == "phone"
    assert session["accessToken"]

    current = client.get(
        "/auth/session",
        headers={"Authorization": f"Bearer {session['accessToken']}"},
    )
    assert current.status_code == 200
    assert current.json()["user"]["id"] == session["user"]["id"]

    logout = client.post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {session['accessToken']}"},
    )
    assert logout.status_code == 200
    assert logout.json() == {"ok": True}

    expired = client.get(
        "/auth/session",
        headers={"Authorization": f"Bearer {session['accessToken']}"},
    )
    assert expired.status_code == 401


def test_google_demo_session_matches_frontend_contract() -> None:
    response = client.post("/auth/google/session")

    assert response.status_code == 200
    session = response.json()
    assert session["user"]["provider"] == "google"
    assert session["user"]["email"] == "demo@medet.local"
    assert session["accessToken"]


def test_clinics_returns_seeded_facilities() -> None:
    response = client.get("/clinics")

    assert response.status_code == 200
    facilities = response.json()
    assert len(facilities) >= 4
    assert {item["type"] for item in facilities} >= {
        "clinic",
        "hospital",
        "health_center",
        "pharmacy",
    }
    assert all(item["phone"] for item in facilities)


def test_clinics_sorts_by_location_distance() -> None:
    response = client.get("/clinics?lat=23.318&lng=77.393")

    assert response.status_code == 200
    facilities = response.json()
    distances = [float(item["distance"].split()[0]) for item in facilities]
    assert distances == sorted(distances)
    assert facilities[0]["id"] == "clinic-jan-aushadhi"
