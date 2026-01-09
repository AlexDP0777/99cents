'use client';

import { ThirdwebProvider } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { base } from 'thirdweb/chains';

// Thirdweb Client ID - получить на https://thirdweb.com/dashboard
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '';

export const thirdwebClient = createThirdwebClient({
  clientId,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}

export const CHAIN = base;
export const CHAIN_ID = base.id;
export const CHAIN_NAME = base.name;
