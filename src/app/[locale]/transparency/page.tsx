'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TransparencyPage() {
  const t = useTranslations('transparency');
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');
  const locale = useLocale();

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

          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.full.title')}
              </h2>
              <p>{t('sections.full.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.publish.title')}
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                {(t.raw('sections.publish.items') as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.blockchain.title')}
              </h2>
              <p className="mb-4">{t('sections.blockchain.content')}</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-mono text-gray-500">
                  {t('sections.blockchain.wallet')}<br />
                  <span className="text-[#1e3a5f]">0x... {t('sections.blockchain.walletNote')}</span>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.reports.title')}
              </h2>
              <p>{t('sections.reports.content')}</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                {(t.raw('sections.reports.items') as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">
                {t('sections.fees.title')}
              </h2>
              <p>{t('sections.fees.content')}</p>
            </section>
          </div>

          <div className="mt-12">
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
          <span className="text-[#1e3a5f] font-medium">{tFooter('transparency')}</span>
          <span className="text-gray-300">·</span>
          <Link href={`/${locale}/how-it-works`} className="footer-link">{tFooter('howItWorks')}</Link>
        </div>
      </footer>
    </div>
  );
}
