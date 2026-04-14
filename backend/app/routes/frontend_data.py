from __future__ import annotations

from typing import Any

from fastapi import APIRouter


router = APIRouter(tags=["frontend-data"])

_profiles: dict[str, dict[str, Any]] = {}
_reminders: dict[str, dict[str, Any]] = {}


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
    del lat, lng
    return []
