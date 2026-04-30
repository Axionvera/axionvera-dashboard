const fs = require('fs');
const text = fs.readFileSync('final_test.txt', 'utf16le');
const lines = text.split('\n');
let capture = false;
let out = [];
lines.forEach(l => {
  if (l.includes('FAIL ')) capture = true;
  if (capture && l.includes('Test Suites:')) capture = false;
  if (capture) out.push(l);
});
fs.writeFileSync('final_test_fails.txt', out.join('\n'));
