import aiosqlite
from pathlib import Path
from typing import Optional
import json
from datetime import datetime

from db.models import Post, WatchlistAgent, Alert, MetricHourly

class Database:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.db_path = connection_string.replace("sqlite+aiosqlite:///", "")
        self.conn: Optional[aiosqlite.Connection] = None

    async def initialize(self):
        """Initialize database with schema"""
        # Create data directory if needed
        db_dir = Path(self.db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)

        # Connect
        self.conn = await aiosqlite.connect(self.db_path)
        self.conn.row_factory = aiosqlite.Row

        # Load and execute schema
        schema_path = Path(__file__).parent / "schema.sql"
        schema = schema_path.read_text()

        await self.conn.executescript(schema)
        await self.conn.commit()

    async def close(self):
        """Close database connection"""
        if self.conn:
            await self.conn.close()

    async def insert_post(self, post: Post) -> int:
        """Insert a post and return its ID"""
        query = """
        INSERT INTO posts (
            moltbook_post_id, agent_name, agent_id, content, timestamp,
            sentiment_score, sentiment_label,
            opportunity_score, opportunity_intent, keywords_matched, actionable,
            is_trending, scraped_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        cursor = await self.conn.execute(query, (
            post.moltbook_post_id,
            post.agent_name,
            post.agent_id,
            post.content,
            post.timestamp.isoformat(),
            post.sentiment_score,
            post.sentiment_label,
            post.opportunity_score,
            post.opportunity_intent,
            post.keywords_matched,
            post.actionable,
            post.is_trending,
            post.scraped_at.isoformat()
        ))

        await self.conn.commit()
        return cursor.lastrowid

    async def get_post_by_moltbook_id(self, moltbook_id: str) -> Optional[Post]:
        """Get post by Moltbook ID"""
        query = "SELECT * FROM posts WHERE moltbook_post_id = ?"
        cursor = await self.conn.execute(query, (moltbook_id,))
        row = await cursor.fetchone()

        if not row:
            return None

        return Post(
            id=row['id'],
            moltbook_post_id=row['moltbook_post_id'],
            agent_name=row['agent_name'],
            agent_id=row['agent_id'],
            content=row['content'],
            timestamp=datetime.fromisoformat(row['timestamp']),
            sentiment_score=row['sentiment_score'],
            sentiment_label=row['sentiment_label'],
            opportunity_score=row['opportunity_score'],
            opportunity_intent=row['opportunity_intent'],
            keywords_matched=row['keywords_matched'],
            actionable=bool(row['actionable']),
            is_trending=bool(row['is_trending']),
            scraped_at=datetime.fromisoformat(row['scraped_at'])
        )

# Singleton pattern for database
_database: Optional[Database] = None

async def get_database(connection_string: Optional[str] = None) -> Database:
    """Get or create database instance"""
    global _database

    if connection_string:
        # For testing - create new instance
        db = Database(connection_string)
        await db.initialize()
        return db

    if _database is None:
        from dotenv import load_dotenv
        import os

        load_dotenv()
        conn_str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/moltbook.db")

        _database = Database(conn_str)
        await _database.initialize()

    return _database
