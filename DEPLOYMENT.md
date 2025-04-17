# Deployment Guide for Innventa AI Chatbot

## Overview
This guide provides instructions for deploying the Innventa AI chatbot application to Render.com.

## Prerequisites
- A Render.com account
- Access to the GitHub repository with the chatbot code
- Meta Developer account (for Instagram API integration)

## Deployment Steps

### 1. Create a New Web Service on Render

1. Log in to your Render dashboard (https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository or use "Public Git repository" and provide the URL
4. Fill in the following details:
   - **Name**: innventachat-ai
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`

### 2. Set Up Environment Variables

Add the following environment variables in the Render dashboard:
- `NODE_ENV`: production
- `VERIFY_TOKEN`: innventa_secure_token
- `OPENAI_API_KEY`: (your OpenAI API key)
- `GEMINI_API_KEY`: (your Google Gemini API key)

### 3. Deploy the Service

1. Click "Create Web Service"
2. Wait for the deployment to complete (this may take a few minutes)
3. Your service will be available at: https://innventachat-ai.onrender.com

## Configuring Instagram Webhook

### 1. In Meta Developer Portal

1. Go to your app in the Meta Developer dashboard
2. Navigate to Products > Instagram > Settings
3. Under Webhooks section, click "Complete Setup" or "Edit"
4. Configure with these values:
   - **Callback URL**: `https://innventachat-ai.onrender.com/webhook`
   - **Verify Token**: `innventa_secure_token`
   - **Fields to subscribe to**: `messages`, `messaging_postbacks`
5. Click "Verify and Save"

### 2. Troubleshooting Webhook Issues

If you encounter "The callback URL or verify token couldn't be validated" error:

1. **Check URL accessibility**: 
   - Ensure your Render app is running and accessible
   - Try accessing `https://innventachat-ai.onrender.com/webhook` directly in browser

2. **Verify token match**: 
   - Confirm you're using `innventa_secure_token` exactly as written
   - This is case-sensitive, no spaces

3. **Network/Firewall issues**:
   - Meta's servers need to reach your webhook URL
   - Render URLs should work without issues

## Testing the Integration

1. In Meta Developer Portal, use the "Test" button in the Webhooks section
2. This will send a verification request to your webhook
3. Check the logs in Render to see if verification was successful
4. Test sending a message to your Instagram Business account to verify full integration

## Monitoring and Maintenance

- The application has a built-in health check endpoint at `/health`
- The app includes an anti-idle mechanism that pings itself every 10 minutes to prevent sleeping on free tier

## Additional Notes

- The free tier on Render may have limitations on uptime and performance
- For production use, consider upgrading to a paid tier for better reliability
- Logs can be viewed in the Render dashboard for debugging