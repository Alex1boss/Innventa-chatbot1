/**
 * Simple Express server specifically for Instagram/Meta webhook verification
 * This is a minimal implementation designed for free tier deployment
 */
const express = require('express');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Your verify token (should be a strong, unique string)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "innventa_secure_token";

console.log(`Starting Instagram webhook handler on port ${PORT}...`);

// Parse JSON for POST requests
app.use(express.json());

// Root path handler for both GET and POST
app.get('/', (req, res) => {
  // For GET requests, handle webhook verification
  
  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  console.log(`Received verification request: mode=${mode}, token=${token}, challenge=${challenge}`);
  
  // Check if a token and mode is in the query string of the request
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log('WEBHOOK_VERIFIED: Challenge accepted');
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      console.log('WEBHOOK_DENIED: Token mismatch');
      res.sendStatus(403);
    }
  } else {
    // Default response if this is just a browser visit
    res.send('Instagram webhook endpoint is running. This endpoint is designed for Meta webhook verification.');
  }
});

// Handle POST requests (actual webhook events)
app.post('/', (req, res) => {
  const body = req.body;
  console.log('Received webhook event:', JSON.stringify(body));
  
  // Just acknowledge receipt for now
  res.status(200).send('EVENT_RECEIVED');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    verify_token_configured: !!VERIFY_TOKEN
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Instagram webhook handler started on port ${PORT} at ${new Date().toISOString()}`);
  console.log(`Verify token set to: ${VERIFY_TOKEN}`);
  console.log('Ready to receive webhook verification from Meta');
});