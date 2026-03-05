const fs = require('fs');
const path = require('path');

console.log('Building Blockulator for deployment...');

// Helper function to copy directory recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper to copy file if it exists
function copyFileIfExists(src, dest) {
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  } catch (err) {
    // Ignore errors
  }
}

// Clean and create dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist');

console.log('📄 Copying HTML files...');
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
htmlFiles.forEach(file => {
  fs.copyFileSync(file, path.join('dist', file));
});

console.log('📦 Copying JavaScript files...');
copyDir('js', 'dist/js');

console.log('🎨 Copying CSS files...');
copyFileIfExists('styles.css', 'dist/styles.css');

console.log('🖼️  Copying images...');
['png', 'jpg', 'svg', 'ico'].forEach(ext => {
  const files = fs.readdirSync('.').filter(f => f.endsWith('.' + ext));
  files.forEach(file => copyFileIfExists(file, path.join('dist', file)));
});

console.log('📜 Copying contract ABIs...');
fs.mkdirSync('dist/contracts/build', { recursive: true });
copyDir('contracts/build/abis', 'dist/contracts/build/abis');

console.log('🚀 Copying deployment files...');
copyDir('contracts/deployments', 'dist/contracts/deployments');

console.log('✅ Build completed successfully!');
console.log('📁 Output directory: dist/');

