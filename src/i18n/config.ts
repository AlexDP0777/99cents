export const locales = ['ru', 'en', 'es', 'de', 'fr', 'zh', 'uk'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  zh: '中文',
  uk: 'Українська',
};

export const defaultLocale: Locale = 'en';
