'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';
import { base } from 'wagmi/chains';

// USDC на Base (6 decimals)
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// TODO: Заменить на реальный адрес кошелька проекта
// Получить адрес из .env: NEXT_PUBLIC_RECIPIENT_ADDRESS
const RECIPIENT_ADDRESS = (process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

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

// Множители для суммы платежа
const AMOUNT_MULTIPLIERS = [
  { value: 1, label: '1×' },
  { value: 5, label: '5×' },
  { value: 10, label: '10×' },
  { value: 25, label: '25×' },
];

const BASE_AMOUNT = 0.99; // $0.99

interface PaymentButtonProps {
  onSuccess?: (txHash: string, votes: number) => void;
  onError?: (error: Error) => void;
  translations: {
    connectWallet: string;
    sendAmount: string;
    processing: string;
    switchNetwork: string;
    votes: string;
    disconnect: string;
    walletConnected: string;
    chooseWallet: string;
    coinbaseWallet: string;
    otherWallets: string;
    confirmPayment: string;
    transactionSuccess: string;
    transactionPending: string;
    insufficientBalance: string;
  };
}

type Step = 'initial' | 'wallet-select' | 'amount-select' | 'confirm' | 'processing' | 'success' | 'error';

export default function PaymentButton({ onSuccess, onError, translations: t }: PaymentButtonProps) {
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
  const totalVotes = multiplier;

  // Найти коннекторы
  const coinbaseConnector = connectors.find(c => c.name.toLowerCase().includes('coinbase'));
  const walletConnectConnector = connectors.find(c => c.name.toLowerCase().includes('walletconnect'));

  // Эффект для отслеживания успешной транзакции
  useEffect(() => {
    if (isConfirmed && hash) {
      setStep('success');
      onSuccess?.(hash, totalVotes);

      // Отправить на сервер для верификации
      fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          txHash: hash,
          amount: totalAmount,
          votes: totalVotes,
          chain: 'base',
        }),
      }).catch(console.error);
    }
  }, [isConfirmed, hash, address, totalAmount, totalVotes, onSuccess]);

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
        args: [RECIPIENT_ADDRESS, amount],
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
            {isWrongNetwork ? t.switchNetwork : isConnected ? `${t.sendAmount} $${BASE_AMOUNT}` : t.connectWallet}
          </button>
        );

      case 'wallet-select':
        return (
          <div className="flex flex-col gap-3 w-full">
            <p className="text-gray-600 text-sm mb-2">{t.chooseWallet}</p>

            {/* Coinbase Smart Wallet - по умолчанию */}
            {coinbaseConnector && (
              <button
                onClick={() => handleConnectWallet(coinbaseConnector)}
                disabled={isConnecting}
                className="btn-primary py-3 px-6 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 4c6.627 0 12 5.373 12 12s-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4zm-2 6a2 2 0 00-2 2v8a2 2 0 002 2h4a2 2 0 002-2v-8a2 2 0 00-2-2h-4z"/>
                </svg>
                {t.coinbaseWallet}
              </button>
            )}

            {/* WalletConnect для продвинутых */}
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
              onClick={resetState}
              className="text-gray-400 text-sm hover:text-gray-600 mt-2"
            >
              ← Back
            </button>
          </div>
        );

      case 'amount-select':
        return (
          <div className="flex flex-col gap-4 w-full">
            {/* Выбор множителя */}
            <div className="grid grid-cols-4 gap-2">
              {AMOUNT_MULTIPLIERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setMultiplier(value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    multiplier === value
                      ? 'bg-[#1e3a5f] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Итого */}
            <div className="text-center py-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#1e3a5f]">
                ${totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                = {totalVotes} {t.votes}
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
              onClick={resetState}
              className="text-gray-400 text-sm hover:text-gray-600"
            >
              ← Back
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
              <div className="text-gray-500">
                {totalVotes} {t.votes}
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
              ← Back
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
            <p className="text-gray-500 text-sm">+{totalVotes} {t.votes}</p>
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
