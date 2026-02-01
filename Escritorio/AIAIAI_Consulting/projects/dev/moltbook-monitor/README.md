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
