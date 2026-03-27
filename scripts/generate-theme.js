const fs = require('fs');
const path = require('path');

const tokensPath = path.join(__dirname, '../src/tokens.json');
const outputPath = path.join(__dirname, '../src/styles/theme.css');

const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

let css = `/* Auto-generated from tokens.json */\n\n`;

css += `:root {\n  color-scheme: light dark;\n`;
for (const [key, value] of Object.entries(tokens.light)) {
  css += `  --color-${key}: ${value};\n`;
}
css += `}\n\n`;

css += `[data-theme="dark"] {\n`;
for (const [key, value] of Object.entries(tokens.dark)) {
  css += `  --color-${key}: ${value};\n`;
}
css += `}\n`;

fs.writeFileSync(outputPath, css);
console.log('Theme CSS generated at src/styles/theme.css');
