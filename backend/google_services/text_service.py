from google.cloud import texttospeech
import logging
import os
from google.oauth2 import service_account

logger = logging.getLogger(__name__)

class TextService:
    """Service for handling text-to-speech conversions using Google Cloud Text-to-Speech API"""
    
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
        self.client = texttospeech.TextToSpeechClient(credentials=self.credentials)
        
        # Cache available voices
        self._available_voices = None
        
    def get_available_voices(self):
        """Get list of available voices from Google Cloud TTS API"""
        if self._available_voices is None:
            try:
                response = self.client.list_voices()
                
                # Format voice information for easy consumption
                self._available_voices = [
                    {
                        "name": voice.name,
                        "language_codes": list(voice.language_codes),  # Convert to a regular list
                        "gender": texttospeech.SsmlVoiceGender(voice.ssml_gender).name,
                        "natural": voice.natural_sample_rate_hertz > 0
                    }
                    for voice in response.voices
                ]
                
                logger.info(f"Retrieved {len(self._available_voices)} available voices")
            except Exception as e:
                logger.error(f"Error retrieving available voices: {str(e)}")
                self._available_voices = []
        
        return self._available_voices
    
    def synthesize_speech(self, text, voice_name=None):
        """
        Convert text to speech using Google Cloud TTS
        
        Args:
            text: Text to convert to speech
            voice_name: Name of the voice to use (e.g., "en-US-Neural2-F")
                        If None, defaults to a standard voice
                        
        Returns:
            tuple: (audio_file_name, audio_content)
        """
        logger.info(f"Synthesizing text to speech: '{text[:50]}{'...' if len(text) > 50 else ''}'")
        
        # Prepare input text
        input_text = texttospeech.SynthesisInput(text=text)
        
        # Set up voice parameters
        if voice_name:
            # Parse language code from voice name
            language_code = voice_name.split('-')[0] + '-' + voice_name.split('-')[1]
            
            # Determine gender from voice name convention
            if 'Female' in voice_name or voice_name.endswith('F'):
                gender = texttospeech.SsmlVoiceGender.FEMALE
            elif 'Male' in voice_name or voice_name.endswith('M'):
                gender = texttospeech.SsmlVoiceGender.MALE
            else:
                gender = texttospeech.SsmlVoiceGender.NEUTRAL
            
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name,
                ssml_gender=gender
            )
        else:
            # Default voice settings
            voice = texttospeech.VoiceSelectionParams(
                language_code="en-US",
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL,
                name="en-US-Neural2-F"  # Modern neural voice
            )
        
        # Set audio format
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,  # Normal speed
            pitch=0.0,  # Normal pitch
            volume_gain_db=0.0,  # Normal volume
            sample_rate_hertz=24000  # High quality
        )
        
        try:
            # Call the API
            response = self.client.synthesize_speech(
                input=input_text,
                voice=voice,
                audio_config=audio_config
            )
            
            # Generate a filename
            file_name = f"tts_{hash(text) % 10000}.mp3"
            
            logger.info(f"Successfully synthesized speech, {len(response.audio_content)} bytes")
            
            return file_name, response.audio_content
            
        except Exception as e:
            logger.error(f"Error synthesizing speech: {str(e)}")
            raise