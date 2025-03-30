// src/services/api.js
const API_BASE_URL = "http://localhost:8080/api";

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "An error occurred");
  }
  return response.json();
};

// Fetch all results from the session
export const fetchResults = async () => {
  const response = await fetch(`${API_BASE_URL}/results`, {
    credentials: "include",
  });
  return handleResponse(response);
};

// Clear all results from the session
export const clearAllResults = async () => {
  const response = await fetch(`${API_BASE_URL}/results`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(response);
};

// Get a specific result by ID
export const fetchResultById = async (resultId) => {
  const response = await fetch(`${API_BASE_URL}/results/${resultId}`, {
    credentials: "include",
  });
  return handleResponse(response);
};

// Convert speech to text
export const convertSpeechToText = async (audioBlob, provider = "google") => {
  const formData = new FormData();
  formData.append("audio", audioBlob);
  formData.append("provider", provider);

  const response = await fetch(`${API_BASE_URL}/speech-to-text`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  return handleResponse(response);
};

// Convert text to speech
export const convertTextToSpeech = async (text, voice, provider = "google") => {
  const response = await fetch(`${API_BASE_URL}/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voice, provider }),
    credentials: "include",
  });

  return handleResponse(response);
};

// Analyze sentiment of text
export const analyzeSentiment = async (text, provider = "google") => {
  const response = await fetch(`${API_BASE_URL}/sentiment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, provider }),
    credentials: "include",
  });

  return handleResponse(response);
};

// Get available voices for text-to-speech
export const fetchAvailableVoices = async (provider = "google") => {
  const response = await fetch(`${API_BASE_URL}/voices?provider=${provider}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(response);
};

export const compareTextToSpeech = async (text, googleVoice, osVoice) => {
  const response = await fetch(`${API_BASE_URL}/compare/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      google_voice: googleVoice,
      os_voice: osVoice,
    }),
    credentials: "include",
  });

  return handleResponse(response);
};

export const compareSentiment = async (text) => {
  const response = await fetch(`${API_BASE_URL}/compare/sentiment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
    credentials: "include",
  });

  return handleResponse(response);
};

// Add this new function to your API service
export const compareSpeechToText = async (audioBlob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob);

  const response = await fetch(`${API_BASE_URL}/compare/speech-to-text`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to compare speech-to-text");
  }

  return await response.json();
};

// Health check
export const checkApiHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
};
