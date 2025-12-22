import { NextResponse } from 'next/server';

interface VoteRequest {
  participantToken: string;
  projectId: string;
}

// POST /api/vote - проголосовать за проект
export async function POST(request: Request) {
  try {
    const body: VoteRequest = await request.json();

    if (!body.participantToken || !body.projectId) {
      return NextResponse.json(
        { error: 'participantToken and projectId required' },
        { status: 400 }
      );
    }

    // TODO: Проверить, что участник оплатил
    // TODO: Проверить, что участник не голосовал сегодня
    // TODO: Записать голос в БД
    // TODO: Обновить счётчики проекта

    return NextResponse.json({
      success: true,
      message: 'Голос учтён',
      nextVoteAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/vote/status - проверить статус голосования
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const participantToken = searchParams.get('token');

  if (!participantToken) {
    return NextResponse.json(
      { error: 'token required' },
      { status: 400 }
    );
  }

  // TODO: Получить информацию о голосовании участника из БД

  return NextResponse.json({
    canVote: true,
    hasVotedToday: false,
    lastVoteDate: null,
  });
}
