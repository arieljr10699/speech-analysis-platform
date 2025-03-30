from google.cloud import language
import logging
import os
from google.oauth2 import service_account

logger = logging.getLogger(__name__)

class SentimentService:
    """Service for analyzing sentiment using Google Cloud Natural Language API"""
    
    def __init__(self):
        # Load service account credentials
        credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        if credentials_path and os.path.exists(credentials_path):
            self.credentials = service_account.Credentials.from_service_account_file(credentials_path)
            logger.info(f"Loaded credentials from {credentials_path}")
        else:
            # Try to use default credentials
            self.credentials = None
            logger.warning("No explicit credentials provided, using default credentials")
        
        # Initialize the client
        self.client = language.LanguageServiceClient(credentials=self.credentials)
    
    def analyze_sentiment(self, text):
        """
        Analyze the sentiment of text using Google Cloud Natural Language API
        
        Args:
            text: The text to analyze
            
        Returns:
            dict: Sentiment analysis results
        """
        if not text or len(text) < 3:
            logger.warning("Text too short for sentiment analysis")
            return {
                "success": False,
                "error": "Text too short for sentiment analysis",
                "score": None,
                "magnitude": None
            }
        
        try:
            logger.info(f"Analyzing sentiment for text: '{text[:50]}{'...' if len(text) > 50 else ''}'")
            
            # Prepare document for analysis
            document = language.Document(
                content=text,
                type_=language.Document.Type.PLAIN_TEXT,
                language="en"
            )
            
            # Call the API
            response = self.client.analyze_sentiment(
                request={"document": document}
            )
            
            # Extract sentiment details
            sentiment = response.document_sentiment
            
            logger.info(f"Sentiment analysis complete: score={sentiment.score}, magnitude={sentiment.magnitude}")
            logger.info(f"Raw sentiment values - score: {sentiment.score}, magnitude: {sentiment.magnitude}")
            # Interpret sentiment
            sentiment_label = self._interpret_sentiment(sentiment.score)
            confidence = min(abs(sentiment.score) * 2, 1.0)  # Convert to 0-1 range
            
            return {
                "success": True,
                "score": sentiment.score,
                "magnitude": sentiment.magnitude,
                "sentiment": sentiment_label,
                "confidence": confidence,
                "sentences": [
                    {
                        "text": sentence.text.content,
                        "score": sentence.sentiment.score,
                        "magnitude": sentence.sentiment.magnitude,
                        "sentiment": self._interpret_sentiment(sentence.sentiment.score)
                    }
                    for sentence in response.sentences
                ]
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            
            return {
                "success": False,
                "error": str(e),
                "score": None,
                "magnitude": None
            }
    
    def _interpret_sentiment(self, score):
        """Interpret sentiment score as a label"""
        if score >= 0.25:
            return "positive"
        elif score <= -0.25:
            return "negative"
        else:
            return "neutral"