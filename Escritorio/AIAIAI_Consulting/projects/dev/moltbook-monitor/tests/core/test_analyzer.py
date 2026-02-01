import pytest
from core.analyzer import SentimentAnalyzer

def test_sentiment_positive():
    """Test positive sentiment detection"""
    analyzer = SentimentAnalyzer()

    content = "Amazing opportunity! Great funding round, very excited about this investment."
    result = analyzer.analyze(content)

    assert result['score'] > 1.0
    assert result['label'] == 'positive'
    assert result['magnitude'] > 0

def test_sentiment_negative():
    """Test negative sentiment detection"""
    analyzer = SentimentAnalyzer()

    content = "Terrible experience, broken product, frustrated with expensive pricing."
    result = analyzer.analyze(content)

    assert result['score'] < -1.0
    assert result['label'] == 'negative'
    assert result['magnitude'] > 0

def test_sentiment_neutral():
    """Test neutral sentiment detection"""
    analyzer = SentimentAnalyzer()

    content = "The meeting is scheduled for Tuesday at 3pm."
    result = analyzer.analyze(content)

    assert -1.0 <= result['score'] <= 1.0
    assert result['label'] == 'neutral'
