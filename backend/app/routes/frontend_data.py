from __future__ import annotations

from math import asin, cos, radians, sin, sqrt
from typing import Any

from fastapi import APIRouter


router = APIRouter(tags=["frontend-data"])

_profiles: dict[str, dict[str, Any]] = {}
_reminders: dict[str, dict[str, Any]] = {}
_clinics: list[dict[str, Any]] = [
    {
        "id": "clinic-bhanpur-primary",
        "name": "Bhanpur Primary Health Centre",
        "type": "health_center",
        "distance": "3.2 km",
        "travelTime": "12 min",
        "address": "Main Road, Bhanpur village, Madhya Pradesh",
        "phone": "+917555010101",
        "isOpen": True,
        "rating": 4.6,
        "latitude": 23.3104,
        "longitude": 77.3856,
    },
    {
        "id": "clinic-asha-care",
        "name": "Asha Community Clinic",
        "type": "clinic",
        "distance": "5.1 km",
        "travelTime": "18 min",
        "address": "Near Gram Panchayat, Kotra Road",
        "phone": "+917555010102",
        "isOpen": True,
        "rating": 4.4,
        "latitude": 23.3262,
        "longitude": 77.4011,
    },
    {
        "id": "clinic-district-hospital",
        "name": "District Civil Hospital",
        "type": "hospital",
        "distance": "11.8 km",
        "travelTime": "32 min",
        "address": "Hospital Chowk, Sehore district",
        "phone": "+917555010103",
        "isOpen": True,
        "rating": 4.2,
        "latitude": 23.205,
        "longitude": 77.0851,
    },
    {
        "id": "clinic-jan-aushadhi",
        "name": "Jan Aushadhi Pharmacy",
        "type": "pharmacy",
        "distance": "2.4 km",
        "travelTime": "9 min",
        "address": "Bus stand market, Bhanpur",
        "phone": "+917555010104",
        "isOpen": False,
        "rating": 4.1,
        "latitude": 23.3181,
        "longitude": 77.3929,
    },
]


@router.get("/profiles")
async def list_profiles() -> list[dict[str, Any]]:
    return list(_profiles.values())


@router.put("/profiles/{profile_id}")
async def upsert_profile(profile_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    profile = {**payload, "id": profile_id}
    _profiles[profile_id] = profile
    return profile


@router.get("/reminders")
async def list_reminders() -> list[dict[str, Any]]:
    return list(_reminders.values())


@router.put("/reminders/{reminder_id}")
async def upsert_reminder(reminder_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    reminder = {**payload, "id": reminder_id}
    _reminders[reminder_id] = reminder
    return reminder


@router.get("/clinics")
async def list_clinics(lat: float | None = None, lng: float | None = None) -> list[dict[str, Any]]:
    if lat is None or lng is None:
        return _clinics

    facilities = []
    for clinic in _clinics:
        distance = _distance_km(lat, lng, clinic["latitude"], clinic["longitude"])
        travel_minutes = max(5, round(distance / 18 * 60))
        facilities.append(
            {
                **clinic,
                "distance": f"{distance:.1f} km",
                "travelTime": f"{travel_minutes} min",
            }
        )
    return sorted(facilities, key=lambda item: float(str(item["distance"]).split()[0]))


def _distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius_km = 6371.0
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    value = sin(d_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(d_lng / 2) ** 2
    return 2 * radius_km * asin(sqrt(value))
