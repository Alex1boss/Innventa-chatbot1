# Innventa AI Chatbot

A chatbot system for Instagram DMs that provides Innventa AI app information and redirects product inquiries to the app.

## Features

- Provides information about the Innventa AI app
- Redirects product recommendation requests to the app
- Supports integration with external platforms (ManyChat for Instagram DMs)
- Uses AI/NLP for flexible, natural-sounding responses
- Fallback mechanism between different AI providers (OpenAI, Google Gemini)

## API Endpoints

### Web Interface
- `GET /` - Chat web interface

### Regular Chat API
- `GET /api/chat/session` - Create a new chat session
- `GET /api/chat/welcome` - Get welcome message
- `POST /api/chat/message` - Send a message and get response
- `GET /api/chat/history/:sessionId` - Get chat history for a session

### External Integration API
- `POST /chatbot` - Simple endpoint for external platforms like ManyChat
  - Request format: `{ "message": "user message here" }`
  - Response format: `{ "reply": "chatbot reply here" }`

### Monitoring
- `GET /health` - Health check endpoint

## Hosting 24/7 for Free on Replit

This application is designed to be hosted 24/7 for free on Replit. Follow these steps:

### Steps for 24/7 Free Hosting

1. **Enable Always On**:
   - Go to your Replit project
   - Click the "Tools" button in the left sidebar
   - Select "Always On" 
   - Toggle it ON to keep your repl running even when not actively used

2. **Run the Keep-Alive Script**:
   - The application includes a `keepalive.js` script that monitors and automatically restarts the service if needed
   - In the Replit Shell, run: `node keepalive.js &` to run it in the background

3. **Set Up External Pinging**:
   - Use a free service like UptimeRobot (https://uptimerobot.com/) to ping your app
   - Create a new monitor that pings `https://your-repl-name.username.repl.co/health` every 5 minutes
   - This keeps the application from going to sleep

4. **Configure API Keys**:
   - Make sure your API keys are set in Replit Secrets for security
   - Required secrets: `OPENAI_API_KEY` and/or `GEMINI_API_KEY`

### Using with Instagram/ManyChat

To use this chatbot with Instagram DMs through ManyChat:

1. Set up a ManyChat account and connect your Instagram business profile
2. In ManyChat Flow Builder, create a new flow triggered by specific messages
3. Add an HTTP Request action using:
   - Method: POST
   - URL: `https://your-repl-name.username.repl.co/chatbot`
   - Headers: `{ "Content-Type": "application/json" }`
   - Body: `{ "message": "{{last user message}}" }`
4. Parse the response to get the reply from: `{{HTTP.body.reply}}`
5. Send the parsed reply back to the user

## Development

### Running Locally
```bash
npm run dev
```

### Required Environment Variables
- `OPENAI_API_KEY` - OpenAI API key
- `GEMINI_API_KEY` - Google Gemini API key (optional, for fallback)