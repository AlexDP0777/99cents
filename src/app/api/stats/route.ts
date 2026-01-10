import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stats - получить глобальную статистику
export async function GET() {
  try {
    // Получаем или создаём запись статистики
    let stats = await prisma.stats.findUnique({
      where: { id: 'global' }
    });

    if (!stats) {
      // Создаём начальную запись с нулями
      stats = await prisma.stats.create({
        data: {
          id: 'global',
          totalParticipants: 0,
          totalCountries: 0,
          totalAmount: 0,
        }
      });
    }

    return NextResponse.json({
      totalParticipants: stats.totalParticipants,
      totalCountries: stats.totalCountries,
      totalAmount: stats.totalAmount,
      lastUpdated: stats.updatedAt.toISOString(),
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

// POST /api/stats - обновить статистику (внутренний endpoint)
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
