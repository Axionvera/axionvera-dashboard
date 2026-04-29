import { 
  shortenAddress, 
  formatAmount, 
  parsePositiveAmount, 
  createAxionveraVaultSdk 
} from '../contractHelpers';

// Mock apiResilience to bypass sleep/timeout logic
jest.mock('../apiResilience', () => ({
  withApiResilience: (fn: any) => fn,
  withErrorHandling: (fn: any) => fn,
  safeApiCall: async (fn: any) => ({ data: await fn() }),
}));

// Mock networkConfig to ensure consistent storage keys
jest.mock('../networkConfig', () => ({
  NETWORK: 'testnet',
}));

describe('contractHelpers utility', () => {
  describe('shortenAddress', () => {
    it('should shorten address', () => {
      expect(shortenAddress('GABC123456789XYZ', 3)).toBe('GAB...XYZ');
    });

    it('should return empty string for no address', () => {
      expect(shortenAddress('')).toBe('');
    });

    it('should return original if short enough', () => {
      expect(shortenAddress('ABC', 6)).toBe('ABC');
    });
  });

  describe('formatAmount', () => {
    it('should format numbers', () => {
      expect(formatAmount('1000')).toBe('1,000');
    });

    it('should return original if not a number', () => {
      expect(formatAmount('abc')).toBe('abc');
    });
  });

  describe('parsePositiveAmount', () => {
    it('should parse valid positive amounts', () => {
      expect(parsePositiveAmount('10.5')).toBe('10.5');
    });

    it('should return null for invalid amounts', () => {
      expect(parsePositiveAmount('-1')).toBeNull();
      expect(parsePositiveAmount('abc')).toBeNull();
      expect(parsePositiveAmount('0')).toBeNull();
    });
  });

  describe('createAxionveraVaultSdk', () => {
    let sdk: any;
    const mockStorage: any = {};

    beforeEach(() => {
      sdk = createAxionveraVaultSdk();
      window.localStorage.clear();
      (global as any).crypto = {
        randomUUID: () => 'test-uuid'
      };
    });

    it('should get balances (mocked)', async () => {
      const balances = await sdk.getBalances({ walletAddress: 'G_BAL', network: 'testnet' });
      expect(balances).toEqual({ balance: '0', rewards: '0' });
    });

    it('should deposit (mocked)', async () => {
      const tx = await sdk.deposit({ walletAddress: 'G_DEP', network: 'testnet', amount: '100' });
      expect(tx.status).toBe('success');
      expect(tx.amount).toBe('100');
      
      const balances = await sdk.getBalances({ walletAddress: 'G_DEP', network: 'testnet' });
      expect(balances.balance).toBe('100');
    });

    it('should withdraw (mocked)', async () => {
      window.localStorage.setItem('axionvera:vault:testnet:G_WIT', JSON.stringify({
        balance: '100',
        rewards: '0',
        txs: []
      }));
      
      const tx = await sdk.withdraw({ walletAddress: 'G_WIT', network: 'testnet', amount: '40' });
      expect(tx.status).toBe('success');
      
      const balances = await sdk.getBalances({ walletAddress: 'G_WIT', network: 'testnet' });
      expect(balances.balance).toBe('60');
    });

    it('should claim rewards (mocked)', async () => {
      window.localStorage.setItem('axionvera:vault:testnet:G_CLA', JSON.stringify({
        balance: '100',
        rewards: '10',
        txs: []
      }));
      
      const tx = await sdk.claimRewards({ walletAddress: 'G_CLA', network: 'testnet' });
      expect(tx.status).toBe('success');
      
      const balances = await sdk.getBalances({ walletAddress: 'G_CLA', network: 'testnet' });
      expect(balances.balance).toBe('110');
      expect(balances.rewards).toBe('0');
    });

    it('should get transactions (mocked)', async () => {
      await sdk.deposit({ walletAddress: 'G_TXS', network: 'testnet', amount: '100' });
      const txs = await sdk.getTransactions({ walletAddress: 'G_TXS', network: 'testnet' });
      expect(txs.length).toBeGreaterThan(0);
    });
    
    it('should handle malformed storage gracefully', async () => {
        window.localStorage.setItem('axionvera:vault:testnet:G_MAL', 'invalid-json');
        const balances = await sdk.getBalances({ walletAddress: 'G_MAL', network: 'testnet' });
        expect(balances.balance).toBe('0');
    });
  });
});
