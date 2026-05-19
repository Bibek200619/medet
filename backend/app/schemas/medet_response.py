from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class MedetResponse(BaseModel):
    response: str
    emergency: bool = False
    severity: str = "low"
    reason: str | None = None
    suggest_doctor: bool = False
    sources: list[dict[str, Any] | str] = Field(default_factory=list)


class MedetChatRequest(BaseModel):
    message: str
    language: str | None = None
    conversation_id: str | None = None
    stream: bool = False
