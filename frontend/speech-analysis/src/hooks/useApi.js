// src/hooks/useApi.js
import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  convertSpeechToText,
  convertTextToSpeech,
  analyzeSentiment,
  fetchAvailableVoices,
  compareTextToSpeech,
  compareSentiment,
  compareSpeechToText,
} from "../services/api";

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voices, setVoices] = useState([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [provider, setProvider] = useState("google"); // 'google' or 'opensource'

  // Process speech-to-text conversion
  const processSpeechToText = async (audioBlob, onSuccess) => {
    if (!audioBlob) {
      toast.error("No audio recording to process");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await convertSpeechToText(audioBlob, provider);
      if (onSuccess) {
        onSuccess(result);
      }
      toast.success("Speech processed successfully");
      return result;
    } catch (err) {
      console.error("Error processing speech:", err);
      setError(err.message || "Failed to process speech");
      toast.error("Failed to process speech");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Process text-to-speech conversion
  const processTextToSpeech = async (text, voice, onSuccess) => {
    if (!text || !text.trim()) {
      toast.error("No text to process");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await convertTextToSpeech(text, voice, provider);
      if (onSuccess) {
        onSuccess(result);
      }
      toast.success("Text processed successfully");
      return result;
    } catch (err) {
      console.error("Error processing text:", err);
      setError(err.message || "Failed to process text");
      toast.error("Failed to process text");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Process sentiment analysis
  const processSentiment = async (text, onSuccess) => {
    if (!text || !text.trim()) {
      toast.error("No text to analyze");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await analyzeSentiment(text, provider);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err) {
      console.error("Error analyzing sentiment:", err);
      setError(err.message || "Failed to analyze sentiment");
      toast.error("Failed to analyze sentiment");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load available voices for text-to-speech
  const loadVoices = useCallback(async () => {
    // Stop any infinite loop by checking if we're already loading
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      setVoicesLoaded(false);

      console.log(`Fetching voices for provider: ${provider}`);
      const data = await fetchAvailableVoices(provider);

      if (data.voices && Array.isArray(data.voices)) {
        setVoices(data.voices);
        console.log(`Loaded ${data.voices.length} voices for ${provider}`);
      } else {
        setVoices([]);
        console.warn("No voices returned from API");
      }
    } catch (err) {
      console.error("Error loading voices:", err);
      setError(err.message || "Failed to load voices");
      toast.error("Failed to load available voices");
      setVoices([]);
    } finally {
      setVoicesLoaded(true);
      setLoading(false);
    }
  }, [provider]);

  // Compare text-to-speech between Google and open-source
  const compareTextToSpeechProcessing = async (
    text,
    googleVoice,
    osVoice,
    onSuccess
  ) => {
    if (!text || !text.trim()) {
      toast.error("No text to process");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await compareTextToSpeech(text, googleVoice, osVoice);
      if (onSuccess) {
        onSuccess(result);
      }
      toast.success("Comparison completed successfully");
      return result;
    } catch (err) {
      console.error("Error comparing text-to-speech:", err);
      setError(err.message || "Failed to compare text-to-speech");
      toast.error("Failed to compare text-to-speech");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Compare sentiment analysis between Google and open-source
  const compareSentimentProcessing = async (text, onSuccess) => {
    if (!text || !text.trim()) {
      toast.error("No text to analyze");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await compareSentiment(text);
      if (onSuccess) {
        onSuccess(result);
      }
      toast.success("Comparison completed successfully");
      return result;
    } catch (err) {
      console.error("Error comparing sentiment:", err);
      setError(err.message || "Failed to compare sentiment");
      toast.error("Failed to compare sentiment");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const compareSpeechToTextProcessing = async (audioBlob, onSuccess) => {
    if (!audioBlob) {
      toast.error("No audio recording to process");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await compareSpeechToText(audioBlob);
      if (onSuccess) {
        onSuccess(result);
      }
      toast.success("Speech comparison completed successfully");
      return result;
    } catch (err) {
      console.error("Error comparing speech-to-text:", err);
      setError(err.message || "Failed to compare speech-to-text");
      toast.error("Failed to compare speech-to-text");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    voices,
    voicesLoaded,
    provider,
    setProvider,
    processSpeechToText,
    processTextToSpeech,
    processSentiment,
    loadVoices,
    compareTextToSpeechProcessing,
    compareSentimentProcessing,
    compareSpeechToTextProcessing,
  };
};

export default useApi;
