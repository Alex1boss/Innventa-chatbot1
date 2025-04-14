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

## Free Hosting Options

This application can be hosted for free on several platforms. We've prepared deployment instructions for Render.com's free tier, which offers 750 hours of runtime per month.

### Deployment on Render.com (Free)

See the detailed instructions in [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md).

Quick steps:
1. Push code to GitHub
2. Connect your GitHub repo to Render
3. Let Render detect the `render.yaml` configuration
4. Add your API keys as environment variables
5. Deploy your application

Your app will be available at `https://innventa-ai-chatbot.onrender.com` or a similar URL assigned by Render.

### Using with ManyChat for Instagram DMs

To integrate with Instagram DMs through ManyChat:

1. In ManyChat, create a new flow triggered by specific messages
2. Add an HTTP Request action using:
   - Method: POST
   - URL: `https://your-app-url.onrender.com/chatbot`
   - Headers: `{ "Content-Type": "application/json" }`
   - Body: `{ "message": "{{last user message}}" }`
3. Parse the response to get the reply from: `{{HTTP.body.reply}}`
4. Send the parsed reply back to the user

### Maintaining Availability (Free Tier Considerations)

Free tier services on Render spin down after periods of inactivity. To maximize uptime:

1. **External Monitoring**:
   - Use a free service like UptimeRobot (https://uptimerobot.com/)
   - Create a monitor to ping your `/health` endpoint every 5 minutes
   - This helps keep your application active

2. **Scheduled Jobs**: 
   - Consider setting up a scheduled job on Render to keep your service active
   - This can help prevent the service from spinning down

3. **Fast Recovery**:
   - The health endpoint helps your service recover quickly if it does spin down
   - The first request after inactivity may take a few seconds to respond



## Development

### Running Locally
```bash
npm run dev
```

### Required Environment Variables
- `OPENAI_API_KEY` - OpenAI API key
- `GEMINI_API_KEY` - Google Gemini API key (optional, for fallback)