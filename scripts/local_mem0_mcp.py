"""
Local Mem0 MCP — zero cloud API keys.
Persists to <CONSTELLATION_APP>/.mem0/local_memory.db

Install:
  python -m venv .venv
  .venv/Scripts/pip install mcp
  point Antigravity mem0-local command at .venv/Scripts/python.exe
"""

from __future__ import annotations

import datetime
import hashlib
import json
import os
import sqlite3

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("mem0-local")

APP = os.environ.get("CONSTELLATION_APP") or os.getcwd()
DEFAULT_USER = os.environ.get("MEM0_USER_ID") or "pta-local"
DB_DIR = os.path.join(APP, ".mem0")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "local_memory.db")


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    with c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                text TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                created_at TEXT NOT NULL
            )
            """
        )
    return c


@mcp.tool()
def add_memory(text: str, user_id: str = DEFAULT_USER, category: str = "general") -> str:
    """Store a memory on local disk (no cloud)."""
    if not text or not text.strip():
        return "Memory text cannot be empty."
    mem_id = hashlib.sha256(
        f"{user_id}:{text}:{datetime.datetime.now().timestamp()}".encode()
    ).hexdigest()[:16]
    created_at = datetime.datetime.now().astimezone().isoformat()
    with _conn() as conn:
        conn.execute(
            "INSERT INTO memories (id, user_id, text, category, created_at) VALUES (?, ?, ?, ?, ?)",
            (mem_id, user_id, text.strip(), category, created_at),
        )
    return f"Successfully saved local memory [ID: {mem_id}]: {text.strip()}"


@mcp.tool()
def search_memories(query: str, user_id: str = DEFAULT_USER, limit: int = 10) -> str:
    """Search local memories by simple token overlap (no cloud embeddings)."""
    if not query:
        return "[]"
    tokens = [t.strip().lower() for t in query.split() if len(t.strip()) > 1]
    with _conn() as conn:
        rows = conn.execute(
            "SELECT id, text, category, created_at FROM memories WHERE user_id = ?",
            (user_id,),
        ).fetchall()
    results = []
    q = query.lower()
    for r in rows:
        text_lower = r["text"].lower()
        score = 10 if q in text_lower else 0
        score += sum(2 for t in tokens if t in text_lower)
        if score > 0:
            results.append(
                {
                    "id": r["id"],
                    "memory": r["text"],
                    "score": score,
                    "category": r["category"],
                    "created_at": r["created_at"],
                }
            )
    results.sort(key=lambda x: x["score"], reverse=True)
    return json.dumps(results[:limit], indent=2)


@mcp.tool()
def get_memories(user_id: str = DEFAULT_USER) -> str:
    """List all local memories for a user id."""
    with _conn() as conn:
        rows = conn.execute(
            "SELECT id, text, category, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    return json.dumps(
        [
            {
                "id": r["id"],
                "memory": r["text"],
                "category": r["category"],
                "created_at": r["created_at"],
            }
            for r in rows
        ],
        indent=2,
    )


@mcp.tool()
def delete_memory(memory_id: str) -> str:
    """Delete one local memory by id."""
    with _conn() as conn:
        cur = conn.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
        n = cur.rowcount
    return f"Successfully deleted memory ID: {memory_id}" if n else f"Memory ID '{memory_id}' not found."


if __name__ == "__main__":
    mcp.run()
