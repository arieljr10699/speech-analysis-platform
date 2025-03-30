import spacy
import logging
from spacytextblob.spacytextblob import SpacyTextBlob

logger = logging.getLogger(__name__)
class OpenSourceSentimentService:
    """Service for analyzing sentiment using spaCy with TextBlob"""
   
    def __init__(self):
        # Load spaCy model and add TextBlob component
        self.nlp = spacy.load("en_core_web_sm")
        self.nlp.add_pipe("spacytextblob")
        logger.info("Initialized spaCy with TextBlob for sentiment analysis")
    
    def analyze_sentiment(self, text):
        """Analyze the sentiment of text using spaCy with TextBlob"""
        if not text or len(text) < 3:
            return {"success": False, "error": "Text too short for sentiment analysis"}
        
        try:
            # Process the text
            doc = self.nlp(text)
            
            # Get the overall polarity (-1 to 1)
            polarity = doc._.blob.polarity
            
            # Get the subjectivity (0 to 1)
            subjectivity = doc._.blob.subjectivity
            
            # Determine sentiment label
            if polarity >= 0.1:
                sentiment_label = "positive"
            elif polarity <= -0.1:
                sentiment_label = "negative"
            else:
                sentiment_label = "neutral"
            
            # Calculate confidence
            confidence = min(abs(polarity) * 2, 1.0)
            
            # Process sentences
            sentences = []
            for sent in doc.sents:
                sent_doc = self.nlp(sent.text)
                sent_polarity = sent_doc._.blob.polarity
                
                if sent_polarity >= 0.25:
                    sent_label = "positive"
                elif sent_polarity <= -0.25:
                    sent_label = "negative"
                else:
                    sent_label = "neutral"
                
                sentences.append({
                    "text": sent.text,
                    "score": sent_polarity,
                    "magnitude": sent_doc._.blob.subjectivity,
                    "sentiment": sent_label
                })
            
            return {
                "success": True,
                "score": polarity,
                "magnitude": subjectivity,
                "sentiment": sentiment_label,
                "confidence": confidence,
                "sentences": sentences
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return {"success": False, "error": str(e)}