from backend.app.services.language_support import (
    build_multilingual_prompt_context,
    get_emergency_escalation_text,
    get_followup_text,
    get_language_profile,
)


def test_language_profile_exposes_speech_locale() -> None:
    profile = get_language_profile("kn")

    assert profile.code == "kn"
    assert profile.native_name == "ಕನ್ನಡ"
    assert profile.speech_locale == "kn-IN"


def test_multilingual_prompt_context_keeps_target_language() -> None:
    context = build_multilingual_prompt_context(
        message="मुझे बुखार है",
        language="hi",
        input_type="voice",
    )

    assert context.language == "hi"
    assert context.native_name == "हिंदी"
    assert "Keep the response in हिंदी" in context.system_instruction
    assert "speech-to-text" in context.system_instruction
    assert context.user_message == "मुझे बुखार है"


def test_language_specific_response_templates() -> None:
    assert "कृपया" in get_followup_text("hi")
    assert "জরুরি" in get_emergency_escalation_text("bn")
