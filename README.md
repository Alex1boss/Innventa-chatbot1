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

This application is designed to be hosted 24/7 for free on Replit. The implementation includes multiple redundant systems to ensure maximum uptime even on Replit's free tier.

### Deployment Instructions

1. **Fork or Create a New Replit**:
   - Create a new Replit project or fork this repository
   - Make sure it's set up as a Node.js project

2. **Deploy the Application**:
   - Click the "Deploy" button in the Replit interface
   - This will create a public URL for your application
   - Note the URL, it will be in the format: `https://your-repl-name.username.repl.co`

3. **Set Up the ManyChat Integration**:
   - Configure ManyChat to use your deployed application URL
   - Use the `/chatbot` endpoint for Instagram DM integration

Now follow these steps for 24/7 availability:

### Steps for 24/7 Free Hosting

1. **Enable Always On**:
   - Go to your Replit project dashboard
   - Click the "Tools" button in the left sidebar
   - Select "Always On" 
   - Toggle it ON to keep your repl running even when not actively used

2. **Configure API Keys**:
   - Set up required API keys in Replit Secrets for security
   - Go to "Secrets" in the Replit Tools menu
   - Add the following secrets:
     - `OPENAI_API_KEY` - Your OpenAI API key
     - `GEMINI_API_KEY` - Your Google Gemini API key (optional, for fallback)

3. **Use the Provided Monitoring System**:
   The project includes two monitoring scripts to ensure 24/7 availability:
   
   a) **Internal Monitoring (keepalive.js)**:
   - Monitors the application from within the Replit environment
   - Automatically restarts the application if it becomes unresponsive
   - Run it in the background with: `node keepalive.js &`
   
   b) **External Monitoring (external-monitoring.js)**:
   - Simulates external pings to keep the Replit instance alive
   - Works even when Always On has limitations
   - Run it in a separate terminal with: `node external-monitoring.js &`

4. **Use the One-Command Startup Script**:
   - We've created a convenient startup script that handles everything for you
   - In the Replit Shell, simply run:
   ```bash
   ./start-all.sh
   ```
   - This script will:
     - Check if your API keys are configured
     - Start the main application server
     - Launch the internal monitoring system (keepalive.js)
     - Launch the external monitoring system (external-monitoring.js)
     - Show the status of all running processes
   
   - Alternatively, you can start components manually:
   ```bash
   # Start the internal monitoring
   node keepalive.js &
   
   # Start the external monitoring in a separate process
   node external-monitoring.js &
   
   # You can check that all are running with:
   ps aux | grep node
   ```

5. **Additional External Monitoring (Optional but Recommended)**:
   - Use a free service like UptimeRobot (https://uptimerobot.com/)
   - Create a new monitor that pings `https://your-repl-name.username.repl.co/health` every 5 minutes
   - Set up alert notifications to your email if the service goes down

6. **For Ultimate Reliability (Optional)**:
   - Set up multiple external monitoring services (UptimeRobot, Pingdom, StatusCake)
   - Configure them to ping at different intervals
   - This ensures your app never sleeps on Replit's free tier

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