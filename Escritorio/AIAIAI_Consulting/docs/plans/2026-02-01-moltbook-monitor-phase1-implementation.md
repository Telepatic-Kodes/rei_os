# Moltbook Monitor - Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build core infrastructure for Moltbook monitoring: scraper, analyzers, database schema, and basic scheduler (heartbeat every 5min).

**Architecture:** Python-based monitoring system using Playwright (Puppeteer alternative), AFINN-165 sentiment analysis, custom monetization scoring algorithm, SQLite for storage, and APScheduler for automation. Integrates with existing ClawdBot infrastructure in `/projects/dev`.

**Tech Stack:** Python 3.11+, FastAPI, Playwright, AFINN, SQLAlchemy (async), APScheduler, SQLite

---

## Pre-requisites

**Working directory:** `.worktrees/feature/moltbook-monitor/Escritorio/AIAIAI_Consulting`

**Verify structure exists:**
```bash
ls -la projects/dev/  # Should show clawdbot/
```

---

## Task 1: Project Structure Setup

**Files:**
- Create: `projects/dev/moltbook-monitor/` (directory structure)
- Create: `projects/dev/moltbook-monitor/requirements.txt`
- Create: `projects/dev/moltbook-monitor/.env.example`
- Create: `projects/dev/moltbook-monitor/README.md`

**Step 1: Create directory structure**

```bash
cd projects/dev
mkdir -p moltbook-monitor/{core,api,db,notifications,config,tests,data,logs}
mkdir -p moltbook-monitor/tests/{core,api,db}
```

**Step 2: Create requirements.txt**

Create `projects/dev/moltbook-monitor/requirements.txt`:

```txt
# Web framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.25
aiosqlite==0.19.0

# Scraping (Playwright instead of Puppeteer - better Python support)
playwright==1.41.0
beautifulsoup4==4.12.3
lxml==5.1.0

# NLP & Analysis
afinn==0.1

# Scheduling
apscheduler==3.10.4

# Utilities
python-dotenv==1.0.0
httpx==0.26.0

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
pytest-cov==4.1.0
```

**Step 3: Create .env.example**

Create `projects/dev/moltbook-monitor/.env.example`:

```bash
# Moltbook
MOLTBOOK_URL=https://moltbook.ai/feed
MOLTBOOK_USERNAME=optional_if_public
MOLTBOOK_PASSWORD=optional_if_public

# Database
DATABASE_URL=sqlite+aiosqlite:///./data/moltbook.db
SYNC_JSON_PATH=../../../data/moltbook.json

# Monitoring
HEARTBEAT_INTERVAL_SECONDS=300
SCRAPE_LIMIT_POSTS=50
AUTO_DISCOVERY_ENABLED=true

# Monetization
MIN_OPPORTUNITY_SCORE=7.0
ALERT_ON_SCORE_ABOVE=8.0

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/moltbook-monitor.log

# Notifications (will integrate later)
WHATSAPP_ENABLED=false
ADMIN_PHONE_NUMBER=+1234567890
```

**Step 4: Create README**

Create `projects/dev/moltbook-monitor/README.md`:

```markdown
# Moltbook Monitor

Autonomous monitoring agent for Moltbook AI social network with monetization-focused analysis.

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Copy environment file
cp .env.example .env

# Initialize database
python -m core.init_db
```

## Run

```bash
# Start monitoring (runs continuously with 5min heartbeat)
python main.py
```

## Testing

```bash
pytest tests/ -v --cov=core --cov=api --cov=db
```

## Architecture

See: `../../docs/plans/2026-02-01-moltbook-monitor-design.md`
```

**Step 5: Verify structure**

```bash
cd projects/dev/moltbook-monitor
ls -la
tree -L 2  # If tree installed, otherwise: find . -maxdepth 2 -type d
```

Expected: All directories created, files present

**Step 6: Commit**

```bash
git add projects/dev/moltbook-monitor/
git commit -m "feat(moltbook): initialize project structure and dependencies

- Create directory structure for moltbook-monitor
- Add requirements.txt with FastAPI, Playwright, AFINN
- Add .env.example with configuration template
- Add README with setup instructions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Database Schema

**Files:**
- Create: `projects/dev/moltbook-monitor/db/schema.sql`
- Create: `projects/dev/moltbook-monitor/db/models.py`
- Create: `projects/dev/moltbook-monitor/db/database.py`
- Create: `tests/db/test_database.py`

**Step 1: Write the failing test**

Create `tests/db/test_database.py`:

```python
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
```

**Step 2: Run test to verify it fails**

```bash
cd projects/dev/moltbook-monitor
pytest tests/db/test_database.py -v
```

Expected: FAIL with "No module named 'db.database'" or similar

**Step 3: Create SQL schema**

Create `db/schema.sql`:

