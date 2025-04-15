/**
 * This is a production ESM wrapper that provides compatibility for path resolution
 * in the production environment on Render.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Ensure import.meta.dirname is handled properly in production
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.IS_RENDER === 'true';

// For logging in production only
if (isProduction) {
  console.log('Running in production mode');
  console.log('Current Node.js version:', process.version);
  console.log('Import meta URL available:', typeof import.meta.url);
  console.log('Import meta dirname available:', 'dirname' in import.meta);
}

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This function gets the project root regardless of environment
export function getProjectRoot() {
  return __dirname;
}

// This function ensures paths are resolved correctly from the project root
export function resolveFromRoot(...pathSegments) {
  return resolve(__dirname, ...pathSegments);
}

// This function ensures directory exists before operations
export function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    } catch (err) {
      console.error(`Error creating directory ${dirPath}:`, err);
    }
  }
  return dirPath;
}

// Print debug info for production troubleshooting
if (isProduction) {
  console.log('Project root directory:', getProjectRoot());
  
  // List all top-level directories and files
  try {
    const topLevelItems = fs.readdirSync(getProjectRoot());
    console.log('Top-level project files/directories:');
    topLevelItems.forEach(item => {
      const stats = fs.statSync(resolve(getProjectRoot(), item));
      console.log(`- ${item} (${stats.isDirectory() ? 'directory' : 'file'})`);
    });
  } catch (err) {
    console.error('Error listing project files:', err);
  }
}

export default {
  getProjectRoot,
  resolveFromRoot,
  ensureDirectoryExists
};