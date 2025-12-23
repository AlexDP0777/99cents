'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const COUNTRIES = [
  'Россия', 'США', 'Великобритания', 'Германия', 'Франция', 'Испания', 'Италия',
  'Китай', 'Япония', 'Южная Корея', 'Индия', 'Бразилия', 'Мексика', 'Канада',
  'Австралия', 'Украина', 'Польша', 'Нидерланды', 'Бельгия', 'Швейцария',
  'Австрия', 'Швеция', 'Норвегия', 'Дания', 'Финляндия', 'Чехия', 'Португалия',
  'Греция', 'Турция', 'Израиль', 'ОАЭ', 'Египет', 'ЮАР', 'Кения',
  'Аргентина', 'Чили', 'Колумбия', 'Перу', 'Индонезия', 'Таиланд',
  'Вьетнам', 'Филиппины', 'Малайзия', 'Сингапур', 'Новая Зеландия', 'Ирландия',
  'Другая'
].sort();

export default function ApplyPage() {
  const t = useTranslations('apply');
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');
  const locale = useLocale();

  const [form, setForm] = useState({
    description: '',
    amount: '',
    country: '',
    contact: '',
    agreedToRules: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [detectedFlag, setDetectedFlag] = useState('');

  // Автоопределение страны по IP
  useEffect(() => {
    fetch('/api/geo')
      .then(res => res.json())
      .then(data => {
        if (data.detected && data.countryName && COUNTRIES.includes(data.countryName)) {
          setForm(f => ({ ...f, country: data.countryName }));
          setDetectedFlag(data.flag);
        }
      })
      .catch(() => {});
  }, []);

  const charCount = form.description.length;
  const isValidLength = charCount >= 200 && charCount <= 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
      } else {
        setErrors(data.errors || [t('errors.generic')]);
      }
    } catch {
      setErrors([t('errors.generic')]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
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

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-4">{t('success.title')}</h1>
            <p className="text-gray-600 mb-8">{t('success.message')}</p>
            <Link href={`/${locale}`} className="btn-primary inline-block px-8 py-3">
              {tNav('back')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">{t('title')}</h1>
          <p className="text-gray-500 mb-8">{t('subtitle')}</p>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <ul className="list-disc pl-5 text-red-600 text-sm">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                {t('form.description.label')} *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('form.description.placeholder')}
                rows={6}
                className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] ${
                  charCount > 0 && !isValidLength ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">{t('form.description.hint')}</span>
                <span className={`text-xs ${
                  charCount === 0 ? 'text-gray-400' :
                  isValidLength ? 'text-green-500' : 'text-red-500'
                }`}>
                  {charCount}/1000
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                {t('form.amount.label')} *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="5000"
                  min="1"
                  max="100000"
                  className="w-full p-4 pl-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>
              <span className="text-xs text-gray-400 mt-1 block">{t('form.amount.hint')}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                {t('form.country.label')} * {detectedFlag && <span className="ml-1">{detectedFlag}</span>}
              </label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] bg-white"
              >
                <option value="">{t('form.country.placeholder')}</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                {t('form.contact.label')} *
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder={t('form.contact.placeholder')}
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
              />
              <span className="text-xs text-gray-400 mt-1 block">{t('form.contact.hint')}</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToRules}
                  onChange={(e) => setForm({ ...form, agreedToRules: e.target.checked })}
                  className="mt-1 w-5 h-5 text-[#1e3a5f] border-gray-300 rounded focus:ring-[#1e3a5f]"
                />
                <span className="text-sm text-gray-600">
                  {t('form.agree.text')}{' '}
                  <Link href={`/${locale}/rules`} className="text-[#1e3a5f] underline">
                    {t('form.agree.link')}
                  </Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!form.agreedToRules || isSubmitting}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                form.agreedToRules && !isSubmitting
                  ? 'bg-[#1e3a5f] text-white hover:bg-[#2d4a6f]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? t('form.submitting') : t('form.submit')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href={`/${locale}`} className="text-[#1e3a5f] hover:underline">
              {tNav('back')}
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href={`/${locale}/rules`} className="footer-link">{tFooter('rules')}</Link>
          <span className="text-gray-300">.</span>
          <Link href={`/${locale}/transparency`} className="footer-link">{tFooter('transparency')}</Link>
          <span className="text-gray-300">.</span>
          <Link href={`/${locale}/how-it-works`} className="footer-link">{tFooter('howItWorks')}</Link>
        </div>
      </footer>
    </div>
  );
}
