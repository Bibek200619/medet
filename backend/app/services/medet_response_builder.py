from __future__ import annotations

from typing import Any

from backend.app.schemas.medet_response import (
    DEFAULT_INPUT_TYPE,
    DEFAULT_LANGUAGE,
    MedetResponse,
    normalize_sources,
)
from backend.app.services.emergency_detector import detect_emergency
from backend.app.services.healthcare_cards import build_healthcare_cards
from backend.app.services.language_support import get_doctor_suggestion_text
from backend.app.services.medical_safety_guard import guard_medical_response
from backend.app.services.voice_support import build_voice_metadata


def build_medet_response(
    ai_text: str,
    user_message: str | None = None,
    sources: list[dict[str, Any] | str] | None = None,
    suggest_doctor: bool | None = None,
    conversation_id: str | None = None,
    input_type: str = DEFAULT_INPUT_TYPE,
    language: str = DEFAULT_LANGUAGE,
) -> MedetResponse:
    """
    Attach healthcare metadata to a Medet answer.

    The emergency detector checks the user message first because escalation should
    not depend on whether the model explicitly repeats a warning phrase.
    """
    user_detection = detect_emergency(user_message)
    answer_detection = detect_emergency(ai_text)
    detection = user_detection if user_detection["emergency"] else answer_detection

    emergency = bool(detection["emergency"])
    safety = guard_medical_response(
        ai_text,
        user_message=user_message,
        emergency=emergency,
        language=language,
    )
    final_text = safety.response

    should_suggest_doctor = (
        emergency or safety.suggest_doctor
        if suggest_doctor is None
        else bool(suggest_doctor or emergency or safety.suggest_doctor)
    )

    if suggest_doctor and not emergency:
        final_text = _append_once(final_text, get_doctor_suggestion_text(language))

    cards = build_healthcare_cards(
        response=final_text,
        user_message=user_message,
        emergency=emergency,
        severity=str(detection["severity"]),
        suggest_doctor=should_suggest_doctor,
        medical_warning=safety.medical_warning,
        trust_level=safety.trust_level,
        language=language,
    )

    return MedetResponse(
        response=final_text,
        input_type=input_type,
        language=language,
        emergency=emergency,
        severity=str(detection["severity"]),
        reason=detection["reason"] if isinstance(detection["reason"], str) else None,
        medical_warning=safety.medical_warning,
        trust_level=safety.trust_level,
        suggest_doctor=should_suggest_doctor,
        cards=cards,
        sources=normalize_sources(sources),
        voice=build_voice_metadata(
            input_type=input_type,
            language=language,
            transcript=user_message,
            response_text=final_text,
        ),
        **({"conversation_id": conversation_id} if conversation_id else {}),
    )


def _append_once(text: str, addition: str) -> str:
    if addition in text:
        return text
    if not text:
        return addition
    return f"{text}\n\n{addition}"
