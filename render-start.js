// This script serves as the entrypoint for Render deployment
// It starts the server and implements basic health check logging

// Using CommonJS-style for maximum compatibility
const { exec } = require('child_process');
const http = require('http');

// Log startup information
console.log(`[${new Date().toISOString()}] Starting Innventa AI Chatbot on Render.com`);

// Check for required environment variables
if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn(`[${new Date().toISOString()}] WARNING: No API keys detected. At least one of OPENAI_API_KEY or GEMINI_API_KEY should be set.`);
} else {
  if (process.env.OPENAI_API_KEY) {
    console.log(`[${new Date().toISOString()}] OpenAI API key configured`);
  }
  if (process.env.GEMINI_API_KEY) {
    console.log(`[${new Date().toISOString()}] Gemini API key configured`);
  }
}

// Start server using npm start command
const serverProcess = exec('npm start', (error, stdout, stderr) => {
  if (error) {
    console.error(`[${new Date().toISOString()}] Error starting server: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`[${new Date().toISOString()}] Server stderr: ${stderr}`);
  }
  console.log(`[${new Date().toISOString()}] Server output: ${stdout}`);
});

// Simple self-pinging function to keep the service active
function pingHealthEndpoint() {
  setTimeout(() => {
    console.log(`[${new Date().toISOString()}] Performing internal health check...`);
    
    http.get('http://localhost:5000/health', (res) => {
      const { statusCode } = res;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (statusCode === 200) {
          console.log(`[${new Date().toISOString()}] Health check passed: ${data}`);
        } else {
          console.error(`[${new Date().toISOString()}] Health check failed with status code: ${statusCode}`);
        }
        
        // Schedule next ping
        pingHealthEndpoint();
      });
    }).on('error', (err) => {
      console.error(`[${new Date().toISOString()}] Health check error: ${err.message}`);
      
      // Still schedule next ping
      pingHealthEndpoint();
    });
  }, 5 * 60 * 1000); // Ping every 5 minutes
}

// Give the server time to start before beginning health checks
setTimeout(() => {
  console.log(`[${new Date().toISOString()}] Starting health check monitoring...`);
  pingHealthEndpoint();
}, 30 * 1000); // Wait 30 seconds before first ping

// Catch termination signals
process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] Received SIGINT, shutting down...`);
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Received SIGTERM, shutting down...`);
  serverProcess.kill();
  process.exit(0);
});