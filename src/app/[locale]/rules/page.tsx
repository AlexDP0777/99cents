'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PaymentButton from '@/components/PaymentButton';

export default function RulesPage() {
  const t = useTranslations('rules');
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
            {/* Идея проекта */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.idea.title')}
              </h2>
              <div className="whitespace-pre-line">{t('sections.idea.content')}</div>
            </section>

            <hr className="border-gray-200" />

            {/* Как работает проект */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.howItWorks.title')}
              </h2>
              <ol className="list-decimal pl-6 space-y-2">
                {(t.raw('sections.howItWorks.items') as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </section>

            <hr className="border-gray-200" />

            {/* Голосование */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.voting.title')}
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                {(t.raw('sections.voting.items') as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            <hr className="border-gray-200" />

            {/* Что вы получаете */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.whatYouGet.title')}
              </h2>
              <p className="mb-3">{t('sections.whatYouGet.content')}</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                {(t.raw('sections.whatYouGet.items') as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="text-[#1e3a5f] font-medium italic">
                {t('sections.whatYouGet.quote')}
              </p>
            </section>

            <hr className="border-gray-200" />

            {/* Прозрачность */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.transparency.title')}
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                {(t.raw('sections.transparency.items') as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            <hr className="border-gray-200" />

            {/* Законность проектов */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.legality.title')}
              </h2>
              <p>{t('sections.legality.content')}</p>
            </section>

            <hr className="border-gray-200" />

            {/* Запрет на запрещённый контент */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.prohibited.title')}
              </h2>
              <p>{t('sections.prohibited.content')}</p>
            </section>

            <hr className="border-gray-200" />

            {/* Соответствие международным нормам */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.aml.title')}
              </h2>
              <p>{t('sections.aml.content')}</p>
            </section>

            <hr className="border-gray-200" />

            {/* Ответственность */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.responsibility.title')}
              </h2>
              <div className="whitespace-pre-line">{t('sections.responsibility.content')}</div>
            </section>

            <hr className="border-gray-200" />

            {/* Команда проекта */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.team.title')}
              </h2>
              <div className="whitespace-pre-line mb-4">{t('sections.team.content')}</div>
              <p className="text-gray-500 text-sm italic bg-gray-50 p-4 rounded-lg">
                {t('sections.team.note')}
              </p>
            </section>

            <hr className="border-gray-200" />

            {/* Поддержка развития проекта */}
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.supportProject.title')}
              </h2>
              <p className="mb-3">{t('sections.supportProject.content')}</p>
              <p className="font-medium mb-2">{t('sections.supportProject.usedFor')}</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                {(t.raw('sections.supportProject.items') as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="text-gray-500 text-sm mb-3">{t('sections.supportProject.disclaimer')}</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-medium mb-2">{t('sections.supportProject.important')}</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {(t.raw('sections.supportProject.notes') as string[]).map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* CTA кнопка */}
          <div className="mt-12 text-center bg-gray-50 rounded-2xl p-8">
            <PaymentButton
              mode="support"
              freeAmount={true}
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
          <span className="text-[#1e3a5f] font-medium">{tFooter('rules')}</span>
          <span className="text-gray-300">·</span>
          <Link href={`/${locale}/transparency`} className="footer-link">{tFooter('transparency')}</Link>
          <span className="text-gray-300">·</span>
          <Link href={`/${locale}/how-it-works`} className="footer-link">{tFooter('howItWorks')}</Link>
        </div>
      </footer>
    </div>
  );
}
