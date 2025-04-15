// Keepalive script for Render to prevent idling
const http = require('http');
const https = require('https');

// Configuration
const config = {
  internalHealthCheck: {
    enabled: true,
    host: 'localhost',
    port: 5000,
    path: '/health',
    interval: 5 * 60 * 1000, // 5 minutes
  },
  externalPing: {
    enabled: process.env.EXTERNAL_URL ? true : false,
    url: process.env.EXTERNAL_URL || '', // Set this in Render environment variables
    interval: 25 * 60 * 1000, // 25 minutes (just under Render's 30 minute idle timeout)
  }
};

// Function to check internal server health
function checkServerHealth() {
  if (!config.internalHealthCheck.enabled) {
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.internalHealthCheck.host,
      port: config.internalHealthCheck.port,
      path: config.internalHealthCheck.path,
      method: 'GET',
      timeout: 5000
    };

    console.log(`[${new Date().toISOString()}] Checking internal server health...`);
    
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`[${new Date().toISOString()}] Internal health check passed!`);
        resolve(true);
      } else {
        const error = new Error(`Health check failed with status code: ${res.statusCode}`);
        console.error(`[${new Date().toISOString()}] ${error.message}`);
        reject(error);
      }
    });

    req.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] Internal health check error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      const error = new Error('Health check timed out');
      console.error(`[${new Date().toISOString()}] ${error.message}`);
      reject(error);
    });

    req.end();
  }).catch(error => {
    handleFailure(error);
    return false;
  });
}

// Function to handle failures
function handleFailure(reason) {
  console.error(`[${new Date().toISOString()}] Keepalive failure: ${reason.message}`);
  // In a production environment, you might want to trigger alerts or attempt to restart the server
}

// Function to restart the server (implementation would depend on your setup)
function restartServer() {
  console.log(`[${new Date().toISOString()}] Attempting to restart server...`);
  // This would need to be implemented based on your specific deployment environment
  // For Render, you might not need this as Render has its own restart mechanisms
}

// Function to ping an external URL to prevent idling
function pingKeepAlive() {
  if (!config.externalPing.enabled || !config.externalPing.url) {
    return Promise.resolve(true);
  }
  
  return new Promise((resolve, reject) => {
    console.log(`[${new Date().toISOString()}] Sending external ping to prevent idling...`);
    
    const req = https.get(config.externalPing.url, (res) => {
      console.log(`[${new Date().toISOString()}] External ping response: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] External ping error: ${error.message}`);
      reject(error);
    });
    
    req.end();
  }).catch(error => {
    console.error(`[${new Date().toISOString()}] External ping failed: ${error.message}`);
    return false;
  });
}

// Start keepalive process
console.log(`[${new Date().toISOString()}] Starting keepalive service for Innventa AI Chatbot`);

// Schedule internal health checks
if (config.internalHealthCheck.enabled) {
  console.log(`[${new Date().toISOString()}] Internal health checks enabled, checking every ${config.internalHealthCheck.interval / 1000 / 60} minutes`);
  setInterval(checkServerHealth, config.internalHealthCheck.interval);
  // Initial check
  checkServerHealth();
}

// Schedule external pings to prevent idling
if (config.externalPing.enabled) {
  console.log(`[${new Date().toISOString()}] External pings enabled, pinging ${config.externalPing.url} every ${config.externalPing.interval / 1000 / 60} minutes`);
  setInterval(pingKeepAlive, config.externalPing.interval);
  // Initial ping
  pingKeepAlive();
}