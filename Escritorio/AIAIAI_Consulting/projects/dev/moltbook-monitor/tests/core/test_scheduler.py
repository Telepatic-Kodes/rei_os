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
