from backend.app.services.medet_response_builder import build_medet_response


def test_emergency_response_adds_escalation_metadata() -> None:
    result = build_medet_response(
        ai_text="Please stay calm and keep the person sitting.",
        user_message="My mother has chest pain and cold sweat.",
    )

    assert result.emergency is True
    assert result.severity == "high"
    assert result.suggest_doctor is True
    assert "medical help immediately" in result.response


def test_regular_response_keeps_schema_low_risk() -> None:
    result = build_medet_response(
        ai_text="Drink clean fluids and rest. Tell me if fever starts.",
        user_message="Mild headache after working in sun.",
        conversation_id="test-conversation",
    )

    response_dict = result.model_dump() if hasattr(result, "model_dump") else result.dict()

    assert response_dict == {
        "response": "Drink clean fluids and rest. Tell me if fever starts.",
        "input_type": "text",
        "language": "en",
        "emergency": False,
        "severity": "low",
        "reason": None,
        "suggest_doctor": False,
        "sources": [],
        "conversation_id": "test-conversation",
        "voice": None,
    }


def test_voice_response_includes_voice_metadata() -> None:
    result = build_medet_response(
        ai_text="Please stay calm. Tell me how long this has been happening.",
        user_message="Mujhe bukhar hai",
        conversation_id="voice-conversation",
        input_type="voice",
        language="hi",
    )

    assert result.input_type == "voice"
    assert result.language == "hi"
    assert result.voice is not None
    assert result.voice.speech_to_text_status == "transcript_provided"
    assert result.voice.transcript == "Mujhe bukhar hai"
    assert result.voice.transcript_language == "hi"
    assert result.voice.voice_locale == "hi-IN"
    assert result.voice.audio_status == "not_generated"
    assert result.voice.audio_url is None
    assert result.voice.tts_text == result.response
