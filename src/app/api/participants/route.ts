import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      country: p.country,
      date: p.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Participants error:', error);
    return NextResponse.json([]);
  }
}
