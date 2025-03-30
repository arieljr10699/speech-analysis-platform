// src/components/TextInput.jsx
// src/components/TextInput.jsx
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import useApi from "../hooks/useApi";
import ProviderToggle from "./ProviderToggle";

const TextInput = ({ onNewResult }) => {
  // Local state for text input and characterCount
  const [text, setText] = useState("");
  const [characterCount, setCharacterCount] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("en-US-Neural2-F");
  const [sentiment, setSentiment] = useState(null);

  // Use the custom API hook
  const {
    loading: processing,
    error: apiError,
    voices: availableVoices,
    voicesLoaded,
    provider,
    setProvider,
    processTextToSpeech,
    processSentiment,
    loadVoices,
  } = useApi();

  // Handle errors from hooks
  useEffect(() => {
    if (apiError) {
      toast.error(apiError);
    }
  }, [apiError]);

  // Load available voices when component mounts or provider changes
  // IMPORTANT: Just have ONE useEffect for voice loading
  useEffect(() => {
    loadVoices();
    // No dependency on loadVoices to avoid the loop
  }, [provider]);

  useEffect(() => {
    // Reset voice when provider changes to avoid invalid voice errors
    if (provider === "opensource") {
      setSelectedVoice("en-US-ChristopherNeural"); // Default Edge TTS voice
    } else if (provider === "google") {
      setSelectedVoice("en-US-Neural2-F"); // Default Google voice
    }
  }, [provider]);

  // Handle text change and update character count
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setCharacterCount(newText.length);
  };

  // Process text for text-to-speech conversion
  const processText = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }

    // Get sentiment analysis
    const sentimentData = await processSentiment(text, (result) => {
      setSentiment(result.sentiment);
    });

    // Convert text to speech
    const ttsData = await processTextToSpeech(text, selectedVoice, (result) => {
      // This is the onSuccess callback for text-to-speech
      if (onNewResult) {
        onNewResult({
          id: result.id,
          type: "text_to_speech",
          text: text,
          audio: result.audio,
          sentiment: sentimentData?.sentiment,
        });
      }
    });

    if (ttsData?.audio) {
      // Create audio URL from base64 data
      const audioData = atob(ttsData.audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const uint8Array = new Uint8Array(arrayBuffer);

      for (let i = 0; i < audioData.length; i++) {
        uint8Array[i] = audioData.charCodeAt(i);
      }

      const audioBlob = new Blob([arrayBuffer], { type: "audio/mp3" });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    }
  };

  // Reset the component state
  const resetText = () => {
    setText("");
    setAudioUrl("");
    setSentiment(null);
    setCharacterCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">
          Text to Speech Conversion
        </h2>

        <ProviderToggle
          provider={provider}
          onChange={setProvider}
          disabled={processing}
        />

        <div className="space-y-4">
          {/* Text input */}
          <div>
            <label
              htmlFor="text-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter text to convert to speech
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={handleTextChange}
              rows={5}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Type or paste text here..."
              disabled={processing}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Characters: {characterCount}</span>
              <span>
                {characterCount > 1000
                  ? "Warning: Long texts may take longer to process"
                  : ""}
              </span>
            </div>
          </div>

          {/* Voice selection */}
          <div>
            <label
              htmlFor="voice-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Voice
            </label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!voicesLoaded || processing}
            >
              {!voicesLoaded ? (
                <option>Loading voices...</option>
              ) : availableVoices.length === 0 ? (
                <option>No voices available</option>
              ) : (
                availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.gender}, {voice.language_codes[0]})
                    {voice.natural ? " - Natural" : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Process buttons */}
          <div className="flex space-x-2">
            <button
              onClick={processText}
              disabled={processing || !text.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md flex-1 disabled:opacity-50"
            >
              {processing ? "Processing..." : "Convert to Speech"}
            </button>

            <button
              onClick={resetText}
              disabled={processing || (!text && !audioUrl)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Audio playback and sentiment results */}
      {audioUrl && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Speech Output</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Audio</h3>
              <audio src={audioUrl} controls className="w-full" />
            </div>

            {sentiment && (
              <div className="bg-purple-50 p-4 rounded-md">
                <h3 className="font-medium text-purple-700 mb-1">
                  Sentiment Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      Overall Sentiment
                    </p>
                    <p className="text-purple-800">
                      {sentiment.sentiment || "Neutral"}
                      {sentiment.confidence
                        ? ` (${(sentiment.confidence * 100).toFixed(1)}%)`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900">Score</p>
                    <p className="text-purple-800">
                      {sentiment.score ? sentiment.score.toFixed(2) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      Magnitude
                    </p>
                    <p className="text-purple-800">
                      {sentiment.magnitude
                        ? sentiment.magnitude.toFixed(2)
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {sentiment.sentences && sentiment.sentences.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-purple-900 mb-2">
                      Sentence-level Sentiment
                    </p>
                    <div className="max-h-40 overflow-y-auto">
                      {sentiment.sentences.map((sentence, index) => (
                        <div
                          key={index}
                          className="mb-2 pb-2 border-b border-purple-100 last:border-0"
                        >
                          <p className="text-sm text-gray-800">
                            {sentence.text}
                          </p>
                          <p className="text-xs text-purple-700">
                            {sentence.sentiment} (Score:{" "}
                            {sentence.score.toFixed(2)})
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextInput;
