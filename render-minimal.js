// Minimal ES5-compatible Express server for Render deployment
var express = require('express');
var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');

// Create Express app
var app = express();
var PORT = process.env.PORT || 5000;

// Helper functions
function checkApiKeys() {
  var requiredKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY'];
  var missingKeys = [];
  
  console.log('Checking required API keys...');
  
  for (var i = 0; i < requiredKeys.length; i++) {
    var key = requiredKeys[i];
    if (!process.env[key]) {
      missingKeys.push(key);
      console.error('❌ Missing required API key: ' + key);
    } else {
      // Log that we have the key, but mask the actual value
      var keyLength = process.env[key].length;
      var firstChar = process.env[key].charAt(0);
      var lastChar = process.env[key].charAt(keyLength - 1);
      var maskedChars = '********';
      if (keyLength - 2 < 8) {
        maskedChars = '*'.repeat(keyLength - 2);
      }
      console.log('✅ ' + key + ': ' + firstChar + maskedChars + lastChar + ' (' + keyLength + ' chars)');
    }
  }
  
  if (missingKeys.length > 0) {
    console.warn('⚠️ Missing ' + missingKeys.length + ' required API keys: ' + missingKeys.join(', '));
    return false;
  }
  
  console.log('✅ All required API keys are present');
  return true;
}

// Prepare static files directory
var staticDir = path.join(__dirname, 'dist');

// Always ensure the dist directory exists
if (!fs.existsSync(staticDir)) {
  console.log('Creating static directory at ' + staticDir);
  fs.mkdirSync(staticDir, { recursive: true });
}

