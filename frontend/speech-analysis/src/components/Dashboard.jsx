// src/components/Dashboard.jsx
import { useState, useEffect } from "react";
import { checkApiHealth } from "../services/api";

const Dashboard = ({ results, onRefresh, onClear }) => {
  const [apiStatus, setApiStatus] = useState("checking");

  // Check API health on component mount
  useEffect(() => {
    checkApiHealthStatus();
  }, []);

  // Check API health
  const checkApiHealthStatus = async () => {
    try {
      setApiStatus("checking");
      await checkApiHealth();
      setApiStatus("online");
    } catch (error) {
      console.error("API health check failed:", error);
      setApiStatus("offline");
    }
  };

  // Calculate statistics
  const stats = {
    totalResults: results.length,
    speechToText: results.filter((r) => r.type === "speech_to_text").length,
    textToSpeech: results.filter((r) => r.type === "text_to_speech").length,
    recentResults: results.slice(0, 5),
    sentimentCounts: {
      positive: 0,
      neutral: 0,
      negative: 0,
    },
  };

  // Count sentiment results
  results.forEach((result) => {
    if (result.sentiment && result.sentiment.sentiment) {
      const sentiment = result.sentiment.sentiment.toLowerCase();
      if (sentiment === "positive") {
        stats.sentimentCounts.positive++;
      } else if (sentiment === "negative") {
        stats.sentimentCounts.negative++;
      } else {
        stats.sentimentCounts.neutral++;
      }
    }
  });

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";

    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6">
      {/* API Status */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard</h2>

        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600 mr-2">API Status:</span>
          {apiStatus === "checking" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Checking...
            </span>
          ) : apiStatus === "online" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Online
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Offline
            </span>
          )}

          <button
            onClick={checkApiHealthStatus}
            className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-gray-400 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Conversions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Conversions
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.totalResults}
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Speech to Text */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Speech to Text
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.speechToText}
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Text to Speech */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 001.06-7.073m-2.11 9.9a9 9 0 010-12.728"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Text to Speech
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.textToSpeech}
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis Metrics */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Sentiment Analysis
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-bold text-green-600">
                {stats.sentimentCounts.positive}
              </div>
              <p className="text-sm text-gray-500">Positive</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-gray-600">
                {stats.sentimentCounts.neutral}
              </div>
              <p className="text-sm text-gray-500">Neutral</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-red-600">
                {stats.sentimentCounts.negative}
              </div>
              <p className="text-sm text-gray-500">Negative</p>
            </div>
          </div>

          {/* Sentiment Distribution Bar */}
          {stats.totalResults > 0 && (
            <div className="mt-6">
              <div className="relative pt-1">
                <div className="flex h-4 overflow-hidden text-xs rounded-lg">
                  <div
                    style={{
                      width: `${
                        (stats.sentimentCounts.positive / stats.totalResults) *
                        100
                      }%`,
                    }}
                    className="bg-green-500 text-white flex items-center justify-center transition-all duration-500"
                  />
                  <div
                    style={{
                      width: `${
                        (stats.sentimentCounts.neutral / stats.totalResults) *
                        100
                      }%`,
                    }}
                    className="bg-gray-400 text-white flex items-center justify-center transition-all duration-500"
                  />
                  <div
                    style={{
                      width: `${
                        (stats.sentimentCounts.negative / stats.totalResults) *
                        100
                      }%`,
                    }}
                    className="bg-red-500 text-white flex items-center justify-center transition-all duration-500"
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <div>Positive</div>
                <div>Neutral</div>
                <div>Negative</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <div className="flex space-x-2">
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={onClear}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {stats.recentResults.length === 0 ? (
            <div className="p-5 text-center text-gray-500">
              No recent activity. Try converting some text or speech.
            </div>
          ) : (
            stats.recentResults.map((result) => (
              <div key={result.id} className="p-5 hover:bg-gray-50">
                <div className="flex justify-between">
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        result.type === "speech_to_text"
                          ? "bg-blue-100"
                          : "bg-purple-100"
                      }`}
                    >
                      {result.type === "speech_to_text" ? (
                        <svg
                          className="h-4 w-4 text-blue-600"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4 text-purple-600"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">
                          {result.type === "speech_to_text"
                            ? "Speech to Text"
                            : "Text to Speech"}
                        </h4>

                        {/* Add provider badge */}
                        <span
                          className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            result.provider === "google"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {result.provider === "google"
                            ? "Google"
                            : "Open Source"}
                        </span>

                        {result.sentiment && (
                          <span
                            className={`ml-2 inline-block h-2 w-2 rounded-full ${
                              result.sentiment.sentiment === "positive"
                                ? "bg-green-400"
                                : result.sentiment.sentiment === "negative"
                                ? "bg-red-400"
                                : "bg-gray-400"
                            }`}
                          ></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(result.timestamp)}
                      </p>
                      <p className="mt-1 text-sm text-gray-700 truncate max-w-xl">
                        {result.type === "speech_to_text"
                          ? result.transcription?.text
                            ? `"${result.transcription.text.slice(0, 50)}${
                                result.transcription.text.length > 50
                                  ? "..."
                                  : ""
                              }"`
                            : "No transcription available"
                          : result.text
                          ? `"${result.text.slice(0, 50)}${
                              result.text.length > 50 ? "..." : ""
                            }"`
                          : "No text available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
