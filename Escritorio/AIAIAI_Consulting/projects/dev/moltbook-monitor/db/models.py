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
