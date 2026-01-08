import { createThirdwebClient } from 'thirdweb';
import { base } from 'thirdweb/chains';

// Client ID от thirdweb (бесплатный)
// Получить на https://thirdweb.com/dashboard
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'demo',
});

// Base chain
export const chain = base;

// USDC на Base
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
