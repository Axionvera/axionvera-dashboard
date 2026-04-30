const fs = require('fs');
const orig = fs.readFileSync('original_contractHelpers_utf8.ts', 'utf8');

let newFile = orig.replace(
  /export type AxionveraVaultSdk = {[\s\S]*?};/,
  `export type TransactionSimulation = {
  cpuInstructions: number;
  ramBytes: number;
  ledgerEntries: number;
  maxFee: string;
  estimatedFee: string;
};

export type AxionveraVaultSdk = {
  getBalances: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultBalances>;
  getTransactions: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultTx[]>;
  deposit: (args: { walletAddress: string; network: StellarNetwork; amount: string }, options?: ApiCallOptions) => Promise<VaultTx>;
  withdraw: (args: { walletAddress: string; network: StellarNetwork; amount: string }, options?: ApiCallOptions) => Promise<VaultTx>;
  claimRewards: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultTx>;
  simulateTransaction: (args: { walletAddress: string; network: StellarNetwork; type: VaultTxType; amount?: string }, options?: ApiCallOptions) => Promise<TransactionSimulation>;
};`
);

newFile = newFile.replace(
  /      saveVault\(walletAddress, network, next\);\n      return completed;\n    }\n  };/,
  `      saveVault(walletAddress, network, next);
      return completed;
    },
    async simulateTransaction({ walletAddress, network, type, amount }: { walletAddress: string; network: StellarNetwork; type: VaultTxType; amount?: string }) {
      await sleep(300); // Simulate network delay
      return {
        cpuInstructions: Math.floor(Math.random() * 50000) + 100000,
        ramBytes: Math.floor(Math.random() * 2000) + 4000,
        ledgerEntries: Math.floor(Math.random() * 5) + 2,
        maxFee: "0.005",
        estimatedFee: "0.001"
      };
    }
  };`
);

newFile = newFile.replace(
  /    claimRewards: withErrorHandling\(\n      withApiResilience\(baseSdk\.claimRewards, { timeout: 10000, retries: 1 }\),\n      'claimRewards'\n    \)\n  };\n}/,
  `    claimRewards: withErrorHandling(
      withApiResilience(baseSdk.claimRewards, { timeout: 10000, retries: 1 }),
      'claimRewards'
    ),
    simulateTransaction: withErrorHandling(
      withApiResilience(baseSdk.simulateTransaction, { timeout: 10000, retries: 1 }),
      'simulateTransaction'
    )
  };
}`
);

fs.writeFileSync('src/utils/contractHelpers.ts', newFile, 'utf8');
console.log('Done restoring contractHelpers.');
