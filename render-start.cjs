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
  
  // Set a default URL if environment variables are not available
  let appUrl = 'http://localhost:5000/health'; // Default fallback for local development
  
  // If EXTERNAL_URL is defined, use it directly
  if (process.env.EXTERNAL_URL) {
    appUrl = process.env.EXTERNAL_URL;
  } 
  // Otherwise try to construct from hostname if available
  else if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    appUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/health`;
  }
  
  console.log(`[${new Date().toISOString()}] Sending external ping to ${appUrl} to prevent idling`);
  
  try {
    // For safety, use different libraries based on protocol
    if (appUrl.startsWith('https://')) {
      const req = https.get(appUrl, handleResponse);
      req.on('error', handleError);
      req.end();
    } else {
      // For http:// URLs
      const http = require('http');
      const req = http.get(appUrl, handleResponse);
      req.on('error', handleError);
      req.end();
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed to initiate ping: ${err.message}`);
  }
  
  // Handler function for response
  function handleResponse(res) {
    let data = '';
    console.log(`[${new Date().toISOString()}] External ping response: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log(`[${new Date().toISOString()}] External ping completed successfully`);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error processing response: ${err.message}`);
      }
    });
  }
  
  // Handler function for error
  function handleError(error) {
    console.error(`[${new Date().toISOString()}] External ping error: ${error.message}`);
  }
};

// Setup anti-idle pings every 10 minutes to prevent the service from sleeping
// Render free tier sleeps after 15 minutes of inactivity
const antiIdleInterval = 10 * 60 * 1000; 
setTimeout(() => {
  setInterval(pingExternalEndpoint, antiIdleInterval);
  console.log(`[${new Date().toISOString()}] External anti-idle pings scheduled every ${antiIdleInterval/1000/60} minutes`);
}, 2 * 60 * 1000); // Start after 2 minutes

// Start the server with proper error handling
console.log('Starting main application...');

// Wrap the spawn in a try-catch to handle any immediate errors
try {
  // First check if the dist/index.js file exists
  const fs = require('fs');
  const path = require('path');
  
  // Path to the built server file
  const serverPath = path.join(process.cwd(), 'dist', 'index.js');
  
  if (!fs.existsSync(serverPath)) {
    console.error(`ERROR: Server file not found at ${serverPath}`);
    console.log('This may be due to a build failure. Running build process...');
    
    // Try to run the build first
    try {
      console.log('Executing build command...');
      const { execSync } = require('child_process');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('Build completed successfully');
    } catch (buildError) {
      console.error('Failed to build the application:', buildError.message);
      console.error('Please check your build configuration');
      process.exit(1);
    }
  }
  
  console.log('Starting server process...');
  const childProcess = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env,
      // Make sure NODE_ENV is set for production
      NODE_ENV: 'production'
    }
  });

  childProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Exit if the child process exits
  childProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    
    if (code !== 0) {
      console.error('Server exited with an error. Check the logs for details.');
      
      // Give a more helpful message based on common errors
      if (code === 1) {
        console.log('This may be due to:');
        console.log('1. Missing environment variables (check OPENAI_API_KEY and GEMINI_API_KEY)');
        console.log('2. Port conflicts (another service might be using port 5000)');
        console.log('3. Memory limits (the free tier has limited memory)');
      }
    }
    
    process.exit(code);
  });
} catch (error) {
  console.error('Critical error starting application:', error.message);
  process.exit(1);
}