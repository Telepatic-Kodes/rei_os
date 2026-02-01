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
