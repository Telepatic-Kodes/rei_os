# Diseño: Agente de Monitoreo Moltbook

**Fecha**: 2026-02-01
**Proyecto**: AIAIAI Consulting - Extensión `/projects/dev`
**Objetivo**: Sistema de monitoreo proactivo de Moltbook enfocado 100% en identificación de oportunidades de monetización

## Resumen Ejecutivo

Sistema de monitoreo autónomo que scraped Moltbook cada 5 minutos para detectar oportunidades de monetización en tiempo real. Integra OpenClaw (Puppeteer), análisis de sentimiento AFINN-165, auto-discovery de agentes relevantes, y alertas WhatsApp configurables.

**ROI esperado**: Identificación temprana de oportunidades de negocio, intelligence competitivo, detección de pain points del mercado.

---

## 1. Arquitectura General

### 1.1 Estructura del Proyecto

```
projects/dev/
├── clawdbot/              # Existente
├── moltbook-monitor/      # NUEVO
│   ├── core/
│   │   ├── scraper.py         # Puppeteer wrapper + OpenClaw integration
│   │   ├── analyzer.py        # Sentiment analysis AFINN-165
│   │   ├── monetization.py    # Monetization opportunity scoring
│   │   ├── watchlist.py       # Agent tracking + auto-discovery
│   │   └── scheduler.py       # Heartbeat every 5min
│   ├── api/
│   │   ├── routes.py          # FastAPI endpoints
│   │   └── models.py          # Pydantic schemas
│   ├── db/
│   │   ├── schema.sql         # SQLite schema
│   │   └── queries.py         # SQLAlchemy async queries
│   ├── notifications/
│   │   └── whatsapp.py        # Reutiliza Baileys de clawdbot
│   ├── config/
│   │   ├── moltbook-watchlist.json
│   │   └── alert-rules.json
│   ├── requirements.txt
│   ├── Dockerfile
│   └── main.py
├── shared/                # Código compartido entre módulos
└── docker-compose.yml     # Actualizado con nuevos servicios
```

### 1.2 Componentes Principales

1. **Scraper** - Puppeteer headless que navega Moltbook cada 5min
2. **Monetization Analyzer** - Procesa posts con scoring de oportunidades (0-10)
3. **Sentiment Analyzer** - AFINN-165 para contexto emocional
4. **Watchlist Manager** - Mantiene lista manual + sugiere agentes vía ML
5. **Scheduler** - Cron job que ejecuta pipeline completo
6. **API** - FastAPI expone datos para dashboard
7. **Notifier** - Envía alertas WhatsApp según reglas configurables

### 1.3 Flujo de Datos

```
┌─────────────┐
│  Scheduler  │  (cada 5min)
└──────┬──────┘
       │
       v
┌─────────────┐
│  Scraper    │  → Puppeteer → Moltbook feed (últimos 50 posts)
└──────┬──────┘
       │ Raw HTML
       v
┌─────────────┐
│   Parser    │  → Extrae: agent_name, content, timestamp
└──────┬──────┘
       │ Structured data
       v
┌─────────────┐
│  Analyzers  │  → Sentiment (AFINN) + Monetization Score
└──────┬──────┘
       │ Scored posts
       v
┌─────────────┐
│  SQLite DB  │  → Almacena posts + metrics
└──────┬──────┘
       │
       ├──→ Alert Engine → WhatsApp (si score >= 8.0)
       │
       └──→ JSON Sync → data/moltbook.json (para dashboard)
```

---

## 2. Modelo de Datos

### 2.1 Schema SQLite: `projects/dev/moltbook.db`

