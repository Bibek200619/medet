from __future__ import annotations

from enum import Enum


class MedetErrorCode(str, Enum):
    INVALID_REQUEST = "invalid_request"
    EMPTY_MESSAGE = "empty_message"
    MALFORMED_JSON = "malformed_json"
    OLLAMA_UNAVAILABLE = "ollama_unavailable"
    TAVILY_UNAVAILABLE = "tavily_unavailable"
    TIMEOUT = "timeout"
    UPSTREAM_FAILURE = "upstream_failure"


class MedetAPIError(Exception):
    def __init__(
        self,
        code: MedetErrorCode,
        message: str,
        *,
        status_code: int = 500,
        retryable: bool = False,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.retryable = retryable
        super().__init__(message)


class OllamaUnavailableError(MedetAPIError):
    def __init__(self, message: str = "AI service is temporarily unavailable.") -> None:
        super().__init__(
            MedetErrorCode.OLLAMA_UNAVAILABLE,
            message,
            status_code=503,
            retryable=True,
        )


class TavilyUnavailableError(MedetAPIError):
    def __init__(self, message: str = "Search sources are temporarily unavailable.") -> None:
        super().__init__(
            MedetErrorCode.TAVILY_UNAVAILABLE,
            message,
            status_code=503,
            retryable=True,
        )
