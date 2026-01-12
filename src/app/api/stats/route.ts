import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stats - получить глобальную статистику (пересчитывается из реальных данных)
export async function GET() {
  try {
    // Считаем реальную статистику из базы данных
    const [participantsCount, countriesResult, paymentsSum] = await Promise.all([
      // Количество уникальных участников
      prisma.participant.count(),
      // Количество уникальных стран
      prisma.participant.groupBy({
        by: ['country'],
        where: { country: { not: null } }
      }),
      // Сумма всех завершённых платежей
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' }
      })
    ]);

    const totalParticipants = participantsCount;
    const totalCountries = countriesResult.length;
    const totalAmount = paymentsSum._sum.amount || 0;

    // Обновляем кэш статистики для совместимости
    await prisma.stats.upsert({
      where: { id: 'global' },
      update: { totalParticipants, totalCountries, totalAmount },
      create: { id: 'global', totalParticipants, totalCountries, totalAmount }
    });

    return NextResponse.json({
      totalParticipants,
      totalCountries,
      totalAmount,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stats error:', error);
    // В случае ошибки возвращаем нули
    return NextResponse.json({
      totalParticipants: 0,
      totalCountries: 0,
      totalAmount: 0,
      lastUpdated: new Date().toISOString(),
    });
  }
}

// POST /api/stats - обновить статистику (внутренний endpoint, теперь опционален)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Обновляем статистику в базе данных
    const stats = await prisma.stats.upsert({
      where: { id: 'global' },
      update: {
        totalParticipants: body.totalParticipants,
        totalCountries: body.totalCountries,
        totalAmount: body.totalAmount,
      },
      create: {
        id: 'global',
        totalParticipants: body.totalParticipants ?? 0,
        totalCountries: body.totalCountries ?? 0,
        totalAmount: body.totalAmount ?? 0,
      }
    });

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Stats update error:', error);
    return NextResponse.json(
      { error: 'Failed to update stats' },
      { status: 500 }
    );
  }
}
