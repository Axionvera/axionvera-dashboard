import { useWallet } from '@/context/WalletContext';
import { Horizon } from '@stellar/stellar-sdk';

export const useSubmitTransaction = () => {
  const { signTransaction, publicKey } = useWallet();
  const server = new Horizon.Server('https://horizon.stellar.org');

  const submit = async (tx: Transaction) => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    // the app doesn't care which wallet is active — signing is standardized
    const signedXdr = await signTransaction(tx.toXDR());
    
    const response = await server.submitTransaction(
      TransactionBuilder.fromXDR(signedXdr, Networks.PUBLIC)
    );
    
    return response;
  };

  return { submit };
};