```sql
-- Posts scrapeados de Moltbook
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moltbook_post_id TEXT UNIQUE NOT NULL,
    agent_name TEXT NOT NULL,
    agent_id TEXT,
    content TEXT NOT NULL,
    timestamp DATETIME NOT NULL,

    -- Sentiment analysis
    sentiment_score REAL,           -- AFINN-165: -5 a +5
    sentiment_label TEXT,           -- 'positive', 'neutral', 'negative'

    -- Monetization analysis
    opportunity_score REAL,         -- 0-10 scale
    opportunity_intent TEXT,        -- 'seeking_solution', 'budget_discussion', etc.
    keywords_matched JSON,          -- ["funding", "pricing", ...]
    actionable BOOLEAN DEFAULT 0,   -- opportunity_score >= 7.0

    is_trending BOOLEAN DEFAULT 0,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_agent (agent_name),
    INDEX idx_timestamp (timestamp),
    INDEX idx_opportunity (opportunity_score),
    INDEX idx_actionable (actionable)
);

-- Agentes en watchlist
CREATE TABLE watchlist_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT UNIQUE NOT NULL,
    agent_id TEXT,
    category TEXT,                  -- 'manual', 'auto-discovered', 'suggested'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    keywords JSON,                  -- ["AI", "blockchain", ...]
    alert_enabled BOOLEAN DEFAULT 1,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME,

    -- Monetization context
    agent_type TEXT,                -- 'potential_buyer', 'decision_maker', 'researcher', 'competitor'
    avg_opportunity_score REAL,
    total_opportunities INTEGER DEFAULT 0
);

-- Alertas enviadas
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT NOT NULL,       -- 'monetization_opportunity', 'agent_active', etc.
    severity TEXT NOT NULL,         -- 'info', 'warning', 'critical'
    message TEXT NOT NULL,
    whatsapp_sent BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_post_id INTEGER,
    opportunity_score REAL,
    FOREIGN KEY (related_post_id) REFERENCES posts(id)
);

-- Métricas agregadas (sincroniza a data/moltbook.json)
CREATE TABLE metrics_hourly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hour DATETIME NOT NULL,
    total_posts INTEGER,
    avg_sentiment REAL,
    avg_opportunity_score REAL,
    high_value_opportunities INTEGER,  -- score >= 8.0
    trending_topics JSON,
    active_agents INTEGER,
    alerts_sent INTEGER
);
```

### 2.2 Sincronización a JSON

**Archivo**: `data/moltbook.json`

Exportación cada hora para consumo del dashboard Next.js:

```json
{
  "last_updated": "2026-02-01T14:00:00Z",
  "summary": {
    "total_posts_today": 1247,
    "avg_opportunity_score": 6.3,
    "high_value_opportunities": 23,
    "watchlist_agents_active": 8,
    "alerts_sent_today": 12
  },
  "trending_keywords": [
    {"keyword": "funding", "count": 45, "avg_score": 8.2},
    {"keyword": "AI automation", "count": 38, "avg_score": 7.5}
  ],
  "hourly_metrics": [
    {"hour": "2026-02-01T13:00:00Z", "posts": 52, "opportunities": 3},
    // ... últimas 24 horas
  ]
}
```

---

## 3. Pipeline de Scraping y Análisis

### 3.1 Scraper: OpenClaw + Puppeteer

```python
# core/scraper.py

OPENCLAW_CONFIG = {
    'gateway_port': 18789,
    'browser_control_port': 18791,
    'canvas_server_port': 18793
}

class MoltbookScraper:
    def __init__(self):
        self.openclaw_url = f"http://localhost:{OPENCLAW_CONFIG['gateway_port']}"

    async def scrape_feed(self, limit=50) -> List[RawPost]:
        """Scrapes Moltbook public feed"""
        # 1. Launch Puppeteer via OpenClaw browser control
        browser = await self._launch_browser()

        # 2. Navigate to Moltbook feed
        page = await browser.new_page()
        await page.goto('https://moltbook.ai/feed')

        # 3. Extract posts (agent_name, content, timestamp)
        posts = await page.evaluate('''
            () => {
                return Array.from(document.querySelectorAll('.post')).map(post => ({
                    id: post.dataset.postId,
                    agent_name: post.querySelector('.agent-name').textContent,
                    content: post.querySelector('.post-content').textContent,
                    timestamp: post.querySelector('.timestamp').dataset.timestamp
                }));
            }
        ''')

        await browser.close()
        return posts[:limit]

    async def scrape_agent_profile(self, agent_name: str) -> AgentProfile:
        """Deep scrape of specific agent's profile"""
        # For watchlist agents only
        # Gets full history, bio, interaction patterns
        pass
```

### 3.2 Monetization Analyzer

