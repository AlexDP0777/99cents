import { NextRequest, NextResponse } from 'next/server';
import {
  selectRandomApplications,
  getOrCreateVotingPeriod,
  startVoting,
  getAllApplications,
  approveApplication,
  rejectApplication,
  getCurrentPeriodInfo,
  endVotingPeriod,
  createNewPeriod
} from '@/lib/applications';

// Простая проверка пароля админа
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin99';

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const password = authHeader.replace('Bearer ', '');
  return password === ADMIN_PASSWORD;
}

/**
 * GET /api/admin/applications
 * Получить заявки и информацию о периоде
 */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const applications = await getAllApplications();
    const periodInfo = await getCurrentPeriodInfo();
    return NextResponse.json({ applications, period: periodInfo });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/applications
 * Действия: approve, reject, select, startVoting, endVoting, newPeriod
 */
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, applicationId, count, durationDays } = body;

    switch (action) {
      case 'approve': {
        if (!applicationId) {
          return NextResponse.json(
            { error: 'applicationId required' },
            { status: 400 }
          );
        }
        const approved = await approveApplication(applicationId);
        return NextResponse.json({ success: true, application: approved });
      }

      case 'reject': {
        if (!applicationId) {
          return NextResponse.json(
            { error: 'applicationId required' },
            { status: 400 }
          );
        }
        const rejected = await rejectApplication(applicationId);
        return NextResponse.json({ success: true, application: rejected });
      }

      case 'select': {
        const period = await getOrCreateVotingPeriod();
        const result = await selectRandomApplications(count || 5, period.id);

        return NextResponse.json({
          success: result.success,
          selected: result.selected,
          message: result.message,
          periodId: period.id
        });
      }

      case 'startVoting': {
        const period = await getOrCreateVotingPeriod();
        const updatedPeriod = await startVoting(period.id);

        return NextResponse.json({
          success: true,
          period: updatedPeriod,
          message: 'Голосование запущено'
        });
      }

      case 'endVoting': {
        const periodInfo = await getCurrentPeriodInfo();
        if (!periodInfo) {
          return NextResponse.json(
            { error: 'Нет активного периода' },
            { status: 400 }
          );
        }
        
        const result = await endVotingPeriod(periodInfo.id);
        return NextResponse.json({
          success: true,
          winner: result.winner,
          message: result.winner 
            ? `Голосование завершено! Победитель: заявка на ${result.winner.amount} USD`
            : 'Голосование завершено, победитель не определён'
        });
      }

      case 'newPeriod': {
        const period = await createNewPeriod(durationDays || 30);
        return NextResponse.json({
          success: true,
          period,
          message: 'Новый период создан'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json(
      { error: 'Action failed' },
      { status: 500 }
    );
  }
}
