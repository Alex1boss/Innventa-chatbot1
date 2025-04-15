// This script helps manage the startup process on Render
const http = require('http');
const { execSync } = require('child_process');

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

// Start the server with npm run start
const childProcess = require('child_process').spawn('npm', ['run', 'start'], {
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