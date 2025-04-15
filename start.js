// Import the polyfill first to patch import.meta
import './meta-polyfill.js';

// Now run the application
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Starting application with import.meta.dirname polyfill...');

// Run the application using tsx (preserving environment variables)
const env = { ...process.env, NODE_ENV: 'development' };
const server = spawn('npx', ['tsx', 'server/index.ts'], { 
  stdio: 'inherit',
  env,
  cwd: __dirname
});

// Handle server process events
server.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

server.on('exit', (code, signal) => {
  console.log(`Server process exited with code ${code} and signal ${signal}`);
  if (code !== 0) {
    console.error('Server crashed - check the logs for more details');
  }
});

console.log('Server process started');

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down...');
  server.kill('SIGTERM');
});