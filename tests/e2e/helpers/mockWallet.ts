import { Page, BrowserContext } from '@playwright/test';

/**
 * Mock wallet helper for E2E tests
 * Provides utilities to mock wallet connection without requiring Freighter extension
 */

export interface MockWalletConfig {
  address?: string;
  network?: 'mainnet' | 'testnet' | 'futurenet';
  balance?: string;
  walletType?: 'freighter' | 'albedo';
  isConnected?: boolean;
}

const DEFAULT_MOCK_CONFIG: Required<MockWalletConfig> = {
  address: 'GABC123MOCKADDRESS456DEF789GHI012JKL345MNO678PQR',
  network: 'testnet',
  balance: '100.0000000',
  walletType: 'freighter',
  isConnected: true,
};

async function seedMiddlewareWalletCookie(
  context: BrowserContext,
  isConnected: boolean
) {
  await context.addCookies([
    {
      name: 'hasWallet',
      value: isConnected ? 'true' : 'false',
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Mock wallet context for a page
 * This should be called before navigating to any page
 */
export async function mockWalletContext(
  page: Page,
  config: MockWalletConfig = {}
) {
  const mockConfig = { ...DEFAULT_MOCK_CONFIG, ...config };
  await seedMiddlewareWalletCookie(page.context(), mockConfig.isConnected);

  await page.addInitScript((config) => {
    // Keep middleware auth check in sync with mocked wallet connection state.
    document.cookie = `hasWallet=${config.isConnected ? 'true' : 'false'}; path=/`;

    // Mock Freighter API
    (window as any).freighter = {
      isConnected: async () => config.isConnected,
      isAllowed: async () => config.isConnected,
      getPublicKey: async () => config.address,
      getNetwork: async () => {
        const networkMap = {
          mainnet: 'PUBLIC',
          testnet: 'TESTNET',
          futurenet: 'FUTURENET',
        };
        return networkMap[config.network];
      },
      setAllowed: async () => true,
    };

    // Store mock context for React components to use
    (window as any).__MOCK_WALLET_CONTEXT__ = {
      address: config.isConnected ? config.address : null,
      publicKey: config.isConnected ? config.address : null,
      network: config.network,
      balance: config.isConnected ? config.balance : null,
      isConnected: config.isConnected,
      isConnecting: false,
      error: null,
      walletType: config.isConnected ? config.walletType : null,
      connect: async () => { },
      disconnect: () => { },
    };
  }, mockConfig);
}

/**
 * Mock wallet context for an entire browser context
 * Useful for tests that open multiple pages
 */
export async function mockWalletForContext(
  context: BrowserContext,
  config: MockWalletConfig = {}
) {
  const mockConfig = { ...DEFAULT_MOCK_CONFIG, ...config };
  await seedMiddlewareWalletCookie(context, mockConfig.isConnected);

  await context.addInitScript((config) => {
    document.cookie = `hasWallet=${config.isConnected ? 'true' : 'false'}; path=/`;

    (window as any).freighter = {
      isConnected: async () => config.isConnected,
      isAllowed: async () => config.isConnected,
      getPublicKey: async () => config.address,
      getNetwork: async () => {
        const networkMap = {
          mainnet: 'PUBLIC',
          testnet: 'TESTNET',
          futurenet: 'FUTURENET',
        };
        return networkMap[config.network];
      },
      setAllowed: async () => true,
    };

    (window as any).__MOCK_WALLET_CONTEXT__ = {
      address: config.isConnected ? config.address : null,
      publicKey: config.isConnected ? config.address : null,
      network: config.network,
      balance: config.isConnected ? config.balance : null,
      isConnected: config.isConnected,
      isConnecting: false,
      error: null,
      walletType: config.isConnected ? config.walletType : null,
      connect: async () => { },
      disconnect: () => { },
    };
  }, mockConfig);
}

/**
 * Mock a disconnected wallet state
 */
export async function mockDisconnectedWallet(page: Page) {
  await mockWalletContext(page, { isConnected: false });
}

/**
 * Mock a connected wallet with custom balance
 */
export async function mockConnectedWallet(
  page: Page,
  balance: string = '100.0000000'
) {
  await mockWalletContext(page, { isConnected: true, balance });
}
