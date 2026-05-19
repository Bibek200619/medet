from __future__ import annotations

from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


SUPPORTED_LANGUAGES = {"en", "hi", "bn", "ne", "ta", "kn"}
DEFAULT_LANGUAGE = "en"


class MedetSource(BaseModel):
    title: str | None = None
    url: str | None = None
    snippet: str | None = None
    source_type: str = "tavily"


class MedetResponse(BaseModel):
    response: str
    emergency: bool = False
    severity: str = "low"
    reason: str | None = None
    suggest_doctor: bool = False
    sources: list[MedetSource] = Field(default_factory=list)
    conversation_id: str = Field(default_factory=lambda: str(uuid4()))


class MedetChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    language: str = DEFAULT_LANGUAGE
    conversation_id: str | None = None
    stream: bool = False

    @field_validator("message")
    @classmethod
    def message_must_not_be_empty(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Message cannot be empty.")
        return cleaned

    @field_validator("language")
    @classmethod
    def language_must_be_supported(cls, value: str | None) -> str:
        language = (value or DEFAULT_LANGUAGE).strip().lower()
        if language not in SUPPORTED_LANGUAGES:
            supported = ", ".join(sorted(SUPPORTED_LANGUAGES))
            raise ValueError(f"Unsupported language. Use one of: {supported}.")
        return language


class MedetErrorDetail(BaseModel):
    code: str
    message: str
    retryable: bool = False
    field: str | None = None


class MedetErrorResponse(BaseModel):
    error: MedetErrorDetail
    conversation_id: str | None = None


def normalize_sources(sources: list[dict[str, Any] | str] | None) -> list[MedetSource]:
    normalized: list[MedetSource] = []
    for source in sources or []:
        if isinstance(source, str):
            normalized.append(MedetSource(title=source, snippet=source))
            continue

        normalized.append(
            MedetSource(
                title=_optional_str(source.get("title") or source.get("name")),
                url=_optional_str(source.get("url") or source.get("link")),
                snippet=_optional_str(
                    source.get("snippet")
                    or source.get("content")
                    or source.get("description")
                ),
                source_type=_optional_str(source.get("source_type")) or "tavily",
            )
        )
    return normalized


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
