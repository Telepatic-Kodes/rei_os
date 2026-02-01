import json
import re
from pathlib import Path
from typing import TypedDict, List

class MonetizationScore(TypedDict):
    score: float
    intent: str
    agent_type: str
    keywords_matched: List[str]
    actionable: bool
    recommendation: str

class MonetizationAnalyzer:
    """Analyzes posts for monetization opportunities"""

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "monetization-keywords.json"

        with open(config_path, 'r') as f:
            self.config = json.load(f)

    def analyze(self, content: str, agent_name: str) -> MonetizationScore:
        """
        Analyze content for monetization opportunities

        Args:
            content: Post content to analyze
            agent_name: Name of the agent who posted

        Returns:
            Monetization score with intent, keywords, and recommendation
        """
        content_lower = content.lower()

        # 1. Match keywords
        keywords_found = self._match_keywords(content_lower)

        # 2. Classify intent
        intent = self._classify_intent(content_lower)

        # 3. Classify agent type
        agent_type = self._classify_agent_role(agent_name)

        # 4. Calculate score
        score = self._calculate_score(keywords_found, intent, agent_type)

        # 5. Generate recommendation
        recommendation = self._generate_recommendation(score, intent, keywords_found)

        return {
            'score': round(score, 2),
            'intent': intent,
            'agent_type': agent_type,
            'keywords_matched': keywords_found,
            'actionable': score >= 7.0,
            'recommendation': recommendation
        }

    def _match_keywords(self, content: str) -> List[str]:
        """Find matching monetization keywords"""
        matched = []

        for category in ['high_value', 'opportunity', 'market_intel', 'pain_points']:
            keywords = self.config[category]['keywords']
            for keyword in keywords:
                if keyword.lower() in content:
                    matched.append(keyword)

        return matched

    def _classify_intent(self, content: str) -> str:
        """Classify user intent from content"""
        intent_patterns = self.config['intent_patterns']

        # Count matches for each intent
        intent_scores = {}
        for intent, patterns in intent_patterns.items():
            score = sum(1 for pattern in patterns if pattern.lower() in content)
            intent_scores[intent] = score

        # Return intent with highest score
        if max(intent_scores.values()) == 0:
            return 'general'

        return max(intent_scores, key=intent_scores.get)

    def _classify_agent_role(self, agent_name: str) -> str:
        """Classify agent role from name"""
        agent_name_lower = agent_name.lower()

        for role, config in self.config['agent_roles'].items():
            for keyword in config['keywords']:
                if keyword.lower() in agent_name_lower:
                    return role

        return 'general'

    def _calculate_score(self, keywords: List[str], intent: str, agent_type: str) -> float:
        """Calculate final monetization opportunity score (0-10)"""
        score = 0.0

        # Keyword scoring
        for keyword in keywords:
            for category in ['high_value', 'opportunity', 'market_intel', 'pain_points']:
                if keyword in self.config[category]['keywords']:
                    score += self.config[category]['weight']
                    break

        # Intent bonus
        intent_weights = {
            'seeking_solution': 2.0,
            'budget_discussion': 2.5,
            'pain_point': 1.5,
            'market_intel': 1.0,
            'general': 0.0
        }
        score += intent_weights.get(intent, 0)

        # Agent type multiplier
        if agent_type in self.config['agent_roles']:
            multiplier = self.config['agent_roles'][agent_type]['multiplier']
            score *= multiplier

        return min(score, 10.0)  # Cap at 10

    def _generate_recommendation(self, score: float, intent: str, keywords: List[str]) -> str:
        """Generate action recommendation based on analysis"""
        if score >= 9.0:
            return f"HIGH PRIORITY: {intent.replace('_', ' ').title()} detected with strong signals. Immediate outreach recommended."
        elif score >= 7.0:
            return f"MEDIUM PRIORITY: {intent.replace('_', ' ').title()} detected. Monitor and consider outreach."
        elif score >= 5.0:
            return f"LOW PRIORITY: Some monetization signals detected ({', '.join(keywords[:3])}). Add to watchlist."
        else:
            return "No significant monetization opportunity detected."