```python
# core/monetization.py

class MonetizationAnalyzer:
    def __init__(self):
        self.keywords = self._load_monetization_keywords()

    def analyze_opportunity(self, post: dict) -> MonetizationScore:
        """Calcula opportunity score (0-10) y extrae señales de monetización"""

        # 1. Keyword matching con pesos
        keywords_found = self._match_keywords(post['content'])
        keyword_score = sum([kw['weight'] for kw in keywords_found])

        # 2. Intent detection (NLP)
        intent = self._classify_intent(post['content'])
        # 'seeking_solution', 'budget_discussion', 'pain_point', 'market_intel'

        # 3. Agent role analysis
        agent_type = self._classify_agent_role(post['agent_name'])
        # 'potential_buyer', 'decision_maker', 'researcher', 'competitor'

        # 4. Calculate final score
        opportunity_score = self._calculate_score(
            keywords=keywords_found,
            intent=intent,
            agent_type=agent_type,
            content=post['content']
        )

        return MonetizationScore(
            score=opportunity_score,
            intent=intent,
            agent_type=agent_type,
            keywords_matched=keywords_found,
            actionable=opportunity_score >= 7.0,
            recommendation=self._generate_recommendation(post, opportunity_score)
        )

    def _calculate_score(self, **kwargs) -> float:
        """Scoring algorithm"""
        score = 0.0

        # High-value keywords: +3 cada uno
        high_value_kw = [k for k in kwargs['keywords'] if k['category'] == 'high_value']
        score += len(high_value_kw) * 3

        # Opportunity keywords: +2 cada uno
        opportunity_kw = [k for k in kwargs['keywords'] if k['category'] == 'opportunity']
        score += len(opportunity_kw) * 2

        # Intent bonuses
        intent_weights = {
            'seeking_solution': 4.0,
            'budget_discussion': 5.0,
            'pain_point': 3.0,
            'market_intel': 2.0
        }
        score += intent_weights.get(kwargs['intent'], 0)

        # Agent type multiplier
        if kwargs['agent_type'] == 'decision_maker':
            score *= 1.5
        elif kwargs['agent_type'] == 'potential_buyer':
            score *= 1.3

        return min(score, 10.0)  # Cap at 10

    def _load_monetization_keywords(self) -> dict:
        """Carga keywords desde config"""
        return {
            "high_value": [
                "funding", "investment", "revenue", "ARR", "MRR",
                "pricing", "enterprise", "B2B SaaS", "valuation", "exit",
                "seed round", "series A", "venture capital"
            ],
            "opportunity": [
                "looking for", "need", "hiring", "seeking", "partnership",
                "acquisition", "budget", "RFP", "proposal", "vendor"
            ],
            "market_intel": [
                "competitor", "market size", "CAC", "LTV", "churn",
                "conversion", "pricing strategy", "go-to-market"
            ],
            "pain_points": [
                "struggling with", "expensive", "slow", "broken",
                "frustrated", "alternative to", "better than"
            ]
        }
```

### 3.3 Sentiment Analyzer

```python
# core/analyzer.py

from afinn import Afinn

class SentimentAnalyzer:
    def __init__(self):
        self.afinn = Afinn(language='en')

    def analyze_post(self, content: str) -> SentimentScore:
        """Returns sentiment score (-5 to +5) and label"""
        score = self.afinn.score(content)

        # Classify
        if score > 1:
            label = 'positive'
        elif score < -1:
            label = 'negative'
        else:
            label = 'neutral'

        return SentimentScore(
            score=score,
            label=label,
            magnitude=abs(score)
        )
```

### 3.4 Scheduler: Heartbeat

```python
# core/scheduler.py

import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

class MonitoringScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scraper = MoltbookScraper()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.monetization_analyzer = MonetizationAnalyzer()
        self.db = Database()

    async def monitoring_job(self):
        """Executed every 5 minutes"""
        try:
            # 1. Scrape Moltbook feed
            posts = await self.scraper.scrape_feed(limit=50)

            # 2. Analyze each post
            for post in posts:
                sentiment = self.sentiment_analyzer.analyze_post(post['content'])
                monetization = self.monetization_analyzer.analyze_opportunity(post)

                # 3. Save to DB
                await self.db.save_post(post, sentiment, monetization)

                # 4. Check alerts
                if monetization.actionable:
                    await self.trigger_alert(post, monetization)

            # 5. Update metrics
            await self.db.update_metrics()

            # 6. Sync to JSON
            await self.sync_to_json()

        except Exception as e:
            logger.error(f"Monitoring job failed: {e}")
            # Continue on next iteration

    def start(self):
        """Start scheduler"""
        self.scheduler.add_job(
            self.monitoring_job,
            'interval',
            minutes=5,
            id='moltbook_monitor'
        )
        self.scheduler.start()
```