// Create a basic HTML file
var htmlContent = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>Innventa AI Chatbot</title>\n' +
'  <style>\n' +
'    body {\n' +
'      font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;\n' +
'      margin: 0;\n' +
'      padding: 0;\n' +
'      display: flex;\n' +
'      justify-content: center;\n' +
'      align-items: center;\n' +
'      min-height: 100vh;\n' +
'      background: #f5f5f5;\n' +
'      color: #333;\n' +
'    }\n' +
'    .container {\n' +
'      background: white;\n' +
'      padding: 2rem;\n' +
'      border-radius: 8px;\n' +
'      box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n' +
'      max-width: 600px;\n' +
'      width: 90%;\n' +
'      text-align: center;\n' +
'    }\n' +
'    h1 {\n' +
'      margin-top: 0;\n' +
'      color: #6366f1;\n' +
'    }\n' +
'    .chatui {\n' +
'      margin-top: 2rem;\n' +
'      text-align: left;\n' +
'      border: 1px solid #e5e7eb;\n' +
'      border-radius: 8px;\n' +
'      height: 300px;\n' +
'      overflow-y: auto;\n' +
'      padding: 1rem;\n' +
'      background: #f9fafb;\n' +
'    }\n' +
'    .message {\n' +
'      margin-bottom: 1rem;\n' +
'      padding: 0.75rem 1rem;\n' +
'      border-radius: 1rem;\n' +
'      max-width: 80%;\n' +
'      word-break: break-word;\n' +
'    }\n' +
'    .bot {\n' +
'      background: #e5e7eb;\n' +
'      margin-right: auto;\n' +
'      border-bottom-left-radius: 0.25rem;\n' +
'    }\n' +
'    .user {\n' +
'      background: #6366f1;\n' +
'      color: white;\n' +
'      margin-left: auto;\n' +
'      border-bottom-right-radius: 0.25rem;\n' +
'    }\n' +
'    .input-area {\n' +
'      display: flex;\n' +
'      margin-top: 1rem;\n' +
'      gap: 0.5rem;\n' +
'    }\n' +
'    input {\n' +
'      flex: 1;\n' +
'      padding: 0.75rem 1rem;\n' +
'      border: 1px solid #e5e7eb;\n' +
'      border-radius: 0.5rem;\n' +
'      font-size: 1rem;\n' +
'    }\n' +
'    button {\n' +
'      background: #6366f1;\n' +
'      color: white;\n' +
'      border: none;\n' +
'      border-radius: 0.5rem;\n' +
'      padding: 0.75rem 1.5rem;\n' +
'      font-weight: 600;\n' +
'      cursor: pointer;\n' +
'    }\n' +
'    button:hover {\n' +
'      background: #4f46e5;\n' +
'    }\n' +
'    .quick-replies {\n' +
'      display: flex;\n' +
'      flex-wrap: wrap;\n' +
'      gap: 0.5rem;\n' +
'      margin-top: 1rem;\n' +
'    }\n' +
'    .quick-reply {\n' +
'      background: #f3f4f6;\n' +
'      border: 1px solid #e5e7eb;\n' +
'      border-radius: 1rem;\n' +
'      padding: 0.5rem 1rem;\n' +
'      font-size: 0.875rem;\n' +
'      cursor: pointer;\n' +
'    }\n' +
'    .quick-reply:hover {\n' +
'      background: #e5e7eb;\n' +
'    }\n' +
'    .typing-indicator {\n' +
'      display: inline-block;\n' +
'      padding: 0.75rem 1rem;\n' +
'      background: #e5e7eb;\n' +
'      border-radius: 1rem;\n' +
'      margin-bottom: 1rem;\n' +
'    }\n' +
'    .typing-indicator span {\n' +
'      width: 0.5rem;\n' +
'      height: 0.5rem;\n' +
'      background: #9ca3af;\n' +
'      display: inline-block;\n' +
'      border-radius: 50%;\n' +
'      margin: 0 0.1rem;\n' +
'      animation: typing 1.4s infinite both;\n' +
'    }\n' +
'    .typing-indicator span:nth-child(2) {\n' +
'      animation-delay: 0.2s;\n' +
'    }\n' +
'    .typing-indicator span:nth-child(3) {\n' +
'      animation-delay: 0.4s;\n' +
'    }\n' +
'    @keyframes typing {\n' +
'      0% { opacity: 0.4; transform: translateY(0); }\n' +
'      50% { opacity: 1; transform: translateY(-0.4rem); }\n' +
'      100% { opacity: 0.4; transform: translateY(0); }\n' +
'    }\n' +
'    .api-status {\n' +
'      margin-top: 1rem;\n' +
'      font-size: 0.875rem;\n' +
'      text-align: center;\n' +
'    }\n' +
'    .api-status.error {\n' +
'      color: #dc2626;\n' +
'    }\n' +
'    .api-status.success {\n' +
'      color: #16a34a;\n' +
'    }\n' +
'    a {\n' +
'      color: #6366f1;\n' +
'      text-decoration: none;\n' +
'    }\n' +
'    a:hover {\n' +
'      text-decoration: underline;\n' +
'    }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <div class="container">\n' +
'    <h1>Innventa AI Chatbot</h1>\n' +
'    <p>Ask me anything about shopping, products, or Innventa AI!</p>\n' +
'    \n' +
'    <div class="chatui" id="chat-messages">\n' +
'      <!-- Messages will appear here -->\n' +
'    </div>\n' +
'    \n' +
'    <div id="typing-indicator" style="display: none;" class="typing-indicator">\n' +
'      <span></span>\n' +
'      <span></span>\n' +
'      <span></span>\n' +
'    </div>\n' +
'    \n' +
'    <div id="quick-replies" class="quick-replies">\n' +
'      <!-- Quick replies will appear here -->\n' +
'    </div>\n' +
'    \n' +
'    <div class="input-area">\n' +
'      <input type="text" id="message-input" placeholder="Type your message..." />\n' +
'      <button id="send-button">Send</button>\n' +
'    </div>\n' +
'    \n' +
'    <div id="api-status" class="api-status">Checking API status...</div>\n' +
'  </div>\n' +
'\n' +
'  <script>\n' +
'    // Simple chat client\n' +
'    document.addEventListener("DOMContentLoaded", function() {\n' +
'      var messagesEl = document.getElementById("chat-messages");\n' +
'      var inputEl = document.getElementById("message-input");\n' +
'      var sendButton = document.getElementById("send-button");\n' +
'      var typingIndicator = document.getElementById("typing-indicator");\n' +
'      var quickRepliesEl = document.getElementById("quick-replies");\n' +
'      var apiStatusEl = document.getElementById("api-status");\n' +
'      \n' +
'      var sessionId = null;\n' +
'      \n' +
'      // Check API status and initialize chat\n' +
'      fetch("/health")\n' +
'        .then(function(response) { return response.json(); })\n' +
'        .then(function(data) {\n' +
'          var openaiConfigured = data.apiKeys.openai === "configured";\n' +
'          var geminiConfigured = data.apiKeys.gemini === "configured";\n' +
'          \n' +
'          if (openaiConfigured && geminiConfigured) {\n' +
'            apiStatusEl.textContent = "AI services connected ✅";\n' +
'            apiStatusEl.className = "api-status success";\n' +
'          } else {\n' +
'            var missing = [];\n' +
'            if (!openaiConfigured) missing.push("OpenAI");\n' +
'            if (!geminiConfigured) missing.push("Gemini");\n' +
'            \n' +
'            apiStatusEl.textContent = "Missing API keys: " + missing.join(", ") + " ❌";\n' +
'            apiStatusEl.className = "api-status error";\n' +
'          }\n' +
'          \n' +
'          // Initialize session\n' +
'          return fetch("/api/chat/session");\n' +
'        })\n' +
'        .then(function(response) { return response.json(); })\n' +
'        .then(function(data) {\n' +
'          sessionId = data.sessionId;\n' +
'          console.log("Session initialized:", sessionId);\n' +
'          \n' +
'          // Get welcome message\n' +
'          return fetch("/api/chat/welcome");\n' +
'        })\n' +
'        .then(function(response) { return response.json(); })\n' +
'        .then(function(data) {\n' +
'          addBotMessage(data.message.content);\n' +
'          showQuickReplies(data.message.quickReplies || []);\n' +
'        })\n' +
'        .catch(function(error) {\n' +
'          console.error("Error initializing chat:", error);\n' +
'          apiStatusEl.textContent = "Error connecting to server ❌";\n' +
'          apiStatusEl.className = "api-status error";\n' +
'        });\n' +
'      \n' +
'      // Send message function\n' +
'      function sendMessage(message) {\n' +
'        if (!message.trim()) return;\n' +
'        \n' +
'        // Add user message to UI\n' +
'        addUserMessage(message);\n' +
'        \n' +
'        // Clear input\n' +
'        inputEl.value = "";\n' +
'        showTypingIndicator(true);\n' +
'        hideQuickReplies();\n' +
'        \n' +
'        // Send to server\n' +
'        fetch("/api/chat/message", {\n' +
'          method: "POST",\n' +
'          headers: {\n' +
'            "Content-Type": "application/json"\n' +
'          },\n' +
'          body: JSON.stringify({\n' +
'            message: message,\n' +
'            sessionId: sessionId\n' +
'          })\n' +
'        })\n' +
'        .then(function(response) { return response.json(); })\n' +
'        .then(function(data) {\n' +
'          showTypingIndicator(false);\n' +
'          addBotMessage(data.message.content);\n' +
'          showQuickReplies(data.message.quickReplies || []);\n' +
'        })\n' +
'        .catch(function(error) {\n' +
'          console.error("Error sending message:", error);\n' +
'          showTypingIndicator(false);\n' +
'          addBotMessage("Sorry, there was an error processing your message. Please try again.");\n' +
'        });\n' +
'      }\n' +
'      \n' +
'      // Add a user message bubble\n' +
'      function addUserMessage(content) {\n' +
'        var messageEl = document.createElement("div");\n' +
'        messageEl.className = "message user";\n' +
'        messageEl.textContent = content;\n' +
'        messagesEl.appendChild(messageEl);\n' +
'        scrollToBottom();\n' +
'      }\n' +
'      \n' +
'      // Add a bot message bubble\n' +
'      function addBotMessage(content) {\n' +
'        var messageEl = document.createElement("div");\n' +
'        messageEl.className = "message bot";\n' +
'        messageEl.textContent = content;\n' +
'        messagesEl.appendChild(messageEl);\n' +
'        scrollToBottom();\n' +
'      }\n' +
'      \n' +
'      // Show/hide typing indicator\n' +
'      function showTypingIndicator(show) {\n' +
'        typingIndicator.style.display = show ? "inline-block" : "none";\n' +
'      }\n' +
'      \n' +
'      // Show quick replies\n' +
'      function showQuickReplies(replies) {\n' +
'        if (!replies || !replies.length) return;\n' +
'        \n' +
'        quickRepliesEl.innerHTML = "";\n' +
'        \n' +
'        for (var i = 0; i < replies.length; i++) {\n' +
'          var reply = replies[i];\n' +
'          var replyEl = document.createElement("div");\n' +
'          replyEl.className = "quick-reply";\n' +
'          replyEl.textContent = reply;\n' +
'          \n' +
'          (function(replyText) {\n' +
'            replyEl.addEventListener("click", function() {\n' +
'              sendMessage(replyText);\n' +
'            });\n' +
'          })(reply);\n' +
'          \n' +
'          quickRepliesEl.appendChild(replyEl);\n' +
'        }\n' +
'      }\n' +
'      \n' +
'      // Hide quick replies\n' +
'      function hideQuickReplies() {\n' +
'        quickRepliesEl.innerHTML = "";\n' +
'      }\n' +
'      \n' +
'      // Scroll chat to bottom\n' +
'      function scrollToBottom() {\n' +
'        messagesEl.scrollTop = messagesEl.scrollHeight;\n' +
'      }\n' +
'      \n' +
'      // Event listeners\n' +
'      sendButton.addEventListener("click", function() {\n' +
'        sendMessage(inputEl.value);\n' +
'      });\n' +
'      \n' +
'      inputEl.addEventListener("keypress", function(event) {\n' +
'        if (event.key === "Enter") {\n' +
'          sendMessage(inputEl.value);\n' +
'        }\n' +
'      });\n' +
'    });\n' +
'  </script>\n' +
'</body>\n' +
'</html>';