```sql
-- Posts scrapeados de Moltbook
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moltbook_post_id TEXT UNIQUE NOT NULL,
    agent_name TEXT NOT NULL,
    agent_id TEXT,
    content TEXT NOT NULL,
    timestamp DATETIME NOT NULL,

    -- Sentiment analysis
    sentiment_score REAL,
    sentiment_label TEXT,

    -- Monetization analysis
    opportunity_score REAL,
    opportunity_intent TEXT,
    keywords_matched TEXT,
    actionable BOOLEAN DEFAULT 0,

    is_trending BOOLEAN DEFAULT 0,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_agent ON posts(agent_name);
CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp);
CREATE INDEX IF NOT EXISTS idx_posts_opportunity ON posts(opportunity_score);
CREATE INDEX IF NOT EXISTS idx_posts_actionable ON posts(actionable);

-- Agentes en watchlist
CREATE TABLE IF NOT EXISTS watchlist_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT UNIQUE NOT NULL,
    agent_id TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    keywords TEXT,
    alert_enabled BOOLEAN DEFAULT 1,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME,

    -- Monetization context
    agent_type TEXT,
    avg_opportunity_score REAL,
    total_opportunities INTEGER DEFAULT 0
);

-- Alertas enviadas
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    whatsapp_sent BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_post_id INTEGER,
    opportunity_score REAL,
    FOREIGN KEY (related_post_id) REFERENCES posts(id)
);

-- Métricas agregadas
CREATE TABLE IF NOT EXISTS metrics_hourly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hour DATETIME NOT NULL,
    total_posts INTEGER,
    avg_sentiment REAL,
    avg_opportunity_score REAL,
    high_value_opportunities INTEGER,
    trending_topics TEXT,
    active_agents INTEGER,
    alerts_sent INTEGER
);
```

**Step 4: Create SQLAlchemy models**

Create `db/models.py`:

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class Post(BaseModel):
    """Pydantic model for Post"""
    id: Optional[int] = None
    moltbook_post_id: str
    agent_name: str
    agent_id: Optional[str] = None
    content: str
    timestamp: datetime

    # Sentiment
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None

    # Monetization
    opportunity_score: Optional[float] = None
    opportunity_intent: Optional[str] = None
    keywords_matched: Optional[str] = None
    actionable: bool = False

    is_trending: bool = False
    scraped_at: datetime = Field(default_factory=datetime.now)

class WatchlistAgent(BaseModel):
    """Pydantic model for Watchlist Agent"""
    id: Optional[int] = None
    agent_name: str
    agent_id: Optional[str] = None
    category: str  # 'manual', 'auto-discovered', 'suggested'
    priority: str = 'medium'
    keywords: Optional[str] = None
    alert_enabled: bool = True
    added_at: datetime = Field(default_factory=datetime.now)
    last_activity: Optional[datetime] = None

    # Monetization context
    agent_type: Optional[str] = None
    avg_opportunity_score: Optional[float] = None
    total_opportunities: int = 0

class Alert(BaseModel):
    """Pydantic model for Alert"""
    id: Optional[int] = None
    alert_type: str
    severity: str
    message: str
    whatsapp_sent: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    related_post_id: Optional[int] = None
    opportunity_score: Optional[float] = None

class MetricHourly(BaseModel):
    """Pydantic model for Hourly Metrics"""
    id: Optional[int] = None
    hour: datetime
    total_posts: int
    avg_sentiment: Optional[float] = None
    avg_opportunity_score: Optional[float] = None
    high_value_opportunities: int
    trending_topics: Optional[str] = None
    active_agents: int
    alerts_sent: int
```

**Step 5: Create database connection manager**

Create `db/database.py`:

```python
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
```

**Step 6: Run test to verify it passes**

```bash
pytest tests/db/test_database.py -v
```

Expected: PASS (2 tests)

**Step 7: Commit**

```bash
git add db/ tests/db/
git commit -m "feat(moltbook): add database schema and models

- Create SQLite schema with posts, watchlist_agents, alerts tables
- Add Pydantic models for type safety
- Implement async database manager with aiosqlite
- Add comprehensive database tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Sentiment Analyzer

**Files:**
- Create: `core/analyzer.py`
- Create: `tests/core/test_analyzer.py`

**Step 1: Write the failing test**

Create `tests/core/test_analyzer.py`:

```python
import pytest
from core.analyzer import SentimentAnalyzer

def test_sentiment_positive():
    """Test positive sentiment detection"""
    analyzer = SentimentAnalyzer()

    content = "Amazing opportunity! Great funding round, very excited about this investment."
    result = analyzer.analyze(content)

    assert result['score'] > 1.0
    assert result['label'] == 'positive'
    assert result['magnitude'] > 0

def test_sentiment_negative():
    """Test negative sentiment detection"""
    analyzer = SentimentAnalyzer()

    content = "Terrible experience, broken product, frustrated with expensive pricing."
    result = analyzer.analyze(content)

    assert result['score'] < -1.0
    assert result['label'] == 'negative'
    assert result['magnitude'] > 0

def test_sentiment_neutral():
    """Test neutral sentiment detection"""
    analyzer = SentimentAnalyzer()

    content = "The meeting is scheduled for Tuesday at 3pm."
    result = analyzer.analyze(content)

    assert -1.0 <= result['score'] <= 1.0
    assert result['label'] == 'neutral'
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/core/test_analyzer.py -v
```

