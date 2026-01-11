import { NextRequest, NextResponse } from 'next/server';

const countryNames: Record<string, string> = {
  'RU': 'Russia', 'UA': 'Ukraine', 'US': 'USA', 'GB': 'United Kingdom',
  'DE': 'Germany', 'FR': 'France', 'ES': 'Spain', 'IT': 'Italy',
  'CN': 'China', 'JP': 'Japan', 'KR': 'South Korea', 'IN': 'India',
  'BR': 'Brazil', 'MX': 'Mexico', 'CA': 'Canada', 'AU': 'Australia',
  'PL': 'Poland', 'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland',
  'AT': 'Austria', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark',
  'FI': 'Finland', 'CZ': 'Czech Republic', 'PT': 'Portugal', 'GR': 'Greece',
  'TR': 'Turkey', 'IL': 'Israel', 'AE': 'UAE', 'SA': 'Saudi Arabia',
  'EG': 'Egypt', 'ZA': 'South Africa', 'AR': 'Argentina', 'CL': 'Chile',
  'CO': 'Colombia', 'PE': 'Peru', 'VE': 'Venezuela', 'ID': 'Indonesia',
  'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines', 'MY': 'Malaysia',
  'SG': 'Singapore', 'NZ': 'New Zealand', 'IE': 'Ireland',
  'KZ': 'Kazakhstan', 'BY': 'Belarus', 'UZ': 'Uzbekistan', 'GE': 'Georgia',
  'AM': 'Armenia', 'AZ': 'Azerbaijan', 'MD': 'Moldova',
  'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia',
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
