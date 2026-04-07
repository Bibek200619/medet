from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from uuid import uuid4

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.app.core.errors import MedetAPIError, MedetErrorCode
from backend.app.schemas.medet_response import (
    MedetChatRequest,
    MedetErrorResponse,
    MedetResponse,
    normalize_sources,
)
from backend.app.services.language_support import (
    build_multilingual_prompt_context,
    get_followup_text,
)
from backend.app.services.medet_response_builder import build_medet_response

router = APIRouter(prefix="/medet", tags=["medet"])


@router.post(
    "/chat",
    response_model=MedetResponse,
    responses={
        400: {"model": MedetErrorResponse},
        422: {"model": MedetErrorResponse},
        503: {"model": MedetErrorResponse},
        504: {"model": MedetErrorResponse},
    },
)
async def medet_chat(payload: MedetChatRequest) -> MedetResponse:
    """
    Non-streaming Medet response.

    Replace `_generate_ai_response` with the existing Omnix/Ollama/Tavily service
    call in the host app. The response builder is the healthcare-safe integration
    point and should stay independent from retrieval or model providers.
    """
    conversation_id = _conversation_id(payload)
    try:
        ai_text, sources = await _generate_ai_response(
            payload.message,
            payload.input_type,
            payload.language,
            conversation_id,
        )
        return build_medet_response(
            ai_text=ai_text,
            user_message=payload.message,
            sources=sources,
            conversation_id=conversation_id,
            input_type=payload.input_type,
            language=payload.language,
        )
    except asyncio.TimeoutError as exc:
        raise MedetAPIError(
            MedetErrorCode.TIMEOUT,
            "The healthcare AI response took too long. Please try again.",
            status_code=504,
            retryable=True,
        ) from exc
    except MedetAPIError:
        raise
    except Exception as exc:
        raise MedetAPIError(
            MedetErrorCode.UPSTREAM_FAILURE,
            "The healthcare AI service could not complete the request.",
            status_code=503,
            retryable=True,
        ) from exc


@router.post(
    "/chat/stream",
    responses={
        400: {"model": MedetErrorResponse},
        422: {"model": MedetErrorResponse},
        503: {"model": MedetErrorResponse},
        504: {"model": MedetErrorResponse},
    },
)
async def medet_chat_stream(payload: MedetChatRequest) -> StreamingResponse:
    """
    Streaming response that keeps token streaming intact and sends metadata last.

    The frontend can keep rendering streamed text exactly as before, then consume
    the final `metadata` event to show emergency UI cards.
    """
    return StreamingResponse(
        _stream_with_metadata(payload, _conversation_id(payload)),
        media_type="text/event-stream",
    )


async def _stream_with_metadata(
    payload: MedetChatRequest,
    conversation_id: str,
) -> AsyncIterator[str]:
    chunks: list[str] = []
    sources: list[dict[str, str] | str] = []

    try:
        async for event in _stream_ai_response(
            payload.message,
            payload.input_type,
            payload.language,
            conversation_id,
        ):
            if event.get("type") == "source":
                source = event.get("source", {})
                if isinstance(source, (dict, str)):
                    sources.append(source)
                    for normalized_source in normalize_sources([source]):
                        yield _sse(
                            "source",
                            {
                                "type": "source",
                                "source": _model_dump(normalized_source),
                                "input_type": payload.input_type,
                                "language": payload.language,
                                "conversation_id": conversation_id,
                            },
                        )
                continue

            token = str(event.get("content", ""))
            if not token:
                continue

            chunks.append(token)
            yield _sse(
                "token",
                {
                    "type": "token",
                    "content": token,
                    "input_type": payload.input_type,
                    "language": payload.language,
                    "conversation_id": conversation_id,
                },
            )

        structured = build_medet_response(
            ai_text="".join(chunks),
            user_message=payload.message,
            sources=sources,
            conversation_id=conversation_id,
            input_type=payload.input_type,
            language=payload.language,
        )
        yield _sse("metadata", _model_dump(structured))
    except asyncio.TimeoutError:
        yield _sse_error(
            MedetErrorCode.TIMEOUT,
            "The healthcare AI response took too long. Please try again.",
            conversation_id,
            retryable=True,
        )
    except MedetAPIError as exc:
        yield _sse_error(
            exc.code,
            exc.message,
            conversation_id,
            retryable=exc.retryable,
        )
    except Exception:
        yield _sse_error(
            MedetErrorCode.UPSTREAM_FAILURE,
            "The healthcare AI service could not complete the request.",
            conversation_id,
            retryable=True,
        )


async def _generate_ai_response(
    message: str,
    input_type: str,
    language: str,
    conversation_id: str,
) -> tuple[str, list[dict[str, str] | str]]:
    """
    Thin placeholder for existing Tavily/Ollama orchestration.

    In the full app, call the current Medet/Omnix generation service here and
    return `(answer_text, sources)`.
    """
    del conversation_id
    prompt_context = build_multilingual_prompt_context(
        message=message,
        language=language,
        input_type=input_type,
    )

    # Existing Omnix/Ollama integration should pass `prompt_context.system_instruction`
    # with `prompt_context.user_message` and keep returning `(answer_text, sources)`.
    del prompt_context
    return (get_followup_text(language), [])


async def _stream_ai_response(
    message: str,
    input_type: str,
    language: str,
    conversation_id: str,
) -> AsyncIterator[dict[str, object]]:
    """Placeholder adapter for the existing streaming generator."""
    answer, sources = await _generate_ai_response(
        message,
        input_type,
        language,
        conversation_id,
    )
    for source in sources:
        yield {"type": "source", "source": source}
    for token in answer.split(" "):
        yield {"type": "token", "content": token + " "}


def _conversation_id(payload: MedetChatRequest) -> str:
    return payload.conversation_id or str(uuid4())


def _sse(event: str, payload: dict[str, object]) -> str:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"


def _sse_error(
    code: MedetErrorCode,
    message: str,
    conversation_id: str,
    *,
    retryable: bool,
) -> str:
    return _sse(
        "error",
        {
            "type": "error",
            "error": {
                "code": code.value,
                "message": message,
                "retryable": retryable,
                "field": None,
            },
            "conversation_id": conversation_id,
        },
    )


def _model_dump(model: object) -> dict[str, object]:
    if hasattr(model, "model_dump"):
        return model.model_dump()  # type: ignore[no-any-return]
    return model.dict()  # type: ignore[attr-defined,no-any-return]
