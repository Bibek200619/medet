from __future__ import annotations

from fastapi import FastAPI

from backend.app.routes.medet import router as medet_router


app = FastAPI(title="Medet Backend")
app.include_router(medet_router)
