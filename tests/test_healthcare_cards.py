from app.services.healthcare_cards import build_healthcare_cards


def test_emergency_cards_prioritize_urgent_ui() -> None:
    cards = build_healthcare_cards(
        response="Please stay calm.",
        user_message="I have chest pain and cannot breathe",
        emergency=True,
        severity="high",
        suggest_doctor=True,
        medical_warning=False,
        trust_level="safe",
        language="en",
    )

    assert [card.type for card in cards] == [
        "emergency",
        "action",
        "doctor_visit",
        "symptom_warning",
    ]
    assert cards[0].title == "Emergency Warning"


def test_hydration_and_followup_cards_for_mild_symptoms() -> None:
    cards = build_healthcare_cards(
        response="Drink clean fluids and rest.",
        user_message="Mild fever and headache",
        emergency=False,
        severity="low",
        suggest_doctor=False,
        medical_warning=False,
        trust_level="safe",
        language="en",
    )

    assert [card.type for card in cards] == ["action", "hydration", "followup"]


def test_medication_card_uses_safety_wording() -> None:
    cards = build_healthcare_cards(
        response="Take only prescribed medicine.",
        user_message="Can I take medicine?",
        emergency=False,
        severity="low",
        suggest_doctor=False,
        medical_warning=False,
        trust_level="safe",
        language="en",
    )

    medication_card = next(card for card in cards if card.type == "medication")
    assert "Do not change dose" in medication_card.content


def test_multilingual_cards_use_requested_language() -> None:
    cards = build_healthcare_cards(
        response="आराम करें और पानी पिएं।",
        user_message="मुझे बुखार है",
        emergency=False,
        severity="low",
        suggest_doctor=False,
        medical_warning=False,
        trust_level="safe",
        language="hi",
    )

    assert cards[0].title == "सुझाया गया कदम"
    assert any(card.type == "hydration" for card in cards)
