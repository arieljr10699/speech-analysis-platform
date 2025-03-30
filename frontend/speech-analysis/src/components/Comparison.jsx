// src/components/Comparison.jsx
import { useState, useEffect, useRef } from "react";
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
const API_BASE_URL = "http://localhost:8080/api";

const Comparison = () => {
  const [text, setText] = useState("");
  const [compareResults, setCompareResults] = useState(null);
  const [googleVoice, setGoogleVoice] = useState("en-US-Neural2-F");
  const [osVoice, setOsVoice] = useState("en-US-ChristopherNeural");
  const [googleVoices, setGoogleVoices] = useState([]);
  const [osVoices, setOsVoices] = useState([]);
  const [comparisonType, setComparisonType] = useState("sentiment");
  const [characterCount, setCharacterCount] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const {
    loading,
    compareTextToSpeechProcessing,
    compareSentimentProcessing,
    compareSpeechToTextProcessing,
  } = useApi();

  const [localLoading, setLocalLoading] = useState(false);

  // Load voices on mount
  useEffect(() => {
    const loadAllVoices = async () => {
      try {
        console.log("Loading Google voices...");
        // Load Google voices
        const googleResponse = await fetch(
          `${API_BASE_URL}/voices?provider=google`
        );
        const googleData = await googleResponse.json();
        console.log("Google voices response:", googleData);

        if (googleData.voices && Array.isArray(googleData.voices)) {
          setGoogleVoices(googleData.voices);
          console.log(`Loaded ${googleData.voices.length} Google voices`);
        } else {
          console.warn("No Google voices found in response", googleData);
        }

        console.log("Loading opensource voices...");
        // Load opensource voices
        const osResponse = await fetch(
          `${API_BASE_URL}/voices?provider=opensource`
        );
        const osData = await osResponse.json();
        console.log("Open-source voices response:", osData);

        if (osData.voices && Array.isArray(osData.voices)) {
          setOsVoices(osData.voices);
          console.log(`Loaded ${osData.voices.length} open-source voices`);
        } else {
          console.warn("No opensource voices found in response", osData);
        }
      } catch (error) {
        console.error("Error loading voices:", error);
        toast.error("Failed to load voices");
      }
    };

    loadAllVoices();
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setCharacterCount(newText.length);
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        setAudioBlob(audioBlob);
        setAudioURL(audioUrl);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setElapsedTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      toast.info("Recording started");
    } catch (error) {
      toast.error("Could not access microphone");
      console.error("Error accessing microphone:", error);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
      toast.info("Recording stopped");
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const runComparison = async () => {
    if (comparisonType === "stt") {
      if (!audioBlob) {
        toast.error("Please record some audio first");
        return;
      }

      try {
        setLocalLoading(true);

        // Using our new unified endpoint
        const result = await compareSpeechToTextProcessing(audioBlob);

        // Ensure correct format - check if the results are in the right structure
        // This makes it work with both the old and new API formats
        setCompareResults({
          google: {
            results: result.google.results || result.google.transcription,
            sentiment: result.google.sentiment,
          },
          opensource: {
            results:
              result.opensource.results || result.opensource.transcription,
            sentiment: result.opensource.sentiment,
          },
        });

        toast.success("Comparison completed successfully");
      } catch (error) {
        console.error("Error comparing speech-to-text:", error);
        toast.error("Failed to compare speech-to-text");
      } finally {
        setLocalLoading(false);
      }
    } else if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }

    try {
      if (comparisonType === "sentiment") {
        const result = await compareSentimentProcessing(text);
        setCompareResults(result);
      } else if (comparisonType === "tts") {
        const result = await compareTextToSpeechProcessing(
          text,
          googleVoice,
          osVoice
        );
        setCompareResults(result);
      } else if (comparisonType === "stt") {
        // Create form data for Google
        const googleFormData = new FormData();
        googleFormData.append("audio", audioBlob);
        googleFormData.append("provider", "google");

        // Create form data for Open Source
        const osFormData = new FormData();
        osFormData.append("audio", audioBlob);
        osFormData.append("provider", "opensource");

        setLocalLoading(true);

        try {
          // Make API calls
          const googleResponse = await fetch(`${API_BASE_URL}/speech-to-text`, {
            method: "POST",
            body: googleFormData,
          });

          const googleData = await googleResponse.json();

          const osResponse = await fetch(`${API_BASE_URL}/speech-to-text`, {
            method: "POST",
            body: osFormData,
          });

          const osData = await osResponse.json();

          // Format results similar to other comparison modes
          setCompareResults({
            google: {
              results: googleData.results,
              sentiment: googleData.sentiment,
            },
            opensource: {
              results: osData.results,
              sentiment: osData.sentiment,
            },
          });

          toast.success("Comparison completed successfully");
        } catch (error) {
          console.error("Error comparing speech-to-text:", error);
          toast.error("Failed to compare speech-to-text");
        } finally {
          setLocalLoading(false);
        }
      }
    } catch (error) {
      console.error("Error running comparison:", error);
      toast.error("Failed to run comparison");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Provider Comparison</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comparison Type
          </label>
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setComparisonType("sentiment")}
              className={`px-4 py-2 text-sm font-medium ${
                comparisonType === "sentiment"
                  ? "bg-purple-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } ${
                comparisonType === "sentiment" ? "" : "border-r border-gray-300"
              }`}
              style={{
                borderTopLeftRadius: "0.375rem",
                borderBottomLeftRadius: "0.375rem",
              }}
            >
              Sentiment Analysis
            </button>
            <button
              type="button"
              onClick={() => setComparisonType("tts")}
              className={`px-4 py-2 text-sm font-medium ${
                comparisonType === "tts"
                  ? "bg-purple-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border-r border-l border-gray-300`}
            >
              Text-to-Speech
            </button>
            <button
              type="button"
              onClick={() => setComparisonType("stt")}
              className={`px-4 py-2 text-sm font-medium ${
                comparisonType === "stt"
                  ? "bg-purple-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              style={{
                borderTopRightRadius: "0.375rem",
                borderBottomRightRadius: "0.375rem",
              }}
            >
              Speech-to-Text
            </button>
          </div>
        </div>

        {/* Different inputs based on comparison type */}
        {comparisonType !== "stt" ? (
          <div className="mb-4">
            <label
              htmlFor="comparison-text"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter text to compare
            </label>
            <textarea
              id="comparison-text"
              value={text}
              onChange={handleTextChange}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Type text to compare providers..."
              disabled={loading || localLoading}
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
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Record audio to compare transcription
            </label>

            <div className="flex flex-col items-center space-y-4">
              {/* Recording controls */}
              <div className="flex items-center justify-center space-x-4 w-full">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={loading || localLoading}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-full flex items-center space-x-2 disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <>
                    <div className="text-lg font-medium">
                      {formatTime(elapsedTime)}
                    </div>
                    <div className="animate-pulse flex space-x-1">
                      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-full flex items-center space-x-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Stop Recording</span>
                    </button>
                  </>
                )}
              </div>

              {/* Audio playback */}
              {audioURL && (
                <div className="mt-4 w-full">
                  <audio src={audioURL} controls className="w-full" />
                </div>
              )}
            </div>
          </div>
        )}

        {comparisonType === "tts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="google-voice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Google Voice
              </label>
              <select
                id="google-voice"
                value={googleVoice}
                onChange={(e) => setGoogleVoice(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={loading || localLoading}
              >
                {googleVoices.length === 0 ? (
                  <option>Loading voices...</option>
                ) : (
                  googleVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.gender}, {voice.language_codes[0]})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="os-voice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Open Source Voice
              </label>
              <select
                id="os-voice"
                value={osVoice}
                onChange={(e) => setOsVoice(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={loading || localLoading}
              >
                {osVoices.length === 0 ? (
                  <option>Loading voices...</option>
                ) : (
                  osVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.gender}, {voice.language_codes[0]})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        )}

        <button
          onClick={runComparison}
          disabled={
            loading ||
            localLoading ||
            (comparisonType !== "stt" && !text.trim()) ||
            (comparisonType === "stt" && !audioBlob)
          }
          className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? "Processing..." : "Run Comparison"}
        </button>

        {compareResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Google Results */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Google Cloud
              </h3>

              {comparisonType === "sentiment" ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Sentiment:</span>{" "}
                    {compareResults.google.sentiment.sentiment}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Score:</span>{" "}
                    {compareResults.google.sentiment.score !== null
                      ? compareResults.google.sentiment.score.toFixed(2)
                      : "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Magnitude:</span>{" "}
                    {compareResults.google.sentiment.magnitude !== null
                      ? compareResults.google.sentiment.magnitude.toFixed(2)
                      : "N/A"}
                  </p>
                </div>
              ) : comparisonType === "tts" ? (
                <div>
                  <audio
                    src={`data:audio/mp3;base64,${compareResults.google.audio}`}
                    controls
                    className="w-full mb-4"
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Voice:</span>{" "}
                      {compareResults.google.voice}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Sentiment:</span>{" "}
                      {compareResults.google.sentiment.sentiment}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Transcription:</span>{" "}
                    {compareResults.google.results.text}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Confidence:</span>{" "}
                    {compareResults.google.results.confidence !== null
                      ? `${(
                          compareResults.google.results.confidence * 100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Model:</span>{" "}
                    {compareResults.google.results.model_used || "N/A"}
                  </p>
                  {compareResults.google.sentiment && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Sentiment:</span>{" "}
                      {compareResults.google.sentiment.sentiment}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Open Source Results */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Open Source
              </h3>

              {comparisonType === "sentiment" ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Sentiment:</span>{" "}
                    {compareResults.opensource.sentiment.sentiment}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Score:</span>{" "}
                    {compareResults.opensource.sentiment.score !== null
                      ? compareResults.opensource.sentiment.score.toFixed(2)
                      : "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Magnitude:</span>{" "}
                    {compareResults.opensource.sentiment.magnitude !== null
                      ? compareResults.opensource.sentiment.magnitude.toFixed(2)
                      : "N/A"}
                  </p>
                </div>
              ) : comparisonType === "tts" ? (
                <div>
                  <audio
                    src={`data:audio/mp3;base64,${compareResults.opensource.audio}`}
                    controls
                    className="w-full mb-4"
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Voice:</span>{" "}
                      {compareResults.opensource.voice}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Sentiment:</span>{" "}
                      {compareResults.opensource.sentiment.sentiment}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Transcription:</span>{" "}
                    {compareResults.opensource.results.text}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Confidence:</span>{" "}
                    {compareResults.opensource.results.confidence !== null
                      ? `${(
                          compareResults.opensource.results.confidence * 100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Model:</span>{" "}
                    {compareResults.opensource.results.model_used || "N/A"}
                  </p>
                  {compareResults.opensource.sentiment && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Sentiment:</span>{" "}
                      {compareResults.opensource.sentiment.sentiment}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comparison;
