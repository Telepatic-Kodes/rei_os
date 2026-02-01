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