Expected: FAIL with "No module named 'core.analyzer'"

**Step 3: Create __init__.py files**

```bash
touch core/__init__.py
touch tests/__init__.py
touch tests/core/__init__.py
```

**Step 4: Implement sentiment analyzer**

Create `core/analyzer.py`:

```python
from afinn import Afinn
from typing import TypedDict

class SentimentScore(TypedDict):
    score: float
    label: str
    magnitude: float

class SentimentAnalyzer:
    """Sentiment analysis using AFINN-165 lexicon"""

    def __init__(self):
        self.afinn = Afinn(language='en')

    def analyze(self, content: str) -> SentimentScore:
        """
        Analyze sentiment of text content

        Args:
            content: Text to analyze

        Returns:
            Dictionary with score (-5 to +5), label, and magnitude
        """
        # Get AFINN score
        score = self.afinn.score(content)

        # Classify
        if score > 1:
            label = 'positive'
        elif score < -1:
            label = 'negative'
        else:
            label = 'neutral'

        return {
            'score': score,
            'label': label,
            'magnitude': abs(score)
        }
```

**Step 5: Run test to verify it passes**

```bash
pytest tests/core/test_analyzer.py -v
```

Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add core/analyzer.py tests/core/test_analyzer.py core/__init__.py tests/__init__.py tests/core/__init__.py
git commit -m "feat(moltbook): add sentiment analysis with AFINN-165

- Implement SentimentAnalyzer using AFINN lexicon
- Support positive/neutral/negative classification
- Add comprehensive tests for all sentiment types

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Monetization Analyzer

**Files:**
- Create: `core/monetization.py`
- Create: `config/monetization-keywords.json`
- Create: `tests/core/test_monetization.py`

**Step 1: Write the failing test**

Create `tests/core/test_monetization.py`:

```python
import pytest
from core.monetization import MonetizationAnalyzer

def test_high_value_opportunity():
    """Test high-value monetization opportunity detection"""
    analyzer = MonetizationAnalyzer()

    content = "Looking for B2B SaaS solution, have budget of $50k MRR for enterprise pricing"
    agent_name = "StartupCEO_Bot"

    result = analyzer.analyze(content, agent_name)

    assert result['score'] >= 8.0
    assert result['intent'] in ['seeking_solution', 'budget_discussion']
    assert result['actionable'] == True
    assert len(result['keywords_matched']) > 0

def test_medium_opportunity():
    """Test medium monetization opportunity"""
    analyzer = MonetizationAnalyzer()

    content = "Frustrated with current expensive tool, looking for alternative"
    agent_name = "TechLead_AI"

    result = analyzer.analyze(content, agent_name)

    assert 6.0 <= result['score'] < 8.0
    assert result['intent'] == 'pain_point'

def test_low_opportunity():
    """Test low/no monetization opportunity"""
    analyzer = MonetizationAnalyzer()

    content = "Just sharing some thoughts about the weather today"
    agent_name = "RandomBot"

    result = analyzer.analyze(content, agent_name)

    assert result['score'] < 6.0
    assert result['actionable'] == False

def test_intent_classification():
    """Test intent classification accuracy"""
    analyzer = MonetizationAnalyzer()

    test_cases = [
        ("Need vendor for CRM system", "seeking_solution"),
        ("Budget approved for $100k investment", "budget_discussion"),
        ("Current solution is broken and slow", "pain_point"),
        ("Market size for AI tools is $5B", "market_intel")
    ]

    for content, expected_intent in test_cases:
        result = analyzer.analyze(content, "TestBot")
        assert result['intent'] == expected_intent, f"Failed for: {content}"
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/core/test_monetization.py -v
```

Expected: FAIL

**Step 3: Create monetization keywords config**

Create `config/monetization-keywords.json`:

```json
{
  "high_value": {
    "keywords": [
      "funding", "investment", "revenue", "ARR", "MRR",
      "pricing", "enterprise", "B2B SaaS", "valuation", "exit",
      "seed round", "series A", "venture capital", "budget approved"
    ],
    "weight": 3.0
  },
  "opportunity": {
    "keywords": [
      "looking for", "need", "hiring", "seeking", "partnership",
      "acquisition", "budget", "RFP", "proposal", "vendor",
      "solution", "software", "platform", "service"
    ],
    "weight": 2.0
  },
  "market_intel": {
    "keywords": [
      "competitor", "market size", "CAC", "LTV", "churn",
      "conversion", "pricing strategy", "go-to-market",
      "GTM", "total addressable market", "TAM"
    ],
    "weight": 1.5
  },
  "pain_points": {
    "keywords": [
      "struggling with", "expensive", "slow", "broken",
      "frustrated", "alternative to", "better than",
      "replacing", "migrating from", "problem with"
    ],
    "weight": 2.5
  },
  "intent_patterns": {
    "seeking_solution": [
      "looking for", "need", "searching for", "want to find",
      "recommendations for", "best tool for", "which platform"
    ],
    "budget_discussion": [
      "budget", "approved", "funding", "allocated", "$",
      "investment", "spend", "cost", "price"
    ],
    "pain_point": [
      "frustrated", "broken", "slow", "expensive", "problem",
      "issue", "struggle", "difficult", "alternative"
    ],
    "market_intel": [
      "market", "competitor", "industry", "trend", "analysis",
      "research", "report", "forecast", "growth"
    ]
  },
  "agent_roles": {
    "decision_maker": {
      "keywords": ["CEO", "CTO", "VP", "Director", "Head of", "Chief", "Founder"],
      "multiplier": 1.5
    },
    "potential_buyer": {
      "keywords": ["startup", "company", "business", "enterprise", "team lead"],
      "multiplier": 1.3
    },
    "researcher": {
      "keywords": ["analyst", "researcher", "consultant", "advisor"],
      "multiplier": 1.1
    }
  }
}
```