// Write the HTML file to the dist directory
fs.writeFileSync(path.join(staticDir, 'index.html'), htmlContent);
console.log('Created or updated index.html in ' + staticDir);

// Serve static files
app.use(express.static(staticDir));
console.log('Serving static files from ' + staticDir);

// Parse JSON requests
app.use(express.json());

// API routes
app.get('/health', function(req, res) {
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
app.get('/api/chat/welcome', function(req, res) {
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
app.post('/api/chat/message', function(req, res) {
  var userMessage = req.body.message || '';
  var sessionId = req.body.sessionId || 'default-session';
  
  console.log('Received message from session ' + sessionId + ': ' + userMessage);
  
  // Check for API keys
  var hasApiKeys = checkApiKeys();
  
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
      content: "I'm a simple placeholder response from the render-minimal.js server. For real AI responses, please make sure your API keys are configured.",
      quickReplies: [
        "How do I download the app?",
        "Tell me more about Innventa AI"
      ]
    }
  });
});

// Generate a new session ID
app.get('/api/chat/session', function(req, res) {
  var sessionId = Math.random().toString(36).substring(2, 15);
  res.json({ sessionId: sessionId });
});

// Fallback to client-side routing
app.get('*', function(req, res) {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Start the server
app.listen(PORT, function() {
  console.log('Server started on port ' + PORT + ' at ' + new Date().toISOString());
  checkApiKeys();
  
  // Setup anti-idle ping for free tier
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    console.log('Setting up anti-idle ping for ' + process.env.RENDER_EXTERNAL_HOSTNAME);
    
    var pingInterval = 10 * 60 * 1000; // 10 minutes
    
    setInterval(function() {
      var pingUrl = 'https://' + process.env.RENDER_EXTERNAL_HOSTNAME + '/health';
      console.log('Pinging ' + pingUrl);
      
      https.get(pingUrl, function(res) {
        console.log('Anti-idle ping status: ' + res.statusCode);
      }).on('error', function(err) {
        console.error('Anti-idle ping failed: ' + err.message);
      });
    }, pingInterval);
  }
});