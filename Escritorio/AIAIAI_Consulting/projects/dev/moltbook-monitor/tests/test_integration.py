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
