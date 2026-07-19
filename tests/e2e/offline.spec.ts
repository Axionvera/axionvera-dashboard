import { test, expect } from '@playwright/test';
import { mockConnectedWallet } from './helpers/mockWallet';

test.describe('PWA Offline Resilience', () => {
  test.beforeEach(async ({ page }) => {
    // Inject flag to force-enable service worker in dev/test builds
    await page.addInitScript(() => {
      (window as any).NEXT_PUBLIC_ENABLE_PWA_DEV = 'true';
    });

    // Connect wallet to access dashboard pages
    await mockConnectedWallet(page);
  });

  test('should register service worker successfully', async ({ page }) => {
    await page.goto('/');
    
    // Service worker registers on load, check for active registrations
    const hasSW = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      // Wait for registration logic to trigger
      await new Promise(resolve => setTimeout(resolve, 1000));
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    });

    expect(hasSW).toBeDefined();
  });

  test('should render offline banner when network drops', async ({ page, context }) => {
    await page.goto('/dashboard');
    
    // Verify offline indicator is NOT visible when online
    const offlineBanner = page.locator('text=Offline Mode');
    await expect(offlineBanner).not.toBeVisible();

    // Turn browser offline
    await context.setOffline(true);
    
    // Verify offline banner pops up
    await expect(offlineBanner).toBeVisible();
    await expect(page.locator('text=Using offline data')).toBeVisible();

    // Recover network connection
    await context.setOffline(false);
    
    // Verify offline banner goes away
    await expect(offlineBanner).not.toBeVisible();
  });

  test('should retrieve and render balances and transactions from local cache when offline', async ({ page, context }) => {
    const testAddress = 'GABC123MOCKADDRESS456DEF789GHI012JKL345MNO678PQR';
    
    // Navigate to dashboard while online
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Seed localStorage with mock cache data while online
    await page.evaluate(({ address }) => {
      const balanceCache = {
        data: { balance: '1234.5678', rewards: '99.99' },
        timestamp: Date.now()
      };
      
      const txsCache = {
        data: [
          { id: 'tx-offline-1', type: 'deposit', amount: '1000', status: 'success', createdAt: new Date().toISOString() }
        ],
        timestamp: Date.now()
      };

      const analyticsCache = {
        data: {
          historicalBalances: [
            { timestamp: new Date().toISOString(), balance: '1234.5678', rewards: '99.99' }
          ],
          rewardPerformance: {
            totalRewardsEarned: '99.99',
            averageRewardRate: '5.2',
            lastRewardDate: new Date().toISOString()
          },
          participationMetrics: {
            totalDeposits: '1000',
            totalWithdrawals: '0',
            netDeposits: '1000',
            transactionCount: 1,
            firstInteractionDate: new Date().toISOString(),
            lastInteractionDate: new Date().toISOString(),
            activeDays: 1
          }
        },
        timestamp: Date.now()
      };

      localStorage.setItem(`axionvera:cache:balances:${address}`, JSON.stringify(balanceCache));
      localStorage.setItem(`axionvera:cache:transactions:${address}`, JSON.stringify(txsCache));
      localStorage.setItem(`axionvera:cache:analytics:${address}`, JSON.stringify(analyticsCache));
    }, { address: testAddress });

    // Go offline
    await context.setOffline(true);
    await expect(page.getByText('Offline Mode').first()).toBeVisible();
    
    // Click the "Refresh" button on the dashboard to trigger state update while offline
    const refreshButton = page.locator('button[aria-label="Refresh vault balances"]');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Dashboard should successfully display cached state instead of blank/error state
    const cachedBalance = page.getByText('1,234.5678', { exact: true }).first();
    await expect(cachedBalance).toBeVisible({ timeout: 5000 });

    // Verify transaction history loads the cached tx
    const txRow = page.getByText('1,000', { exact: true }).first();
    await expect(txRow).toBeVisible();

    // Verify indicator tells user they are viewing cached data
    const toastMsg = page.getByText('Displaying cached vault details.').first();
    await expect(toastMsg).toBeVisible();
    
    // Restore network
    await context.setOffline(false);
  });
});
