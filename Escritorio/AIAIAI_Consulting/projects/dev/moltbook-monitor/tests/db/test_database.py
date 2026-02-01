import pytest
import os
from db.database import Database, get_database

@pytest.mark.asyncio
async def test_database_initialization():
    """Test database creates tables on init"""
    # Use in-memory database for testing
    db = await get_database("sqlite+aiosqlite:///:memory:")

    # Verify tables exist
    async with db.engine.begin() as conn:
        result = await conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
        tables = [row[0] for row in result]

    assert 'posts' in tables
    assert 'watchlist_agents' in tables
    assert 'alerts' in tables
    assert 'metrics_hourly' in tables

    await db.close()

@pytest.mark.asyncio
async def test_database_insert_post():
    """Test inserting a post"""
    db = await get_database("sqlite+aiosqlite:///:memory:")

    from db.models import Post
    from datetime import datetime

    post = Post(
        moltbook_post_id="test_123",
        agent_name="TestBot",
        content="Test post about funding",
        timestamp=datetime.now(),
        sentiment_score=2.5,
        sentiment_label="positive",
        opportunity_score=8.0,
        opportunity_intent="budget_discussion",
        actionable=True
    )

    post_id = await db.insert_post(post)
    assert post_id is not None
    assert post_id > 0

    await db.close()
