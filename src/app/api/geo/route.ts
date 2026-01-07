import { NextRequest, NextResponse } from 'next/server';

const countryNames: Record<string, string> = {
  'RU': 'Россия', 'UA': 'Украина', 'US': 'США', 'GB': 'Великобритания',
  'DE': 'Германия', 'FR': 'Франция', 'ES': 'Испания', 'IT': 'Италия',
  'CN': 'Китай', 'JP': 'Япония', 'KR': 'Южная Корея', 'IN': 'Индия',
  'BR': 'Бразилия', 'MX': 'Мексика', 'CA': 'Канада', 'AU': 'Австралия',
  'PL': 'Польша', 'NL': 'Нидерланды', 'BE': 'Бельгия', 'CH': 'Швейцария',
  'AT': 'Австрия', 'SE': 'Швеция', 'NO': 'Норвегия', 'DK': 'Дания',
  'FI': 'Финляндия', 'CZ': 'Чехия', 'PT': 'Португалия', 'GR': 'Греция',
  'TR': 'Турция', 'IL': 'Израиль', 'AE': 'ОАЭ', 'SA': 'Саудовская Аравия',
  'EG': 'Египет', 'ZA': 'ЮАР', 'AR': 'Аргентина', 'CL': 'Чили',
  'CO': 'Колумбия', 'PE': 'Перу', 'VE': 'Венесуэла', 'ID': 'Индонезия',
  'TH': 'Таиланд', 'VN': 'Вьетнам', 'PH': 'Филиппины', 'MY': 'Малайзия',
  'SG': 'Сингапур', 'NZ': 'Новая Зеландия', 'IE': 'Ирландия',
  'KZ': 'Казахстан', 'BY': 'Беларусь', 'UZ': 'Узбекистан', 'GE': 'Грузия',
  'AM': 'Армения', 'AZ': 'Азербайджан', 'MD': 'Молдова',
  'LT': 'Литва', 'LV': 'Латвия', 'EE': 'Эстония',
};

const countryFlags: Record<string, string> = {
  'RU': '🇷🇺', 'UA': '🇺🇦', 'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪',
  'FR': '🇫🇷', 'ES': '🇪🇸', 'IT': '🇮🇹', 'CN': '🇨🇳', 'JP': '🇯🇵',
  'KR': '🇰🇷', 'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽', 'CA': '🇨🇦',
  'AU': '🇦🇺', 'PL': '🇵🇱', 'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭',
  'AT': '🇦🇹', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',
  'CZ': '🇨🇿', 'PT': '🇵🇹', 'GR': '🇬🇷', 'TR': '🇹🇷', 'IL': '🇮🇱',
  'AE': '🇦🇪', 'SA': '🇸🇦', 'EG': '🇪🇬', 'ZA': '🇿🇦', 'AR': '🇦🇷',
  'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪', 'VE': '🇻🇪', 'ID': '🇮🇩',
  'TH': '🇹🇭', 'VN': '🇻🇳', 'PH': '🇵🇭', 'MY': '🇲🇾', 'SG': '🇸🇬',
  'NZ': '🇳🇿', 'IE': '🇮🇪', 'KZ': '🇰🇿', 'BY': '🇧🇾', 'UZ': '🇺🇿',
  'GE': '🇬🇪', 'AM': '🇦🇲', 'AZ': '🇦🇿', 'MD': '🇲🇩', 'LT': '🇱🇹',
  'LV': '🇱🇻', 'EE': '🇪🇪',
};

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '';
}

// Динамическая загрузка geoip-lite (чтобы избежать проблем с bundling)
async function lookupWithGeoipLite(ip: string): Promise<{ country: string; city: string } | null> {
  try {
    // @ts-ignore - dynamic import
    const geoip = await import('geoip-lite');
    const geo = geoip.default?.lookup?.(ip) || geoip.lookup?.(ip);
    if (geo) {
      return { country: geo.country || '', city: geo.city || '' };
    }
  } catch (e) {
    // geoip-lite не доступен в этом окружении
    console.log('geoip-lite not available');
  }
  return null;
}

export async function GET(request: NextRequest) {
  let countryCode = '';
  let city = '';
  let source = '';

  // 1. Пробуем Vercel geo-заголовки (бесплатно на Vercel)
  countryCode = request.headers.get('x-vercel-ip-country') || '';
  city = request.headers.get('x-vercel-ip-city') || '';
  if (countryCode) {
    source = 'vercel';
  }

  const ip = getClientIp(request);
  const isLocalIp = !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.');

  // 2. Fallback на ip-api.com (бесплатный внешний сервис)
  if (!countryCode && !isLocalIp) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3 секунды таймаут

      const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,city`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        countryCode = data.countryCode || '';
        city = data.city || '';
        if (countryCode) {
          source = 'ip-api';
        }
      }
    } catch (e) {
      // ip-api недоступен, переходим к локальной базе
      console.log('ip-api fallback failed, trying geoip-lite');
    }
  }

  // 3. Fallback на geoip-lite (локальная база MaxMind)
  if (!countryCode && !isLocalIp) {
    const geo = await lookupWithGeoipLite(ip);
    if (geo) {
      countryCode = geo.country;
      city = geo.city;
      if (countryCode) {
        source = 'geoip-lite';
      }
    }
  }

  const countryName = countryNames[countryCode] || 'Other';
  const flag = countryFlags[countryCode] || '🌍';

  return NextResponse.json({
    countryCode,
    countryName,
    city: city ? decodeURIComponent(city) : '',
    flag,
    detected: !!countryCode,
    source, // для дебага - откуда взяли данные
  });
}

// Отключаем статическую генерацию для этого API
export const dynamic = 'force-dynamic';
