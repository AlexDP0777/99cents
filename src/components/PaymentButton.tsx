'use client';

import { useState, useEffect } from 'react';
import { ConnectButton, useActiveAccount, useActiveWallet, useDisconnect, useSendTransaction } from 'thirdweb/react';
import { prepareContractCall, getContract, toUnits } from 'thirdweb';
import { base } from 'thirdweb/chains';
import { client } from '@/lib/thirdweb';

// USDC на Base (6 decimals)
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Адреса кошельков для разных типов платежей
const DONATION_WALLET = process.env.NEXT_PUBLIC_DONATION_WALLET || '0x0000000000000000000000000000000000000000';
const SUPPORT_WALLET = process.env.NEXT_PUBLIC_SUPPORT_WALLET || '0x0000000000000000000000000000000000000000';

// Быстрые множители
const QUICK_MULTIPLIERS = [1, 5, 10, 50, 100];
const BASE_AMOUNT = 0.99;

// USDC контракт
const usdcContract = getContract({
  client,
  chain: base,
  address: USDC_ADDRESS,
});

interface PaymentButtonProps {
  onSuccess?: (txHash: string, amount: number) => void;
  onError?: (error: Error) => void;
  mode?: 'donation' | 'support';
  translations: {
    helpPeople: string;
    supportProject: string;
    choosePaymentMethod: string;
    cryptoPayment: string;
    cardPayment: string;
    cardComingSoon: string;
    sendAmount: string;
    processing: string;
    switchNetwork: string;
    disconnect: string;
    walletConnected: string;
    confirmPayment: string;
    transactionSuccess: string;
    transactionPending: string;
    insufficientBalance: string;
    back: string;
  };
}

type Step = 'initial' | 'payment-method' | 'connect-wallet' | 'amount-select' | 'confirm' | 'processing' | 'success' | 'error';

