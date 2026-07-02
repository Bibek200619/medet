from app.services.emergency_detector import detect_emergency


def test_detects_breathing_difficulty() -> None:
    result = detect_emergency("My father cannot breathe and is gasping")

    assert result == {
        "emergency": True,
        "severity": "high",
        "reason": "Possible breathing difficulty detected",
    }


def test_detects_pregnancy_bleeding() -> None:
    result = detect_emergency("She is pregnant and bleeding since morning")

    assert result["emergency"] is True
    assert result["severity"] == "high"
    assert result["reason"] == "Possible pregnancy bleeding detected"


def test_detects_stroke_symptoms() -> None:
    result = detect_emergency("Sudden weakness on one side and slurred speech")

    assert result["emergency"] is True
    assert result["reason"] == "Possible stroke symptoms detected"


def test_non_emergency_returns_low_metadata() -> None:
    result = detect_emergency("Mild cough for two days")

    assert result == {
        "emergency": False,
        "severity": "low",
        "reason": None,
    }


def test_simple_negation_does_not_trigger() -> None:
    result = detect_emergency("There is no chest pain, only mild acidity")

    assert result["emergency"] is False


def test_detects_hindi_breathing_difficulty() -> None:
    result = detect_emergency("मुझे सांस लेने में दिक्कत हो रही है")

    assert result["emergency"] is True
    assert result["reason"] == "Possible breathing difficulty detected"


def test_detects_bengali_severe_bleeding() -> None:
    result = detect_emergency("রক্ত বন্ধ হচ্ছে না")

    assert result["emergency"] is True
    assert result["reason"] == "Possible severe bleeding detected"


def test_detects_nepali_chest_pain() -> None:
    result = detect_emergency("छाती दुखेको छ")

    assert result["emergency"] is True
    assert result["reason"] == "Possible chest pain or heart attack symptoms detected"


def test_detects_tamil_stroke_symptoms() -> None:
    result = detect_emergency("ஒரு பக்கம் பலவீனம் உள்ளது")

    assert result["emergency"] is True
    assert result["reason"] == "Possible stroke symptoms detected"


def test_detects_kannada_severe_burn() -> None:
    result = detect_emergency("ತೀವ್ರ ಸುಟ್ಟ ಗಾಯವಾಗಿದೆ")

    assert result["emergency"] is True
    assert result["reason"] == "Possible severe burn detected"
