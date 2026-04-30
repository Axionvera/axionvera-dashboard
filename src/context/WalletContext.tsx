import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  ISupportedWallet,
  FREIGHTER_ID,
  FreighterModule,
  xBullModule,
  AlbedoModule,
} from '@creit-tech/stellar-wallets-kit';

interface WalletState {
  kit: StellarWalletsKit | null;
  publicKey: string | null;
  walletId: string | null; // 'freighter' | 'xbull' | 'albedo'
  status: 'idle' | 'connecting' | 'connected' | 'error';
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    kit: null,
    publicKey: null,
    walletId: null,
    status: 'idle',
    error: null,
  });

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'connecting', error: null }));

    try {
      const kit = new StellarWalletsKit({
        network: WalletNetwork.PUBLIC, // or TESTNET based on env
        modules: [
          new FreighterModule(),
          new xBullModule(),
          new AlbedoModule(),
        ],
      });

      const { address } = await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          await kit.setWallet(option.id);
          return option.id;
        },
        onClosed: () => {
          // If closed without selection, revert to idle
          setState(prev => 
            prev.status === 'connecting' 
              ? { ...prev, status: 'idle' } 
              : prev
          );
        },
      });

      setState({
        kit,
        publicKey: address,
        walletId: kit.selectedWalletId,
        status: 'connected',
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Connection failed',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      kit: null,
      publicKey: null,
      walletId: null,
      status: 'idle',
      error: null,
    });
  }, []);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!state.kit || !state.publicKey) {
      throw new Error('Wallet not connected');
    }

    const { signedTxXdr } = await state.kit.signTransaction(xdr, {
      networkPassphrase: WalletNetwork.PUBLIC,
      address: state.publicKey,
    });

    return signedTxXdr;
  }, [state.kit, state.publicKey]);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};