'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// WalletConnect Project ID
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo';

// Метаданные приложения
const metadata = {
  name: '99 cents',
  description: 'Global micro-donation platform',
  url: 'https://99cents.one',
  icons: ['https://99cents.one/icon.png'],
};

// Создаем wagmi config через Web3Modal
const config = defaultWagmiConfig({
  chains: [base],
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true, // MetaMask, Rabby и другие браузерные
  enableEIP6963: true,  // Автоопределение кошельков
  enableCoinbase: true, // Coinbase Wallet
});

// Инициализируем Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#1e3a5f',
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
