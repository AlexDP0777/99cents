import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin99';

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  return authHeader.replace('Bearer ', '') === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ stats: { total: 0 }, byCountry: [], completedPeriods: [], recentApplications: [] });
  }

  const db = prisma;

  try {
    const [total, pending, approved, selected, rejected, winners] = await Promise.all([
      db.application.count(),
      db.application.count({ where: { status: 'PENDING' } }),
      db.application.count({ where: { status: 'APPROVED' } }),
      db.application.count({ where: { status: 'SELECTED' } }),
      db.application.count({ where: { status: 'REJECTED' } }),
      db.application.count({ where: { status: 'WINNER' } }),
    ]);

    const byCountry = await db.application.groupBy({
      by: ['country'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const completedPeriods = await db.votingPeriod.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { endDate: 'desc' },
      take: 5,
      select: { id: true, startDate: true, endDate: true, winnerId: true }
    });

    const periodsWithWinners = await Promise.all(
      completedPeriods.map(async (period) => {
        let winner = null;
        if (period.winnerId) {
          winner = await db.application.findUnique({
            where: { id: period.winnerId },
            select: { id: true, description: true, amount: true, country: true, votesCount: true }
          });
        }
        return { ...period, winner };
      })
    );

    const recentApplications = await db.application.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, description: true, amount: true, country: true, status: true, votesCount: true, createdAt: true }
    });

    const totalVotes = await db.applicationVote.count();

    return NextResponse.json({
      stats: { total, pending, approved, selected, rejected, winners, totalVotes },
      byCountry: byCountry.map(c => ({ country: c.country, count: c._count.id })),
      completedPeriods: periodsWithWinners,
      recentApplications
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