---

## 4. Sistema de Alertas

### 4.1 Reglas de Alertas

**Archivo**: `config/alert-rules.json`

```json
{
  "rules": [
    {
      "id": "high_value_opportunity",
      "type": "monetization_opportunity",
      "condition": "opportunity_score >= 8.0",
      "severity": "critical",
      "destinations": ["whatsapp", "dashboard"],
      "cooldown_minutes": 5,
      "message_template": "💰 *Oportunidad de Alto Valor*\n\nAgent: {agent_name}\nScore: {score}/10\nIntent: {intent}\n\n{post_preview}\n\nAcción sugerida: {recommendation}"
    },
    {
      "id": "medium_opportunity",
      "type": "monetization_opportunity",
      "condition": "opportunity_score >= 7.0 AND opportunity_score < 8.0",
      "severity": "warning",
      "destinations": ["dashboard"],
      "cooldown_minutes": 15,
      "message_template": "📊 Oportunidad detectada (Score: {score}/10)"
    },
    {
      "id": "watchlist_agent_active",
      "type": "agent_activity",
      "condition": "watchlist_agent posts AND priority >= 'high'",
      "severity": "info",
      "destinations": ["whatsapp"],
      "cooldown_minutes": 15,
      "message_template": "👤 *Agente en Watchlist Activo*\n\n{agent_name} ({priority})\n\n{post_preview}"
    },
    {
      "id": "budget_discussion",
      "type": "intent_detected",
      "condition": "intent == 'budget_discussion'",
      "severity": "critical",
      "destinations": ["whatsapp"],
      "cooldown_minutes": 10,
      "message_template": "💵 *Discusión de Presupuesto Detectada*\n\n{agent_name}\n{post_preview}"
    },
    {
      "id": "pain_point_detected",
      "type": "intent_detected",
      "condition": "intent == 'pain_point' AND opportunity_score >= 6.0",
      "severity": "warning",
      "destinations": ["whatsapp", "dashboard"],
      "cooldown_minutes": 30,
      "message_template": "🔧 *Pain Point Detectado*\n\n{post_preview}"
    }
  ]
}
```

### 4.2 WhatsApp Notifier

```python
# notifications/whatsapp.py

class WhatsAppNotifier:
    def __init__(self):
        # Reutiliza la conexión Baileys de clawdbot
        self.baileys_client = get_shared_baileys_client()
        self.admin_phone = os.getenv('ADMIN_PHONE_NUMBER')

    async def send_alert(self, alert: Alert):
        """Envía alerta formateada a WhatsApp"""
        if not self._should_send(alert):
            return  # Cooldown activo

        message = self._format_message(alert)

        await self.baileys_client.send_message(
            recipient=self.admin_phone,
            text=message
        )

        # Mark as sent
        await self.db.mark_alert_sent(alert.id)
        self._update_cooldown(alert.type)

    def _should_send(self, alert: Alert) -> bool:
        """Check cooldown period"""
        last_sent = self.cooldowns.get(alert.type)
        if not last_sent:
            return True

        rule = self._get_rule(alert.type)
        cooldown_seconds = rule['cooldown_minutes'] * 60

        return (time.time() - last_sent) > cooldown_seconds
```

---

## 5. Watchlist Management y Auto-Discovery

### 5.1 Configuración de Watchlist

**Archivo**: `config/moltbook-watchlist.json`

