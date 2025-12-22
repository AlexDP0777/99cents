'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSendTransaction } from 'wagmi';
import { parseUnits } from 'viem';

// USDC контракт на Abstract
const USDC_ADDRESS = '0x...' as const; // TODO: Реальный адрес USDC на Abstract
const RECIPIENT_ADDRESS = '0x...' as const; // TODO: Кошелёк проекта

interface PaymentButtonProps {
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

export default function PaymentButton({ onSuccess, onError }: PaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { sendTransaction } = useSendTransaction();

  const handlePayment = async () => {
    if (!isConnected) {
      // Подключить кошелёк
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Реализовать отправку USDC через ERC20 transfer
      // Для MVP можно использовать нативный ETH transfer как демо
      
      sendTransaction({
        to: RECIPIENT_ADDRESS,
        value: parseUnits('0.00033', 18), // ~$0.99 в ETH
      }, {
        onSuccess: (hash) => {
          onSuccess?.(hash);
          // Отправить на сервер для верификации
          fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: address,
              txHash: hash,
              paymentType: 'USDC',
            }),
          });
        },
        onError: (error) => {
          onError?.(error);
        },
      });
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="btn-primary text-lg px-12 py-4"
      >
        {isProcessing
          ? 'Обработка...'
          : isConnected
          ? 'Отправить 99 центов'
          : 'Подключить кошелёк'}
      </button>

      {isConnected && (
        <div className="text-sm text-gray-400">
          <span>Кошелёк: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
          <button
            onClick={() => disconnect()}
            className="ml-4 text-red-400 hover:text-red-600"
          >
            Отключить
          </button>
        </div>
      )}
    </div>
  );
}
