const fs = require('fs');
const path = require('path');

const directoryToScan = path.join(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');
const indexHtml = path.join(__dirname, 'index.html');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const replaceMap = {
  'Dios': 'SCW',
  'dios': 'scw',
  'DIOS': 'SCW',
  '/DiosDerivativewithslogapng.png': '/scw-logo.png',
  '/DiosDerivativewithoutsloganwhite.png': '/scw-logo.png',
  '/DiosDerivativewithoutsloganblack.png': '/scw-logo.png',
  '/DiosDerivativeswhite.png': '/scw-logo.png',
  '/DiosDerivativewhite.png': '/scw-logo.png',
  '/Tablogo.png': '/scw-logo.png',
};

function processFile(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // First, path replacements
    for (const [key, value] of Object.entries(replaceMap)) {
      if (key.includes('.png')) {
        content = content.replace(new RegExp(key, 'g'), value);
      }
    }
    
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
if (fs.existsSync(indexHtml)) processFile(indexHtml);

console.log('Replacement complete.');
