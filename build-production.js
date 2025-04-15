/**
 * Custom build script for production
 * This helps overcome path resolution issues in Render deployment
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running custom production build script...');

try {
  // Step 1: Run the normal build through npm script
  console.log('Step 1: Running standard Vite build...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Step 2: Run the server build through esbuild
  console.log('Step 2: Building server with esbuild...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', 
    { stdio: 'inherit' });
  
  // Step 3: Copy the production-wrapper.js to dist directory
  console.log('Step 3: Copying production wrapper to dist directory...');
  const wrapperSource = path.join(__dirname, 'production-wrapper.js');
  const wrapperDest = path.join(__dirname, 'dist', 'production-wrapper.js');
  
  fs.copyFileSync(wrapperSource, wrapperDest);
  console.log(`Copied ${wrapperSource} to ${wrapperDest}`);
  
  // Step 4: Create additional compatibility files
  console.log('Step 4: Creating additional compatibility files...');
  
  // Create a CJS version of the path fix for Node.js require()
  const fixPathsCjs = path.join(__dirname, 'fix-paths.cjs');
  const fixPathsContent = `
// Fix for import.meta.dirname path resolution issues
const { dirname } = require('path');
const { fileURLToPath } = require('url');

// Patch global for ESM modules
global.__fileURLToPath = function(url) {
  try {
    return fileURLToPath(url);
  } catch (err) {
    console.error('Error in fileURLToPath:', err);
    return url.replace('file://', '');
  }
};

global.__dirname = function(url) {
  try {
    return dirname(global.__fileURLToPath(url));
  } catch (err) {
    console.error('Error in dirname calculation:', err);
    return process.cwd();
  }
};

// Print the current directory for debugging
console.log('Current directory (cwd):', process.cwd());

module.exports = {
  getCurrentDir: () => process.cwd(),
  getProjectRoot: () => process.cwd()
};
`;
  
  fs.writeFileSync(fixPathsCjs, fixPathsContent);
  console.log(`Created ${fixPathsCjs}`);
  
  // Step 5: Create production startup helper
  console.log('Step 5: Creating production startup helper...');
  
  // This file will be called before the main app to properly configure paths
  const startupHelperPath = path.join(__dirname, 'dist', 'startup-helper.js');
  const startupHelperContent = `
// Production startup helper
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Log startup for debugging
console.log('Production startup helper initializing...');
console.log('Node.js version:', process.version);
console.log('Current working directory:', process.cwd());

// Ensure import.meta features are available
console.log('Import meta URL available:', typeof import.meta.url);
console.log('Import meta dirname available:', 'dirname' in import.meta);

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Resolved __dirname:', __dirname);

// This will be imported by the main app
export const getProjectRoot = () => __dirname;
export const resolveFromRoot = (...paths) => resolve(__dirname, ...paths);

export default {
  getProjectRoot,
  resolveFromRoot
};

console.log('Production startup helper initialized successfully');
`;
  
  fs.writeFileSync(startupHelperPath, startupHelperContent);
  console.log(`Created ${startupHelperPath}`);
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}