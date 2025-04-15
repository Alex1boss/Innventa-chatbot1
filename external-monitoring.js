// External monitoring script for the Innventa AI Chatbot
// Can be run on a separate server to monitor the chatbot's health
const https = require('https');

// Configuration 
const config = {
  url: process.env.APP_URL || 'https://your-deployed-app-url.onrender.com',
  healthEndpoint: '/health',
  interval: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  retryInterval: 30 * 1000 // 30 seconds
};

// Function to ping the health endpoint
function pingHealthEndpoint(retryCount = 0) {
  console.log(`[${new Date().toISOString()}] Checking application health...`);
  
  return new Promise((resolve, reject) => {
    const url = `${config.url}${config.healthEndpoint}`;
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[${new Date().toISOString()}] Application is healthy! Response: ${data}`);
          resolve(true);
        } else {
          const errorMsg = `Health check failed with status code: ${res.statusCode}`;
          console.error(`[${new Date().toISOString()}] ERROR: ${errorMsg}`);
          reject(new Error(errorMsg));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] ERROR: ${error.message}`);
      reject(error);
    });
    
    req.end();
  }).catch(error => {
    return handleFailure(error, retryCount);
  });
}

// Function to handle failure
function handleFailure(reason, retryCount) {
  if (retryCount < config.maxRetries) {
    console.log(`[${new Date().toISOString()}] Retrying in ${config.retryInterval / 1000} seconds... (Attempt ${retryCount + 1}/${config.maxRetries})`);
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(pingHealthEndpoint(retryCount + 1));
      }, config.retryInterval);
    });
  }
  
  console.error(`[${new Date().toISOString()}] ALERT: Application appears to be down after ${config.maxRetries} retry attempts.`);
  console.error(`[${new Date().toISOString()}] Last error: ${reason.message}`);
  
  // You could add notification logic here (email, SMS, webhook to notification service)
  // For example:
  // sendAlertEmail('Application appears to be down!', reason.message);
  
  return false;
}

// Start monitoring
console.log(`[${new Date().toISOString()}] Starting monitoring for ${config.url}${config.healthEndpoint}`);
console.log(`[${new Date().toISOString()}] Will check every ${config.interval / 1000 / 60} minutes`);

// Initial check
pingHealthEndpoint().then(() => {
  // Set up interval for regular checks
  setInterval(() => {
    pingHealthEndpoint().catch(error => {
      console.error(`[${new Date().toISOString()}] Monitoring error: ${error.message}`);
    });
  }, config.interval);
}).catch(error => {
  console.error(`[${new Date().toISOString()}] Initial monitoring check failed: ${error.message}`);
  process.exit(1);
});