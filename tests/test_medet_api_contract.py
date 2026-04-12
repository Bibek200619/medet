import json

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.routes import medet


client = TestClient(app)


def test_chat_returns_frontend_contract_with_conversation_id() -> None:
    response = client.post(
        "/medet/chat",
        json={
            "message": "I have chest pain and cold sweat",
            "language": "en",
            "conversation_id": "demo-123",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["conversation_id"] == "demo-123"
    assert payload["input_type"] == "text"
    assert payload["language"] == "en"
    assert payload["emergency"] is True
    assert payload["severity"] == "high"
    assert payload["medical_warning"] is False
    assert payload["trust_level"] == "safe"
    assert payload["suggest_doctor"] is True
    assert payload["cards"][0]["type"] == "emergency"
    assert "doctor_visit" in [card["type"] for card in payload["cards"]]
    assert payload["sources"] == []
    assert "medical help immediately" in payload["response"]


def test_chat_returns_normalized_tavily_sources(monkeypatch) -> None:
    async def fake_generate(
        message: str,
        input_type: str,
        language: str,
        conversation_id: str,
    ):
        return (
            "Drink clean water and rest.",
            [
                {
                    "title": "Health source",
                    "url": "https://example.com/health",
                    "content": "General health guidance",
                }
            ],
        )

    monkeypatch.setattr(medet, "_generate_ai_response", fake_generate)

    response = client.post(
        "/medet/chat",
        json={"message": "Mild headache", "language": "en"},
    )

    assert response.status_code == 200
    assert response.json()["sources"] == [
        {
            "title": "Health source",
            "url": "https://example.com/health",
            "snippet": "General health guidance",
            "source_type": "tavily",
        }
    ]


def test_chat_guards_unsafe_ai_response(monkeypatch) -> None:
    async def fake_generate(
        message: str,
        input_type: str,
        language: str,
        conversation_id: str,
    ):
        return ("You definitely have malaria. Take antibiotic 500mg now.", [])

    monkeypatch.setattr(medet, "_generate_ai_response", fake_generate)

    response = client.post(
        "/medet/chat",
        json={"message": "I have fever", "language": "en"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["medical_warning"] is True
    assert payload["trust_level"] == "guarded"
    assert payload["suggest_doctor"] is True
    assert "medication" in [card["type"] for card in payload["cards"]]
    assert "symptom_warning" in [card["type"] for card in payload["cards"]]
    assert "definitely have" not in payload["response"].lower()
    assert "500mg" not in payload["response"].lower()


def test_chat_accepts_voice_transcript_contract() -> None:
    response = client.post(
        "/medet/chat",
        json={
            "message": "Mujhe saans lene mein dikkat ho rahi hai",
            "input_type": "voice",
            "language": "hi",
            "conversation_id": "voice-123",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["conversation_id"] == "voice-123"
    assert payload["input_type"] == "voice"
    assert payload["language"] == "hi"
    assert payload["emergency"] is True
    assert payload["voice"] == {
        "interaction_mode": "voice_first",
        "speech_to_text_status": "transcript_provided",
        "transcript": "Mujhe saans lene mein dikkat ho rahi hai",
        "transcript_language": "hi",
        "voice_locale": "hi-IN",
        "tts_text": payload["response"],
        "audio_status": "not_generated",
        "audio_url": None,
    }


def test_chat_preserves_requested_response_language() -> None:
    response = client.post(
        "/medet/chat",
        json={
            "message": "আমার জ্বর আছে",
            "language": "bn",
            "conversation_id": "bn-123",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["conversation_id"] == "bn-123"
    assert payload["language"] == "bn"
    assert "আমি বুঝতে পারছি" in payload["response"]


def test_chat_rejects_empty_message_with_safe_error() -> None:
    response = client.post(
        "/medet/chat",
        json={"message": "   ", "language": "en"},
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "empty_message",
            "message": "Message cannot be empty.",
            "retryable": False,
            "field": "message",
        },
        "conversation_id": None,
    }


def test_chat_rejects_missing_message_as_invalid_request() -> None:
    response = client.post(
        "/medet/chat",
        json={"language": "en"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"
    assert response.json()["error"]["field"] == "message"


def test_chat_rejects_malformed_json_with_safe_error() -> None:
    response = client.post(
        "/medet/chat",
        content='{"message": "hello"',
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "malformed_json"
    assert response.json()["error"]["retryable"] is False


def test_chat_rejects_unsupported_language() -> None:
    response = client.post(
        "/medet/chat",
        json={"message": "hello", "language": "fr"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"
    assert response.json()["error"]["field"] == "language"


def test_chat_rejects_unsupported_input_type() -> None:
    response = client.post(
        "/medet/chat",
        json={"message": "hello", "input_type": "image", "language": "en"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"
    assert response.json()["error"]["field"] == "input_type"


def test_stream_returns_tokens_and_final_metadata() -> None:
    with client.stream(
        "POST",
        "/medet/chat/stream",
        json={
            "message": "My father cannot breathe",
            "language": "en",
            "conversation_id": "stream-123",
        },
    ) as response:
        body = response.read().decode()

    assert response.status_code == 200
    assert "event: token" in body
    assert "event: metadata" in body

    metadata_line = [
        line for line in body.splitlines() if line.startswith("data: {") and "emergency" in line
    ][0]
    metadata = json.loads(metadata_line.removeprefix("data: "))
    assert metadata["conversation_id"] == "stream-123"
    assert metadata["input_type"] == "text"
    assert metadata["language"] == "en"
    assert metadata["emergency"] is True
    assert metadata["reason"] == "Possible breathing difficulty detected"
    assert metadata["medical_warning"] is False
    assert metadata["trust_level"] == "safe"
    assert metadata["cards"][0]["type"] == "emergency"
