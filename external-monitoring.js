// This script sets up an external monitoring system for our Innventa AI chatbot
// It will ping the health endpoint every 5 minutes to keep the Replit instance alive

const https = require('https');
const http = require('http');

// Configuration
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 30 * 1000; // 30 seconds

// Get the Replit URL from environment variable or use a default pattern
const REPLIT_URL = process.env.REPLIT_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co';
const HEALTH_ENDPOINT = '/health';

// Log the start of monitoring
console.log(`[${new Date().toISOString()}] External monitoring started`);
console.log(`[${new Date().toISOString()}] Target URL: ${REPLIT_URL}${HEALTH_ENDPOINT}`);
console.log(`[${new Date().toISOString()}] Ping interval: ${PING_INTERVAL / 1000} seconds`);

// Function to ping the health endpoint
function pingHealthEndpoint(retryCount = 0) {
  console.log(`[${new Date().toISOString()}] Pinging health endpoint...`);
  
  // Determine if we're using http or https
  const client = REPLIT_URL.startsWith('https') ? https : http;
  
  client.get(`${REPLIT_URL}${HEALTH_ENDPOINT}`, (res) => {
    const { statusCode } = res;
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (statusCode === 200) {
        console.log(`[${new Date().toISOString()}] Health check successful: ${data}`);
        // Schedule next ping
        setTimeout(pingHealthEndpoint, PING_INTERVAL);
      } else {
        handleFailure(`Health check failed with status code: ${statusCode}`, retryCount);
      }
    });
  }).on('error', (err) => {
    handleFailure(`Health check error: ${err.message}`, retryCount);
  });
}

// Function to handle health check failures
function handleFailure(reason, retryCount) {
  console.error(`[${new Date().toISOString()}] ${reason}`);
  
  if (retryCount < MAX_RETRIES) {
    console.log(`[${new Date().toISOString()}] Retrying in ${RETRY_DELAY / 1000} seconds (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
    setTimeout(() => pingHealthEndpoint(retryCount + 1), RETRY_DELAY);
  } else {
    console.error(`[${new Date().toISOString()}] Maximum retries reached. Scheduling next regular ping.`);
    setTimeout(pingHealthEndpoint, PING_INTERVAL);
  }
}

// Start pinging the health endpoint
pingHealthEndpoint();