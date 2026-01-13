import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Маппинг русских названий стран на английские
const russianToEnglish: Record<string, string> = {
  'Россия': 'Russia',
  'США': 'USA',
  'Великобритания': 'United Kingdom',
  'Германия': 'Germany',
  'Франция': 'France',
  'Испания': 'Spain',
  'Италия': 'Italy',
  'Китай': 'China',
  'Япония': 'Japan',
  'Южная Корея': 'South Korea',
  'Индия': 'India',
  'Бразилия': 'Brazil',
  'Мексика': 'Mexico',
  'Канада': 'Canada',
  'Австралия': 'Australia',
  'Украина': 'Ukraine',
  'Польша': 'Poland',
  'Нидерланды': 'Netherlands',
  'Бельгия': 'Belgium',
  'Швейцария': 'Switzerland',
  'Австрия': 'Austria',
  'Швеция': 'Sweden',
  'Норвегия': 'Norway',
  'Дания': 'Denmark',
  'Финляндия': 'Finland',
  'Чехия': 'Czech Republic',
  'Португалия': 'Portugal',
  'Греция': 'Greece',
  'Турция': 'Turkey',
  'Израиль': 'Israel',
  'ОАЭ': 'UAE',
  'Египет': 'Egypt',
  'ЮАР': 'South Africa',
  'Кения': 'Kenya',
  'Аргентина': 'Argentina',
  'Чили': 'Chile',
  'Колумбия': 'Colombia',
  'Перу': 'Peru',
  'Индонезия': 'Indonesia',
  'Таиланд': 'Thailand',
  'Вьетнам': 'Vietnam',
  'Филиппины': 'Philippines',
  'Малайзия': 'Malaysia',
  'Сингапур': 'Singapore',
  'Новая Зеландия': 'New Zealand',
  'Ирландия': 'Ireland',
  'Казахстан': 'Kazakhstan',
  'Беларусь': 'Belarus',
  'Узбекистан': 'Uzbekistan',
  'Грузия': 'Georgia',
  'Армения': 'Armenia',
  'Азербайджан': 'Azerbaijan',
  'Молдова': 'Moldova',
  'Литва': 'Lithuania',
  'Латвия': 'Latvia',
  'Эстония': 'Estonia',
  'Другое': 'Other',
};

// Нормализовать название страны в английское
function normalizeCountry(country: string | null): string {
  if (!country) return '';
  return russianToEnglish[country] || country;
}

// GET /api/participants - получить участников для карты
export async function GET() {
  try {
    // Получаем всех участников с координатами
    const participants = await prisma.participant.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        city: true,
        country: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000, // Лимит для производительности
    });

    return NextResponse.json(participants.map(p => ({
      id: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      city: p.city,
      country: normalizeCountry(p.country),
      date: p.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Participants error:', error);
    return NextResponse.json([]);
  }
}
