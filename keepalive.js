// This script sets up an automatic keep-alive and monitoring system
// for our Innventa AI chatbot server to ensure 24/7 availability

const http = require('http');
const { exec } = require('child_process');

// Configuration
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const HEALTH_CHECK_URL = 'http://localhost:5000/health';
const MAX_CONSECUTIVE_FAILURES = 3;

let consecutiveFailures = 0;

// Function to check if our server is healthy
function checkServerHealth() {
  console.log(`[${new Date().toISOString()}] Performing health check...`);
  
  http.get(HEALTH_CHECK_URL, (res) => {
    const { statusCode } = res;
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (statusCode === 200) {
        consecutiveFailures = 0;
        console.log(`[${new Date().toISOString()}] Health check passed: ${data}`);
      } else {
        handleFailure(`Health check failed with status code: ${statusCode}`);
      }
    });
  }).on('error', (err) => {
    handleFailure(`Health check error: ${err.message}`);
  });
}

// Function to handle health check failures
function handleFailure(reason) {
  console.error(`[${new Date().toISOString()}] ${reason}`);
  consecutiveFailures++;
  
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    console.log(`[${new Date().toISOString()}] Too many consecutive failures (${consecutiveFailures}). Attempting to restart server...`);
    restartServer();
  } else {
    console.log(`[${new Date().toISOString()}] Failure count: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}`);
  }
}

// Function to restart the server
function restartServer() {
  console.log(`[${new Date().toISOString()}] Restarting server...`);
  
  // In Replit, we can use the 'refresh' command to restart the repl
  exec('refresh', (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] Error restarting: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`[${new Date().toISOString()}] Restart stderr: ${stderr}`);
      return;
    }
    console.log(`[${new Date().toISOString()}] Restart output: ${stdout}`);
  });
  
  // Reset failure counter
  consecutiveFailures = 0;
}

// Self-ping to keep the server alive
function pingKeepAlive() {
  checkServerHealth();
  
  // Schedule the next health check
  setTimeout(pingKeepAlive, HEALTH_CHECK_INTERVAL);
}

// Start the health check monitoring
console.log(`[${new Date().toISOString()}] Starting health check monitoring every ${HEALTH_CHECK_INTERVAL/1000} seconds`);
pingKeepAlive();