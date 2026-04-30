import React from 'react';
import { useWallet } from '@/context/WalletContext';

export const ConnectWalletButton: React.FC = () => {
  const { status, publicKey, walletId, connect, disconnect, error } = useWallet();

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (status === 'connected' && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 capitalize">
          {walletId}
        </span>
        <button 
          onClick={disconnect}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
        >
          {formatAddress(publicKey)}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={connect}
        disabled={status === 'connecting'}
        className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && (
        <span className="text-red-400 text-sm ml-2">{error}</span>
      )}
    </>
  );
};