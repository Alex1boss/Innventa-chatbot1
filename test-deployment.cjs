#!/usr/bin/env node
// Test script for the Innventa AI Chatbot deployment
const https = require('https');
const http = require('http');

// Configuration (replace with your actual deployment URL)
const config = {
  baseUrl: process.env.DEPLOYMENT_URL || 'https://innventa-ai-chatbot.onrender.com',
  tests: [
    {
      name: 'Health Check',
      endpoint: '/health',
      method: 'GET'
    },
    {
      name: 'Get Session',
      endpoint: '/api/chat/session',
      method: 'GET'
    },
    {
      name: 'Welcome Message',
      endpoint: '/api/chat/welcome',
      method: 'GET'
    }
  ]
};

// Function to make HTTP requests
function makeRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = config.baseUrl.startsWith('https://');
    const urlObj = new URL(config.baseUrl);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const requestLib = isHttps ? https : http;
    
    const req = requestLib.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log(`Testing deployment at ${config.baseUrl}\n`);
  
  let sessionId = null;
  
  for (const test of config.tests) {
    try {
      console.log(`⏳ Running test: ${test.name}`);
      const result = await makeRequest(test.endpoint, test.method);
      
      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log(`✅ ${test.name}: Success (${result.statusCode})`);
        console.log(`   Response: ${JSON.stringify(result.data, null, 2).substring(0, 150)}...\n`);
        
        // Store session ID if this was the session test
        if (test.endpoint === '/api/chat/session' && result.data.sessionId) {
          sessionId = result.data.sessionId;
          console.log(`📝 Session ID captured: ${sessionId}\n`);
        }
      } else {
        console.log(`❌ ${test.name}: Failed (${result.statusCode})`);
        console.log(`   Response: ${JSON.stringify(result.data)}\n`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}\n`);
    }
  }
  
  // If we got a session ID, test sending a message
  if (sessionId) {
    try {
      console.log('⏳ Running test: Send Message');
      const messageResult = await makeRequest('/api/chat/message', 'POST', {
        sessionId,
        content: 'Hello, is this working?',
        fromUser: true
      });
      
      if (messageResult.statusCode >= 200 && messageResult.statusCode < 300) {
        console.log(`✅ Send Message: Success (${messageResult.statusCode})`);
        console.log(`   Response: ${JSON.stringify(messageResult.data, null, 2).substring(0, 150)}...\n`);
      } else {
        console.log(`❌ Send Message: Failed (${messageResult.statusCode})`);
        console.log(`   Response: ${JSON.stringify(messageResult.data)}\n`);
      }
    } catch (error) {
      console.log(`❌ Send Message: Error - ${error.message}\n`);
    }
  }
  
  console.log('Testing complete!');
}

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
});