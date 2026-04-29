import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright E2E test suite...');
  
  // Verify environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_STELLAR_NETWORK',
    'NEXT_PUBLIC_SOROBAN_RPC_URL',
    'NEXT_PUBLIC_HORIZON_URL',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missingVars.join(', ')}`
    );
    console.warn('   Tests will use default values from .env.test');
  }

  // Optional: Pre-warm the application
  const baseURL = config.projects[0].use.baseURL;
  if (baseURL) {
    console.log(`🔥 Pre-warming application at ${baseURL}...`);
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('✅ Application is ready');
    } catch (error) {
      console.warn('⚠️  Could not pre-warm application:', error);
    } finally {
      await browser.close();
    }
  }

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
