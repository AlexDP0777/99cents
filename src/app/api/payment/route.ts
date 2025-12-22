import { NextResponse } from 'next/server';

interface PaymentRequest {
  walletAddress?: string;
  txHash?: string;
  paymentType: 'USDC' | 'STRIPE';
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
}

// POST /api/payment - регистрация платежа
export async function POST(request: Request) {
  try {
    const body: PaymentRequest = await request.json();

    // Валидация
    if (body.paymentType === 'USDC') {
      if (!body.walletAddress || !body.txHash) {
        return NextResponse.json(
          { error: 'walletAddress and txHash required for USDC payment' },
          { status: 400 }
        );
      }

      // TODO: Проверить транзакцию на блокчейне
      // TODO: Создать участника в БД
      // TODO: Обновить статистику
    }

    // Генерируем уникальный токен для участника
    const participantToken = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      participantToken,
      canVote: true,
      message: 'Платёж успешно обработан',
    });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/payment/verify/:txHash - проверка транзакции
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txHash = searchParams.get('txHash');

  if (!txHash) {
    return NextResponse.json(
      { error: 'txHash required' },
      { status: 400 }
    );
  }

  // TODO: Проверить транзакцию на блокчейне Abstract

  return NextResponse.json({
    verified: true,
    amount: 0.99,
    currency: 'USDC',
  });
}
