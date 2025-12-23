import { NextRequest, NextResponse } from 'next/server';
import {
  selectRandomApplications,
  getOrCreateVotingPeriod,
  startVoting,
  getPendingApplications,
  approveApplication,
  rejectApplication
} from '@/lib/applications';

// Простая проверка пароля админа
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const password = authHeader.replace('Bearer ', '');
  return password === ADMIN_PASSWORD;
}

/**
 * GET /api/admin/applications
 * Получить все заявки на модерацию
 */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const applications = await getPendingApplications();
    return NextResponse.json({ applications });
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
 * Действия: approve, reject, select, startVoting
 */
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, applicationId, count } = body;

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
        // Получаем или создаём период голосования
        const period = await getOrCreateVotingPeriod();

        // Выбираем случайные заявки
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
