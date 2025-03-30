// src/components/ProviderToggle.jsx
import React from "react";

const ProviderToggle = ({ provider, onChange, disabled = false }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        API Provider
      </label>
      <div className="flex rounded-md shadow-sm">
        <button
          type="button"
          onClick={() => onChange("google")}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-medium rounded-l-md ${
            provider === "google"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Google Cloud
        </button>
        <button
          type="button"
          onClick={() => onChange("opensource")}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-medium rounded-r-md ${
            provider === "opensource"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Open Source
        </button>
      </div>
    </div>
  );
};

export default ProviderToggle;