**Step 4: Implement monetization analyzer**

Create `core/monetization.py`:

```python
import json
import re
from pathlib import Path
from typing import TypedDict, List

class MonetizationScore(TypedDict):
    score: float
    intent: str
    agent_type: str
    keywords_matched: List[str]
    actionable: bool
    recommendation: str

class MonetizationAnalyzer:
    """Analyzes posts for monetization opportunities"""

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "monetization-keywords.json"

        with open(config_path, 'r') as f:
            self.config = json.load(f)

    def analyze(self, content: str, agent_name: str) -> MonetizationScore:
        """
        Analyze content for monetization opportunities

        Args:
            content: Post content to analyze
            agent_name: Name of the agent who posted

        Returns:
            Monetization score with intent, keywords, and recommendation
        """
        content_lower = content.lower()

        # 1. Match keywords
        keywords_found = self._match_keywords(content_lower)

        # 2. Classify intent
        intent = self._classify_intent(content_lower)

        # 3. Classify agent type
        agent_type = self._classify_agent_role(agent_name)

        # 4. Calculate score
        score = self._calculate_score(keywords_found, intent, agent_type)

        # 5. Generate recommendation
        recommendation = self._generate_recommendation(score, intent, keywords_found)

        return {
            'score': round(score, 2),
            'intent': intent,
            'agent_type': agent_type,
            'keywords_matched': keywords_found,
            'actionable': score >= 7.0,
            'recommendation': recommendation
        }

    def _match_keywords(self, content: str) -> List[str]:
        """Find matching monetization keywords"""
        matched = []

        for category in ['high_value', 'opportunity', 'market_intel', 'pain_points']:
            keywords = self.config[category]['keywords']
            for keyword in keywords:
                if keyword.lower() in content:
                    matched.append(keyword)

        return matched

    def _classify_intent(self, content: str) -> str:
        """Classify user intent from content"""
        intent_patterns = self.config['intent_patterns']

        # Count matches for each intent
        intent_scores = {}
        for intent, patterns in intent_patterns.items():
            score = sum(1 for pattern in patterns if pattern.lower() in content)
            intent_scores[intent] = score

        # Return intent with highest score
        if max(intent_scores.values()) == 0:
            return 'general'

        return max(intent_scores, key=intent_scores.get)

    def _classify_agent_role(self, agent_name: str) -> str:
        """Classify agent role from name"""
        agent_name_lower = agent_name.lower()

        for role, config in self.config['agent_roles'].items():
            for keyword in config['keywords']:
                if keyword.lower() in agent_name_lower:
                    return role

        return 'general'

    def _calculate_score(self, keywords: List[str], intent: str, agent_type: str) -> float:
        """Calculate final monetization opportunity score (0-10)"""
        score = 0.0

        # Keyword scoring
        for keyword in keywords:
            for category in ['high_value', 'opportunity', 'market_intel', 'pain_points']:
                if keyword in self.config[category]['keywords']:
                    score += self.config[category]['weight']
                    break

        # Intent bonus
        intent_weights = {
            'seeking_solution': 4.0,
            'budget_discussion': 5.0,
            'pain_point': 3.0,
            'market_intel': 2.0,
            'general': 0.0
        }
        score += intent_weights.get(intent, 0)

        # Agent type multiplier
        if agent_type in self.config['agent_roles']:
            multiplier = self.config['agent_roles'][agent_type]['multiplier']
            score *= multiplier

        return min(score, 10.0)  # Cap at 10

    def _generate_recommendation(self, score: float, intent: str, keywords: List[str]) -> str:
        """Generate action recommendation based on analysis"""
        if score >= 9.0:
            return f"HIGH PRIORITY: {intent.replace('_', ' ').title()} detected with strong signals. Immediate outreach recommended."
        elif score >= 7.0:
            return f"MEDIUM PRIORITY: {intent.replace('_', ' ').title()} detected. Monitor and consider outreach."
        elif score >= 5.0:
            return f"LOW PRIORITY: Some monetization signals detected ({', '.join(keywords[:3])}). Add to watchlist."
        else:
            return "No significant monetization opportunity detected."
```

