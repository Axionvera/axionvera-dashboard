#!/usr/bin/env node

/**
 * CI Verification Script
 * 
 * Verifies that the local environment is ready to pass CI checks.
 * Run this before pushing to catch issues early.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

function runCommand(command, description) {
  console.log(`\n${chalk.blue('→')} ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(chalk.green('✓') + ` ${description} passed`);
    return true;
  } catch (error) {
    console.log(chalk.red('✗') + ` ${description} failed`);
    return false;
  }
}

function checkFile(filePath, description) {
  console.log(`\n${chalk.blue('→')} Checking ${description}...`);
  if (fs.existsSync(filePath)) {
    console.log(chalk.green('✓') + ` ${description} exists`);
    return true;
  } else {
    console.log(chalk.red('✗') + ` ${description} not found`);
    return false;
  }
}

async function main() {
  console.log(chalk.bold('\n🔍 CI Verification Script\n'));
  console.log('This script simulates CI checks locally.\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Check prerequisites
  console.log(chalk.bold('=== Prerequisites ==='));
  
  const hasEnv = checkFile('.env', '.env file');
  if (!hasEnv) {
    console.log(chalk.yellow('⚠') + '  Creating .env from .env.test...');
    try {
      fs.copyFileSync('.env.test', '.env');
      console.log(chalk.green('✓') + ' .env created');
      results.warnings++;
    } catch (error) {
      console.log(chalk.red('✗') + ' Failed to create .env');
      results.failed++;
    }
  } else {
    results.passed++;
  }

  checkFile('src/tokens.json', 'Design tokens');
  checkFile('package.json', 'package.json');
  checkFile('tsconfig.json', 'TypeScript config');

  // Run CI checks
  console.log(chalk.bold('\n=== CI Checks ==='));

  // 1. Generate theme
  if (runCommand('npm run generate-theme', 'Theme generation')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // 2. Validate environment
  if (runCommand('npm run validate-env', 'Environment validation')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // 3. Lint
  if (runCommand('npm run lint', 'ESLint')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // 4. Type check
  if (runCommand('npm run typecheck', 'TypeScript type checking')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // 5. Unit tests
  if (runCommand('npm test -- --passWithNoTests', 'Unit tests')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  console.log(chalk.bold('\n=== Summary ===\n'));
  console.log(`${chalk.green('✓')} Passed: ${results.passed}`);
  if (results.failed > 0) {
    console.log(`${chalk.red('✗')} Failed: ${results.failed}`);
  }
  if (results.warnings > 0) {
    console.log(`${chalk.yellow('⚠')} Warnings: ${results.warnings}`);
  }

  if (results.failed === 0) {
    console.log(chalk.bold(chalk.green('\n✅ All CI checks passed! Safe to push.\n')));
    process.exit(0);
  } else {
    console.log(chalk.bold(chalk.red('\n❌ Some CI checks failed. Please fix before pushing.\n')));
    console.log('Run individual commands to see detailed errors:');
    console.log('  npm run lint');
    console.log('  npm run typecheck');
    console.log('  npm test\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Error running CI verification:'), error);
  process.exit(1);
});
