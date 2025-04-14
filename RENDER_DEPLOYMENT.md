# Deploying Innventa AI Chatbot to Render.com (Free Tier)

This guide will walk you through deploying your Innventa AI chatbot on Render.com's free tier.

## Prerequisites

1. A GitHub account (to host your code repository)
2. A Render.com account (sign up at https://render.com)
3. Your OpenAI and/or Gemini API keys

## Step 1: Push Your Code to GitHub

1. Create a new repository on GitHub
2. Push your code to the repository
3. Make sure your repository includes the `render.yaml` file

## Step 2: Connect to Render

1. Log in to your Render dashboard
2. Click "New +" and select "Blueprint" from the dropdown
3. Connect your GitHub account if you haven't already
4. Select the repository containing your chatbot code
5. Render will automatically detect the `render.yaml` file and set up your service

## Step 3: Configure Environment Variables

1. In the Render dashboard, navigate to your new service
2. Go to "Environment" tab
3. Add the following environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GEMINI_API_KEY`: Your Google Gemini API key (optional)

## Step 4: Deploy Your App

1. Click "Manual Deploy" and select "Deploy latest commit"
2. Wait for the build and deployment to complete

## Step 5: Set Up External Monitoring

1. Your app will be available at: `https://innventa-ai-chatbot.onrender.com`
2. Set up UptimeRobot (https://uptimerobot.com) for free to ping your app
   - Create a new monitor
   - Set the URL to `https://innventa-ai-chatbot.onrender.com/health`
   - Set the monitoring interval to 5 minutes

## Using with ManyChat for Instagram DMs

1. In ManyChat, create a new flow
2. Add an HTTP Request action with:
   - Method: POST
   - URL: `https://innventa-ai-chatbot.onrender.com/chatbot`
   - Headers: `{ "Content-Type": "application/json" }`
   - Body: `{ "message": "{{last user message}}" }`
3. Parse the response to get the reply from: `{{HTTP.body.reply}}`
4. Send the parsed reply back to the user

## Free Tier Limitations on Render

- Free tier web services on Render spin down after 15 minutes of inactivity
- They automatically spin up when receiving a request (may take a few seconds)
- Limited to 750 hours of runtime per month
- If you need more reliable 24/7 hosting, consider upgrading to a paid plan

## Keeping Your Service Active

The external monitoring with UptimeRobot will help keep your service active by periodically pinging it. This should be sufficient for most use cases on the free tier.