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
    assert [card.type for card in result.cards] == [
        "emergency",
        "action",
        "doctor_visit",
        "symptom_warning",
    ]


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
        "medical_warning": False,
        "trust_level": "safe",
        "suggest_doctor": False,
        "cards": [
            {
                "type": "action",
                "title": "Recommended Action",
                "content": "Rest in a safe place, keep the person comfortable, and watch symptoms closely.",
            },
            {
                "type": "hydration",
                "title": "Fluids",
                "content": "Drink clean water or oral rehydration fluid in small sips, especially with fever, vomiting, loose motion, or heat.",
            },
            {
                "type": "followup",
                "title": "Follow Up",
                "content": "Tell me the person’s age, how long this has been happening, and whether symptoms are getting better or worse.",
            },
        ],
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


def test_unsafe_ai_response_is_guarded() -> None:
    result = build_medet_response(
        ai_text="You definitely have an infection. Take antibiotic 500mg twice daily.",
        user_message="I have fever",
        conversation_id="safety-conversation",
    )

    assert result.medical_warning is True
    assert result.trust_level == "guarded"
    assert result.suggest_doctor is True
    assert "definitely have" not in result.response.lower()
    assert "500mg" not in result.response.lower()
    assert "cannot diagnose" in result.response.lower()
    assert "medication" in [card.type for card in result.cards]
    assert "doctor_visit" in [card.type for card in result.cards]


def test_emergency_response_keeps_safe_trust_metadata() -> None:
    result = build_medet_response(
        ai_text="Please stay calm and sit upright.",
        user_message="I have chest pain and cannot breathe",
        conversation_id="emergency-conversation",
    )

    assert result.emergency is True
    assert result.medical_warning is False
    assert result.trust_level == "safe"
    assert result.suggest_doctor is True
    assert "medical help immediately" in result.response
    assert result.cards[0].type == "emergency"
