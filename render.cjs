/**
 * Simple Express server for Render deployment
 * This avoids ESM vs CommonJS issues
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Check for API keys
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
    return false;
  }
  
  console.log('✅ All required API keys are present');
  return true;
}

// Serve static files
const staticDir = path.join(__dirname, 'dist');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  console.log(`Serving static files from ${staticDir}`);
} else {
  console.warn(`Static directory ${staticDir} not found, creating it...`);
  fs.mkdirSync(staticDir, { recursive: true });

  // Create a basic HTML file
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Innventa AI Chatbot</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      max-width: 600px;
      width: 90%;
      text-align: center;
    }
    h1 {
      margin-top: 0;
      color: #6366f1;
    }
    a {
      color: #6366f1;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Innventa AI Chatbot</h1>
    <p>Server is running. The front-end build will be available after a successful deployment.</p>
    <p>Check for any build errors in the Render logs.</p>
    <p>API Status: <span id="apiStatus">Checking...</span></p>
    <script>
      fetch('/health')
        .then(response => response.json())
        .then(data => {
          document.getElementById('apiStatus').textContent = 
            data.apiKeys.openai === 'configured' && data.apiKeys.gemini === 'configured' 
              ? 'All API keys configured ✅' 
              : 'Missing API keys ❌';
        })
        .catch(err => {
          document.getElementById('apiStatus').textContent = 'Error checking API status ❌';
        });
    </script>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(staticDir, 'index.html'), htmlContent);
  console.log('Created basic index.html file');
}

// Parse JSON requests
app.use(express.json());

// API routes
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

// Simple welcome message endpoint
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

// Basic message handling endpoint
app.post('/api/chat/message', (req, res) => {
  const userMessage = req.body.message || '';
  const sessionId = req.body.sessionId || 'default-session';
  
  console.log(`Received message from session ${sessionId}: ${userMessage}`);
  
  // Check for API keys
  const hasApiKeys = checkApiKeys();
  
  if (!hasApiKeys) {
    return res.status(500).json({
      error: 'Missing API keys',
      message: 'The server is missing required API keys for AI response generation.'
    });
  }
  
  // For now, return a placeholder response
  // In production, this would call OpenAI or Gemini APIs
  res.json({
    message: {
      content: "I'm a simple placeholder response from the render.cjs server. For real AI responses, please make sure your API keys are configured.",
      quickReplies: [
        "How do I download the app?",
        "Tell me more about Innventa AI"
      ]
    }
  });
});

// Generate a new session ID
app.get('/api/chat/session', (req, res) => {
  const sessionId = Math.random().toString(36).substring(2, 15);
  res.json({ sessionId });
});

// Fallback to client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} at ${new Date().toISOString()}`);
  checkApiKeys();
  
  // Setup anti-idle ping for free tier
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    console.log(`Setting up anti-idle ping for ${process.env.RENDER_EXTERNAL_HOSTNAME}`);
    
    const pingInterval = 10 * 60 * 1000; // 10 minutes
    
    setInterval(() => {
      const pingUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/health`;
      console.log(`Pinging ${pingUrl}`);
      
      https.get(pingUrl, (res) => {
        console.log(`Anti-idle ping status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error(`Anti-idle ping failed: ${err.message}`);
      });
    }, pingInterval);
  }
});