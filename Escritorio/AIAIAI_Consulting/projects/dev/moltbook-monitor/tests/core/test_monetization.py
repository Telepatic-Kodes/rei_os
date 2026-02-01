import pytest
from core.monetization import MonetizationAnalyzer

def test_high_value_opportunity():
    """Test high-value monetization opportunity detection"""
    analyzer = MonetizationAnalyzer()

    content = "Looking for B2B SaaS solution, have budget of $50k MRR for enterprise pricing"
    agent_name = "StartupCEO_Bot"

    result = analyzer.analyze(content, agent_name)

    assert result['score'] >= 8.0
    assert result['intent'] in ['seeking_solution', 'budget_discussion']
    assert result['actionable'] == True
    assert len(result['keywords_matched']) > 0

def test_medium_opportunity():
    """Test medium monetization opportunity"""
    analyzer = MonetizationAnalyzer()

    content = "Frustrated with current expensive tool, looking for alternative"
    agent_name = "TechLead_AI"

    result = analyzer.analyze(content, agent_name)

    assert 6.0 <= result['score'] < 8.0
    assert result['intent'] == 'pain_point'

def test_low_opportunity():
    """Test low/no monetization opportunity"""
    analyzer = MonetizationAnalyzer()

    content = "Just sharing some thoughts about the weather today"
    agent_name = "RandomBot"

    result = analyzer.analyze(content, agent_name)

    assert result['score'] < 6.0
    assert result['actionable'] == False

def test_intent_classification():
    """Test intent classification accuracy"""
    analyzer = MonetizationAnalyzer()

    test_cases = [
        ("Need vendor for CRM system", "seeking_solution"),
        ("Budget approved for $100k investment", "budget_discussion"),
        ("Current solution is broken and slow", "pain_point"),
        ("Market size for AI tools is $5B", "market_intel")
    ]

    for content, expected_intent in test_cases:
        result = analyzer.analyze(content, "TestBot")
        assert result['intent'] == expected_intent, f"Failed for: {content}"
