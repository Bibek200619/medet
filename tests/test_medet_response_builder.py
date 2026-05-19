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
        "emergency": False,
        "severity": "low",
        "reason": None,
        "suggest_doctor": False,
        "sources": [],
        "conversation_id": "test-conversation",
    }
