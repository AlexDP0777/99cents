'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { coinbaseWallet, walletConnect } from 'wagmi/connectors';

// Base chain - Coinbase L2, низкие комиссии, поддержка всех бирж
const config = createConfig({
  chains: [base],
  connectors: [
    // Coinbase Wallet - по умолчанию (через email, без seed phrase)
    coinbaseWallet({
      appName: '99 cents',
      preference: 'smartWalletOnly',
    }),
    // WalletConnect - для браузерных кошельков (MetaMask, Trust, и др.)
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo',
      metadata: {
        name: '99 cents',
        description: 'Global micro-donation platform',
        url: 'https://99cents.one',
        icons: ['https://99cents.one/icon.png'],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Экспорт констант для использования в других компонентах
export const CHAIN_ID = base.id;
export const CHAIN_NAME = base.name;
