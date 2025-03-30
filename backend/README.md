# Speech Analysis Platform - Backend

This is the backend of the Speech Analysis Platform project, which provides APIs for speech-to-text analysis, sentiment analysis, and text-to-speech capabilities.

## Overview

The backend of the Speech Analysis Platform includes services for:

- Speech-to-text conversion using Google Cloud Speech-to-Text API
- Text-to-speech synthesis using Google Cloud Text-to-Speech API
- Sentiment analysis using Google Cloud Natural Language API
- Utility functions to handle requests and manage credentials
- Open Source alternatives for STT, TTS and Sentiment Analysis inside the `open_source_services/` directory

## Installation

Follow these steps to set up the backend:

### Prerequisites

- Python 3.4+
- Google Cloud Account (for using the Google APIs)

### Setup Instructions

1. Clone the repository:

   ````bash
   git clone https://github.com/arieljr10699/speech-analysis-platform.git ```

   ````

2. Navigate to the backend directory:

cd speech-analysis-platform/backend

3. Install dependencies and download the SpaCy model:

`pip install -r requirements.txt`
`python -m spacy download en_core_web_sm`

4.

- Visit the Google Cloud Console.

- Create a new project or select an existing one.

- Enable the Speech-to-Text, Text-to-Speech, and Natural Language APIs.

- Create a service account and download the JSON key file.

- Create an environment variable called GOOGLE_APPLICATION_CREDENTIALS and point to the JSON key file.

5. Start the backend server:

`python app.py`
