'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo';

const config = createConfig({
  chains: [base],
  connectors: [
    // Coinbase Smart Wallet - основной для новичков (вход через email)
    // preference: 'all' = Smart Wallet + расширение браузера
    coinbaseWallet({
      appName: '99 cents',
      appLogoUrl: 'https://99cents.one/icon.png',
      preference: 'all',
    }),
    // Браузерные кошельки (MetaMask, Rabby, и др.)
    injected(),
    // WalletConnect для мобильных
    walletConnect({
      projectId,
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

export const CHAIN_ID = base.id;
export const CHAIN_NAME = base.name;
