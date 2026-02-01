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