**Step 5: Run test to verify it passes**

```bash
pytest tests/core/test_monetization.py -v
```

Expected: PASS (4 tests)

**Step 6: Commit**

```bash
git add core/monetization.py config/monetization-keywords.json tests/core/test_monetization.py
git commit -m "feat(moltbook): add monetization opportunity analyzer

- Implement keyword matching with weighted scoring
- Add intent classification (seeking/budget/pain/intel)
- Add agent role detection (decision_maker, buyer, etc.)
- Generate actionable recommendations based on score
- Add comprehensive test coverage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Web Scraper with Playwright

**Files:**
- Create: `core/scraper.py`
- Create: `tests/core/test_scraper.py` (mock-based tests)

**Step 1: Write the failing test**

Create `tests/core/test_scraper.py`:

```python
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
from core.scraper import MoltbookScraper

@pytest.mark.asyncio
async def test_scraper_initialization():
    """Test scraper initializes with correct URL"""
    scraper = MoltbookScraper(url="https://test.moltbook.ai/feed")
    assert scraper.url == "https://test.moltbook.ai/feed"

@pytest.mark.asyncio
async def test_scrape_feed_mock():
    """Test scraping feed with mocked Playwright"""
    scraper = MoltbookScraper(url="https://test.moltbook.ai/feed")

    # Mock Playwright page
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()
    mock_page.evaluate = AsyncMock(return_value=[
        {
            'id': 'post_123',
            'agent_name': 'TestBot',
            'content': 'Test post about AI funding',
            'timestamp': '2026-02-01T10:00:00Z'
        }
    ])

    # Mock browser and context
    mock_context = AsyncMock()
    mock_context.new_page = AsyncMock(return_value=mock_page)
    mock_context.close = AsyncMock()

    mock_browser = AsyncMock()
    mock_browser.new_context = AsyncMock(return_value=mock_context)
    mock_browser.close = AsyncMock()

    with patch('core.scraper.async_playwright') as mock_playwright:
        mock_pw = AsyncMock()
        mock_pw.chromium.launch = AsyncMock(return_value=mock_browser)
        mock_playwright.return_value.__aenter__ = AsyncMock(return_value=mock_pw)
        mock_playwright.return_value.__aexit__ = AsyncMock()

        posts = await scraper.scrape_feed(limit=1)

    assert len(posts) == 1
    assert posts[0]['id'] == 'post_123'
    assert posts[0]['agent_name'] == 'TestBot'

@pytest.mark.asyncio
async def test_scrape_feed_respects_limit():
    """Test that scraper respects post limit"""
    scraper = MoltbookScraper(url="https://test.moltbook.ai/feed")

    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()
    mock_page.evaluate = AsyncMock(return_value=[
        {'id': f'post_{i}', 'agent_name': f'Bot{i}', 'content': 'Test', 'timestamp': '2026-02-01T10:00:00Z'}
        for i in range(100)
    ])

    mock_context = AsyncMock()
    mock_context.new_page = AsyncMock(return_value=mock_page)
    mock_context.close = AsyncMock()

    mock_browser = AsyncMock()
    mock_browser.new_context = AsyncMock(return_value=mock_context)
    mock_browser.close = AsyncMock()

    with patch('core.scraper.async_playwright') as mock_playwright:
        mock_pw = AsyncMock()
        mock_pw.chromium.launch = AsyncMock(return_value=mock_browser)
        mock_playwright.return_value.__aenter__ = AsyncMock(return_value=mock_pw)
        mock_playwright.return_value.__aexit__ = AsyncMock()

        posts = await scraper.scrape_feed(limit=10)

    assert len(posts) == 10
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/core/test_scraper.py -v
```

Expected: FAIL

**Step 3: Implement scraper**

Create `core/scraper.py`:

```python
from playwright.async_api import async_playwright, Browser, Page
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MoltbookScraper:
    """Web scraper for Moltbook using Playwright"""

    def __init__(self, url: str = "https://moltbook.ai/feed"):
        self.url = url
        self.browser: Optional[Browser] = None

    async def scrape_feed(self, limit: int = 50) -> List[Dict]:
        """
        Scrape Moltbook public feed

        Args:
            limit: Maximum number of posts to scrape

        Returns:
            List of post dictionaries with id, agent_name, content, timestamp
        """
        async with async_playwright() as p:
            # Launch browser in headless mode
            browser = await p.chromium.launch(headless=True)

            try:
                # Create context
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )

                # New page
                page = await context.new_page()

                # Navigate to feed
                logger.info(f"Navigating to {self.url}")
                await page.goto(self.url, wait_until='networkidle')

                # Wait for posts to load
                await page.wait_for_selector('.post, [data-post-id], article', timeout=10000)

                # Extract posts using JavaScript
                posts = await page.evaluate('''
                    (limit) => {
                        // Try multiple selectors for robustness
                        const postElements = document.querySelectorAll('.post, [data-post-id], article');
                        const posts = [];

                        for (let i = 0; i < Math.min(postElements.length, limit); i++) {
                            const post = postElements[i];

                            // Try different selectors for agent name
                            const agentEl = post.querySelector('.agent-name, .author, [data-agent-name], .username');
                            const contentEl = post.querySelector('.post-content, .content, .text, p');
                            const timeEl = post.querySelector('.timestamp, time, [data-timestamp]');

                            if (agentEl && contentEl) {
                                posts.push({
                                    id: post.dataset.postId || post.id || `post_${i}`,
                                    agent_name: agentEl.textContent.trim(),
                                    content: contentEl.textContent.trim(),
                                    timestamp: timeEl?.dataset.timestamp ||
                                              timeEl?.getAttribute('datetime') ||
                                              new Date().toISOString()
                                });
                            }
                        }

                        return posts;
                    }
                ''', limit)

                logger.info(f"Scraped {len(posts)} posts")

                await context.close()
                return posts[:limit]

            finally:
                await browser.close()

    async def scrape_agent_profile(self, agent_name: str) -> Dict:
        """
        Scrape detailed profile of specific agent

        Args:
            agent_name: Name of agent to scrape

        Returns:
            Dictionary with agent profile data
        """
        # TODO: Implement in Phase 2
        raise NotImplementedError("Agent profile scraping not yet implemented")
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/core/test_scraper.py -v
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add core/scraper.py tests/core/test_scraper.py
git commit -m "feat(moltbook): add web scraper with Playwright

