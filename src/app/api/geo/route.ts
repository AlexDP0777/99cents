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

// Локальная база MaxMind через geoip-lite (без лимитов, без внешних запросов)
async function lookupWithGeoipLite(ip: string): Promise<{ country: string; city: string } | null> {
  try {
    const geoip = await import('geoip-lite');
    const lookup = geoip.default?.lookup || geoip.lookup;
    const geo = lookup(ip);
    if (geo) {
      return { country: geo.country || '', city: geo.city || '' };
    }
  } catch (e) {
    console.log('geoip-lite lookup failed:', e);
  }
  return null;
}

export async function GET(request: NextRequest) {
  let countryCode = '';
  let city = '';
  let source = '';

  // 1. Пробуем заголовки от хостинга (nginx, cloudflare и т.п.)
  countryCode = request.headers.get('x-vercel-ip-country')
    || request.headers.get('cf-ipcountry')  // Cloudflare
    || request.headers.get('x-country-code') // Nginx GeoIP
    || '';
  city = request.headers.get('x-vercel-ip-city')
    || request.headers.get('cf-ipcity')
    || '';
  if (countryCode) {
    source = 'headers';
  }

  const ip = getClientIp(request);
  const isLocalIp = !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.');

  // 2. ОСНОВНОЙ: geoip-lite - локальная база MaxMind (без лимитов!)
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

  // 3. Запасной: ip-api.com (только если geoip-lite не сработал)
  // Осторожно: лимит 45 req/min, только некоммерческое использование
  if (!countryCode && !isLocalIp) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

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
      console.log('ip-api fallback failed');
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
    source,
  });
}

export const dynamic = 'force-dynamic';
