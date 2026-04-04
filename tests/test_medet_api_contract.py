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
    assert payload["emergency"] is True
    assert payload["severity"] == "high"
    assert payload["suggest_doctor"] is True
    assert payload["sources"] == []
    assert "medical help immediately" in payload["response"]


def test_chat_returns_normalized_tavily_sources(monkeypatch) -> None:
    async def fake_generate(message: str, language: str, conversation_id: str):
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
    assert metadata["emergency"] is True
    assert metadata["reason"] == "Possible breathing difficulty detected"