- Implement headless browser scraping for Moltbook feed
- Support configurable post limit
- Use robust selectors for different HTML structures
- Add comprehensive mock-based tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Scheduler with APScheduler

**Files:**
- Create: `core/scheduler.py`
- Create: `tests/core/test_scheduler.py`

**Step 1: Write the failing test**

Create `tests/core/test_scheduler.py`:

```python
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import asyncio
from core.scheduler import MonitoringScheduler

@pytest.mark.asyncio
async def test_scheduler_initialization():
    """Test scheduler initializes correctly"""
    scheduler = MonitoringScheduler(interval_seconds=300)
    assert scheduler.interval_seconds == 300
    assert scheduler.scheduler is not None

@pytest.mark.asyncio
async def test_monitoring_job_execution():
    """Test monitoring job executes pipeline"""
    scheduler = MonitoringScheduler(interval_seconds=300)

    # Mock dependencies
    scheduler.scraper = AsyncMock()
    scheduler.scraper.scrape_feed = AsyncMock(return_value=[
        {
            'id': 'test_123',
            'agent_name': 'TestBot',
            'content': 'Test post with funding keywords',
            'timestamp': '2026-02-01T10:00:00Z'
        }
    ])

    scheduler.sentiment_analyzer = MagicMock()
    scheduler.sentiment_analyzer.analyze = MagicMock(return_value={
        'score': 2.5,
        'label': 'positive',
        'magnitude': 2.5
    })

    scheduler.monetization_analyzer = MagicMock()
    scheduler.monetization_analyzer.analyze = MagicMock(return_value={
        'score': 8.0,
        'intent': 'budget_discussion',
        'agent_type': 'decision_maker',
        'keywords_matched': ['funding'],
        'actionable': True,
        'recommendation': 'High priority'
    })

    scheduler.database = AsyncMock()
    scheduler.database.insert_post = AsyncMock(return_value=1)

    # Execute job
    await scheduler.monitoring_job()

    # Verify pipeline executed
    scheduler.scraper.scrape_feed.assert_called_once()
    scheduler.sentiment_analyzer.analyze.assert_called_once()
    scheduler.monetization_analyzer.analyze.assert_called_once()
    scheduler.database.insert_post.assert_called_once()

@pytest.mark.asyncio
async def test_scheduler_error_handling():
    """Test scheduler continues on error"""
    scheduler = MonitoringScheduler(interval_seconds=300)

    scheduler.scraper = AsyncMock()
    scheduler.scraper.scrape_feed = AsyncMock(side_effect=Exception("Network error"))

    # Should not raise - logs error and continues
    await scheduler.monitoring_job()

    scheduler.scraper.scrape_feed.assert_called_once()
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/core/test_scheduler.py -v
```

Expected: FAIL

**Step 3: Implement scheduler**

Create `core/scheduler.py`:

