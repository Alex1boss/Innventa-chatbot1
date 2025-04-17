/**
 * Simple test script for Instagram webhook validation
 * Run this file directly with Node.js to test webhook functionality
 */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON for POST requests
app.use(express.json());

// Meta webhook verification token - MUST match what you entered in Meta Developer Portal
const VERIFY_TOKEN = "innventa_secure_token";

console.log('Starting webhook test server...');

// This endpoint handles Meta webhook verification (GET request)
app.get('/webhook', (req, res) => {
  console.log('====== WEBHOOK VERIFICATION REQUEST ======');
  console.log('Request query parameters:', req.query);
  
  // Get the parameters sent by Meta
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  console.log(`Mode: ${mode}`);
  console.log(`Token: ${token}`);
  console.log(`Challenge: ${challenge}`);
  console.log(`Expected token: ${VERIFY_TOKEN}`);
  
  // Validate the request
  if (mode && token) {
    // Check if the mode and token are valid
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with the challenge token to complete verification
      console.log('✅ WEBHOOK VERIFIED SUCCESSFULLY!');
      
      // IMPORTANT: Must return challenge as plain text
      res.status(200).send(challenge);
    } else {
      // Token mismatch
      console.log('❌ WEBHOOK VERIFICATION FAILED: Token mismatch');
      console.log(`Received: "${token}", Expected: "${VERIFY_TOKEN}"`);
      res.sendStatus(403);
    }
  } else {
    // Missing required parameters
    console.log('❌ WEBHOOK VERIFICATION FAILED: Missing required parameters');
    res.sendStatus(400);
  }
});

// Handle actual webhook events (POST requests)
app.post('/webhook', (req, res) => {
  console.log('====== WEBHOOK EVENT RECEIVED ======');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  // Always acknowledge receipt of the event
  res.status(200).send('EVENT_RECEIVED');
});

// Simple health check and test endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Webhook Test</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          .container { max-width: 800px; margin: 0 auto; }
          .important { color: #cc0000; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Instagram Webhook Test Server</h1>
          <p>This server is configured to handle webhook verification for Instagram.</p>
          
          <h2>Configuration:</h2>
          <ul>
            <li><strong>Callback URL:</strong> https://[your-app-url]/webhook</li>
            <li><strong>Verify Token:</strong> <code>${VERIFY_TOKEN}</code></li>
            <li><strong>Server Status:</strong> Running on port ${PORT}</li>
          </ul>
          
          <h2>Testing:</h2>
          <p>To test the webhook verification, Meta will send a GET request to your callback URL with these parameters:</p>
          <ul>
            <li><code>hub.mode=subscribe</code></li>
            <li><code>hub.verify_token=${VERIFY_TOKEN}</code></li>
            <li><code>hub.challenge=[random string]</code></li>
          </ul>
          
          <p class="important">Important: Make sure your callback URL is publicly accessible and the verify token matches exactly.</p>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Webhook test server running on port ${PORT}`);
  console.log(`Verify token: ${VERIFY_TOKEN}`);
  console.log(`Webhook URL: [your-app-url]/webhook`);
  console.log('Ready to receive webhook verification requests!');
});