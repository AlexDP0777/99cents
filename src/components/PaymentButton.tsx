'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';
import { base } from 'wagmi/chains';

// USDC на Base (6 decimals)
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// Адреса кошельков для разных типов платежей
// NEXT_PUBLIC_DONATION_WALLET - для пожертвований на добрые дела
// NEXT_PUBLIC_SUPPORT_WALLET - для поддержки самого проекта (юр.лицо)
const DONATION_WALLET = (process.env.NEXT_PUBLIC_DONATION_WALLET || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const SUPPORT_WALLET = (process.env.NEXT_PUBLIC_SUPPORT_WALLET || '0x0000000000000000000000000000000000000000') as `0x${string}`;

// NOTE: Gas Sponsorship (Paymaster)
// Для бесплатного газа пользователям нужно:
// 1. Зарегистрироваться в Coinbase Developer Platform
// 2. Верифицировать приложение
// 3. Использовать useSendCalls с capabilities.paymasterService
// Подробнее: https://docs.base.org/identity/smart-wallet/guides/paymasters
// Пока газ на Base стоит ~$0.01, это опционально

// Минимальный ABI для ERC20 transfer
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Быстрые множители (подсказки)
const QUICK_MULTIPLIERS = [1, 5, 10, 50, 100];

const BASE_AMOUNT = 0.99; // $0.99

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
    chooseWallet: string;
    coinbaseWallet: string;
    otherWallets: string;
    confirmPayment: string;
    transactionSuccess: string;
    transactionPending: string;
    insufficientBalance: string;
    back: string;
  };
}

type Step = 'initial' | 'payment-method' | 'wallet-select' | 'amount-select' | 'confirm' | 'processing' | 'success' | 'error';

export default function PaymentButton({ onSuccess, onError, mode = 'donation', translations: t }: PaymentButtonProps) {
  const [step, setStep] = useState<Step>('initial');
  const [multiplier, setMultiplier] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const totalAmount = BASE_AMOUNT * multiplier;

  // Выбор кошелька получателя в зависимости от режима
  const recipientWallet = mode === 'donation' ? DONATION_WALLET : SUPPORT_WALLET;

  // Найти коннекторы
  const coinbaseConnector = connectors.find(c => c.name.toLowerCase().includes('coinbase'));
  const walletConnectConnector = connectors.find(c => c.name.toLowerCase().includes('walletconnect'));

  // Эффект для отслеживания успешной транзакции
  useEffect(() => {
    if (isConfirmed && hash) {
      setStep('success');
      onSuccess?.(hash, totalAmount);

      // Отправить на сервер для верификации
      fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          txHash: hash,
          amount: totalAmount,
          multiplier,
          chain: 'base',
        }),
      }).catch(console.error);
    }
  }, [isConfirmed, hash, address, totalAmount, multiplier, onSuccess]);

  // Эффект для отслеживания ошибок
  useEffect(() => {
    if (writeError) {
      setError(writeError.message);
      setStep('error');
      onError?.(writeError);
    }
  }, [writeError, onError]);

  // Проверка сети
  const isWrongNetwork = isConnected && chainId !== base.id;

  const handleInitialClick = () => {
    // Всегда сначала показываем выбор способа оплаты
    setStep('payment-method');
  };

  const handleSelectCrypto = () => {
    if (!isConnected) {
      setStep('wallet-select');
    } else if (isWrongNetwork) {
      switchChain?.({ chainId: base.id });
    } else {
      setStep('amount-select');
    }
  };

  const handleConnectWallet = async (connector: typeof connectors[number]) => {
    try {
      connect({ connector });
      // После подключения переходим к выбору суммы
      setStep('amount-select');
    } catch (err) {
      setError((err as Error).message);
      setStep('error');
    }
  };

  const handleConfirmPayment = async () => {
    setStep('processing');
    setError(null);

    try {
      // USDC имеет 6 decimals
      const amount = parseUnits(totalAmount.toString(), 6);

      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipientWallet, amount],
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
  };

  // Рендер в зависимости от шага
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
            
            {/* Crypto (USDC) */}
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

            {/* Card - Coming Soon */}
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

      case 'wallet-select':
        return (
          <div className="flex flex-col gap-3 w-full">
            <p className="text-gray-600 text-sm mb-2">{t.chooseWallet}</p>

            {/* Простой вход через email - по умолчанию */}
            {coinbaseConnector && (
              <button
                onClick={() => handleConnectWallet(coinbaseConnector)}
                disabled={isConnecting}
                className="btn-primary py-3 px-6 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {t.coinbaseWallet}
              </button>
            )}

            {/* Для тех у кого уже есть кошелек */}
            {walletConnectConnector && (
              <button
                onClick={() => handleConnectWallet(walletConnectConnector)}
                disabled={isConnecting}
                className="btn-secondary py-3 px-6 text-sm"
              >
                {t.otherWallets}
              </button>
            )}

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
            {/* Ввод количества */}
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

            {/* Быстрый выбор */}
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

            {/* Итого */}
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-[#1e3a5f]">
                ${totalAmount.toFixed(2)}
              </div>
            </div>

            {/* Кнопка подтверждения */}
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
            <p className="text-gray-600">
              {isWriting ? t.processing : isConfirming ? t.transactionPending : t.processing}
            </p>
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

      {/* Информация о подключенном кошельке */}
      {isConnected && step !== 'wallet-select' && step !== 'success' && step !== 'error' && (
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          <button
            onClick={() => { disconnect(); resetState(); }}
            className="text-red-400 hover:text-red-600 ml-2"
          >
            {t.disconnect}
          </button>
        </div>
      )}
    </div>
  );
}
