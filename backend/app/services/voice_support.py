from __future__ import annotations

from backend.app.schemas.medet_response import (
    DEFAULT_INPUT_TYPE,
    MedetVoiceMetadata,
)
from backend.app.services.language_support import get_language_profile


VOICE_INPUT_TYPE = "voice"


def build_voice_metadata(
    *,
    input_type: str = DEFAULT_INPUT_TYPE,
    language: str,
    transcript: str | None,
    response_text: str,
) -> MedetVoiceMetadata | None:
    """
    Prepare voice interaction metadata without generating audio.

    The frontend can treat `transcript` as speech-to-text output and `tts_text`
    as the future text-to-speech source. Audio generation is deliberately left
    for a later integration.
    """
    if input_type != VOICE_INPUT_TYPE:
        return None

    language_profile = get_language_profile(language)
    return MedetVoiceMetadata(
        interaction_mode="voice_first",
        speech_to_text_status="transcript_provided",
        transcript=transcript,
        transcript_language=language,
        voice_locale=language_profile.speech_locale,
        tts_text=response_text,
        audio_status="not_generated",
        audio_url=None,
    )
