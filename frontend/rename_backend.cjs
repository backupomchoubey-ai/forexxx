const fs = require('fs');
const path = require('path');

const directoryToScan = path.join(__dirname, '..', 'backend');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (dirPath.includes('node_modules')) return;
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const replaceMap = {
  'Dios': 'SCW',
  'DIOS': 'SCW',
  'dios': 'scw',
};

function processFile(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.json') || filePath.endsWith('.md')) {
    // don't mess up package.json dependencies
    if (filePath.includes('package.json') || filePath.includes('package-lock.json')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Text replacements using regex matching whole words or inside strings
    content = content.replace(/\bDios\b/g, 'SCW');
    content = content.replace(/\bdios\b/g, 'scw');
    content = content.replace(/\bDIOS\b/g, 'SCW');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
    }
  }
}

walkDir(directoryToScan, processFile);
console.log('Backend Replacement complete.');
