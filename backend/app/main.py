from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.errors import MedetAPIError, MedetErrorCode
from app.routes.auth import router as auth_router
from app.routes.frontend_data import router as frontend_data_router
from app.routes.medet import router as medet_router
from app.schemas.medet_response import MedetErrorDetail, MedetErrorResponse


app = FastAPI(title="Medet Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(medet_router)
app.include_router(frontend_data_router)
app.include_router(auth_router)


@app.exception_handler(MedetAPIError)
async def medet_api_error_handler(
    request: Request,
    exc: MedetAPIError,
) -> JSONResponse:
    del request
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_response(
            code=exc.code.value,
            message=exc.message,
            retryable=exc.retryable,
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    del request
    code = MedetErrorCode.INVALID_REQUEST
    status_code = 422
    message = "Please check the request and try again."
    field = _first_error_field(exc)

    if _has_error_type(exc, "json"):
        code = MedetErrorCode.MALFORMED_JSON
        status_code = 400
        message = "The request body must be valid JSON."
        field = None
    elif _is_empty_message_error(exc):
        code = MedetErrorCode.EMPTY_MESSAGE
        status_code = 400
        message = "Message cannot be empty."

    return JSONResponse(
        status_code=status_code,
        content=_error_response(
            code=code.value,
            message=message,
            retryable=False,
            field=field,
        ),
    )


def _error_response(
    *,
    code: str,
    message: str,
    retryable: bool,
    field: str | None = None,
) -> dict[str, object]:
    payload = MedetErrorResponse(
        error=MedetErrorDetail(
            code=code,
            message=message,
            retryable=retryable,
            field=field,
        )
    )
    if hasattr(payload, "model_dump"):
        return payload.model_dump()
    return payload.dict()


def _has_error_type(exc: RequestValidationError, expected: str) -> bool:
    return any(expected in str(error.get("type", "")) for error in exc.errors())


def _first_error_field(exc: RequestValidationError) -> str | None:
    for error in exc.errors():
        location = error.get("loc", ())
        if not location:
            continue
        return str(location[-1])
    return None


def _is_empty_message_error(exc: RequestValidationError) -> bool:
    for error in exc.errors():
        location = error.get("loc", ())
        if not location or location[-1] != "message":
            continue

        error_type = str(error.get("type", ""))
        error_message = str(error.get("msg", "")).lower()
        if error_type == "string_too_short" or "empty" in error_message:
            return True
    return False
