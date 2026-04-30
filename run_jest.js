const { execSync } = require('child_process');
try {
    const out = execSync('npx jest src/utils/__tests__/contractHelpers.test.ts', { encoding: 'utf8' });
    console.log(out);
} catch (e) {
    console.log(e.stdout);
    console.log(e.stderr);
}
