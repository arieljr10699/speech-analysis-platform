// src/components/Results.jsx
import { useState } from "react";
import { toast } from "react-toastify";

const Results = ({ results, onRefresh, onClear, loading }) => {
  const [activeType, setActiveType] = useState("all");
  const [expandedResult, setExpandedResult] = useState(null);

  // Filter results by type
  const filteredResults =
    activeType === "all"
      ? results
      : results.filter((result) => result.type === activeType);

  // Toggle result expansion
  const toggleExpand = (id) => {
    setExpandedResult(expandedResult === id ? null : id);
  };

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";

    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

  // Render empty state
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No results</h3>
        <p className="mt-1 text-sm text-gray-500">
          Use the Speech-to-Text or Text-to-Speech tools to create results.
        </p>
        <div className="mt-6">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Results"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Results</h2>

        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              if (
                window.confirm("Are you sure you want to clear all results?")
              ) {
                onClear();
              }
            }}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeType === "all"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveType("all")}
          >
            All Results
          </button>

          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeType === "speech_to_text"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveType("speech_to_text")}
          >
            Speech to Text
          </button>

          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeType === "text_to_speech"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveType("text_to_speech")}
          >
            Text to Speech
          </button>
        </nav>
      </div>

      {/* Results list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">
              No {activeType !== "all" ? activeType.replace("_", " ") : ""}{" "}
              results found
            </p>
          </div>
        ) : (
          filteredResults.map((result) => (
            <div
              key={result.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Result header */}
              <div
                className={`p-4 flex justify-between items-center cursor-pointer ${
                  expandedResult === result.id ? "bg-gray-50" : ""
                }`}
                onClick={() => toggleExpand(result.id)}
              >
                <div>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.type === "speech_to_text"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {result.type === "speech_to_text"
                        ? "Speech to Text"
                        : "Text to Speech"}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {formatDate(result.timestamp)}
                    </span>
                  </div>

                  <div className="mt-1">
                    {result.type === "speech_to_text" &&
                    result.transcription ? (
                      <p className="text-sm text-gray-700 truncate">
                        {result.transcription.text
                          ? `"${result.transcription.text.slice(0, 80)}${
                              result.transcription.text.length > 80 ? "..." : ""
                            }"`
                          : "No transcription available"}
                      </p>
                    ) : result.type === "text_to_speech" && result.text ? (
                      <p className="text-sm text-gray-700 truncate">
                        {`"${result.text.slice(0, 80)}${
                          result.text.length > 80 ? "..." : ""
                        }"`}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No content available
                      </p>
                    )}
                  </div>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 text-gray-400 transform transition-transform ${
                    expandedResult === result.id ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Expanded content */}
              {expandedResult === result.id && (
                <div className="border-t border-gray-200 p-4">
                  {result.type === "speech_to_text" && (
                    <>
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700">
                          Transcription
                        </h3>
                        <div className="mt-1 bg-gray-50 p-3 rounded-md">
                          <p className="text-gray-800">
                            {result.transcription?.text ||
                              "No transcription available"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {result.transcription?.model_used && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase">
                              Model
                            </h4>
                            <p className="text-sm text-gray-800">
                              {result.transcription.model_used}
                            </p>
                          </div>
                        )}

                        {result.transcription?.confidence !== undefined && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase">
                              Confidence
                            </h4>
                            <p className="text-sm text-gray-800">
                              {(result.transcription.confidence * 100).toFixed(
                                1
                              )}
                              %
                            </p>
                          </div>
                        )}

                        {result.sentiment && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase">
                              Sentiment
                            </h4>
                            <p className="text-sm text-gray-800">
                              {result.sentiment.sentiment || "Neutral"}
                              {result.sentiment.confidence
                                ? ` (${(
                                    result.sentiment.confidence * 100
                                  ).toFixed(1)}%)`
                                : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {result.type === "text_to_speech" && (
                    <>
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700">
                          Text
                        </h3>
                        <div className="mt-1 bg-gray-50 p-3 rounded-md">
                          <p className="text-gray-800">
                            {result.text || "No text available"}
                          </p>
                        </div>
                      </div>

                      {result.audio && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-700">
                            Audio
                          </h3>
                          <div className="mt-1">
                            <audio
                              controls
                              className="w-full"
                              src={`data:audio/mp3;base64,${result.audio}`}
                            />
                          </div>
                        </div>
                      )}

                      {result.sentiment && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">
                            Sentiment
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase">
                                Overall
                              </h4>
                              <p className="text-sm text-gray-800">
                                {result.sentiment.sentiment || "Neutral"}
                                {result.sentiment.confidence
                                  ? ` (${(
                                      result.sentiment.confidence * 100
                                    ).toFixed(1)}%)`
                                  : ""}
                              </p>
                            </div>

                            {result.sentiment.score !== undefined && (
                              <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase">
                                  Score
                                </h4>
                                <p className="text-sm text-gray-800">
                                  {result.sentiment.score.toFixed(2)}
                                </p>
                              </div>
                            )}

                            {result.sentiment.magnitude !== undefined && (
                              <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase">
                                  Magnitude
                                </h4>
                                <p className="text-sm text-gray-800">
                                  {result.sentiment.magnitude.toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Results;
