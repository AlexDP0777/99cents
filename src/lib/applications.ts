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
  } catch (error: unknown) {
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

/**
 * Проверяет, может ли пользователь голосовать сегодня
 */
export async function canVoteToday(visitorHash: string, periodId: string): Promise<boolean> {
  if (!prisma) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const voteToday = await prisma.applicationVote.findFirst({
    where: {
      visitorHash,
      periodId,
      createdAt: { gte: today }
    }
  });

  return !voteToday;
}

/**
 * Голосует за заявку
 */
export async function voteForApplication(
  visitorHash: string,
  applicationId: string,
  periodId: string
): Promise<{ success: boolean; message: string; nextVoteTime?: string }> {
  if (!prisma) {
    return { success: false, message: 'Database not connected' };
  }

  try {
    // Проверяем лимит голосов
    const canVote = await canVoteToday(visitorHash, periodId);
    if (!canVote) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return {
        success: false,
        message: 'Вы уже голосовали сегодня',
        nextVoteTime: tomorrow.toISOString()
      };
    }

    // Проверяем существование заявки
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!application || application.status !== 'SELECTED') {
      return { success: false, message: 'Заявка не найдена или недоступна для голосования' };
    }

    // Создаём голос и увеличиваем счётчик
    await prisma.$transaction([
      prisma.applicationVote.create({
        data: {
          visitorHash,
          applicationId,
          periodId
        }
      }),
      prisma.application.update({
        where: { id: applicationId },
        data: { votesCount: { increment: 1 } }
      })
    ]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      success: true,
      message: 'Голос учтён!',
      nextVoteTime: tomorrow.toISOString()
    };
  } catch (error: unknown) {
    console.error('Vote error:', error);
    // Если ошибка уникальности - значит уже голосовал
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { success: false, message: 'Вы уже голосовали за эту заявку' };
    }
    return { success: false, message: 'Ошибка при голосовании' };
  }
}

/**
 * Получает статус голосования для пользователя
 */
export async function getVotingStatus(visitorHash: string, periodId: string) {
  if (!prisma) {
    return { canVote: true, votedToday: false, todayVotes: [] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayVotes = await prisma.applicationVote.findMany({
    where: {
      visitorHash,
      periodId,
      createdAt: { gte: today }
    },
    select: { applicationId: true }
  });

  return {
    canVote: todayVotes.length === 0,
    votedToday: todayVotes.length > 0,
    todayVotes: todayVotes.map(v => v.applicationId)
  };
}
