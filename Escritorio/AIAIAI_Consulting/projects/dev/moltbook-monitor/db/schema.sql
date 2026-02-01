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
