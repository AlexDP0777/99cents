import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PaymentRequest {
  walletAddress: string;
  txHash: string;
  amount: number;
  multiplier?: number;
  chain: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
}

// Координаты стран (центр/столица) для карты
const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  'Россия': { lat: 55.7558, lng: 37.6173 },
  'США': { lat: 40.7128, lng: -74.006 },
  'Великобритания': { lat: 51.5074, lng: -0.1278 },
  'Германия': { lat: 52.52, lng: 13.405 },
  'Франция': { lat: 48.8566, lng: 2.3522 },
  'Испания': { lat: 40.4168, lng: -3.7038 },
  'Италия': { lat: 41.9028, lng: 12.4964 },
  'Китай': { lat: 39.9042, lng: 116.4074 },
  'Япония': { lat: 35.6762, lng: 139.6503 },
  'Южная Корея': { lat: 37.5665, lng: 126.978 },
  'Индия': { lat: 19.076, lng: 72.8777 },
  'Бразилия': { lat: -23.5505, lng: -46.6333 },
  'Канада': { lat: 43.6532, lng: -79.3832 },
  'Австралия': { lat: -33.8688, lng: 151.2093 },
  'Украина': { lat: 50.4501, lng: 30.5234 },
  'Польша': { lat: 52.2297, lng: 21.0122 },
  'Нидерланды': { lat: 52.3676, lng: 4.9041 },
  'Турция': { lat: 41.0082, lng: 28.9784 },
  'ОАЭ': { lat: 25.2048, lng: 55.2708 },
  'Израиль': { lat: 32.0853, lng: 34.7818 },
  'Мексика': { lat: 19.4326, lng: -99.1332 },
  'Аргентина': { lat: -34.6037, lng: -58.3816 },
  'ЮАР': { lat: -33.9249, lng: 18.4241 },
  'Сингапур': { lat: 1.3521, lng: 103.8198 },
  'Таиланд': { lat: 13.7563, lng: 100.5018 },
  'Other': { lat: 20, lng: 0 },
};

// Добавляем случайное смещение чтобы точки не накладывались
const addOffset = (coord: number) => coord + (Math.random() - 0.5) * 0.5;

// POST /api/payment - регистрация платежа
export async function POST(request: Request) {
  try {
    const body: PaymentRequest = await request.json();

    // Валидация
    if (!body.walletAddress || !body.txHash) {
      return NextResponse.json(
        { error: 'walletAddress and txHash required' },
        { status: 400 }
      );
    }

    // Проверяем, не был ли уже обработан этот txHash
    const existingPayment = await prisma.payment.findUnique({
      where: { txHash: body.txHash }
    });

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: 'Платёж уже зарегистрирован',
        participantId: existingPayment.participantId,
      });
    }

    // Находим или создаём участника
    let participant = await prisma.participant.findUnique({
      where: { walletAddress: body.walletAddress }
    });

    const isNewParticipant = !participant;
    const isNewCountry = body.country && !await prisma.participant.findFirst({
      where: { country: body.country }
    });

    // Получаем координаты по стране если не переданы
    let latitude = body.latitude;
    let longitude = body.longitude;
    if (!latitude || !longitude) {
      const coords = countryCoordinates[body.country || 'Other'] || countryCoordinates['Other'];
      latitude = addOffset(coords.lat);
      longitude = addOffset(coords.lng);
    }

    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          walletAddress: body.walletAddress,
          country: body.country,
          city: body.city,
          latitude,
          longitude,
          canVote: true,
        }
      });
    } else {
      // Обновляем геоданные если они нужны
      if (!participant.latitude || !participant.longitude) {
        await prisma.participant.update({
          where: { id: participant.id },
          data: {
            latitude,
            longitude,
            country: body.country || participant.country,
            city: body.city || participant.city,
            canVote: true,
          }
        });
      }
    }

    // Создаём запись о платеже
    await prisma.payment.create({
      data: {
        participantId: participant.id,
        amount: body.amount,
        paymentType: 'USDC',
        txHash: body.txHash,
        chain: body.chain,
        status: 'completed',
      }
    });

    // Обновляем статистику
    const statsUpdate: { totalAmount: { increment: number }, totalParticipants?: { increment: number }, totalCountries?: { increment: number } } = {
      totalAmount: { increment: body.amount }
    };

    if (isNewParticipant) {
      statsUpdate.totalParticipants = { increment: 1 };
    }

    if (isNewCountry) {
      statsUpdate.totalCountries = { increment: 1 };
    }

    await prisma.stats.upsert({
      where: { id: 'global' },
      update: statsUpdate,
      create: {
        id: 'global',
        totalParticipants: isNewParticipant ? 1 : 0,
        totalCountries: isNewCountry ? 1 : 0,
        totalAmount: body.amount,
      }
    });

    return NextResponse.json({
      success: true,
      participantId: participant.id,
      canVote: true,
      message: 'Платёж успешно зарегистрирован',
    });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/payment/verify/:txHash - проверка транзакции
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txHash = searchParams.get('txHash');

  if (!txHash) {
    return NextResponse.json(
      { error: 'txHash required' },
      { status: 400 }
    );
  }

  // Проверяем в базе
  const payment = await prisma.payment.findUnique({
    where: { txHash }
  });

  if (payment) {
    return NextResponse.json({
      verified: true,
      amount: payment.amount,
      currency: 'USDC',
    });
  }

  return NextResponse.json({
    verified: false,
  });
}
