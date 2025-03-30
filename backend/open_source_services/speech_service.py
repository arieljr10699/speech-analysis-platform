# open_source_services/speech_service.py
import logging
import os
import whisper
import ffmpeg

logger = logging.getLogger(__name__)

class OpenSourceSpeechService:
    """Service for handling speech-to-text conversions using Whisper"""
    
    def __init__(self):
        # Initialize the model (you can choose different sizes: "tiny", "base", "small", "medium", "large")
        self.model = whisper.load_model("base")
        logger.info("Initialized Whisper model for speech-to-text")
    
    def transcribe_audio(self, audio_file):
        """
        Transcribe audio using Whisper
        
        Args:
            audio_file: Path to audio file
            
        Returns:
            dict: Transcription results
        """
        try:
            logger.info(f"Transcribing audio file with Whisper: {audio_file}")
            
            # Debug: Check if file exists
            if not os.path.exists(audio_file):
                logger.error(f"File does not exist: {audio_file}")
                return {
                    'success': False,
                    'error': f"File does not exist: {audio_file}",
                    'text': None,
                    'confidence': None,
                    'model_used': 'Whisper Base'
                }
            
            # Debug: Log file details
            file_size = os.path.getsize(audio_file)
            logger.info(f"File size: {file_size} bytes")
            
            # Transcribe with Whisper
            result = self.model.transcribe(audio_file)
            
            transcription_text = result["text"]
            segments = result["segments"]
            
            # Calculate average confidence

            try:
                avg_confidence = sum(segment.get("confidence", 0) for segment in segments) / len(segments) if segments else 0
            except Exception as e:
                logger.warning(f"Could not calculate confidence: {str(e)}")
                avg_confidence = None

            # avg_confidence = sum(segment["confidence"] for segment in segments) / len(segments) if segments else 0
            if avg_confidence == 0:
                avg_confidence = None
            logger.info(f"Successful transcription with Whisper: {transcription_text[:100]}")
            logger.info(f"Average confidence: {avg_confidence}")
            
            return {
                'success': True,
                'text': transcription_text,
                'confidence': avg_confidence,
                'model_used': 'Whisper Base',
                'processing_time': 0.0  # Whisper doesn't provide this, so we use a default
            }
            
        except Exception as e:
            logger.error(f"Error transcribing audio with Whisper: {str(e)}")
            logger.exception(e)  # Log full stack trace
            return {
                'success': False,
                'error': str(e),
                'text': None,
                'confidence': None,
                'model_used': 'Whisper Base'
            }