```json
{
  "monetization_focus": {
    "keywords": {
      "high_value": [
        "funding", "investment", "revenue", "ARR", "MRR",
        "pricing", "enterprise", "B2B SaaS", "valuation", "exit"
      ],
      "opportunity": [
        "looking for", "need", "hiring", "seeking", "partnership",
        "acquisition", "budget", "RFP"
      ],
      "market_intel": [
        "competitor", "market size", "CAC", "LTV", "churn",
        "conversion", "pricing strategy"
      ],
      "pain_points": [
        "struggling with", "expensive", "slow", "broken",
        "frustrated", "alternative to"
      ]
    },
    "agent_types": {
      "potential_clients": ["startup", "founder", "CEO", "CTO", "VP"],
      "market_intelligence": ["analyst", "investor", "VC", "researcher"],
      "competition": []  // Añadir keywords de tu nicho
    }
  },
  "agents": [
    {
      "agent_name": "TechTrendBot",
      "category": "manual",
      "priority": "high",
      "keywords": ["AI", "automation", "Claude"],
      "alert_on_post": true,
      "alert_on_opportunity": true,
      "min_opportunity_score": 7.0
    }
  ],
  "auto_discovery": {
    "enabled": true,
    "criteria": {
      "min_opportunity_score": 8.0,
      "keyword_match_required": ["high_value", "opportunity"],
      "agent_role_match": ["potential_clients", "market_intelligence"],
      "min_posts_per_week": 3,
      "business_context_required": true
    },
    "suggestion_limit": 10,
    "review_required": true
  }
}
```

### 5.2 Auto-Discovery Engine

```python
# core/watchlist.py

class WatchlistManager:
    async def discover_candidates(self) -> List[AgentSuggestion]:
        """Identifica agentes con alto potencial de monetización"""

        # 1. Query: agentes con alta actividad + opportunity score
        candidates = await self.db.query('''
            SELECT
                agent_name,
                COUNT(*) as post_count,
                AVG(opportunity_score) as avg_score,
                MAX(opportunity_score) as max_score
            FROM posts
            WHERE
                scraped_at >= datetime('now', '-7 days')
                AND opportunity_score >= 7.0
                AND agent_name NOT IN (SELECT agent_name FROM watchlist_agents)
            GROUP BY agent_name
            HAVING post_count >= 3
            ORDER BY avg_score DESC, post_count DESC
            LIMIT 20
        ''')

        # 2. Score cada candidato
        scored = []
        for candidate in candidates:
            score = await self._score_candidate(candidate)
            if score >= 8.0:
                scored.append(AgentSuggestion(
                    agent_name=candidate.agent_name,
                    relevance_score=score,
                    avg_opportunity_score=candidate.avg_score,
                    post_count=candidate.post_count,
                    sample_posts=await self._get_sample_posts(candidate.agent_name),
                    reason=self._explain_suggestion(candidate, score)
                ))

        # 3. Return top 10
        return sorted(scored, key=lambda x: x.relevance_score, reverse=True)[:10]

    async def _score_candidate(self, candidate) -> float:
        """Calcula relevance score para auto-discovery"""
        score = 0.0

        # Oportunity score alto: +30%
        score += candidate.avg_score * 3

        # Consistencia (posts por semana): +20%
        score += min(candidate.post_count / 3, 1.0) * 2

        # Max opportunity score: +30%
        score += candidate.max_score * 3

        # Agent type match: +20%
        agent_type = await self._classify_agent(candidate.agent_name)
        if agent_type in ['potential_buyer', 'decision_maker']:
            score += 2.0

        return min(score, 10.0)
```

---

## 6. Dashboard y API

### 6.1 FastAPI Endpoints

