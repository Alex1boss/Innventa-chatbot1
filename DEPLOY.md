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
   - **Plan**: Free tier (512MB RAM, 0.1 CPU)
      - NOTE: While the application can run on the free tier, you may experience slower response times, especially during peak usage.

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

## Free Tier Optimizations

When using the free tier (512MB RAM, 0.1 CPU), consider the following optimizations:

1. **Response Time**: Expect slightly longer response times, especially for initial responses or after periods of inactivity.

2. **Memory Usage**: We've optimized the startup script to reduce memory usage:
   - Integrated health checks into the main process instead of using a separate process
   - Optimized interval times for monitoring tasks
   - Removed unnecessary background processes

3. **Concurrency**: The free tier has limited capacity to handle concurrent users. For production use with more than a few simultaneous users, consider upgrading to a paid plan.

### Keeping Your Free Tier Service Running 24/7

By default, Render free tier services sleep after 15 minutes of inactivity. To keep your service active 24/7, we've implemented multiple strategies:

#### 1. Built-in Anti-Idle Mechanism

The application includes an anti-idle system in `render-start.cjs` that:
- Makes internal health checks every 10 minutes
- Sends external pings to itself every 10 minutes (before Render's 15-minute sleep threshold)
- Automatically recovers if the service is temporarily unavailable

This built-in mechanism should keep your service active most of the time without any additional configuration.

#### 2. External Uptime Monitors (Recommended)

For maximum reliability, set up an external uptime monitor:

**Option A: Uptime Kuma (Self-hosted, Free)**
1. Deploy [Uptime Kuma](https://github.com/louislam/uptime-kuma) on another server or locally
2. Use the provided `uptime-kuma-config.json` file to configure monitoring
3. Set the ping interval to 5-10 minutes

**Option B: UptimeRobot (Cloud-based, Free Plan Available)**
1. Sign up at [UptimeRobot](https://uptimerobot.com/)
2. Add a new monitor with these settings:
   - Monitor Type: HTTP(S)
   - URL: `https://your-app-name.onrender.com/health`
   - Monitoring Interval: 5 minutes

**Option C: Local Keep-Alive Script**
1. Use the provided `keep-alive.js` script that runs on your local machine
2. Run it with: `APP_URL=https://your-app-name.onrender.com/health node keep-alive.js`
3. Keep the script running 24/7 on your computer or another server

**Option D: Cron Job Services**
1. Sign up at a service like [Cron-job.org](https://cron-job.org/) (free)
2. Create a new cron job to ping your app's health endpoint
3. Set it to run every 10 minutes

Using any of these external monitors in combination with the built-in mechanism will help ensure your application runs 24/7 on the free tier.

> **Note**: While these methods are effective at keeping your app awake, they do consume resources and generate network traffic. Make sure you're not violating any terms of service by using these techniques excessively.

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