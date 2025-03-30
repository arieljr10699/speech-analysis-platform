// src/App.jsx
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AudioRecorder from "./components/AudioRecorder";
import TextInput from "./components/TextInput";
import Results from "./components/Results";
import Dashboard from "./components/Dashboard";
import Comparison from "./components/Comparison";
import { fetchResults, clearAllResults } from "./services/api";

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Load results when component mounts
  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await fetchResults();
      setResults(data.results || []);
    } catch (error) {
      toast.error("Failed to load results");
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearResults = async () => {
    try {
      await clearAllResults();
      setResults([]);
      toast.success("Results cleared");
    } catch (error) {
      toast.error("Failed to clear results");
      console.error("Error clearing results:", error);
    }
  };

  // Add a new result to the list
  const handleNewResult = (result) => {
    setResults((prevResults) => [result, ...prevResults]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Speech Analysis Platform
          </h1>
          <p className="text-gray-500">
            Compare Speech-to-Text, Text-to-Speech, and Sentiment Analysis
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto pb-1">
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === "dashboard"
                ? "border-b-2 border-primary-500 text-primary-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === "speech-to-text"
                ? "border-b-2 border-primary-500 text-primary-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("speech-to-text")}
          >
            Speech-to-Text
          </button>
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === "text-to-speech"
                ? "border-b-2 border-primary-500 text-primary-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("text-to-speech")}
          >
            Text-to-Speech
          </button>
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === "comparison"
                ? "border-b-2 border-primary-500 text-primary-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("comparison")}
          >
            Comparison
          </button>
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === "results"
                ? "border-b-2 border-primary-500 text-primary-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("results")}
          >
            Results
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === "dashboard" && (
            <Dashboard
              results={results}
              onRefresh={loadResults}
              onClear={handleClearResults}
            />
          )}

          {activeTab === "speech-to-text" && (
            <AudioRecorder onNewResult={handleNewResult} />
          )}

          {activeTab === "text-to-speech" && (
            <TextInput onNewResult={handleNewResult} />
          )}

          {activeTab === "comparison" && <Comparison results={results} />}

          {activeTab === "results" && (
            <Results
              results={results}
              onRefresh={loadResults}
              onClear={handleClearResults}
              loading={loading}
            />
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Speech Analysis Platform - Ariel Gonzalez B. & Hamzeh Shuqair
          </p>
        </div>
      </footer>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;
