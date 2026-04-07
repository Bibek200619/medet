from __future__ import annotations

from dataclasses import dataclass

from backend.app.schemas.medet_response import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES


@dataclass(frozen=True)
class LanguageProfile:
    code: str
    display_name: str
    speech_locale: str
    prompt_hint: str


LANGUAGE_PROFILES: dict[str, LanguageProfile] = {
    "en": LanguageProfile("en", "English", "en-IN", "Respond in simple English."),
    "hi": LanguageProfile("hi", "Hindi", "hi-IN", "Respond in simple Hindi when translation is enabled."),
    "bn": LanguageProfile("bn", "Bengali", "bn-IN", "Respond in simple Bengali when translation is enabled."),
    "ne": LanguageProfile("ne", "Nepali", "ne-NP", "Respond in simple Nepali when translation is enabled."),
    "ta": LanguageProfile("ta", "Tamil", "ta-IN", "Respond in simple Tamil when translation is enabled."),
    "kn": LanguageProfile("kn", "Kannada", "kn-IN", "Respond in simple Kannada when translation is enabled."),
}


def get_language_profile(language: str | None) -> LanguageProfile:
    code = (language or DEFAULT_LANGUAGE).lower()
    if code not in SUPPORTED_LANGUAGES:
        code = DEFAULT_LANGUAGE
    return LANGUAGE_PROFILES[code]