```python
# api/routes.py

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List

router = APIRouter(prefix="/api/moltbook", tags=["moltbook"])

@router.get("/metrics/overview")
async def get_overview():
    """Dashboard principal - métricas agregadas"""
    return await db.get_overview_metrics()

@router.get("/opportunities", response_model=List[OpportunityResponse])
async def get_opportunities(
    min_score: float = Query(7.0, ge=0, le=10),
    limit: int = Query(50, le=200),
    intent: Optional[str] = None
):
    """Lista de oportunidades de monetización detectadas"""
    return await db.get_opportunities(
        min_score=min_score,
        limit=limit,
        intent=intent
    )

@router.get("/watchlist", response_model=WatchlistResponse)
async def get_watchlist():
    """Agentes en watchlist + sugerencias pendientes"""
    return {
        "active": await db.get_watchlist_agents(category=['manual', 'auto-discovered']),
        "suggested": await db.get_watchlist_agents(category='suggested')
    }

@router.post("/watchlist/{agent_name}/approve")
async def approve_suggestion(agent_name: str):
    """Aprueba sugerencia de auto-discovery"""
    agent = await db.get_suggested_agent(agent_name)
    if not agent:
        raise HTTPException(404, "Agent not found in suggestions")

    await db.update_agent_category(agent_name, 'auto-discovered')
    return {"status": "approved", "agent_name": agent_name}

@router.delete("/watchlist/{agent_name}")
async def remove_from_watchlist(agent_name: str):
    """Remueve agente de watchlist"""
    await db.delete_watchlist_agent(agent_name)
    return {"status": "removed"}

@router.get("/posts/search")
async def search_posts(
    q: str = Query(..., min_length=2),
    agent: Optional[str] = None,
    min_opportunity_score: Optional[float] = None,
    limit: int = 100
):
    """Búsqueda full-text en posts"""
    return await db.search_posts(
        query=q,
        agent_name=agent,
        min_score=min_opportunity_score,
        limit=limit
    )

@router.get("/analytics/trends")
async def get_trends(days: int = Query(7, ge=1, le=30)):
    """Tendencias de monetización en los últimos N días"""
    return await db.get_monetization_trends(days=days)
```

### 6.2 Frontend: Dashboard Next.js

**Nueva página**: `app/src/app/moltbook/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/stat-card';
import { OpportunityTable } from '@/components/moltbook/opportunity-table';
import { WatchlistPanel } from '@/components/moltbook/watchlist-panel';
import { TrendsChart } from '@/components/moltbook/trends-chart';

export default function MoltbookMonitorPage() {
  const [metrics, setMetrics] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [watchlist, setWatchlist] = useState({ active: [], suggested: [] });

  useEffect(() => {
    // Polling cada 30s
    const fetchData = async () => {
      const [metricsRes, oppsRes, watchlistRes] = await Promise.all([
        fetch('/api/moltbook/metrics/overview'),
        fetch('/api/moltbook/opportunities?min_score=7.0'),
        fetch('/api/moltbook/watchlist')
      ]);

      setMetrics(await metricsRes.json());
      setOpportunities(await oppsRes.json());
      setWatchlist(await watchlistRes.json());
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div>Cargando...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Moltbook Monitor</h1>

      {/* Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Oportunidades Hoy"
          value={metrics.high_value_opportunities}
          trend="+12%"
          icon="💰"
        />
        <StatCard
          title="Score Promedio"
          value={`${metrics.avg_opportunity_score.toFixed(1)}/10`}
          icon="📊"
        />
        <StatCard
          title="Watchlist Activa"
          value={metrics.watchlist_agents_active}
          icon="👥"
        />
        <StatCard
          title="Alertas Enviadas"
          value={metrics.alerts_sent_today}
          icon="🔔"
        />
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Oportunidades (2 columnas) */}
        <div className="lg:col-span-2">
          <OpportunityTable opportunities={opportunities} />
        </div>

        {/* Watchlist + Sugerencias (1 columna) */}
        <div className="lg:col-span-1 space-y-6">
          <WatchlistPanel
            active={watchlist.active}
            suggested={watchlist.suggested}
            onApprove={async (agentName) => {
              await fetch(`/api/moltbook/watchlist/${agentName}/approve`, {
                method: 'POST'
              });
              // Refresh watchlist
            }}
          />
        </div>
      </div>

      {/* Trends Chart */}
      <TrendsChart />
    </div>
  );
}
```

---

## 7. Deployment y Configuración

### 7.1 Docker Compose

**Actualización de**: `projects/dev/docker-compose.yml`

```yaml
version: '3.8'

services:
  # Servicios existentes de clawdbot...

  moltbook-monitor:
    build: ./moltbook-monitor
    container_name: moltbook-monitor
    environment:
      - OPENCLAW_GATEWAY=http://openclaw:18789
      - DATABASE_URL=sqlite:///data/moltbook.db
      - WHATSAPP_ENABLED=true
      - MONITORING_INTERVAL=300  # 5 minutos
      - ADMIN_PHONE_NUMBER=${ADMIN_PHONE_NUMBER}
    volumes:
      - ./moltbook-monitor/data:/data
      - ./shared:/app/shared  # Baileys client compartido
      - moltbook-logs:/app/logs
    depends_on:
      - clawdbot
      - openclaw
    restart: unless-stopped
    networks:
      - dev-network

  openclaw:
    image: openclaw/openclaw:latest
    container_name: openclaw
    ports:
      - "18789:18789"  # Gateway
      - "18791:18791"  # Browser Control
      - "18793:18793"  # Canvas Server
    environment:
      - DOCKER_SANDBOX=true
      - LOG_LEVEL=info
    volumes:
      - openclaw-data:/data
      - openclaw-cache:/cache
    restart: unless-stopped
    networks:
      - dev-network

volumes:
  openclaw-data:
  openclaw-cache:
  moltbook-logs:

networks:
  dev-network:
    driver: bridge
```

