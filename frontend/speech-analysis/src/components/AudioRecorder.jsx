// src/components/AudioRecorder.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import useRecorder from "../hooks/useRecorder";
import useApi from "../hooks/useApi";
import ProviderToggle from "./ProviderToggle";

const AudioRecorder = ({ onNewResult }) => {
  // Use the custom hooks
  const {
    isRecording,
    recordingTime,
    formattedTime,
    audioBlob,
    audioURL,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useRecorder();

  const {
    loading: processing,
    error: apiError,
    processSpeechToText,
    provider,
    setProvider,
  } = useApi();

  // Local state for transcription results
  const [transcription, setTranscription] = useState(null);

  // Handle errors from hooks
  if (recorderError) {
    toast.error(recorderError);
  }

  // Process recorded audio for speech-to-text
  const processAudio = async () => {
    if (!audioBlob) {
      toast.error("No recording to process");
      return;
    }

    const data = await processSpeechToText(audioBlob, (result) => {
      // This is the onSuccess callback
      if (onNewResult) {
        onNewResult(result);
      }
    });

    if (data) {
      setTranscription({
        text: data.results.text || "No transcription available",
        modelUsed: data.results.model_used,
        confidence: data.results.confidence,
        sentiment: data.sentiment,
      });
    }
  };

  // Reset the recorder state
  const resetRecorder = () => {
    resetRecording();
    setTranscription(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">
          Speech to Text Conversion
        </h2>

        <ProviderToggle
          provider={provider}
          onChange={setProvider}
          disabled={processing}
        />

        <div className="flex flex-col items-center space-y-4">
          {/* Recording controls */}
          <div className="flex items-center justify-center space-x-4 w-full">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={processing}
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
                <div className="text-lg font-medium">{formattedTime}</div>
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

              <div className="flex mt-4 space-x-2">
                <button
                  onClick={processAudio}
                  disabled={processing}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md flex-1 disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Process Speech"}
                </button>

                <button
                  onClick={resetRecorder}
                  disabled={processing}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transcription results */}
      {transcription && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Transcription Results</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700">{transcription.text}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-700 mb-1">Model Used</h3>
                <p className="text-blue-800">
                  {transcription.modelUsed || "Unknown"}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="font-medium text-green-700 mb-1">Confidence</h3>
                <p className="text-green-800">
                  {transcription.confidence
                    ? `${(transcription.confidence * 100).toFixed(1)}%`
                    : "Not available"}
                </p>
              </div>

              {transcription.sentiment && (
                <div className="bg-purple-50 p-4 rounded-md">
                  <h3 className="font-medium text-purple-700 mb-1">
                    Sentiment
                  </h3>
                  <p className="text-purple-800">
                    {transcription.sentiment.sentiment || "Neutral"}
                    {transcription.sentiment.confidence
                      ? ` (${(transcription.sentiment.confidence * 100).toFixed(
                          1
                        )}%)`
                      : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
