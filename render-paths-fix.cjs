/**
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
    console.log(`- ${item} (${stats.isDirectory() ? 'directory' : 'file'})`);
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
    const patchedContent = `
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
      
      ${content}
    `;
    
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

console.log('Render paths fix script initialized successfully');