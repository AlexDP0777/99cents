'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PaymentButton from '@/components/PaymentButton';

interface Category {
  icon: string;
  name: string;
  desc: string;
}

export default function HowItWorksPage() {
  const t = useTranslations('howItWorks');
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tPayment = useTranslations('payment');
  const locale = useLocale();

  // Переводы для PaymentButton
  const paymentTranslations = {
    helpPeople: tPayment('helpPeople'),
    supportProject: tPayment('supportProject'),
    choosePaymentMethod: tPayment('choosePaymentMethod'),
    cryptoPayment: tPayment('cryptoPayment'),
    cryptoPaymentHint: tPayment('cryptoPaymentHint'),
    cardPayment: tPayment('cardPayment'),
    cardComingSoon: tPayment('cardComingSoon'),
    walletConnectTitle: tPayment('walletConnectTitle'),
    walletConnectDescription: tPayment('walletConnectDescription'),
    walletConnectButton: tPayment('walletConnectButton'),
    instructionTitle: tPayment('instructionTitle'),
    instructionCrypto: tPayment('instructionCrypto'),
    instructionCard: tPayment('instructionCard'),
    instructionCoinbase: tPayment('instructionCoinbase'),
    instructionStripe: tPayment('instructionStripe'),
    sendAmount: tPayment('sendAmount'),
    processing: tPayment('processing'),
    switchNetwork: tPayment('switchNetwork'),
    disconnect: tPayment('disconnect'),
    walletConnected: tPayment('walletConnected'),
    confirmPayment: tPayment('confirmPayment'),
    transactionSuccess: tPayment('transactionSuccess'),
    transactionPending: tPayment('transactionPending'),
    insufficientBalance: tPayment('insufficientBalance'),
    back: tPayment('back'),
    enterAmount: tPayment('enterAmount'),
    minAmount: tPayment('minAmount'),
  };

  const steps = t.raw('sections.process.steps') as Array<{ title: string; content: string }>;
  const categories = t.raw('sections.projects.categories') as Category[];
  const reportItems = t.raw('sections.reporting.items') as string[];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link href={`/${locale}`} className="text-2xl font-bold text-[#1e3a5f]">
            99 cents
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-8">{t('title')}</h1>

          <div className="space-y-8 text-gray-600">
            {/* Простой процесс */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-4">
                {t('sections.process.title')}
              </h2>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1e3a5f]">{step.title}</h3>
                      <p>{step.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* Какие проекты поддерживаем */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-2">
                {t('sections.projects.title')}
              </h2>
              <p className="text-gray-500 mb-4">{t('sections.projects.subtitle')}</p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 text-left text-sm font-medium text-gray-500 w-12"></th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500"></th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-2xl">{cat.icon}</td>
                        <td className="p-3 font-medium text-[#1e3a5f]">{cat.name}</td>
                        <td className="p-3 text-gray-600">{cat.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-sm text-gray-500">{t('sections.projects.note')}</p>
            </section>

            <hr className="border-gray-200" />

            {/* Распределение средств */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.distribution.title')}
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span>{t('sections.distribution.toProject')}</span>
                  <span className="font-bold text-[#1e3a5f]">100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-[#1e3a5f] h-4 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-sm mt-4 text-gray-500">
                  {t('sections.distribution.note')}
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* Отчётность */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.reporting.title')}
              </h2>
              <p>{t('sections.reporting.content')}</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                {reportItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* CTA кнопка */}
          <div className="mt-12 text-center bg-gray-50 rounded-2xl p-8">
            <PaymentButton
              mode="donation"
              translations={paymentTranslations}
            />
            <p className="text-gray-500 text-sm mt-3">
              {t('cta.note')}
            </p>
          </div>

          <div className="mt-8">
            <Link href={`/${locale}`} className="text-[#1e3a5f] hover:underline">
              {tNav('back')}
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href={`/${locale}/rules`} className="footer-link">{tFooter('rules')}</Link>
          <span className="text-gray-300">·</span>
          <Link href={`/${locale}/transparency`} className="footer-link">{tFooter('transparency')}</Link>
          <span className="text-gray-300">·</span>
          <span className="text-[#1e3a5f] font-medium">{tFooter('howItWorks')}</span>
        </div>
      </footer>
    </div>
  );
}
