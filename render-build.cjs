/**
 * Special build script for Render deployment
 * This handles converting ESM modules to CJS compatibility
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting specialized Render build process...');

try {
  // Step 1: Run vite build for the client
  console.log('Step 1: Building client with Vite...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Step 2: Create a dist folder for our server files if it doesn't exist
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  // Step 3: Copy and transform server files
  console.log('Step 3: Transforming server files to CJS...');
  
  // Helper to transform import statements to require
  function transformToCjs(content) {
    // Transform dynamic import() to require()
    content = content.replace(/import\s*\(\s*(['"`])(.*?)\1\s*\)/g, 'require($1$2$1)');
    
    // Transform static imports to require statements
    content = content.replace(/import\s+(\w+)\s+from\s+(['"`])(.*?)\2/g, 'const $1 = require($2$3$2)');
    content = content.replace(/import\s*{([^}]*)}\s*from\s+(['"`])(.*?)\2/g, (_, imports, quote, source) => {
      const importItems = imports.split(',').map(item => item.trim());
      const assignments = importItems.map(item => {
        if (item.includes(' as ')) {
          const [original, alias] = item.split(' as ').map(s => s.trim());
          return `const ${alias} = require(${quote}${source}${quote}).${original};`;
        }
        return `const ${item} = require(${quote}${source}${quote}).${item};`;
      });
      return assignments.join('\n');
    });
    
    // Transform export statements
    content = content.replace(/export\s+default\s+(\w+)/g, 'module.exports = $1');
    content = content.replace(/export\s+const\s+(\w+)\s*=\s*(.*?);/g, 'const $1 = $2;\nmodule.exports.$1 = $1;');
    content = content.replace(/export\s+function\s+(\w+)/g, 'function $1');
    content = content.replace(/export\s+class\s+(\w+)/g, 'class $1');
    
    return content;
  }
  
  // Process server directory
  function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Create the same directory in dist
        const targetDir = path.join('dist', path.relative('server', filePath));
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        processDirectory(filePath);
      } else if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.ts'))) {
        // Transform file content and save to dist
        let content = fs.readFileSync(filePath, 'utf8');
        
        // For TypeScript files, we'll use esbuild to compile to JS
        if (file.endsWith('.ts')) {
          const outputFile = path.join(path.dirname(filePath), `${path.basename(file, '.ts')}.temp.js`);
          execSync(`npx esbuild ${filePath} --platform=node --target=node14 --format=cjs --outfile=${outputFile}`, { stdio: 'inherit' });
          content = fs.readFileSync(outputFile, 'utf8');
          fs.unlinkSync(outputFile); // Clean up temp file
          
          // Save as .js file in dist
          const relativePath = path.relative('server', filePath);
          const targetPath = path.join('dist', path.dirname(relativePath), `${path.basename(relativePath, '.ts')}.js`);
          
          // Make sure the target directory exists
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          
          // Apply additional transformations for CommonJS compatibility
          const transformedContent = transformToCjs(content);
          fs.writeFileSync(targetPath, transformedContent);
          console.log(`Transformed and compiled: ${filePath} -> ${targetPath}`);
        } else {
          // It's already a JS file, just transform and copy
          const relativePath = path.relative('server', filePath);
          const targetPath = path.join('dist', relativePath);
          
          // Make sure the target directory exists
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          
          // Apply transformations for CommonJS compatibility
          const transformedContent = transformToCjs(content);
          fs.writeFileSync(targetPath, transformedContent);
          console.log(`Transformed: ${filePath} -> ${targetPath}`);
        }
      }
    });
  }
  
  // Process the server directory
  processDirectory('server');
  
  // Step 4: Create a simple index.js entrypoint in dist
  console.log('Step 4: Creating server entrypoint...');
  const entrypointContent = `
// Server entrypoint (CommonJS)
try {
  console.log('Starting server from dist/index.js...');
  
  // Check if environment variables are set
  const requiredEnvVars = ['OPENAI_API_KEY', 'GEMINI_API_KEY'];
  const missingVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(\`⚠️ Missing environment variables: \${missingVars.join(', ')}\`);
    console.error('Please add these to your Render environment variables.');
  } else {
    console.log('✅ All required environment variables are present');
  }
  
  // Load the converted server code
  require('./index');
} catch (error) {
  console.error('Fatal error starting server:', error);
  process.exit(1);
}
`;
  
  fs.writeFileSync('dist/server.js', entrypointContent);
  console.log('Created server entrypoint at dist/server.js');
  
  // Step 5: Copy additional files to dist
  console.log('Step 5: Copying additional files to dist...');
  
  // Copy shared directory
  if (fs.existsSync('shared')) {
    function copyDir(src, dest) {
      fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
    
    copyDir('shared', 'dist/shared');
    console.log('Copied shared directory to dist/shared');
  }
  
  console.log('Build process completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}