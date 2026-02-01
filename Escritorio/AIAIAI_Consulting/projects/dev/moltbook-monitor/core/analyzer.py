from afinn import Afinn
from typing import TypedDict

class SentimentScore(TypedDict):
    score: float
    label: str
    magnitude: float

class SentimentAnalyzer:
    """Sentiment analysis using AFINN-165 lexicon"""

    def __init__(self):
        self.afinn = Afinn(language='en')

    def analyze(self, content: str) -> SentimentScore:
        """
        Analyze sentiment of text content

        Args:
            content: Text to analyze

        Returns:
            Dictionary with score (-5 to +5), label, and magnitude
        """
        # Get AFINN score
        score = self.afinn.score(content)

        # Classify
        if score > 1:
            label = 'positive'
        elif score < -1:
            label = 'negative'
        else:
            label = 'neutral'

        return {
            'score': score,
            'label': label,
            'magnitude': abs(score)
        }
