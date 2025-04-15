// This script helps manage the startup process on Render
const http = require('http');
const { execSync, spawn } = require('child_process');

// Function to check if the server is healthy
function pingHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
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
const missingVars = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.error(`⚠️ ERROR: The following required environment variables are missing: ${missingVars.join(', ')}`);
  console.error('');
  console.error('================== ACTION REQUIRED ==================');
  console.error('Please set these environment variables in the Render dashboard:');
  console.error('1. Go to your Render dashboard: https://dashboard.render.com');
  console.error('2. Open your deployed service "innventa-ai-chatbot"');
  console.error('3. Click on "Environment" in the left sidebar');
  console.error('4. Add the missing environment variables under "Environment Variables"');
  console.error('');
  console.error('For OPENAI_API_KEY: Create or use an existing API key from https://platform.openai.com/api-keys');
  console.error('For GEMINI_API_KEY: Create or use an existing API key from https://aistudio.google.com/app/apikey');
  console.error('');
  console.error('After adding the environment variables, redeploy your service.');
  console.error('====================================================');
  console.error('');
  
  // Let's attempt to continue anyway, the render-paths-fix.cjs will handle this more gracefully
  console.log('Attempting to continue despite missing environment variables...');
} else {
  console.log('✅ All required environment variables are set');
}

// On free tier, we'll integrate keepalive with the main process instead of spawning a separate process
console.log('Running on free tier - integrating keepalive with main process...');

// Simple internal health check (minimal version of keepalive.cjs functionality)
const pingInternalHealth = () => {
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
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
  let appUrl = `http://localhost:${process.env.PORT || 3000}/health`; // Default fallback for local development
  
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

// Check if our path resolver is already in place
try {
  console.log('Checking for render-paths-fix.cjs path resolver...');
  const fs = require('fs');
  const path = require('path');
  
  // Path to our path resolution fix file
  const pathsFixFile = path.join(process.cwd(), 'render-paths-fix.cjs');
  
  if (!fs.existsSync(pathsFixFile)) {
    console.error('ERROR: render-paths-fix.cjs file not found!');
    console.log('This file should have been included in the deployment.');
    console.log('Will attempt to create it now...');
    
    // Try to create the paths fix file from the template in this file
    const renderPathsFixContent = `/**
 * This script fixes path resolution issues with import.meta.dirname
 * in the Node.js environment on Render.
 * 
 * It uses a global require hook to patch the import.meta object.
 */

const path = require('path');
const fs = require('fs');
const Module = require('module');

console.log('Render paths fix script loaded');
console.log('Node.js version:', process.version);
console.log('Current working directory:', process.cwd());

// Create a helper for path resolution
function resolveFromCwd(...segments) {
  return path.resolve(process.cwd(), ...segments);
}

// List major directories to help with debugging
try {
  console.log('Project structure:');
  const items = fs.readdirSync(process.cwd());
  items.forEach(item => {
    const stats = fs.statSync(path.join(process.cwd(), item));
    console.log(\`- \${item} (\${stats.isDirectory() ? 'directory' : 'file'})\`);
  });
} catch (err) {
  console.error('Error listing project structure:', err);
}

// Create a special patch for ESM modules that adds import.meta.dirname
const originalCompile = Module.prototype._compile;
Module.prototype._compile = function(content, filename) {
  // Only patch JavaScript/TypeScript modules
  if (filename.endsWith('.js') || filename.endsWith('.mjs') || filename.endsWith('.cjs')) {
    // This patched content ensures import.meta.dirname is always defined
    const patchedContent = \`
      // Start of patch for import.meta.dirname
      import { fileURLToPath as __fileURLToPath } from 'url';
      import { dirname as __dirname_fn } from 'path';
      
      // Ensure import.meta.dirname is available and correct
      if (!import.meta.dirname) {
        Object.defineProperty(import.meta, 'dirname', {
          get() {
            try {
              return __dirname_fn(__fileURLToPath(import.meta.url));
            } catch (err) {
              console.error('Error calculating dirname:', err);
              return process.cwd();
            }
          }
        });
      }
      // End of patch
      
      \${content}
    \`;
    
    return originalCompile.call(this, patchedContent, filename);
  }
  
  // For non-JS files, use the original compile
  return originalCompile.call(this, content, filename);
};

// Expose utilities for other modules
module.exports = {
  resolveFromCwd,
  getProjectRoot: () => process.cwd()
};

console.log('Render paths fix script initialized successfully');`;
    
    fs.writeFileSync(pathsFixFile, renderPathsFixContent);
    console.log('Created render-paths-fix.cjs successfully');
  } else {
    console.log('render-paths-fix.cjs file found, will use it for path resolution');
  }
} catch (pathsFixError) {
  console.error('Error checking/creating render-paths-fix.cjs:', pathsFixError);
  console.log('Will attempt to continue, but path resolution errors may occur');
}

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
  // Use a custom environment variable to indicate we're running in Render environment
  // Use render.js instead of dist/index.js for more compatibility with free tier
  const childProcess = spawn('node', ['render.js'], {
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env,
      // Make sure NODE_ENV is set for production
      NODE_ENV: 'production',
      // Add a flag to indicate we're in Render
      IS_RENDER: 'true',
      // Set the port explicitly for free tier
      PORT: process.env.PORT || 3000
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