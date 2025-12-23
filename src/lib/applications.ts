import prisma from './prisma';

/**
 * Случайно выбирает N заявок из одобренных (APPROVED)
 */
export async function selectRandomApplications(
  count: number = 5,
  periodId: string
): Promise<{ success: boolean; selected: number; message: string }> {
  if (!prisma) {
    return { success: false, selected: 0, message: 'Database not connected' };
  }

  try {
    const approvedApplications = await prisma.application.findMany({
      where: { status: 'APPROVED' },
      select: { id: true }
    });

    if (approvedApplications.length === 0) {
      return { success: false, selected: 0, message: 'No approved applications' };
    }

    const actualCount = Math.min(count, approvedApplications.length);
    const shuffled = [...approvedApplications];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedIds = shuffled.slice(0, actualCount).map(app => app.id);

    await prisma.application.updateMany({
      where: { id: { in: selectedIds } },
      data: { status: 'SELECTED', periodId }
    });

    return { success: true, selected: actualCount, message: `Selected ${actualCount} applications` };
  } catch (error) {
    console.error('Error selecting applications:', error);
    return { success: false, selected: 0, message: 'Error selecting applications' };
  }
}

/**
 * Получает заявки для голосования
 */
export async function getSelectedApplications(periodId?: string) {
  if (!prisma) return [];

  const where: Record<string, unknown> = { status: 'SELECTED' };
  if (periodId) where.periodId = periodId;

  return prisma.application.findMany({
    where,
    select: { id: true, description: true, amount: true, country: true, votesCount: true, createdAt: true },
    orderBy: { votesCount: 'desc' }
  });
}

/**
 * Получает или создаёт период голосования
 */
export async function getOrCreateVotingPeriod() {
  if (!prisma) throw new Error('Database not connected');

  let period = await prisma.votingPeriod.findFirst({
    where: { status: { in: ['COLLECTING', 'VOTING'] } },
    orderBy: { createdAt: 'desc' }
  });

  if (!period) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    period = await prisma.votingPeriod.create({
      data: { startDate: now, endDate, status: 'COLLECTING' }
    });
  }

  return period;
}

/**
 * Запускает голосование
 */
export async function startVoting(periodId: string) {
  if (!prisma) throw new Error('Database not connected');
  return prisma.votingPeriod.update({
    where: { id: periodId },
    data: { status: 'VOTING' }
  });
}

/**
 * Получает заявки на модерацию
 */
export async function getPendingApplications() {
  if (!prisma) return [];
  return prisma.application.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * Одобряет заявку
 */
export async function approveApplication(id: string) {
  if (!prisma) throw new Error('Database not connected');
  return prisma.application.update({
    where: { id },
    data: { status: 'APPROVED' }
  });
}

/**
 * Отклоняет заявку
 */
export async function rejectApplication(id: string) {
  if (!prisma) throw new Error('Database not connected');
  return prisma.application.update({
    where: { id },
    data: { status: 'REJECTED' }
  });
}
