from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
import uuid
import logging
from datetime import datetime, timedelta
import tempfile
from google_services.speech_service import SpeechService
from google_services.text_service import TextService
from google_services.sentiment_service import SentimentService
from utils.session_manager import SessionManager

# Import open-source services
from open_source_services.sentiment_service import OpenSourceSentimentService
from open_source_services.text_service import OpenSourceTextService
from open_source_services.speech_service import OpenSourceSpeechService


logging.getLogger('flask_cors').level = logging.DEBUG
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)

# Enable CORS for the frontend
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"], supports_credentials=True, allow_headers=["Content-Type", "Authorization"])

# Initialize Google services
google_speech_service = SpeechService()
google_text_service = TextService()
google_sentiment_service = SentimentService()

# Initialize open-source services
os_sentiment_service = OpenSourceSentimentService()
os_text_service = OpenSourceTextService()
os_speech_service = OpenSourceSpeechService()

# Initialize session manager
session_manager = SessionManager()

# Create temporary directory to store session files
TEMP_DIR = tempfile.mkdtemp(prefix="speech_analysis_")
logger.info(f"Using temporary directory: {TEMP_DIR}")

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "API is working"})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    """Endpoint for speech-to-text conversion"""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
    
    # Get the provider from request (default to 'google')
    provider = request.form.get('provider', 'google')
    
    try:
        # Generate a unique ID for this conversion
        conversion_id = str(uuid.uuid4())
        
        # Save the audio file temporarily
        temp_path = os.path.join(TEMP_DIR, f"{conversion_id}.webm")
        file.save(temp_path)
        
        logger.info(f"Processing audio file using {provider}: {temp_path}")
        
        # Choose the appropriate services based on provider
        if provider == 'opensource':
            results = os_speech_service.transcribe_audio(temp_path)  # Use open-source service
            sentiment_service_to_use = os_sentiment_service
        else:
            results = google_speech_service.transcribe_audio(temp_path)
            sentiment_service_to_use = google_sentiment_service
        
        # Process the text for sentiment if transcription was successful
        sentiment = None
        if results['success'] and results['text']:
            sentiment = sentiment_service_to_use.analyze_sentiment(results['text'])
        
        # Store result in session
        session_data = {
            'id': conversion_id,
            'type': 'speech_to_text',
            'provider': provider,
            'timestamp': datetime.now().isoformat(),
            'transcription': results,
            'sentiment': sentiment
        }
        session_manager.add_result(session_data)
        
        # Clean up temporary file
        os.remove(temp_path)
        
        return jsonify({
            "id": conversion_id,
            "provider": provider,
            "results": results,
            "sentiment": sentiment
        })
    
    except Exception as e:
        logger.exception(f"Error in speech-to-text conversion using {provider}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/compare/speech-to-text', methods=['POST'])
def compare_speech_to_text():
    """Compare speech-to-text between Google and open-source"""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
    
    try:
        # Generate a unique ID for this comparison
        conversion_id = str(uuid.uuid4())
        
        # Save the audio file temporarily with a WAV extension (more compatible with Whisper)
        webm_path = os.path.join(TEMP_DIR, f"{conversion_id}.webm")
        wav_path = os.path.join(TEMP_DIR, f"{conversion_id}.wav")
        
        file.save(webm_path)
        logger.info(f"Processing audio file for comparison. Original: {webm_path}, WAV: {wav_path}")
        
        # Try to convert WEBM to WAV using FFmpeg (needed for Whisper)
        try:
            import subprocess
            # Make sure FFmpeg is installed and in your PATH
            subprocess.run([
                'ffmpeg', '-i', webm_path, '-ar', '16000', '-ac', '1', 
                '-c:a', 'pcm_s16le', wav_path
            ], check=True)
            logger.info(f"Successfully converted audio to WAV format: {wav_path}")
        except Exception as e:
            logger.error(f"Error converting audio file: {str(e)}")
            # Continue with original file if conversion fails
            wav_path = webm_path
        
        # Process with Google first (using the original WEBM file)
        google_results = google_speech_service.transcribe_audio(webm_path)
        google_sentiment = None
        if google_results['success'] and google_results['text']:
            google_sentiment = google_sentiment_service.analyze_sentiment(google_results['text'])
            
        # For open-source, use the WAV file which is more compatible
        os_results = {"success": False, "error": "Not processed", "text": None}
        os_sentiment = None
        
        try:
            logger.info(f"Processing with open-source using file: {wav_path}")
            if os.path.exists(wav_path):
                os_results = os_speech_service.transcribe_audio(wav_path)
                if os_results['success'] and os_results['text']:
                    os_sentiment = os_sentiment_service.analyze_sentiment(os_results['text'])
            else:
                logger.error(f"WAV file not found for open-source processing: {wav_path}")
                os_results = {"success": False, "error": "Audio file not found", "text": None}
        except Exception as e:
            logger.exception(f"Error processing with open-source: {str(e)}")
            os_results = {"success": False, "error": str(e), "text": None}
        
        # Store result in session
        session_data = {
            'id': conversion_id,
            'type': 'speech_to_text_comparison',
            'timestamp': datetime.now().isoformat(),
            'google': {
                'transcription': google_results,
                'sentiment': google_sentiment
            },
            'opensource': {
                'transcription': os_results,
                'sentiment': os_sentiment
            }
        }
        session_manager.add_result(session_data)
        
        # Clean up files before returning
        try:
            if os.path.exists(webm_path):
                os.remove(webm_path)
            if os.path.exists(wav_path) and wav_path != webm_path:
                os.remove(wav_path)
        except Exception as e:
            logger.warning(f"Error removing temporary files: {str(e)}")
        
        # Format the response to match the expected structure in the frontend
        return jsonify({
            "id": conversion_id,
            "google": {
                "results": google_results,
                "sentiment": google_sentiment
            },
            "opensource": {
                "results": os_results,
                "sentiment": os_sentiment
            }
        })
    
    except Exception as e:
        logger.exception("Error in speech-to-text comparison")
        # Clean up any temporary files
        try:
            if 'webm_path' in locals() and os.path.exists(webm_path):
                os.remove(webm_path)
            if 'wav_path' in locals() and os.path.exists(wav_path):
                os.remove(wav_path)
        except:
            pass
        return jsonify({"error": str(e)}), 500

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    """Endpoint for text-to-speech conversion"""
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data.get('text', '').strip()
    voice_type = data.get('voice', 'en-US-Neural2-F')  # Default voice
    provider = data.get('provider', 'google')  # Default to Google
    
    if not text:
        return jsonify({"error": "Empty text"}), 400
    
    try:
        # Generate a unique ID for this conversion
        conversion_id = str(uuid.uuid4())
        
        # Choose the appropriate services based on provider
        if provider == 'opensource':
            audio_file, audio_content = os_text_service.synthesize_speech(text, voice_type)
            sentiment_service_to_use = os_sentiment_service
        else:
            audio_file, audio_content = google_text_service.synthesize_speech(text, voice_type)
            sentiment_service_to_use = google_sentiment_service
        
        # Store in temporary directory
        temp_path = os.path.join(TEMP_DIR, f"{conversion_id}.mp3")
        with open(temp_path, 'wb') as f:
            f.write(audio_content)
        
        # Process the text for sentiment
        sentiment = sentiment_service_to_use.analyze_sentiment(text)
        
        # Store result in session
        session_data = {
            'id': conversion_id,
            'type': 'text_to_speech',
            'provider': provider,
            'timestamp': datetime.now().isoformat(),
            'text': text,
            'audio_path': temp_path,
            'sentiment': sentiment
        }
        session_manager.add_result(session_data)
        
        # Return audio data as base64
        import base64
        audio_base64 = base64.b64encode(audio_content).decode('utf-8')
        
        return jsonify({
            "id": conversion_id,
            "provider": provider,
            "audio": audio_base64,
            "sentiment": sentiment
        })
    
    except Exception as e:
        logger.exception(f"Error in text-to-speech conversion using {provider}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/sentiment', methods=['POST'])
def analyze_sentiment():
    """Endpoint for sentiment analysis"""
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data.get('text', '').strip()
    provider = data.get('provider', 'google')  # Default to Google
    
    if not text:
        return jsonify({"error": "Empty text"}), 400
    
    try:
        # Choose the appropriate service based on provider
        if provider == 'opensource':
            sentiment = os_sentiment_service.analyze_sentiment(text)
        else:
            sentiment = google_sentiment_service.analyze_sentiment(text)
        
        return jsonify({
            "text": text,
            "provider": provider,
            "sentiment": sentiment
        })
    
    except Exception as e:
        logger.exception(f"Error in sentiment analysis using {provider}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Get available voices for text-to-speech"""
    provider = request.args.get('provider', 'google')  # Default to Google
    
    try:
        # Choose the appropriate service based on provider
        if provider == 'opensource':
            voices = os_text_service.get_available_voices()
        else:
            voices = google_text_service.get_available_voices()
        
        return jsonify({
            "provider": provider,
            "voices": voices
        })
    except Exception as e:
        logger.exception(f"Error retrieving voices for {provider}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/results', methods=['GET'])
def get_results():
    """Get all results for the current session"""
    try:
        results = session_manager.get_all_results()
        return jsonify({"results": results})
    except Exception as e:
        logger.exception("Error retrieving results")
        return jsonify({"error": str(e)}), 500

@app.route('/api/results/<result_id>', methods=['GET'])
def get_result(result_id):
    """Get a specific result by ID"""
    try:
        result = session_manager.get_result(result_id)
        if result:
            return jsonify(result)
        else:
            return jsonify({"error": "Result not found"}), 404
    except Exception as e:
        logger.exception(f"Error retrieving result {result_id}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/results', methods=['DELETE'])
def clear_results():
    """Clear all results from the current session"""
    try:
        session_manager.clear_results()
        return jsonify({"status": "Session cleared"})
    except Exception as e:
        logger.exception("Error clearing session")
        return jsonify({"error": str(e)}), 500

# Additional routes for comparison
@app.route('/api/compare/sentiment', methods=['POST'])
def compare_sentiment():
    """Compare sentiment analysis between Google and open-source"""
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data.get('text', '').strip()
    
    if not text:
        return jsonify({"error": "Empty text"}), 400
    
    try:
        # Get sentiment from both providers
        google_sentiment = google_sentiment_service.analyze_sentiment(text)
        os_sentiment = os_sentiment_service.analyze_sentiment(text)
        
        return jsonify({
            "text": text,
            "google": {
                "provider": "google",
                "sentiment": google_sentiment
            },
            "opensource": {
                "provider": "opensource",
                "sentiment": os_sentiment
            }
        })
    
    except Exception as e:
        logger.exception("Error in sentiment comparison")
        return jsonify({"error": str(e)}), 500

@app.route('/api/compare/text-to-speech', methods=['POST'])
def compare_text_to_speech():
    """Compare text-to-speech between Google and open-source"""
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data.get('text', '').strip()
    google_voice = data.get('google_voice', 'en-US-Neural2-F')
    os_voice = data.get('os_voice', 'en-US-ChristopherNeural')
    
    if not text:
        return jsonify({"error": "Empty text"}), 400
    
    try:
        # Generate a unique ID for this conversion
        conversion_id = str(uuid.uuid4())
        
        # Process with Google
        google_file, google_audio = google_text_service.synthesize_speech(text, google_voice)
        google_sentiment = google_sentiment_service.analyze_sentiment(text)
        
        # Process with open-source
        os_file, os_audio = os_text_service.synthesize_speech(text, os_voice)
        os_sentiment = os_sentiment_service.analyze_sentiment(text)
        
        # Store files
        google_path = os.path.join(TEMP_DIR, f"{conversion_id}_google.mp3")
        os_path = os.path.join(TEMP_DIR, f"{conversion_id}_os.mp3")
        
        with open(google_path, 'wb') as f:
            f.write(google_audio)
        
        with open(os_path, 'wb') as f:
            f.write(os_audio)
        
        # Convert to base64
        import base64
        google_base64 = base64.b64encode(google_audio).decode('utf-8')
        os_base64 = base64.b64encode(os_audio).decode('utf-8')
        
        # Store result in session
        session_data = {
            'id': conversion_id,
            'type': 'comparison',
            'timestamp': datetime.now().isoformat(),
            'text': text,
            'google': {
                'voice': google_voice,
                'audio_path': google_path,
                'sentiment': google_sentiment
            },
            'opensource': {
                'voice': os_voice,
                'audio_path': os_path,
                'sentiment': os_sentiment
            }
        }
        session_manager.add_result(session_data)
        
        return jsonify({
            "id": conversion_id,
            "text": text,
            "google": {
                "voice": google_voice,
                "audio": google_base64,
                "sentiment": google_sentiment
            },
            "opensource": {
                "voice": os_voice,
                "audio": os_base64,
                "sentiment": os_sentiment
            }
        })
    
    except Exception as e:
        logger.exception("Error in text-to-speech comparison")
        return jsonify({"error": str(e)}), 500

# Clean up temporary files when the app exits
import atexit
def cleanup():
    import shutil
    try:
        shutil.rmtree(TEMP_DIR)
        logger.info(f"Cleaned up temporary directory: {TEMP_DIR}")
    except Exception as e:
        logger.error(f"Error cleaning up temporary directory: {e}")

atexit.register(cleanup)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)