import { NextRequest, NextResponse } from 'next/server';
import { voteForApplication, getVotingStatus, getOrCreateVotingPeriod } from '@/lib/applications';

interface VoteRequest {
  visitorHash: string;
  applicationId: string;
}

// POST /api/vote - проголосовать за заявку
export async function POST(request: NextRequest) {
  try {
    const body: VoteRequest = await request.json();

    if (!body.visitorHash || !body.applicationId) {
      return NextResponse.json(
        { success: false, error: 'visitorHash and applicationId required' },
        { status: 400 }
      );
    }

    // Получаем активный период голосования
    let periodId: string;
    try {
      const period = await getOrCreateVotingPeriod();
      periodId = period.id;
    } catch {
      periodId = 'mock-period';
    }

    const result = await voteForApplication(body.visitorHash, body.applicationId, periodId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/vote?hash=xxx - проверить статус голосования
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const visitorHash = searchParams.get('hash');

  if (!visitorHash) {
    return NextResponse.json(
      { error: 'hash parameter required' },
      { status: 400 }
    );
  }

  try {
    let periodId: string;
    try {
      const period = await getOrCreateVotingPeriod();
      periodId = period.id;
    } catch {
      periodId = 'mock-period';
    }

    const status = await getVotingStatus(visitorHash, periodId);
    return NextResponse.json(status);
  } catch (error) {
    console.error('Vote status error:', error);
    return NextResponse.json({
      canVote: true,
      votedToday: false,
      todayVotes: []
    });
  }
}
