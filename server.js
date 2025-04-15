/**
 * Simple CommonJS server starter for Render
 * This resolves the ESM vs CJS compatibility issues
 */
"use strict";

const express = require('express');
const path = require('path');
const fs = require('fs');

// Check for required API keys
function checkApiKeys() {
  const requiredKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY'];
  const missingKeys = [];
  
  console.log('Checking required API keys...');
  
  for (const key of requiredKeys) {
    if (!process.env[key]) {
      missingKeys.push(key);
      console.error(`❌ Missing required API key: ${key}`);
    } else {
      // Log that we have the key, but mask the actual value
      const keyLength = process.env[key].length;
      const firstChar = process.env[key].charAt(0);
      const lastChar = process.env[key].charAt(keyLength - 1);
      console.log(`✅ ${key}: ${firstChar}${'*'.repeat(Math.min(8, keyLength - 2))}${lastChar} (${keyLength} chars)`);
    }
  }
  
  if (missingKeys.length > 0) {
    console.warn(`⚠️ Missing ${missingKeys.length} required API keys: ${missingKeys.join(', ')}`);
    console.warn('AI response generation may fail without these keys.');
    return false;
  }
  
  console.log('✅ All required API keys are present');
  return true;
}

// Create a simple Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Parse JSON requests
app.use(express.json());

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apiKeys: {
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
    }
  });
});

// Placeholder endpoints for the main API
app.get('/api/chat/welcome', (req, res) => {
  res.json({ 
    message: {
      content: "Hey! 👋\nI'm here if you need help with your shopping decisions. Ask me anything about products, recommendations, or prices!",
      quickReplies: [
        "Tell me about Innventa AI",
        "How can you help me?",
        "What products can you recommend?"
      ]
    }
  });
});

app.post('/api/chat/message', (req, res) => {
  const userMessage = req.body.message;
  const sessionId = req.body.sessionId || 'default-session';
  
  console.log(`Received message from session ${sessionId}: ${userMessage}`);
  
  // Check if we have API keys before attempting to generate responses
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "API keys not configured",
      message: "The server is missing required API keys for AI response generation."
    });
  }
  
  // Simple response for testing
  res.json({
    message: {
      content: "I'm a placeholder response from the simplified server. For real AI responses, please ensure the API keys are properly configured.",
      quickReplies: ["Tell me more", "How do I shop with Innventa?", "Download the app"]
    }
  });
});

// Get or generate a new session ID
app.get('/api/chat/session', (req, res) => {
  const sessionId = Math.random().toString(36).substring(2, 15);
  res.json({ sessionId });
});

// Catch all other requests and serve the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
  checkApiKeys();
  
  // Anti-idle ping setup for free tier
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    const pingInterval = 10 * 60 * 1000; // 10 minutes
    console.log(`Setting up anti-idle ping every ${pingInterval/60000} minutes`);
    
    setInterval(() => {
      const https = require('https');
      const pingUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/health`;
      console.log(`Pinging ${pingUrl} to prevent idle...`);
      
      https.get(pingUrl, (res) => {
        console.log(`Anti-idle ping status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('Anti-idle ping failed:', err.message);
      });
    }, pingInterval);
  }
});