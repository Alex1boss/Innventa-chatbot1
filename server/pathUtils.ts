import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the current file's directory
const getCurrentDirname = (importMetaUrl: string) => {
  try {
    const __filename = fileURLToPath(importMetaUrl);
    return dirname(__filename);
  } catch (error) {
    console.error('Error getting dirname:', error);
    // Fallback to process.cwd() if fileURLToPath fails
    return process.cwd();
  }
};

// Resolve a path relative to the project root
export const resolveProjectPath = (...pathSegments: string[]) => {
  const currentDir = getCurrentDirname(import.meta.url);
  // Go up one level from server/ to the project root
  return resolve(currentDir, '..', ...pathSegments);
};

// Export a compatibility function for import.meta.dirname usage
export const getProjectRoot = () => {
  try {
    const currentDir = getCurrentDirname(import.meta.url);
    // Go up one level from server/ to the project root
    return resolve(currentDir, '..');
  } catch (error) {
    console.error('Error getting project root:', error);
    return process.cwd();
  }
};

// Export __dirname equivalent for ES modules
export const __dirname = getCurrentDirname(import.meta.url);