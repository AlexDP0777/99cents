import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

// Маппинг страны -> язык
const countryToLocale: Record<string, string> = {
  // Русскоязычные страны
  RU: 'ru', BY: 'ru', KZ: 'ru', UA: 'ru', KG: 'ru', UZ: 'ru', TJ: 'ru', MD: 'ru', AM: 'ru', AZ: 'ru', GE: 'ru',
  // Испаноязычные страны
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es', GT: 'es', CU: 'es',
  BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es',
  // Немецкоязычные страны
  DE: 'de', AT: 'de', CH: 'de', LI: 'de', LU: 'de',
  // Франкоязычные страны
  FR: 'fr', BE: 'fr', CA: 'fr', SN: 'fr', CI: 'fr', ML: 'fr', CM: 'fr', MG: 'fr', NE: 'fr', BF: 'fr',
  // Китайскоязычные
  CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh',
};

// Маппинг Accept-Language -> наш локаль
const languageToLocale: Record<string, string> = {
  ru: 'ru', uk: 'ru', be: 'ru', kk: 'ru',
  es: 'es',
  de: 'de',
  fr: 'fr',
  zh: 'zh',
  en: 'en',
};

function getPreferredLocale(request: NextRequest): string {
  // 1. Проверяем cookie с сохранённым выбором пользователя
  const savedLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (savedLocale && locales.includes(savedLocale as typeof locales[number])) {
    return savedLocale;
  }

  // 2. Пробуем определить по Accept-Language заголовку
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => {
      const [code] = lang.trim().split(';');
      return code.split('-')[0].toLowerCase();
    });

    for (const lang of languages) {
      const mapped = languageToLocale[lang];
      if (mapped && locales.includes(mapped as typeof locales[number])) {
        return mapped;
      }
    }
  }

  // 3. Пробуем определить по Vercel Geo headers (если деплоится на Vercel)
  const country = request.headers.get('x-vercel-ip-country');
  if (country) {
    const mapped = countryToLocale[country];
    if (mapped && locales.includes(mapped as typeof locales[number])) {
      return mapped;
    }
  }

  // 4. По умолчанию - английский
  return defaultLocale;
}

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Пропускаем API routes и статические файлы
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') // файлы со расширениями
  ) {
    return NextResponse.next();
  }

  // Проверяем, есть ли локаль в URL
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Если локали нет в URL - редиректим на предпочтительную
  if (!pathnameHasLocale) {
    const locale = getPreferredLocale(request);
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
