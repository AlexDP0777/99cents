import { NextResponse } from 'next/server';

// GET /api/stats - получить глобальную статистику
export async function GET() {
  // TODO: Получить из базы данных
  const stats = {
    totalParticipants: 999,
    totalCountries: 47,
    totalAmount: 989.01,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(stats);
}

// POST /api/stats - обновить статистику (внутренний endpoint)
export async function POST(request: Request) {
  const body = await request.json();
  
  // TODO: Обновить статистику в базе данных
  
  return NextResponse.json({ success: true });
}
