import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createAxionveraVaultSdk, type VaultTx } from '@/utils/contractHelpers';
import { NETWORK } from '@/utils/networkConfig';

const TRANSACTION_HISTORY_QUERY_KEY = 'transactionHistory';

export function useTransactionHistory(walletAddress: string | null) {
    const queryClient = useQueryClient();
    const sdk = createAxionveraVaultSdk();

    const query = useQuery({
        queryKey: [TRANSACTION_HISTORY_QUERY_KEY, walletAddress],
        queryFn: async () => {
            if (!walletAddress) {
                return [];
            }
            return sdk.getTransactions({ walletAddress, network: NETWORK });
        },
        enabled: !!walletAddress,
        staleTime: 30 * 1000, // 30 seconds
    });

    const invalidateTransactionHistory = () => {
        queryClient.invalidateQueries({
            queryKey: [TRANSACTION_HISTORY_QUERY_KEY, walletAddress],
        });
    };

    return {
        ...query,
        invalidate: invalidateTransactionHistory,
    };
}

export function getTransactionHistoryQueryKey(walletAddress: string | null) {
    return [TRANSACTION_HISTORY_QUERY_KEY, walletAddress];
}
