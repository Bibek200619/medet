from __future__ import annotations

import asyncio
import json
import logging
import os
from collections.abc import AsyncIterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

from app.core.errors import MedetAPIError, MedetErrorCode
from app.services.emergency_detector import detect_emergency
from app.services.language_support import (
    MultilingualPromptContext,
    build_multilingual_prompt_context,
    get_emergency_escalation_text,
    get_followup_text,
)

logger = logging.getLogger(__name__)

OLLAMA_CONNECT_TIMEOUT_SECONDS = 10.0
TAVILY_SEARCH_URL = "https://api.tavily.com/search"

URGENT_FALLBACK_TEXT: dict[str, str] = {
    "en": (
        "This may be serious. Please seek medical help immediately. Contact nearby "
        "healthcare services now. I cannot diagnose this, but these symptoms need urgent attention."
    ),
    "hi": (
        "यह गंभीर हो सकता है। कृपया तुरंत पास की स्वास्थ्य सेवा से मदद लें। "
        "मैं पक्की बीमारी नहीं बता सकता, लेकिन इन लक्षणों पर तुरंत ध्यान जरूरी है।"
    ),
    "bn": (
        "এটি গুরুতর হতে পারে। দয়া করে এখনই কাছের স্বাস্থ্যসেবার সাহায্য নিন। "
        "আমি নিশ্চিত রোগ বলতে পারি না, কিন্তু এই লক্ষণগুলোতে দ্রুত চিকিৎসা দরকার।"
    ),
    "ne": (
        "यो गम्भीर हुन सक्छ। कृपया तुरुन्त नजिकको स्वास्थ्य सेवामा सम्पर्क गर्नुहोस्। "
        "म पक्का रोग भन्न सक्दिन, तर यी लक्षणमा छिटो जाँच जरूरी छ।"
    ),
    "ta": (
        "இது தீவிரமாக இருக்கலாம். தயவு செய்து உடனே அருகிலுள்ள சுகாதார சேவையை தொடர்பு கொள்ளுங்கள். "
        "நான் உறுதியான நோயறிதல் சொல்ல முடியாது, ஆனால் இந்த அறிகுறிகளுக்கு உடனடி கவனம் தேவை."
    ),
    "kn": (
        "ಇದು ಗಂಭೀರವಾಗಿರಬಹುದು. ದಯವಿಟ್ಟು ಈಗಲೇ ಹತ್ತಿರದ ಆರೋಗ್ಯ ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ. "
        "ನಾನು ಖಚಿತ ರೋಗನಿರ್ಣಯ ಹೇಳಲು ಸಾಧ್ಯವಿಲ್ಲ, ಆದರೆ ಈ ಲಕ್ಷಣಗಳಿಗೆ ತಕ್ಷಣ ಗಮನ ಬೇಕು."
    ),
}


@dataclass(frozen=True)
class MedetGeneration:
    content: str
    sources: list[dict[str, str] | str]


def load_medet_environment() -> None:
    """Load local env files without overriding deployment-provided variables."""
    backend_dir = Path(__file__).resolve().parents[2]
    project_dir = backend_dir.parent
    load_dotenv(project_dir / ".env", override=False)
    load_dotenv(backend_dir / ".env", override=False)


