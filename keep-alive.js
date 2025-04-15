/**
 * Simple NodeJS script to ping your Render app and keep it alive 24/7
 * Run this script on your local machine or any other server
 */

const https = require('https');

// Configuration
const config = {
  appUrl: process.env.APP_URL || 'https://your-app-name.onrender.com/health',
  interval: 10 * 60 * 1000, // 10 minutes
  logToConsole: true
};

// Function to ping the app
function pingApp() {
  const now = new Date().toISOString();
  console.log(`[${now}] Pinging ${config.appUrl} to keep the app alive...`);
  
  const req = https.get(config.appUrl, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (config.logToConsole) {
        console.log(`[${new Date().toISOString()}] Response: ${res.statusCode} ${data}`);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Error: ${error.message}`);
  });
  
  req.end();
}

// Start pinging
console.log(`Starting keep-alive service for ${config.appUrl}`);
console.log(`Will ping every ${config.interval / 1000 / 60} minutes`);

// Initial ping
pingApp();

// Set up interval
setInterval(pingApp, config.interval);

console.log('Press Ctrl+C to stop');