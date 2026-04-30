const { execSync } = require('child_process');
const fs = require('fs');

let content = fs.readFileSync('src/utils/contractHelpers.ts', 'utf8');
content = content.replace(
  'const vault = loadVault(walletAddress, network);\n      vault.txs = [tx, ...vault.txs].slice(0, 25);',
  `const vault = loadVault(walletAddress, network);
      console.log('WITHDRAW INITIAL VAULT:', JSON.stringify(vault), 'AMOUNT:', amount, 'NETWORK:', network, 'ADDRESS:', walletAddress);
      vault.txs = [tx, ...vault.txs].slice(0, 25);`
);
fs.writeFileSync('src/utils/contractHelpers.ts', content, 'utf8');

try {
    const out = execSync('npx jest src/utils/__tests__/contractHelpers.test.ts', { encoding: 'utf8' });
    console.log(out);
} catch (e) {
    console.log(e.stdout);
    console.log(e.stderr);
}
