const fs = require('fs');
const text = fs.readFileSync('test-results.txt', 'utf16le');
const lines = text.split('\n');
let capture = false;
let out = [];
lines.forEach(l => {
  if (l.includes('FAIL tests/utils/contractHelpers.test.ts') || l.includes('FAIL src/utils/__tests__/contractHelpers.test.ts')) capture = true;
  if (capture && l.includes('Test Suites:')) capture = false;
  if (capture) out.push(l);
});
fs.writeFileSync('test-out.txt', out.join('\n'));
