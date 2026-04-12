from backend.app.services.medical_safety_guard import guard_medical_response


def test_guard_removes_guaranteed_diagnosis() -> None:
    result = guard_medical_response(
        "You definitely have a heart attack. Sit quietly.",
        emergency=True,
        language="en",
    )

    assert result.medical_warning is True
    assert result.trust_level == "guarded"
    assert result.suggest_doctor is True
    assert "definitely have" not in result.response.lower()
    assert "medical help immediately" in result.response


def test_guard_removes_unsafe_medication_instruction() -> None:
    result = guard_medical_response(
        "Take antibiotic 500mg now. Drink clean water.",
        language="en",
    )

    assert result.medical_warning is True
    assert "500mg" not in result.response
    assert "healthcare professional" in result.response


def test_guard_flags_dangerous_self_treatment() -> None:
    result = guard_medical_response(
        "No need to see a doctor. Treat this at home without a doctor.",
        language="en",
    )

    assert result.medical_warning is True
    assert result.trust_level == "guarded"
    assert "no need to see a doctor" not in result.response.lower()


def test_guard_keeps_safe_response_unchanged() -> None:
    result = guard_medical_response(
        "Please rest, drink clean fluids, and tell me if fever gets worse.",
        language="en",
    )

    assert result.medical_warning is False
    assert result.trust_level == "safe"
    assert result.response == "Please rest, drink clean fluids, and tell me if fever gets worse."


def test_guard_uses_multilingual_fallback() -> None:
    result = guard_medical_response(
        "You definitely have an infection.",
        language="hi",
    )

    assert result.medical_warning is True
    assert "पक्की बीमारी" in result.response