### 7.2 Variables de Entorno

**Archivo**: `projects/dev/.env.moltbook`

```bash
# Moltbook Credentials
MOLTBOOK_USERNAME=your_agent_name
MOLTBOOK_PASSWORD=***

# OpenClaw
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_BROWSER_PORT=18791

# Database
DATABASE_URL=sqlite:///data/moltbook.db
SYNC_JSON_PATH=../../data/moltbook.json

# Notifications
WHATSAPP_ENABLED=true
ADMIN_PHONE_NUMBER=+56912345678

# Monitoring
HEARTBEAT_INTERVAL_SECONDS=300
SCRAPE_LIMIT_POSTS=50
AUTO_DISCOVERY_ENABLED=true

# Monetization Thresholds
MIN_OPPORTUNITY_SCORE=7.0
ALERT_ON_SCORE_ABOVE=8.0

# Logging
LOG_LEVEL=INFO
LOG_FILE=/app/logs/moltbook-monitor.log
```

### 7.3 Dependencies

**Archivo**: `projects/dev/moltbook-monitor/requirements.txt`

```txt
# Web framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3

# Database
sqlalchemy==2.0.25
aiosqlite==0.19.0

# Scraping
playwright==1.41.0
beautifulsoup4==4.12.3

# NLP & Analysis
afinn==0.1
nltk==3.8.1

# Scheduling
apscheduler==3.10.4

# Notifications (reutiliza Baileys de clawdbot)
# No necesita deps extra si usa shared client

# Utilities
python-dotenv==1.0.0
httpx==0.26.0
```

### 7.4 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /data /app/logs

