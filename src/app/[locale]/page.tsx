'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const ParticipantsMap = dynamic(() => import('@/components/ParticipantsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Loading...</span>
    </div>
  ),
});

interface Stats {
  totalParticipants: number;
  totalCountries: number;
  totalAmount: number;
}

export default function Home() {
  const t = useTranslations('home');
  const tFooter = useTranslations('footer');
  const locale = useLocale();

  const [stats] = useState<Stats>({
    totalParticipants: 999,
    totalCountries: 47,
    totalAmount: 989.01,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const handlePayment = async () => {
    setIsConnecting(true);
    setTimeout(() => setIsConnecting(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center px-4 py-12 md:py-20">
        {/* Logo & Title */}
        <div className="text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-4">
            <span className="font-black">{t('title')}</span>{' '}
            <span className="font-normal">{t('subtitle1')}</span>
            <br />
            <span className="font-normal">{t('subtitle2')}</span>
          </h1>

          <p className="text-gray-500 text-lg mt-6">
            {t('tagline')}
          </p>
        </div>

        {/* Call to Action Block */}
        <div className="mt-12 text-center max-w-xl bg-gray-50 rounded-2xl p-8">
          <p className="text-[#1e3a5f] text-lg mb-6">
            {t('cta.description')}
            <br />
            <span className="font-medium">{t('cta.meaning')}</span>
          </p>

          <button
            onClick={handlePayment}
            disabled={isConnecting}
            className="btn-primary text-lg px-12 py-4"
          >
            {isConnecting ? t('cta.connecting') : t('cta.button')}
          </button>

          <p className="text-gray-400 text-sm mt-4">
            {t('cta.note')}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12">
          <div className="text-center">
            <div className="stat-number">{stats.totalParticipants.toLocaleString()}</div>
            <div className="stat-label">{t('stats.people')}</div>
          </div>
          <div className="text-center">
            <div className="stat-number">{stats.totalCountries}</div>
            <div className="stat-label">{t('stats.countries')}</div>
          </div>
          <div className="text-center">
            <div className="stat-number">${stats.totalAmount.toLocaleString()}</div>
            <div className="stat-label">{t('stats.collected')}</div>
          </div>
        </div>

        {/* Map */}
        <div className="w-full max-w-5xl mt-12">
          <ParticipantsMap />
          <p className="text-center text-gray-400 text-sm mt-4">
            {t('map.caption')}
          </p>
        </div>

        {/* Link to Voting */}
        <div className="mt-12">
          <Link
            href={`/${locale}/voting`}
            className="text-[#1e3a5f] hover:underline font-medium"
          >
            {t('voting')}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href={`/${locale}/rules`} className="footer-link">{tFooter('rules')}</Link>
          <span className="text-gray-300">·</span>
          <Link href={`/${locale}/transparency`} className="footer-link">{tFooter('transparency')}</Link>
          <span className="text-gray-300">·</span>
          <Link href={`/${locale}/how-it-works`} className="footer-link">{tFooter('howItWorks')}</Link>
        </div>
      </footer>
    </div>
  );
}
