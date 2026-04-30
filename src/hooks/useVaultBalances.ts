import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createAxionveraVaultSdk, type VaultBalances } from '@/utils/contractHelpers';
import { NETWORK } from '@/utils/networkConfig';

const VAULT_BALANCES_QUERY_KEY = 'vaultBalances';

export function useVaultBalances(walletAddress: string | null) {
    const queryClient = useQueryClient();
    const sdk = createAxionveraVaultSdk();

    const query = useQuery({
        queryKey: [VAULT_BALANCES_QUERY_KEY, walletAddress],
        queryFn: async () => {
            if (!walletAddress) {
                return { balance: '0', rewards: '0' };
            }
            return sdk.getBalances({ walletAddress, network: NETWORK });
        },
        enabled: !!walletAddress,
        staleTime: 30 * 1000, // 30 seconds
    });

    const invalidateVaultBalances = () => {
        queryClient.invalidateQueries({
            queryKey: [VAULT_BALANCES_QUERY_KEY, walletAddress],
        });
    };

    return {
        ...query,
        invalidate: invalidateVaultBalances,
    };
}

export function getVaultBalancesQueryKey(walletAddress: string | null) {
    return [VAULT_BALANCES_QUERY_KEY, walletAddress];
}
