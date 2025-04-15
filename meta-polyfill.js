// This file provides a polyfill for import.meta.dirname in Node.js environments
// that might be missing this feature or have issues with it

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Ensure import.meta has a dirname property
if (!('dirname' in import.meta)) {
  // Define dirname on import.meta
  Object.defineProperty(import.meta, 'dirname', {
    get() {
      // Get the directory of the current module
      return dirname(fileURLToPath(import.meta.url));
    }
  });
}

// Export for users who prefer explicit imports
export const getMetaDirname = () => {
  return dirname(fileURLToPath(import.meta.url));
};

// Export project root
export const getProjectRoot = () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return currentDir; // This file is at the project root
};

// Log the fix
console.log('Meta dirname polyfill loaded');

// This needs to run first
export default function init() {
  console.log('Meta dirname polyfill initialized');
  return true;
}

// Log that the polyfill was loaded
console.log('Path polyfill module loaded');