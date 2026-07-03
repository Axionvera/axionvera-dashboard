import { test, expect } from '@playwright/test';
import { mockConnectedWallet, mockDisconnectedWallet } from './helpers/mockWallet';

test.describe('Critical dashboard workflows', () => {
  test('redirects disconnected users away from protected dashboard routes', async ({ page }) => {
    await mockDisconnectedWallet(page);

    await page.goto('/dashboard');

    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: /Axionvera Dashboard/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Connect Stellar wallet/i })
    ).toBeVisible();
  });

  test('loads connected-wallet vault controls and history', async ({ page }) => {
    await mockConnectedWallet(page);

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Current Vault Balance')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Refresh vault balances' })
    ).toBeVisible();
    await expect(page.getByText('Deposit tokens into the Axionvera vault.')).toBeVisible();
    await expect(page.getByText('Withdraw tokens from the Axionvera vault.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview Deposit' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Preview Withdrawal' })).toBeDisabled();
    await expect(page.getByRole('table', { name: 'Transaction History' })).toBeVisible();
  });
});
