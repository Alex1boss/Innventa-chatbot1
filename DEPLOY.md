# Innventa AI Chatbot Deployment Guide

This guide explains how to deploy the Innventa AI Chatbot to Render.com.

## Deployment Options

### 1. Using the Render Dashboard (Manual)

1. Log in to your Render account at [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New** and select **Web Service**
3. Connect your GitHub repository
4. Configure the following settings:
   - **Name**: innventa-ai-chatbot
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install; npm run build`
   - **Start Command**: `node render-start.cjs`
   - **Plan**: Pro Plus (8GB RAM, 4 CPU) or higher
      - IMPORTANT: Do not use the Free tier (512MB RAM) as it is insufficient for this application

5. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `EXTERNAL_URL`: `https://innventa-ai-chatbot.onrender.com/health` (replace with your actual deployed URL + /health)

6. Click **Create Web Service**

### 2. Using render.yaml (Blueprint)

If your repository contains the `render.yaml` file, you can deploy using Render Blueprints:

1. Navigate to [https://dashboard.render.com/blueprint/new](https://dashboard.render.com/blueprint/new)
2. Connect your GitHub repository
3. Render will automatically detect the `render.yaml` file and set up your services
4. Follow the prompts to complete the deployment

## Environment Variables

The following environment variables must be set in your Render dashboard:

- `NODE_ENV`: Set to `production` for deployment
- `OPENAI_API_KEY`: Your OpenAI API key
- `GEMINI_API_KEY`: Your Google Gemini API key
- `EXTERNAL_URL`: Optional URL for external healthchecks (usually `https://your-app-name.onrender.com/health`)

## Monitoring and Maintenance

The application includes several monitoring and maintenance tools:

### 1. Health Check Endpoint

The server exposes a `/health` endpoint that returns a 200 OK status when the service is running properly. Render uses this endpoint to monitor the application's health.

### 2. Keepalive Service

The `keepalive.cjs` script runs in the background to prevent the application from being idled by Render. This script:
- Performs internal health checks every 5 minutes
- Can be configured to ping an external URL to keep the service active

### 3. External Monitoring

The `external-monitoring.cjs` script can be run on a separate server to monitor the application's health from outside. This script:
- Pings the application's health endpoint every 5 minutes
- Retries failed health checks up to 3 times
- Can be extended to send alerts when the application is unreachable

## Troubleshooting

### ESM/CommonJS Compatibility

This application contains a mix of ESM and CommonJS modules. The following files have been specifically set up as CommonJS files (with .cjs extension):
- `render-start.cjs`: Main startup script for Render deployment
- `keepalive.cjs`: Background service to prevent idling
- `external-monitoring.cjs`: Optional external health monitoring
- `test-deployment.cjs`: Test script for verifying deployment

If you encounter errors like `ReferenceError: require is not defined in ES module scope`, you may need to ensure the file extensions are correct.

### API Keys

If you see errors related to the AI services, check that both API keys are properly set in the environment variables:

1. OpenAI API key (`OPENAI_API_KEY`)
2. Google Gemini API key (`GEMINI_API_KEY`)

### Port Binding

Render automatically assigns a port to your application. The application uses port 5000 internally but Render will route external traffic to this port.

### Logs

Access your application logs from the Render dashboard to diagnose issues.

## Testing the Deployment

After deployment, you can test the API with:

```bash
# Option 1: Use our test script
DEPLOYMENT_URL=https://your-app-name.onrender.com node test-deployment.cjs

# Option 2: Test manually with curl
# Check if the service is healthy
curl https://your-app-name.onrender.com/health

# Get a new chat session
curl https://your-app-name.onrender.com/api/chat/session

# Send a message (replace SESSION_ID with a valid session ID)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID", "content":"Hello, can you help me?", "fromUser":true}' \
  https://your-app-name.onrender.com/api/chat/message
```