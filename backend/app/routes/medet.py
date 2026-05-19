from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.app.schemas.medet_response import MedetChatRequest, MedetResponse
from backend.app.services.medet_response_builder import build_medet_response

router = APIRouter(prefix="/medet", tags=["medet"])


@router.post("/chat", response_model=MedetResponse)
async def medet_chat(payload: MedetChatRequest) -> MedetResponse:
    """
    Non-streaming Medet response.

    Replace `_generate_ai_response` with the existing Omnix/Ollama/Tavily service
    call in the host app. The response builder is the healthcare-safe integration
    point and should stay independent from retrieval or model providers.
    """
    ai_text, sources = await _generate_ai_response(payload.message, payload.language)
    return build_medet_response(
        ai_text=ai_text,
        user_message=payload.message,
        sources=sources,
    )


@router.post("/chat/stream")
async def medet_chat_stream(payload: MedetChatRequest) -> StreamingResponse:
    """
    Streaming response that keeps token streaming intact and sends metadata last.

    The frontend can keep rendering streamed text exactly as before, then consume
    the final `metadata` event to show emergency UI cards.
    """
    return StreamingResponse(
        _stream_with_metadata(payload),
        media_type="text/event-stream",
    )


async def _stream_with_metadata(payload: MedetChatRequest) -> AsyncIterator[str]:
    chunks: list[str] = []
    sources: list[dict[str, str] | str] = []

    async for event in _stream_ai_response(payload.message, payload.language):
        if event.get("type") == "source":
            sources.append(event.get("source", {}))
            continue

        token = str(event.get("content", ""))
        if not token:
            continue

        chunks.append(token)
        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

    structured = build_medet_response(
        ai_text="".join(chunks),
        user_message=payload.message,
        sources=sources,
    )
    metadata = (
        structured.model_dump_json()
        if hasattr(structured, "model_dump_json")
        else structured.json()
    )
    yield f"event: metadata\ndata: {metadata}\n\n"


async def _generate_ai_response(
    message: str,
    language: str | None = None,
) -> tuple[str, list[dict[str, str] | str]]:
    """
    Thin placeholder for existing Tavily/Ollama orchestration.

    In the full app, call the current Medet/Omnix generation service here and
    return `(answer_text, sources)`.
    """
    del language
    return (
        "I understand. Please share how long this has been happening, the age of "
        "the person, and whether there is fever, pain, bleeding, or weakness.",
        [],
    )


async def _stream_ai_response(
    message: str,
    language: str | None = None,
) -> AsyncIterator[dict[str, object]]:
    """Placeholder adapter for the existing streaming generator."""
    answer, sources = await _generate_ai_response(message, language)
    for source in sources:
        yield {"type": "source", "source": source}
    for token in answer.split(" "):
        yield {"type": "token", "content": token + " "}