async def generate_medet_ai_response(
    *,
    message: str,
    input_type: str,
    language: str,
) -> MedetGeneration:
    prompt_context = build_multilingual_prompt_context(
        message=message,
        language=language,
        input_type=input_type,
    )
    emergency = bool(detect_emergency(message)["emergency"])
    sources = await _fetch_tavily_sources(message, emergency=emergency)

    try:
        content = await _ollama_generate(prompt_context, sources)
    except asyncio.TimeoutError as exc:
        logger.warning("Medet Ollama request timed out.")
        raise MedetAPIError(
            MedetErrorCode.TIMEOUT,
            "The healthcare AI response took too long. Please try again.",
            status_code=504,
            retryable=True,
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.warning("Medet Ollama rejected request with status %s.", exc.response.status_code)
        content = _safe_local_guidance(prompt_context.language, emergency)
    except (httpx.RequestError, json.JSONDecodeError, ValueError) as exc:
        logger.warning("Medet Ollama unavailable, using healthcare-safe fallback: %s", exc)
        content = _safe_local_guidance(prompt_context.language, emergency)

    return MedetGeneration(content=content, sources=sources)


async def stream_medet_ai_response(
    *,
    message: str,
    input_type: str,
    language: str,
) -> AsyncIterator[dict[str, object]]:
    prompt_context = build_multilingual_prompt_context(
        message=message,
        language=language,
        input_type=input_type,
    )
    emergency = bool(detect_emergency(message)["emergency"])
    sources = await _fetch_tavily_sources(message, emergency=emergency)

    for source in sources:
        yield {"type": "source", "source": source}

    try:
        async for token in _ollama_stream(prompt_context, sources):
            yield {"type": "token", "content": token}
    except asyncio.TimeoutError as exc:
        logger.warning("Medet Ollama stream timed out.")
        raise MedetAPIError(
            MedetErrorCode.TIMEOUT,
            "The healthcare AI response took too long. Please try again.",
            status_code=504,
            retryable=True,
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.warning("Medet Ollama stream rejected request with status %s.", exc.response.status_code)
        for token in _split_fallback_tokens(_safe_local_guidance(prompt_context.language, emergency)):
            yield {"type": "token", "content": token}
    except (httpx.RequestError, json.JSONDecodeError, ValueError) as exc:
        logger.warning("Medet Ollama stream unavailable, using healthcare-safe fallback: %s", exc)
        for token in _split_fallback_tokens(_safe_local_guidance(prompt_context.language, emergency)):
            yield {"type": "token", "content": token}


async def _ollama_generate(
    prompt_context: MultilingualPromptContext,
    sources: list[dict[str, str] | str],
) -> str:
    payload = _ollama_payload(prompt_context, sources, stream=False)
    timeout = httpx.Timeout(_env_float("AI_REQUEST_TIMEOUT_SECONDS", 60.0), connect=OLLAMA_CONNECT_TIMEOUT_SECONDS)

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(_ollama_chat_url(), json=payload)
        response.raise_for_status()
        return _extract_ollama_content(response.json())


async def _ollama_stream(
    prompt_context: MultilingualPromptContext,
    sources: list[dict[str, str] | str],
) -> AsyncIterator[str]:
    payload = _ollama_payload(prompt_context, sources, stream=True)
    timeout = httpx.Timeout(_env_float("AI_STREAM_TIMEOUT_SECONDS", 120.0), connect=OLLAMA_CONNECT_TIMEOUT_SECONDS)

    emitted = False
    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", _ollama_chat_url(), json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                token = _parse_ollama_stream_line(line)
                if token:
                    emitted = True
                    yield token

    if not emitted:
        raise ValueError("Ollama stream returned no tokens.")


def _ollama_payload(
    prompt_context: MultilingualPromptContext,
    sources: list[dict[str, str] | str],
    *,
    stream: bool,
) -> dict[str, Any]:
    user_message = _user_prompt(prompt_context, sources)
    return {
        "model": _ollama_model(),
        "messages": [
            {"role": "system", "content": prompt_context.system_instruction},
            {"role": "user", "content": user_message},
        ],
        "stream": stream,
        "options": {
            "temperature": _env_float("AI_TEMPERATURE", 0.2),
            "num_predict": _env_int("AI_MAX_OUTPUT_TOKENS", 384, minimum=1, maximum=768),
        },
    }


def _user_prompt(
    prompt_context: MultilingualPromptContext,
    sources: list[dict[str, str] | str],
) -> str:
    if not sources:
        return prompt_context.user_message

    source_text = "\n".join(_format_source(index, source) for index, source in enumerate(sources, start=1))
    return (
        f"{prompt_context.user_message}\n\n"
        "If useful, use these web source snippets. Keep the answer simple and do not invent facts.\n"
        f"{source_text}"
    )


async def _fetch_tavily_sources(
    message: str,
    *,
    emergency: bool,
) -> list[dict[str, str] | str]:
    api_key = _env("TAVILY_API_KEY")
    tavily_enabled = _env_bool("WEB_SEARCH_ENABLED", _env_bool("TAVILY_ENABLED", False))
    if not api_key or emergency or not tavily_enabled:
        return []

    payload = {
        "api_key": api_key,
        "query": f"simple healthcare guidance for: {message}",
        "search_depth": _env("WEB_SEARCH_DEPTH", "basic"),
        "max_results": _env_int("WEB_SEARCH_MAX_RESULTS", 3, minimum=1, maximum=5),
        "include_answer": False,
        "include_raw_content": False,
    }
    timeout = httpx.Timeout(_env_float("WEB_SEARCH_TIMEOUT_SECONDS", 8.0), connect=5.0)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                TAVILY_SEARCH_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, json.JSONDecodeError) as exc:
        logger.warning("Tavily source lookup failed, continuing without sources: %s", exc)
        return []

    results = data.get("results") if isinstance(data, dict) else None
    if not isinstance(results, list):
        return []

    sources: list[dict[str, str]] = []
    for item in results:
        if not isinstance(item, dict):
            continue
        title = _clean_source_text(item.get("title"))
        url = _clean_source_text(item.get("url"))
        snippet = _clean_source_text(item.get("content") or item.get("snippet"))
        if not title and not url and not snippet:
            continue
        sources.append(
            {
                "title": title or "Health source",
                "url": url or "",
                "snippet": snippet or "",
                "source_type": "tavily",
            }
        )

    return sources


def _extract_ollama_content(payload: dict[str, Any]) -> str:
    choices = payload.get("choices")
    if isinstance(choices, list) and choices:
        first_choice = choices[0]
        message = first_choice.get("message") if isinstance(first_choice, dict) else None
        if isinstance(message, dict) and isinstance(message.get("content"), str):
            return message["content"].strip()

    message = payload.get("message")
    if isinstance(message, dict) and isinstance(message.get("content"), str):
        return message["content"].strip()

    response = payload.get("response")
    if isinstance(response, str):
        return response.strip()

    raise ValueError("Ollama returned an invalid response.")


def _parse_ollama_stream_line(line: str) -> str:
    if not line:
        return ""

    data = line.removeprefix("data:").strip()
    if not data or data == "[DONE]":
        return ""

    chunk = json.loads(data)
    if isinstance(chunk.get("error"), str) and chunk["error"].strip():
        raise ValueError(chunk["error"].strip())

    choices = chunk.get("choices")
    if isinstance(choices, list) and choices:
        first_choice = choices[0]
        delta = first_choice.get("delta") if isinstance(first_choice, dict) else None
        if isinstance(delta, dict) and isinstance(delta.get("content"), str):
            return delta["content"]
        message = first_choice.get("message") if isinstance(first_choice, dict) else None
        if isinstance(message, dict) and isinstance(message.get("content"), str):
            return message["content"]

    message = chunk.get("message")
    if isinstance(message, dict) and isinstance(message.get("content"), str):
        return message["content"]

    return ""


def _safe_local_guidance(language: str, emergency: bool) -> str:
    if emergency:
        return URGENT_FALLBACK_TEXT.get(language, URGENT_FALLBACK_TEXT["en"])
    return get_followup_text(language)


def _split_fallback_tokens(text: str) -> list[str]:
    return [f"{part} " for part in text.split(" ")]


def _format_source(index: int, source: dict[str, str] | str) -> str:
    if isinstance(source, str):
        return f"{index}. {source}"

    title = source.get("title") or "Health source"
    snippet = source.get("snippet") or source.get("content") or ""
    url = source.get("url") or ""
    return f"{index}. {title}\n{snippet}\n{url}".strip()


def _clean_source_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()[:700]


def _ollama_chat_url() -> str:
    model_url = _env("MODEL_URL")
    if model_url:
        return model_url

    base_url = _env("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    return f"{base_url}/api/chat"


def _ollama_model() -> str:
    return _env("OLLAMA_DEFAULT_MODEL") or _env("AI_MODEL") or "phi3:mini"


def _env(key: str, default: str | None = None) -> str:
    load_medet_environment()
    value = os.getenv(key)
    if value is None or value.strip() == "":
        return default or ""
    return value.strip()


def _env_bool(key: str, default: bool) -> bool:
    value = _env(key)
    if not value:
        return default
    return value.lower() not in {"0", "false", "no", "off"}


def _env_float(key: str, default: float) -> float:
    value = _env(key)
    if not value:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _env_int(key: str, default: int, *, minimum: int, maximum: int) -> int:
    value = _env(key)
    if not value:
        return default
    try:
        parsed = int(value)
    except ValueError:
        return default
    return max(minimum, min(parsed, maximum))
