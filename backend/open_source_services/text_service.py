# open_source_services/text_service.py
import logging
import os
import asyncio
import tempfile
import edge_tts

logger = logging.getLogger(__name__)

class OpenSourceTextService:
    """Service for handling text-to-speech conversions using Edge TTS"""
    
    def __init__(self):
        self._available_voices = None
        logger.info("Initialized Edge TTS for text-to-speech")
    
    async def _get_voices(self):
        try:
            logger.info("Calling edge_tts.list_voices()")
            voices = await edge_tts.list_voices()
            logger.info(f"Successfully retrieved {len(voices)} voices from Edge TTS")
            
            # Let's log a sample voice to see its structure
            if voices:
                logger.info(f"Sample voice structure: {voices[0]}")
            
            return [
                {
                    "name": voice["ShortName"],
                    "language_codes": [voice["Locale"]],
                    "gender": "FEMALE" if "Female" in voice["Gender"] else "MALE",
                    # Assume all Edge TTS voices are neural/natural
                    "natural": True
                }
                for voice in voices
            ]
        except Exception as e:
            logger.error(f"Error in _get_voices: {str(e)}")
            logger.exception(e)  # This logs the full stack trace
            return [
                {
                    "name": "en-US-ChristopherNeural",
                    "language_codes": ["en-US"],
                    "gender": "MALE",
                    "natural": True
                },
                {
                    "name": "en-US-JennyNeural",
                    "language_codes": ["en-US"],
                    "gender": "FEMALE",
                    "natural": True
                }
            ]
    
    def get_available_voices(self):
        """Get list of available voices for TTS"""
        if self._available_voices is None:
            try:
                # Create an event loop if there isn't one
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                
                logger.info("Getting voices from Edge TTS")
                # Run the coroutine in the event loop
                self._available_voices = loop.run_until_complete(self._get_voices())
                
                logger.info(f"Retrieved {len(self._available_voices)} available voices")
            except Exception as e:
                logger.error(f"Error retrieving available voices: {str(e)}")
                logger.exception(e)
                # Provide fallback voices
                self._available_voices = [
                    {
                        "name": "en-US-ChristopherNeural",
                        "language_codes": ["en-US"],
                        "gender": "MALE",
                        "natural": True
                    },
                    {
                        "name": "en-US-JennyNeural",
                        "language_codes": ["en-US"],
                        "gender": "FEMALE",
                        "natural": True
                    }
                ]
                logger.info(f"Using {len(self._available_voices)} fallback voices")
        
        return self._available_voices
    
    async def _synthesize(self, text, voice):
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
            temp_path = temp_file.name
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(temp_path)
        
        return temp_path
    
    def synthesize_speech(self, text, voice_name=None):
        """
        Convert text to speech using Edge TTS
        
        Args:
            text: Text to convert to speech
            voice_name: Name of the voice to use
                       
        Returns:
            tuple: (audio_file_name, audio_content)
        """
        try:
            logger.info(f"Synthesizing text to speech: '{text[:50]}{'...' if len(text) > 50 else ''}'")
            
            # Use default voice if not specified
            voice = voice_name or "en-US-ChristopherNeural"
            
            # Create an event loop if there isn't one
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Generate speech
            temp_path = loop.run_until_complete(self._synthesize(text, voice))
            
            # Read the file content
            with open(temp_path, "rb") as f:
                audio_content = f.read()
            
            # Clean up temporary file
            os.remove(temp_path)
            
            file_name = f"tts_os_{hash(text) % 10000}.mp3"
            logger.info(f"Successfully synthesized speech, {len(audio_content)} bytes")
            
            return file_name, audio_content
            
        except Exception as e:
            logger.error(f"Error synthesizing speech: {str(e)}")
            logger.exception(e)
            raise