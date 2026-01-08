'use client';

import { ThirdwebProvider } from 'thirdweb/react';

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}

// Экспорт констант для использования в других компонентах
export const CHAIN_ID = 8453; // Base
export const CHAIN_NAME = 'Base';
