const { execSync } = require('child_process');
const fs = require('fs');

let content = fs.readFileSync('src/utils/__tests__/contractHelpers.test.ts', 'utf8');
content = content.replace(
  'expect(balances.balance).toBe(\'60\');',
  `console.log('MOCKSTORAGE:', mockStorage); expect(balances.balance).toBe('60');`
);
fs.writeFileSync('src/utils/__tests__/contractHelpers.test.ts', content, 'utf8');

try {
    const out = execSync('npx jest src/utils/__tests__/contractHelpers.test.ts', { encoding: 'utf8' });
    fs.writeFileSync('jest_out.txt', out);
} catch (e) {
    fs.writeFileSync('jest_out.txt', e.stdout + '\\n' + e.stderr);
}
