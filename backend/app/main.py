from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import conflicts, news


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    app.state.settings = settings
    yield
    await app.state.http_client.aclose()


app = FastAPI(title="ConflictLens API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_url],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(conflicts.router, prefix="/api")
app.include_router(news.router, prefix="/api")


@app.get("/")
async def health():
    return {"status": "ok"}
