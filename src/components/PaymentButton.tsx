'use client';

import { useState, useEffect } from 'react';
import { ConnectButton, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { transfer } from 'thirdweb/extensions/erc20';
import { inAppWallet, createWallet } from 'thirdweb/wallets';
import { thirdwebClient, CHAIN } from './Web3Provider';

// USDC на Base (6 decimals)
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Адреса кошельков
const DONATION_WALLET = (process.env.NEXT_PUBLIC_DONATION_WALLET || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const SUPPORT_WALLET = (process.env.NEXT_PUBLIC_SUPPORT_WALLET || '0x0000000000000000000000000000000000000000') as `0x${string}`;

const QUICK_MULTIPLIERS = [1, 5, 10, 50, 100];
const BASE_AMOUNT = 0.99;

// Кошельки для thirdweb
const wallets = [
  // Email/Social login - первый и основной
  inAppWallet({
    auth: {
      options: ['email', 'google', 'apple', 'facebook'],
    },
  }),
  // Браузерные кошельки
  createWallet('io.metamask'),
  createWallet('io.rabby'),
  createWallet('com.coinbase.wallet'),
  // WalletConnect
  createWallet('walletConnect'),
];

// USDC контракт
const usdcContract = getContract({
  client: thirdwebClient,
  chain: CHAIN,
  address: USDC_ADDRESS,
});

interface PaymentButtonProps {
  onSuccess?: (txHash: string, amount: number) => void;
  onError?: (error: Error) => void;
  mode?: 'donation' | 'support';
  freeAmount?: boolean;
  translations: {
    helpPeople: string;
    supportProject: string;
    choosePaymentMethod: string;
    cryptoPayment: string;
    cryptoPaymentHint: string;
    cardPayment: string;
    cardComingSoon: string;
    walletConnectTitle: string;
    walletConnectDescription: string;
    walletConnectButton: string;
    instructionTitle: string;
    instructionCrypto: string;
    instructionCard: string;
    instructionCoinbase: string;
    instructionStripe: string;
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
    submitRequest?: string;
    orJustClose?: string;
    enterAmount?: string;
    minAmount?: string;
  };
}

type Step = 'initial' | 'payment-method' | 'wallet-connect' | 'amount-select' | 'confirm' | 'processing' | 'success' | 'error';

export default function PaymentButton({ onSuccess, onError, mode = 'donation', freeAmount = false, translations: t }: PaymentButtonProps) {
  const [step, setStep] = useState<Step>('initial');
  const [multiplier, setMultiplier] = useState(1);
  const [customAmount, setCustomAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } = useSendTransaction();

  // Сумма для отображения и оплаты
  const displayAmount = freeAmount ? customAmount : BASE_AMOUNT * multiplier;
  // Сумма для оплаты: при freeAmount - customAmount, иначе при 1× отправляем $1.00 (минимум Stripe)
  const paymentAmount = freeAmount ? customAmount : (multiplier === 1 ? 1.00 : BASE_AMOUNT * multiplier);
  const recipientWallet = mode === 'donation' ? DONATION_WALLET : SUPPORT_WALLET;

  // Когда кошелек подключен - переходим к выбору суммы
  useEffect(() => {
    if (account && step === 'wallet-connect') {
      setStep('amount-select');
    }
  }, [account, step]);

  const handleInitialClick = () => {
    setStep('payment-method');
  };

  const handleSelectCrypto = () => {
    if (account) {
      setStep('amount-select');
    } else {
      setStep('wallet-connect');
    }
  };

  const handleConfirmPayment = async () => {
    if (!account) return;

    setStep('processing');
    setError(null);

    try {
      // Используем встроенную функцию transfer из thirdweb
      const transaction = transfer({
        contract: usdcContract,
        to: recipientWallet,
        amount: paymentAmount.toString(),
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          setStep('success');
          onSuccess?.(result.transactionHash, displayAmount);

          // Получаем гео-данные и сохраняем в БД
          fetch('/api/geo')
            .then(res => res.json())
            .then(geo => {
              return fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  walletAddress: account.address,
                  txHash: result.transactionHash,
                  amount: displayAmount,
                  multiplier,
                  chain: 'base',
                  country: geo.countryName,
                  city: geo.city,
                }),
              });
            })
            .catch(console.error);
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
  };

  const renderContent = () => {
    switch (step) {
      case 'initial':
        return (
          <button onClick={handleInitialClick} className="btn-primary text-lg px-12 py-4 w-full">
            {mode === 'donation' ? t.helpPeople : t.supportProject}
          </button>
        );

      case 'payment-method':
        return (
          <div className="flex flex-col gap-3 w-full">
            <p className="text-gray-600 text-sm mb-2 text-center">{t.choosePaymentMethod}</p>

            <div className="flex flex-col gap-1">
              <button onClick={handleSelectCrypto} className="btn-primary py-2 px-4 text-xs">
                {t.cryptoPayment}
              </button>
              <p className="text-gray-400 text-xs text-center">{t.cryptoPaymentHint}</p>
            </div>

            <div className="flex flex-col gap-1">
              <button disabled className="btn-secondary py-3 px-6 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                {t.cardPayment}
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded ml-1">{t.cardComingSoon}</span>
              </button>
            </div>

            <button onClick={resetState} className="text-gray-400 text-sm hover:text-gray-600 mt-2">
              {t.back}
            </button>
          </div>
        );

      case 'wallet-connect':
        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[#1e3a5f] mb-2">{t.walletConnectTitle}</h3>
              <p className="text-gray-600 text-sm">{t.walletConnectDescription}</p>
            </div>

            <ConnectButton
              client={thirdwebClient}
              wallets={wallets}
              chain={CHAIN}
              theme="light"
              connectModal={{
                size: 'wide',
                title: t.walletConnectButton,
                showThirdwebBranding: false,
              }}
              connectButton={{
                label: t.walletConnectButton,
              }}
            />

            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">{t.instructionTitle}</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• {t.instructionCrypto}</li>
                <li>• {t.instructionCard}</li>
                <li>• {t.instructionCoinbase}</li>
                <li>• {t.instructionStripe}</li>
              </ul>
            </div>

            <button onClick={() => setStep('payment-method')} className="text-gray-400 text-sm hover:text-gray-600">
              {t.back}
            </button>
          </div>
        );

      case 'amount-select':
        return (
          <div className="flex flex-col gap-4 w-full">
            {freeAmount ? (
              <>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">{t.enterAmount || 'Введите сумму'}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-[#1e3a5f]">$</span>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-32 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg py-2 focus:border-[#1e3a5f] focus:outline-none"
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{t.minAmount || 'Минимум $1'}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {[5, 10, 25, 50, 100].map((value) => (
                    <button
                      key={value}
                      onClick={() => setCustomAmount(value)}
                      className={`py-1 px-3 rounded-full text-sm transition-colors ${
                        customAmount === value ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ${value}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
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
                        multiplier === value ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {value}×
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-[#1e3a5f]">${displayAmount.toFixed(2)}</div>
            </div>

            <button onClick={() => setStep('confirm')} className="btn-primary py-3">
              {t.confirmPayment}
            </button>

            <button onClick={() => setStep('payment-method')} className="text-gray-400 text-sm hover:text-gray-600">
              {t.back}
            </button>
          </div>
        );

      case 'confirm':
        return (
          <div className="flex flex-col gap-4 w-full text-center">
            <div className="py-4">
              <div className="text-3xl font-bold text-[#1e3a5f] mb-2">${displayAmount.toFixed(2)}</div>
              <div className="text-gray-500 text-sm">{freeAmount ? t.supportProject : `${multiplier} × $0.99`}</div>
            </div>

            <button onClick={handleConfirmPayment} disabled={isSending} className="btn-primary py-4 text-lg">
              {isSending ? t.processing : t.confirmPayment}
            </button>

            <button onClick={() => setStep('amount-select')} className="text-gray-400 text-sm hover:text-gray-600">
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
            <p className="text-gray-500 text-sm">${displayAmount.toFixed(2)}</p>
            {mode === 'donation' && (
              <a href="/apply" className="btn-primary py-2 px-6 text-sm mt-2 text-center">
                {t.submitRequest || 'Submit a request for help'}
              </a>
            )}
            <button onClick={resetState} className="text-gray-400 text-sm hover:text-gray-600 mt-1">
              {t.orJustClose || 'OK'}
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
            <button onClick={resetState} className="btn-secondary py-2 px-6 text-sm mt-2">Попробовать снова</button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      {renderContent()}

      {account && step !== 'wallet-connect' && step !== 'success' && step !== 'error' && (
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>{account.address?.slice(0, 6)}...{account.address?.slice(-4)}</span>
        </div>
      )}
    </div>
  );
}
