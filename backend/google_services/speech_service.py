from google.cloud import speech
import logging
import time
import os
from google.oauth2 import service_account

logger = logging.getLogger(__name__)

class SpeechService:
    """Service for handling speech-to-text conversions using Google Cloud Speech API"""
    
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
        self.client = speech.SpeechClient(credentials=self.credentials)
        
        # Define models to try
        self.models = [
            {
                "name": "WebM OPUS Standard",
                "config": speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                    sample_rate_hertz=48000,
                    language_code="en-US",
                    audio_channel_count=1,
                    enable_automatic_punctuation=True,
                    model="default",
                )
            },
            {
                "name": "OGG OPUS Standard",
                "config": speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
                    sample_rate_hertz=48000,
                    language_code="en-US",
                    audio_channel_count=1,
                    enable_automatic_punctuation=True,
                    model="default",
                )
            },
            {
                "name": "Latest Short",
                "config": speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                    sample_rate_hertz=48000,
                    language_code="en-US",
                    audio_channel_count=1,
                    enable_automatic_punctuation=True,
                    model="latest_short",
                )
            },
            {
                "name": "Phone Call",
                "config": speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                    sample_rate_hertz=48000,
                    language_code="en-US",
                    audio_channel_count=1,
                    enable_automatic_punctuation=True,
                    model="phone_call",
                    use_enhanced=True,
                )
            },
            {
                "name": "Enhanced Default",
                "config": speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                    sample_rate_hertz=48000,
                    language_code="en-US",
                    audio_channel_count=1,
                    enable_automatic_punctuation=True,
                    model="default",
                    use_enhanced=True,
                )
            },
            {
                "name": "With Speech Contexts",
                "config": speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                    sample_rate_hertz=48000,
                    language_code="en-US",
                    audio_channel_count=1,
                    enable_automatic_punctuation=True,
                    model="default",
                    use_enhanced=True,
                    speech_contexts=[speech.SpeechContext(
                        phrases=["hello", "test", "testing", "one two three", "Google", "speech to text"],
                        boost=20.0
                    )]
                )
            }
        ]
    
    def transcribe_audio(self, audio_file_path):
        """
        Transcribe audio file to text using multiple models until one succeeds
        
        Args:
            audio_file_path: Path to the audio file to transcribe
            
        Returns:
            dict: Dictionary containing transcription results and metadata
        """
        logger.info(f"Transcribing audio file: {audio_file_path}")
        
        # Check if file exists and has content
        if not os.path.exists(audio_file_path):
            logger.error(f"Audio file does not exist: {audio_file_path}")
            return {
                "success": False,
                "error": "Audio file does not exist",
                "text": None,
                "model_used": None
            }
        
        file_size = os.path.getsize(audio_file_path)
        if file_size < 1000:
            logger.warning(f"Audio file too small: {file_size} bytes")
            return {
                "success": False,
                "error": "Audio file too small or empty",
                "text": None,
                "model_used": None
            }
        
        # Read the audio file
        with open(audio_file_path, 'rb') as audio_file:
            content = audio_file.read()
        
        # Create the audio object
        audio = speech.RecognitionAudio(content=content)
        
        # Try each model until one works
        for model_info in self.models:
            try:
                logger.info(f"Trying model: {model_info['name']}")
                start_time = time.time()
                
                response = self.client.recognize(config=model_info['config'], audio=audio)
                
                elapsed_time = time.time() - start_time
                logger.info(f"API response time: {elapsed_time:.2f} seconds")
                
                # Check if we got results
                if response.results:
                    # Build transcript
                    transcript_parts = []
                    confidence_sum = 0
                    confidence_count = 0
                    
                    for result in response.results:
                        for alternative in result.alternatives:
                            transcript_parts.append(alternative.transcript)
                            if hasattr(alternative, 'confidence'):
                                confidence_sum += alternative.confidence
                                confidence_count += 1
                    
                    transcript = " ".join(transcript_parts)
                    avg_confidence = confidence_sum / confidence_count if confidence_count > 0 else None
                    
                    logger.info(f"Successful transcription with model '{model_info['name']}': {transcript}")
                    logger.info(f"Average confidence: {avg_confidence}")
                    
                    return {
                        "success": True,
                        "text": transcript,
                        "model_used": model_info['name'],
                        "confidence": avg_confidence,
                        "processing_time": elapsed_time
                    }
                else:
                    logger.warning(f"No transcription results with model '{model_info['name']}'")
            
            except Exception as e:
                logger.error(f"Error with model '{model_info['name']}': {str(e)}")
        
        # If we get here, all models failed
        return {
            "success": False,
            "error": "Failed to transcribe with any model",
            "text": None,
            "model_used": None
        }