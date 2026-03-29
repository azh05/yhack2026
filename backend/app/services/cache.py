"""Simple in-memory TTL cache for API responses."""

import time
from typing import Any

_store: dict[str, tuple[float, Any]] = {}

DEFAULT_TTL = 30 * 60  # 30 minutes


def get(key: str) -> Any | None:
    entry = _store.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if time.monotonic() > expires_at:
        _store.pop(key, None)
        return None
    return value


def set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
    _store[key] = (time.monotonic() + ttl, value)
