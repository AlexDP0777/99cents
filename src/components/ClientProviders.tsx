'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Динамический импорт без SSR - Web3 библиотеки используют браузерные API (indexedDB)
const Web3ProviderNoSSR = dynamic(
  () => import('./Web3Provider').then(mod => mod.Web3Provider),
  { ssr: false }
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <Web3ProviderNoSSR>
      {children}
    </Web3ProviderNoSSR>
  );
}