# Run
CMD ["python", "main.py"]
```

---

## 8. Checklist de Implementación

### Fase 1: Core Infrastructure (Semana 1)

- [ ] Crear estructura de carpetas `projects/dev/moltbook-monitor/`
- [ ] Setup inicial de Python venv y dependencias
- [ ] Implementar `core/scraper.py` con OpenClaw integration
- [ ] Implementar `core/analyzer.py` (sentiment AFINN-165)
- [ ] Implementar `core/monetization.py` (opportunity scoring)
- [ ] Crear schema SQLite (`db/schema.sql`)
- [ ] Implementar `db/queries.py` (SQLAlchemy async)
- [ ] Testing manual de scraping (verificar 50 posts extraídos correctamente)

### Fase 2: Automation & Alerts (Semana 2)

- [ ] Implementar `core/scheduler.py` (APScheduler heartbeat 5min)
- [ ] Implementar `notifications/whatsapp.py` (integración con Baileys)
- [ ] Configurar `alert-rules.json` con reglas iniciales
- [ ] Implementar lógica de cooldown de alertas
- [ ] Testing de alertas WhatsApp (enviar alerta de prueba)
- [ ] Monitoreo de logs (verificar ejecución cada 5min sin errores)
- [ ] Optimizar Puppeteer (headless mode, cache, performance)

### Fase 3: Dashboard & API (Semana 3)

- [ ] Implementar FastAPI endpoints (`api/routes.py`)
- [ ] Implementar Pydantic models (`api/models.py`)
- [ ] Crear página Next.js (`app/src/app/moltbook/page.tsx`)
- [ ] Implementar componentes de UI:
  - [ ] `OpportunityTable`
  - [ ] `WatchlistPanel`
  - [ ] `TrendsChart`
  - [ ] `OpportunityBadge`
- [ ] Setup de polling (cada 30s) en frontend
- [ ] Sincronización SQLite → JSON (`data/moltbook.json`)
- [ ] Testing de dashboard (carga < 2s, datos en tiempo real)

### Fase 4: Watchlist & Auto-Discovery (Semana 4)

- [ ] Implementar `core/watchlist.py` (auto-discovery engine)
- [ ] Configurar `moltbook-watchlist.json` con agentes iniciales
- [ ] Implementar scoring de candidatos
- [ ] UI de sugerencias en dashboard (botón "Aprobar")
- [ ] Testing de auto-discovery (verificar sugerencias relevantes)
- [ ] Refinamiento de criterios de monetización
- [ ] Documentación de configuración

### Fase 5: Docker & Production (Semana 4)

- [ ] Crear `Dockerfile` para moltbook-monitor
- [ ] Actualizar `docker-compose.yml` con servicios
- [ ] Setup de OpenClaw container
- [ ] Configurar volúmenes y networking
- [ ] Setup de `.env.moltbook` con credenciales
- [ ] Deploy en entorno de desarrollo
- [ ] Testing end-to-end completo
- [ ] Monitoreo de recursos (CPU, memoria, storage)

---

## 9. Métricas de Éxito

### 9.1 Técnicas

- ✅ **Uptime**: Heartbeat ejecutándose cada 5min sin fallos (>99% uptime)
- ✅ **Accuracy**: >90% de posts scrapeados correctamente (sin duplicados, sin pérdidas)
- ✅ **Latency**: Alertas WhatsApp llegan en <30s desde detección
- ✅ **Precision**: Opportunity score accuracy >80% (validación manual de primeras 100 alertas)
- ✅ **Performance**: Dashboard carga en <2s, API responses <200ms p95

### 9.2 Negocio

- ✅ **Identificación de oportunidades**: Detectar al menos 20 oportunidades de alto valor (score >= 8.0) en la primera semana
- ✅ **Relevancia de alertas**: <10% de alertas WhatsApp son false positives
- ✅ **Auto-discovery**: Al menos 5 agentes sugeridos relevantes por semana
- ✅ **Actionability**: Al menos 30% de oportunidades detectadas resultan en acción (outreach, investigación, etc.)

---

## 10. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Moltbook cambia estructura HTML | Media | Alto | Implementar parser robusto con múltiples selectores, alertas si scraping falla |
| Rate limiting de Moltbook | Media | Alto | Implementar backoff exponencial, respetar robots.txt, distribuir requests |
| OpenClaw inestabilidad | Baja | Medio | Fallback a Puppeteer directo, monitoreo de healthcheck |
| False positives en scoring | Alta | Medio | Iteración continua del algoritmo, feedback loop con validación manual |
| Overhead de Puppeteer | Media | Bajo | Headless mode, cache agresivo, limitar concurrencia |
| WhatsApp spam | Baja | Alto | Cooldown estricto, limit de alertas/hora, configuración granular |

---

## 11. Próximos Pasos (Post-MVP)

### 11.1 Mejoras Técnicas

- **Escalabilidad**: Migrar de SQLite a PostgreSQL cuando se superen 100K posts
- **Caching**: Implementar Redis para reducir latency de API
- **ML Avanzado**: Entrenar modelo custom de clasificación de oportunidades (mejor que scoring manual)
- **Multi-plataforma**: Extender scraping a otras redes de agentes (no solo Moltbook)

### 11.2 Features

- **Outreach automation**: Generar mensajes personalizados para contactar agentes con oportunidades
- **CRM integration**: Sincronizar oportunidades con Pipedrive/HubSpot
- **Email reports**: Resumen diario/semanal vía email
- **Competitive intelligence**: Dashboard separado para análisis de competencia
- **Sentiment trends**: Gráficos de evolución de sentimiento por tópico/agente

---

## 12. Referencias

- **OpenClaw Documentation**: https://github.com/openclaw/openclaw
- **AFINN Sentiment Analysis**: https://github.com/fnielsen/afinn
- **Puppeteer Best Practices**: https://pptr.dev/guides/
- **FastAPI Async SQLAlchemy**: https://fastapi.tiangolo.com/advanced/async-sql-databases/

---

**Documento validado**: 2026-02-01
**Autor**: AIAIAI Consulting + Claude Sonnet 4.5
**Próximo paso**: Crear workspace aislado con git worktree e implementar Fase 1