export default function PaymentButton({ onSuccess, onError, mode = 'donation', translations: t }: PaymentButtonProps) {
  const [step, setStep] = useState<Step>('initial');
  const [multiplier, setMultiplier] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { mutate: sendTransaction, isPending: isSending } = useSendTransaction();

  const isConnected = !!account;
  const totalAmount = BASE_AMOUNT * multiplier;
  const recipientWallet = mode === 'donation' ? DONATION_WALLET : SUPPORT_WALLET;

  // После подключения кошелька переходим к выбору суммы
  useEffect(() => {
    if (isConnected && step === 'connect-wallet') {
      setStep('amount-select');
    }
  }, [isConnected, step]);

  const handleInitialClick = () => {
    setStep('payment-method');
  };

  const handleSelectCrypto = () => {
    if (!isConnected) {
      setStep('connect-wallet');
    } else {
      setStep('amount-select');
    }
  };

  const handleConfirmPayment = async () => {
    if (!account) return;

    setStep('processing');
    setError(null);

    try {
      // USDC имеет 6 decimals
      const amount = toUnits(totalAmount.toString(), 6);

      const transaction = prepareContractCall({
        contract: usdcContract,
        method: 'function transfer(address to, uint256 amount) returns (bool)',
        params: [recipientWallet as `0x${string}`, amount],
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          setTxHash(result.transactionHash);
          setStep('success');
          onSuccess?.(result.transactionHash, totalAmount);

          // Отправить на сервер
          fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: account.address,
              txHash: result.transactionHash,
              amount: totalAmount,
              multiplier,
              chain: 'base',
            }),
          }).catch(console.error);
        },
        onError: (err) => {
          setError(err.message);
          setStep('error');
          onError?.(err);
        },
      });
    } catch (err) {
      setError((err as Error).message);
      setStep('error');
      onError?.(err as Error);
    }
  };

  const resetState = () => {
    setStep('initial');
    setMultiplier(1);
    setError(null);
    setTxHash(null);
  };

  const renderContent = () => {
    switch (step) {
      case 'initial':
        return (
          <button
            onClick={handleInitialClick}
            className="btn-primary text-lg px-12 py-4 w-full"
          >
            {mode === 'donation' ? t.helpPeople : t.supportProject}
          </button>
        );

      case 'payment-method':
        return (
          <div className="flex flex-col gap-3 w-full">
            <p className="text-gray-600 text-sm mb-2 text-center">{t.choosePaymentMethod}</p>

            <button
              onClick={handleSelectCrypto}
              className="btn-primary py-3 px-6 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v12M6 12h12" />
              </svg>
              {t.cryptoPayment}
            </button>

            <button
              disabled
              className="btn-secondary py-3 px-6 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              {t.cardPayment}
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded ml-1">{t.cardComingSoon}</span>
            </button>

            <button
              onClick={resetState}
              className="text-gray-400 text-sm hover:text-gray-600 mt-2"
            >
              {t.back}
            </button>
          </div>
        );

      case 'connect-wallet':
        return (
          <div className="flex flex-col gap-3 w-full items-center">
            <p className="text-gray-600 text-sm mb-2">{t.choosePaymentMethod}</p>

            <ConnectButton
              client={client}
              chain={base}
              theme="light"
              connectModal={{
                size: 'wide',
                showThirdwebBranding: false,
              }}
              appMetadata={{
                name: '99 cents',
                url: 'https://99cents.one',
              }}
            />

            <button
              onClick={() => setStep('payment-method')}
              className="text-gray-400 text-sm hover:text-gray-600 mt-2"
            >
              {t.back}
            </button>
          </div>
        );

      case 'amount-select':
        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-500">$0.99 ×</span>
              <input
                type="number"
                min="1"
                max="10000"
                value={multiplier}
                onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center text-xl font-bold border-2 border-gray-200 rounded-lg py-2 focus:border-[#1e3a5f] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_MULTIPLIERS.map((value) => (
                <button
                  key={value}
                  onClick={() => setMultiplier(value)}
                  className={`py-1 px-3 rounded-full text-sm transition-colors ${
                    multiplier === value
                      ? 'bg-[#1e3a5f] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {value}×
                </button>
              ))}
            </div>

            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-[#1e3a5f]">
                ${totalAmount.toFixed(2)}
              </div>
            </div>

            <button
              onClick={() => setStep('confirm')}
              className="btn-primary py-3"
            >
              {t.confirmPayment}
            </button>

            <button
              onClick={() => setStep('payment-method')}
              className="text-gray-400 text-sm hover:text-gray-600"
            >
              {t.back}
            </button>
          </div>
        );

      case 'confirm':
        return (
          <div className="flex flex-col gap-4 w-full text-center">
            <div className="py-4">
              <div className="text-3xl font-bold text-[#1e3a5f] mb-2">
                ${totalAmount.toFixed(2)}
              </div>
              <div className="text-gray-500 text-sm">
                {multiplier} × $0.99
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isSending}
              className="btn-primary py-4 text-lg"
            >
              {t.confirmPayment}
            </button>

            <button
              onClick={() => setStep('amount-select')}
              className="text-gray-400 text-sm hover:text-gray-600"
            >
              {t.back}
            </button>
          </div>
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e3a5f] border-t-transparent"></div>
            <p className="text-gray-600">{t.processing}</p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">{t.transactionSuccess}</p>
            <p className="text-gray-500 text-sm">${totalAmount.toFixed(2)}</p>
            <button
              onClick={resetState}
              className="btn-secondary py-2 px-6 text-sm mt-2"
            >
              OK
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 text-sm text-center max-w-xs">
              {error?.includes('insufficient') ? t.insufficientBalance : error}
            </p>
            <button
              onClick={resetState}
              className="btn-secondary py-2 px-6 text-sm mt-2"
            >
              Try again
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      {renderContent()}

      {isConnected && step !== 'connect-wallet' && step !== 'success' && step !== 'error' && (
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>{account?.address?.slice(0, 6)}...{account?.address?.slice(-4)}</span>
          <button
            onClick={() => { if (wallet) disconnect(wallet); resetState(); }}
            className="text-red-400 hover:text-red-600 ml-2"
          >
            {t.disconnect}
          </button>
        </div>
      )}
    </div>
  );
}