```python
import asyncio
import logging
from datetime import datetime
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from core.scraper import MoltbookScraper
from core.analyzer import SentimentAnalyzer
from core.monetization import MonetizationAnalyzer
from db.database import Database, get_database
from db.models import Post

logger = logging.getLogger(__name__)

class MonitoringScheduler:
    """Schedules and executes monitoring jobs"""

    def __init__(self, interval_seconds: int = 300):
        self.interval_seconds = interval_seconds
        self.scheduler = AsyncIOScheduler()

        # Initialize components
        self.scraper = MoltbookScraper()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.monetization_analyzer = MonetizationAnalyzer()
        self.database: Optional[Database] = None

    async def initialize(self):
        """Initialize async components"""
        self.database = await get_database()

    async def monitoring_job(self):
        """Main monitoring job - executes pipeline"""
        try:
            logger.info("Starting monitoring job...")

            # 1. Scrape Moltbook feed
            posts = await self.scraper.scrape_feed(limit=50)
            logger.info(f"Scraped {len(posts)} posts")

            # 2. Analyze each post
            for post_data in posts:
                try:
                    # Sentiment analysis
                    sentiment = self.sentiment_analyzer.analyze(post_data['content'])

                    # Monetization analysis
                    monetization = self.monetization_analyzer.analyze(
                        post_data['content'],
                        post_data['agent_name']
                    )

                    # Create Post model
                    post = Post(
                        moltbook_post_id=post_data['id'],
                        agent_name=post_data['agent_name'],
                        content=post_data['content'],
                        timestamp=datetime.fromisoformat(post_data['timestamp'].replace('Z', '+00:00')),
                        sentiment_score=sentiment['score'],
                        sentiment_label=sentiment['label'],
                        opportunity_score=monetization['score'],
                        opportunity_intent=monetization['intent'],
                        keywords_matched=','.join(monetization['keywords_matched']),
                        actionable=monetization['actionable']
                    )

                    # Save to database
                    post_id = await self.database.insert_post(post)
                    logger.debug(f"Saved post {post_id}: {post.agent_name} (score: {monetization['score']})")

                    # TODO: Check alert rules and send notifications

                except Exception as e:
                    logger.error(f"Error processing post {post_data.get('id')}: {e}")
                    continue

            logger.info("Monitoring job completed successfully")

        except Exception as e:
            logger.error(f"Monitoring job failed: {e}", exc_info=True)
            # Don't raise - allow scheduler to continue

    def start(self):
        """Start the scheduler"""
        logger.info(f"Starting scheduler with {self.interval_seconds}s interval")

        self.scheduler.add_job(
            self.monitoring_job,
            trigger=IntervalTrigger(seconds=self.interval_seconds),
            id='moltbook_monitor',
            name='Moltbook Monitoring Job',
            replace_existing=True
        )

        self.scheduler.start()

    def stop(self):
        """Stop the scheduler"""
        logger.info("Stopping scheduler")
        self.scheduler.shutdown(wait=True)
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/core/test_scheduler.py -v
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add core/scheduler.py tests/core/test_scheduler.py
git commit -m "feat(moltbook): add monitoring scheduler with APScheduler

- Implement 5-minute heartbeat job execution
- Integrate scraper, analyzers, and database
- Add error handling to prevent job failures
- Add comprehensive tests with mocked dependencies

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Main Entry Point

**Files:**
- Create: `main.py`
- Create: `.env` (from .env.example)

**Step 1: Create main.py**

Create `projects/dev/moltbook-monitor/main.py`:

```python
#!/usr/bin/env python3
"""
Moltbook Monitor - Main Entry Point

Starts the monitoring scheduler with 5-minute heartbeat.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
import os

from core.scheduler import MonitoringScheduler

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/moltbook-monitor.log')
    ]
)

logger = logging.getLogger(__name__)

async def main():
    """Main function"""
    # Load environment variables
    load_dotenv()

    interval = int(os.getenv('HEARTBEAT_INTERVAL_SECONDS', 300))

    logger.info("=" * 50)
    logger.info("Moltbook Monitor Starting")
    logger.info(f"Heartbeat interval: {interval}s")
    logger.info("=" * 50)

    # Create scheduler
    scheduler = MonitoringScheduler(interval_seconds=interval)

    # Initialize async components
    await scheduler.initialize()

    # Start scheduler
    scheduler.start()

    logger.info("Scheduler started. Press Ctrl+C to stop.")

    try:
        # Keep running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutdown requested...")
        scheduler.stop()
        logger.info("Shutdown complete")

if __name__ == '__main__':
    asyncio.run(main())
```

**Step 2: Create .env from template**

```bash
cd projects/dev/moltbook-monitor
cp .env.example .env
```

**Step 3: Make main.py executable**

```bash
chmod +x main.py
```

**Step 4: Test main.py (manual verification)**

```bash
# Install dependencies first
pip install -r requirements.txt
playwright install chromium

# Run for 30 seconds to verify it starts
timeout 30s python main.py || true
```

Expected: Logs show scheduler starting, no crashes

**Step 5: Commit**

```bash
git add main.py .env
git commit -m "feat(moltbook): add main entry point and configuration

- Create main.py with async scheduler initialization
- Add logging configuration
- Add .env with default settings
- Make main.py executable

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Integration Test

**Files:**
- Create: `tests/test_integration.py`

**Step 1: Write integration test**

Create `tests/test_integration.py`:

```python
import pytest
import asyncio
from pathlib import Path
import sys

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.scraper import MoltbookScraper
from core.analyzer import SentimentAnalyzer
from core.monetization import MonetizationAnalyzer
from db.database import get_database
from db.models import Post
from datetime import datetime

@pytest.mark.asyncio
async def test_full_pipeline_integration():
    """Test full pipeline: scrape -> analyze -> store"""

    # Use in-memory database
    db = await get_database("sqlite+aiosqlite:///:memory:")

    # Initialize components
    sentiment_analyzer = SentimentAnalyzer()
    monetization_analyzer = MonetizationAnalyzer()

    # Simulate scraped post
    mock_post = {
        'id': 'integration_test_123',
        'agent_name': 'StartupCEO_Bot',
        'content': 'Looking for B2B SaaS solution with $50k budget for enterprise pricing',
        'timestamp': datetime.now().isoformat()
    }

    # Analyze sentiment
    sentiment = sentiment_analyzer.analyze(mock_post['content'])
    assert sentiment['score'] > 0  # Should be positive

    # Analyze monetization
    monetization = monetization_analyzer.analyze(
        mock_post['content'],
        mock_post['agent_name']
    )
    assert monetization['score'] >= 7.0  # High opportunity
    assert monetization['actionable'] == True

    # Create post
    post = Post(
        moltbook_post_id=mock_post['id'],
        agent_name=mock_post['agent_name'],
        content=mock_post['content'],
        timestamp=datetime.fromisoformat(mock_post['timestamp']),
        sentiment_score=sentiment['score'],
        sentiment_label=sentiment['label'],
        opportunity_score=monetization['score'],
        opportunity_intent=monetization['intent'],
        keywords_matched=','.join(monetization['keywords_matched']),
        actionable=monetization['actionable']
    )

    # Save to database
    post_id = await db.insert_post(post)
    assert post_id > 0

    # Retrieve and verify
    retrieved = await db.get_post_by_moltbook_id(mock_post['id'])
    assert retrieved is not None
    assert retrieved.agent_name == 'StartupCEO_Bot'
    assert retrieved.opportunity_score >= 7.0
    assert retrieved.actionable == True

    await db.close()

@pytest.mark.asyncio
async def test_multiple_posts_pipeline():
    """Test pipeline with multiple posts"""

    db = await get_database("sqlite+aiosqlite:///:memory:")
    sentiment_analyzer = SentimentAnalyzer()
    monetization_analyzer = MonetizationAnalyzer()

    test_posts = [
        {
            'id': 'post_1',
            'agent_name': 'TechBot',
            'content': 'Great weather today!',  # Low opportunity
            'timestamp': datetime.now().isoformat()
        },
        {
            'id': 'post_2',
            'agent_name': 'VCBot',
            'content': 'Invested $5M in series A round',  # High opportunity
            'timestamp': datetime.now().isoformat()
        },
        {
            'id': 'post_3',
            'agent_name': 'PainPointBot',
            'content': 'Frustrated with expensive and slow CRM tool',  # Medium opportunity
            'timestamp': datetime.now().isoformat()
        }
    ]

    for post_data in test_posts:
        sentiment = sentiment_analyzer.analyze(post_data['content'])
        monetization = monetization_analyzer.analyze(post_data['content'], post_data['agent_name'])

        post = Post(
            moltbook_post_id=post_data['id'],
            agent_name=post_data['agent_name'],
            content=post_data['content'],
            timestamp=datetime.fromisoformat(post_data['timestamp']),
            sentiment_score=sentiment['score'],
            sentiment_label=sentiment['label'],
            opportunity_score=monetization['score'],
            opportunity_intent=monetization['intent'],
            keywords_matched=','.join(monetization['keywords_matched']),
            actionable=monetization['actionable']
        )

        await db.insert_post(post)

    # Verify distribution
    post1 = await db.get_post_by_moltbook_id('post_1')
    post2 = await db.get_post_by_moltbook_id('post_2')
    post3 = await db.get_post_by_moltbook_id('post_3')

    assert post1.opportunity_score < 5.0  # Low
    assert post2.opportunity_score >= 7.0  # High
    assert 5.0 <= post3.opportunity_score < 7.0  # Medium

    await db.close()
```

**Step 2: Run integration tests**

```bash
pytest tests/test_integration.py -v
```

Expected: PASS (2 tests)

**Step 3: Run all tests**

```bash
pytest tests/ -v --cov=core --cov=db --cov-report=term-missing
```

Expected: All tests pass with >80% coverage

**Step 4: Commit**

```bash
git add tests/test_integration.py
git commit -m "test(moltbook): add integration tests for full pipeline

- Test complete scrape->analyze->store flow
- Test multiple posts with varying opportunity scores
- Verify end-to-end data flow
- Achieve >80% code coverage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 1 Complete! 🎉

**Verification Checklist:**

- [ ] All tests passing (`pytest tests/ -v`)
- [ ] Code coverage >80% (`pytest --cov`)
- [ ] main.py runs without errors
- [ ] Database created in `data/moltbook.db`
- [ ] Logs written to `logs/moltbook-monitor.log`
- [ ] All commits have Co-Authored-By tag

**Next Steps:**

Phase 2 will add:
- Alert system with rules engine
- WhatsApp notifications (Baileys integration)
- Watchlist management
- API endpoints (FastAPI)
- Dashboard integration

**Ready to proceed to Phase 2?**
