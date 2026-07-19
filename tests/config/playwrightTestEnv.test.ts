import { applyEnvDefaults, parseEnvContent } from '../e2e/helpers/testEnv';

describe('Playwright test environment helpers', () => {
  it('parses dotenv content used by the E2E test environment', () => {
    const parsed = parseEnvContent(`
# comment
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID=test=vault

NEXT_PUBLIC_EMPTY=
`);

    expect(parsed).toEqual({
      NEXT_PUBLIC_STELLAR_NETWORK: 'testnet',
      NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID: 'test=vault',
      NEXT_PUBLIC_EMPTY: '',
    });
  });

  it('applies test env defaults without overwriting existing values', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'test',
      NEXT_PUBLIC_STELLAR_NETWORK: 'mainnet',
    };

    applyEnvDefaults(env, {
      NEXT_PUBLIC_STELLAR_NETWORK: 'testnet',
      NEXT_PUBLIC_SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
    });

    expect(env).toEqual({
      NODE_ENV: 'test',
      NEXT_PUBLIC_STELLAR_NETWORK: 'mainnet',
      NEXT_PUBLIC_SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
    });
  });
});
