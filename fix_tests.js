const fs = require('fs');
const path = require('path');

function prependDisable(filePath) {
  const fullPath = path.join(__dirname, 'travel-ai', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  if (!content.startsWith('/* eslint-disable */')) {
    fs.writeFileSync(fullPath, '/* eslint-disable */\n' + content);
  }
}

prependDisable('__tests__/api.test.ts');
prependDisable('__tests__/security.test.ts');
prependDisable('__tests__/types.test.ts');
