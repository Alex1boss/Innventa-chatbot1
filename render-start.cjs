// This script helps manage the startup process on Render
const http = require('http');
const { execSync, spawn } = require('child_process');

// Function to check if the server is healthy
function pingHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('Health check successful!');
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(true);
        });
      } else {
        console.log(`Health check failed with status code: ${res.statusCode}`);
        reject(new Error(`Health check failed with status code: ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      console.error('Health check error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('Health check timed out');
      req.destroy();
      reject(new Error('Health check timed out'));
    });

    req.end();
  });
}

// Start the server
console.log('Starting server...');

// Make sure the API keys are properly set
const requiredEnvVars = ['OPENAI_API_KEY', 'GEMINI_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`ERROR: Required environment variable ${envVar} is missing`);
    console.error('Please set this environment variable in the Render dashboard');
    process.exit(1);
  }
}

// On free tier, we'll integrate keepalive with the main process instead of spawning a separate process
console.log('Running on free tier - integrating keepalive with main process...');

// Simple internal health check (minimal version of keepalive.cjs functionality)
const pingInternalHealth = () => {
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log(`[${new Date().toISOString()}] Internal health check passed!`);
    } else {
      console.error(`[${new Date().toISOString()}] Health check failed with status code: ${res.statusCode}`);
    }
  });

  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Internal health check error: ${error.message}`);
  });

  req.end();
};

// Set a 10-minute interval for internal health checks (primary keepalive)
const healthInterval = 10 * 60 * 1000;
setTimeout(() => {
  setInterval(pingInternalHealth, healthInterval);
  console.log(`[${new Date().toISOString()}] Internal health checks scheduled every ${healthInterval/1000/60} minutes`);
}, 60000); // Start after 1 minute to give the server time to start

// Add an external ping function to keep the service alive 24/7
const pingExternalEndpoint = () => {
  const https = require('https');
  const appUrl = process.env.EXTERNAL_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app-name.onrender.com'}/health`;
  
  console.log(`[${new Date().toISOString()}] Sending external ping to ${appUrl} to prevent idling`);
  
  const req = https.get(appUrl, (res) => {
    console.log(`[${new Date().toISOString()}] External ping response: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] External ping response data: ${data}`);
    });
  });
  
  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] External ping error: ${error.message}`);
  });
  
  req.end();
};

// Setup anti-idle pings every 10 minutes to prevent the service from sleeping
// Render free tier sleeps after 15 minutes of inactivity
const antiIdleInterval = 10 * 60 * 1000; 
setTimeout(() => {
  setInterval(pingExternalEndpoint, antiIdleInterval);
  console.log(`[${new Date().toISOString()}] External anti-idle pings scheduled every ${antiIdleInterval/1000/60} minutes`);
}, 2 * 60 * 1000); // Start after 2 minutes

// Start the server with npm run start
console.log('Starting main application...');
const childProcess = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  shell: true
});

childProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Exit if the child process exits
childProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});