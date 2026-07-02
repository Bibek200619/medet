from __future__ import annotations

from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from typing import Any

from fastapi import APIRouter, Header, HTTPException


router = APIRouter(prefix="/auth", tags=["auth"])

_sessions: dict[str, dict[str, Any]] = {}


def _new_session(user: dict[str, Any]) -> dict[str, Any]:
    token = token_urlsafe(24)
    session = {
        "user": user,
        "accessToken": token,
        "expiresAt": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    }
    _sessions[token] = session
    return session


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


@router.post("/phone")
async def sign_in_phone(payload: dict[str, Any]) -> dict[str, Any]:
    phone = str(payload.get("phone") or "").strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required.")

    name = str(payload.get("name") or "").strip() or "MEDET User"
    user = {
        "id": f"phone-{''.join(char for char in phone if char.isalnum()) or token_urlsafe(6)}",
        "name": name,
        "phone": phone,
        "provider": "phone",
    }
    return _new_session(user)


@router.post("/google/session")
async def sign_in_google() -> dict[str, Any]:
    user = {
        "id": "google-demo-user",
        "name": "MEDET Demo User",
        "email": "demo@medet.local",
        "provider": "google",
    }
    return _new_session(user)


@router.get("/session")
async def get_session(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = _bearer_token(authorization)
    if not token or token not in _sessions:
        raise HTTPException(status_code=401, detail="Session not found.")
    return _sessions[token]


@router.post("/logout")
async def logout(authorization: str | None = Header(default=None)) -> dict[str, bool]:
    token = _bearer_token(authorization)
    if token:
        _sessions.pop(token, None)
    return {"ok": True}
