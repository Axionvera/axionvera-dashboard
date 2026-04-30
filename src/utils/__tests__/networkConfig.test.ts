import { getEnv } from '../env';

jest.mock('../env', () => ({
  getEnv: jest.fn(),
}));

describe('networkConfig', () => {
  beforeEach(() => {
    jest.resetModules();
    (getEnv as jest.Mock).mockReset();
  });

  it('should use default values for testnet', () => {
    (getEnv as jest.Mock).mockReturnValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nc = require('../networkConfig');
    expect(nc.NETWORK).toBe('testnet');
  });

  it('should use mainnet values when configured', () => {
    (getEnv as jest.Mock).mockImplementation((key) => {
      if (key === 'NEXT_PUBLIC_STELLAR_NETWORK') return 'mainnet';
      return undefined;
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nc = require('../networkConfig');
    expect(nc.NETWORK).toBe('mainnet');
  });

  it('should use futurenet values when configured', () => {
    (getEnv as jest.Mock).mockImplementation((key) => {
      if (key === 'NEXT_PUBLIC_STELLAR_NETWORK') return 'futurenet';
      return undefined;
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nc = require('../networkConfig');
    expect(nc.NETWORK).toBe('futurenet');
  });

  it('should respect custom URLs from env', () => {
    (getEnv as jest.Mock).mockImplementation((key) => {
      if (key === 'NEXT_PUBLIC_SOROBAN_RPC_URL') return 'https://custom-rpc.com';
      return undefined;
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nc = require('../networkConfig');
    expect(nc.SOROBAN_RPC_URL).toBe('https://custom-rpc.com');
  });

  it('should respect custom contract IDs from env', () => {
    (getEnv as jest.Mock).mockImplementation((key) => {
      if (key === 'NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID') return 'VAULT123';
      return undefined;
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nc = require('../networkConfig');
    expect(nc.AXIONVERA_VAULT_CONTRACT_ID).toBe('VAULT123');
  });
});
