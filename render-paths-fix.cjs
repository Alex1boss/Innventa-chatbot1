/**
 * This script fixes path resolution issues with import.meta.dirname
 * in the Node.js environment on Render.
 * 
 * It also checks for required environment variables and provides better error handling.
 */

const path = require('path');
const fs = require('fs');
const Module = require('module');

console.log('Render paths fix script loaded');
console.log('Node.js version:', process.version);
console.log('Current working directory:', process.cwd());

// Check if required API keys are set
function checkRequiredEnvVars() {
  const requiredKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY'];
  const missingKeys = [];

  for (const key of requiredKeys) {
    if (!process.env[key]) {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    console.error(`⚠️ Missing required environment variables: ${missingKeys.join(', ')}`);
    console.error('These need to be set in the Render dashboard under Environment Variables');
    
    // For testing/development, create placeholders (these won't actually work for API calls)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Creating placeholder values for development environment');
      missingKeys.forEach(key => {
        process.env[key] = `placeholder-${key.toLowerCase()}-value`;
      });
    }
    
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
}

// Print API key status (without revealing actual keys)
function logEnvVarStatus() {
  const keysToCheck = ['OPENAI_API_KEY', 'GEMINI_API_KEY'];
  
  keysToCheck.forEach(key => {
    if (process.env[key]) {
      const keyLength = process.env[key].length;
      const firstChar = process.env[key].charAt(0);
      const lastChar = process.env[key].charAt(keyLength - 1);
      console.log(`${key}: ${firstChar}${'*'.repeat(Math.min(8, keyLength - 2))}${lastChar} (${keyLength} chars)`);
    } else {
      console.log(`${key}: Not set`);
    }
  });
}

// Create a helper for path resolution
function resolveFromCwd(...segments) {
  return path.resolve(process.cwd(), ...segments);
}

// List major directories to help with debugging
function listProjectStructure() {
  try {
    console.log('Project structure:');
    const items = fs.readdirSync(process.cwd());
    items.forEach(item => {
      const stats = fs.statSync(path.join(process.cwd(), item));
      console.log(`- ${item} (${stats.isDirectory() ? 'directory' : 'file'})`);
    });
  } catch (err) {
    console.error('Error listing project structure:', err);
  }
}

// Create a special transformer for ESM import statements in CJS context
function setupModuleTransformer() {
  try {
    // Save the original compile function
    const originalCompile = Module.prototype._compile;
    
    // Replace with our custom version that handles ESM imports in CJS context
    Module.prototype._compile = function(content, filename) {
      if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
        // Check for import statements in a CommonJS context
        if (
          (content.includes('import {') || content.includes('import*as') || 
           content.includes('import"') || content.includes('import\'')) && 
          !content.includes('// @ts-ignore') && 
          !filename.includes('node_modules')
        ) {
          console.log(`Transforming ESM imports in: ${path.basename(filename)}`);
          
          // Create a compatible version that properly works in CJS context
          const transformedContent = `
// Start of ESM compatibility layer - added by render-paths-fix.cjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Enable import.meta features
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Ensure import.meta.dirname is available
if (!import.meta.dirname) {
  Object.defineProperty(import.meta, 'dirname', {
    get() {
      return __dirname;
    }
  });
}
// End of ESM compatibility layer

${content}
`;
          return originalCompile.call(this, transformedContent, filename);
        }
      }
      
      // For non-JS files or files without ESM imports, use the original compile
      return originalCompile.call(this, content, filename);
    };
    
    console.log('Module transformer initialized successfully');
    return true;
  } catch (err) {
    console.error('Failed to initialize module transformer:', err);
    return false;
  }
}

// Initialize
console.log('Checking environment variables...');
const envsOk = checkRequiredEnvVars();
if (envsOk) {
  console.log('Logging API key status (redacted):');
  logEnvVarStatus();
}

console.log('Setting up module transformer...');
setupModuleTransformer();

console.log('Listing project structure...');
listProjectStructure();

// Expose utilities for other modules
module.exports = {
  resolveFromCwd,
  getProjectRoot: () => process.cwd(),
  checkRequiredEnvVars,
  logEnvVarStatus
};

console.log('Render paths fix script initialized successfully');