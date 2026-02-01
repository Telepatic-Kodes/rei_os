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
