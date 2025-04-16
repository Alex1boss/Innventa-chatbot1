/**
 * Simple Express server for Render free tier deployment
 * This version is specifically optimized for free tier and avoids path issues
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000; // Use port 3000 as fallback

console.log(`Starting Render free tier server on port ${PORT}...`);
console.log(`Node version: ${process.version}`);
console.log(`Current working directory: ${process.cwd()}`);

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

// List all files in the current directory for debugging
try {
  console.log('Current directory contents:');
  const files = fs.readdirSync(process.cwd());
  files.forEach(file => {
    try {
      const stats = fs.statSync(path.join(process.cwd(), file));
      console.log(`- ${file} (${stats.isDirectory() ? 'directory' : 'file'})`);
    } catch (err) {
      console.error(`Error getting stats for ${file}: ${err.message}`);
    }
  });
} catch (err) {
  console.error(`Error listing directory: ${err.message}`);
}

// Check if dist directory exists, if not create it
const staticDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(staticDir)) {
  console.log(`Creating static directory at ${staticDir}`);
  try {
    fs.mkdirSync(staticDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory: ${err.message}`);
  }
}

// Create a basic HTML file for the chat interface
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
    .chatui {
      margin-top: 2rem;
      text-align: left;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      height: 300px;
      overflow-y: auto;
      padding: 1rem;
      background: #f9fafb;
    }
    .message {
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
      max-width: 80%;
      word-break: break-word;
    }
    .bot {
      background: #e5e7eb;
      margin-right: auto;
      border-bottom-left-radius: 0.25rem;
    }
    .user {
      background: #6366f1;
      color: white;
      margin-left: auto;
      border-bottom-right-radius: 0.25rem;
    }
    .input-area {
      display: flex;
      margin-top: 1rem;
      gap: 0.5rem;
    }
    input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
    }
    button {
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover {
      background: #4f46e5;
    }
    .quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .quick-reply {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .quick-reply:hover {
      background: #e5e7eb;
    }
    .typing-indicator {
      display: inline-block;
      padding: 0.75rem 1rem;
      background: #e5e7eb;
      border-radius: 1rem;
      margin-bottom: 1rem;
    }
    .typing-indicator span {
      width: 0.5rem;
      height: 0.5rem;
      background: #9ca3af;
      display: inline-block;
      border-radius: 50%;
      margin: 0 0.1rem;
      animation: typing 1.4s infinite both;
    }
    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes typing {
      0% { opacity: 0.4; transform: translateY(0); }
      50% { opacity: 1; transform: translateY(-0.4rem); }
      100% { opacity: 0.4; transform: translateY(0); }
    }
    .api-status {
      margin-top: 1rem;
      font-size: 0.875rem;
      text-align: center;
    }
    .api-status.error {
      color: #dc2626;
    }
    .api-status.success {
      color: #16a34a;
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
    <p>Ask me anything about shopping, products, or Innventa AI!</p>
    
    <div class="chatui" id="chat-messages">
      <!-- Messages will appear here -->
    </div>
    
    <div id="typing-indicator" style="display: none;" class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
    
    <div id="quick-replies" class="quick-replies">
      <!-- Quick replies will appear here -->
    </div>
    
    <div class="input-area">
      <input type="text" id="message-input" placeholder="Type your message..." />
      <button id="send-button">Send</button>
    </div>
    
    <div id="api-status" class="api-status">Checking API status...</div>
  </div>

  <script>
    // Simple chat client
    document.addEventListener("DOMContentLoaded", function() {
      var messagesEl = document.getElementById("chat-messages");
      var inputEl = document.getElementById("message-input");
      var sendButton = document.getElementById("send-button");
      var typingIndicator = document.getElementById("typing-indicator");
      var quickRepliesEl = document.getElementById("quick-replies");
      var apiStatusEl = document.getElementById("api-status");
      
      var sessionId = null;
      
      // Check API status and initialize chat
      fetch("/health")
        .then(function(response) { return response.json(); })
        .then(function(data) {
          var openaiConfigured = data.apiKeys.openai === "configured";
          var geminiConfigured = data.apiKeys.gemini === "configured";
          
          if (openaiConfigured && geminiConfigured) {
            apiStatusEl.textContent = "AI services connected ✅";
            apiStatusEl.className = "api-status success";
          } else {
            var missing = [];
            if (!openaiConfigured) missing.push("OpenAI");
            if (!geminiConfigured) missing.push("Gemini");
            
            apiStatusEl.textContent = "Missing API keys: " + missing.join(", ") + " ❌";
            apiStatusEl.className = "api-status error";
          }
          
          // Initialize session
          return fetch("/api/chat/session");
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
          sessionId = data.sessionId;
          console.log("Session initialized:", sessionId);
          
          // Get welcome message
          return fetch("/api/chat/welcome");
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
          addBotMessage(data.message.content);
          showQuickReplies(data.message.quickReplies || []);
        })
        .catch(function(error) {
          console.error("Error initializing chat:", error);
          apiStatusEl.textContent = "Error connecting to server ❌";
          apiStatusEl.className = "api-status error";
        });
      
      // Send message function
      function sendMessage(message) {
        if (!message.trim()) return;
        
        // Add user message to UI
        addUserMessage(message);
        
        // Clear input
        inputEl.value = "";
        showTypingIndicator(true);
        hideQuickReplies();
        
        // Send to server
        fetch("/api/chat/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: message,
            sessionId: sessionId
          })
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
          showTypingIndicator(false);
          addBotMessage(data.message.content);
          showQuickReplies(data.message.quickReplies || []);
        })
        .catch(function(error) {
          console.error("Error sending message:", error);
          showTypingIndicator(false);
          addBotMessage("Sorry, there was an error processing your message. Please try again.");
        });
      }
      
      // Add a user message bubble
      function addUserMessage(content) {
        var messageEl = document.createElement("div");
        messageEl.className = "message user";
        messageEl.textContent = content;
        messagesEl.appendChild(messageEl);
        scrollToBottom();
      }
      
      // Add a bot message bubble
      function addBotMessage(content) {
        var messageEl = document.createElement("div");
        messageEl.className = "message bot";
        messageEl.textContent = content;
        messagesEl.appendChild(messageEl);
        scrollToBottom();
      }
      
      // Show/hide typing indicator
      function showTypingIndicator(show) {
        typingIndicator.style.display = show ? "inline-block" : "none";
      }
      
      // Show quick replies
      function showQuickReplies(replies) {
        if (!replies || !replies.length) return;
        
        quickRepliesEl.innerHTML = "";
        
        for (var i = 0; i < replies.length; i++) {
          var reply = replies[i];
          var replyEl = document.createElement("div");
          replyEl.className = "quick-reply";
          replyEl.textContent = reply;
          
          (function(replyText) {
            replyEl.addEventListener("click", function() {
              sendMessage(replyText);
            });
          })(reply);
          
          quickRepliesEl.appendChild(replyEl);
        }
      }
      
      // Hide quick replies
      function hideQuickReplies() {
        quickRepliesEl.innerHTML = "";
      }
      
      // Scroll chat to bottom
      function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      
      // Event listeners
      sendButton.addEventListener("click", function() {
        sendMessage(inputEl.value);
      });
      
      inputEl.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
          sendMessage(inputEl.value);
        }
      });
    });
  </script>
</body>
</html>`;

// Write the HTML file to the dist directory
try {
  fs.writeFileSync(path.join(staticDir, 'index.html'), htmlContent);
  console.log('Created or updated index.html in static directory');
} catch (err) {
  console.error(`Error writing index.html: ${err.message}`);
}

// Serve static files
app.use(express.static(staticDir));
console.log(`Serving static files from ${staticDir}`);

// Parse JSON requests
app.use(express.json());

// Add a simple keepalive mechanism
function setupKeepAlive() {
  const interval = 10 * 60 * 1000; // 10 minutes
  
  setInterval(() => {
    console.log(`[${new Date().toISOString()}] Sending keepalive ping`);
    
    // Self ping to prevent idle timeout
    if (process.env.RENDER_EXTERNAL_HOSTNAME) {
      const url = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/health`;
      console.log(`Pinging ${url}`);
      
      https.get(url, (res) => {
        console.log(`Keepalive response: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error(`Keepalive error: ${err.message}`);
      });
    } else {
      console.log('No external hostname found, skipping external ping');
    }
  }, interval);
  
  console.log(`Keepalive ping scheduled every ${interval/1000/60} minutes`);
}

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

// Welcome message endpoint
app.get('/api/chat/welcome', (req, res) => {
  res.json({
    message: {
      content: "Hey! 👋\nI'm your Innventa AI shopping assistant. Ask me anything about products, recommendations, or our app!",
      quickReplies: [
        "What is Innventa AI?",
        "How do I use the app?", 
        "Product recommendations"
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
  
  // Use predefined response templates based on the message content
  const userMessageLower = userMessage.toLowerCase();
  
  // Check for specific keywords to provide appropriate responses
  if (userMessageLower.includes("innventa") || userMessageLower.includes("about")) {
    return res.json({
      message: {
        content: "Innventa AI is your shopping assistant that helps you discover products you'll love! 🛍️\n\nWe use AI to understand your style and preferences to recommend items that match what you're looking for.\n\nFor the best experience, check out our app where you can browse personalized recommendations!",
        quickReplies: [
          "How do I use the app?",
          "I need help with something",
          "Product recommendations"
        ],
        includeAppRedirect: true
      }
    });
  }
  
  if (userMessageLower.includes("app") || userMessageLower.includes("download") || userMessageLower.includes("use")) {
    return res.json({
      message: {
        content: "The Innventa AI app is available on both iOS and Android.\n\nTo get started:\n1. Download the app from the App Store or Google Play\n2. Create an account\n3. Take our quick style quiz\n4. Start browsing personalized recommendations!\n\nWould you like me to help you find something specific?",
        quickReplies: [
          "Send me the download link",
          "What can I do in the app?",
          "I need help with something else"
        ],
        includeAppRedirect: true
      }
    });
  }
  
  if (userMessageLower.includes("product") || userMessageLower.includes("recommend") || userMessageLower.includes("shop")) {
    return res.json({
      message: {
        content: "I'd love to help you find the perfect products for you! 👟\n\nFor the best personalized recommendations, you'll want to use our app where I can show you options based on your style and preferences.",
        quickReplies: [
          "How do I use the app?",
          "What is Innventa AI?",
          "Download link"
        ],
        includeAppRedirect: true
      }
    });
  }
  
  // Default response for other messages
  res.json({
    message: {
      content: "Hello! What can I help you with today? Ask me about Innventa AI, our app, or how to get personalized product recommendations!",
      quickReplies: [
        "What is Innventa AI?",
        "How do I use the app?",
        "Product recommendations"
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
  setupKeepAlive();
});