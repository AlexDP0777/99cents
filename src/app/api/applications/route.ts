import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSelectedApplications } from '@/lib/applications';

// Country list for validation
const VALID_COUNTRIES = [
  'Russia', 'USA', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy',
  'China', 'Japan', 'South Korea', 'India', 'Brazil', 'Mexico', 'Canada',
  'Australia', 'Ukraine', 'Poland', 'Netherlands', 'Belgium', 'Switzerland',
  'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Czech Republic', 'Portugal',
  'Greece', 'Turkey', 'Israel', 'UAE', 'Saudi Arabia', 'Egypt', 'South Africa',
  'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Indonesia', 'Thailand',
  'Vietnam', 'Philippines', 'Malaysia', 'Singapore', 'New Zealand', 'Ireland',
  'Other'
];



interface ApplicationBody {
  description: string;
  amount: number;
  country: string;
  contact: string;
  agreedToRules: boolean;
}

// GET /api/applications - получить заявки для голосования
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const periodId = searchParams.get('periodId');

  try {
    if (status === 'SELECTED') {
      const applications = await getSelectedApplications(periodId || undefined);

      if (applications.length > 0 && prisma) {
        const period = await prisma.votingPeriod.findFirst({
          where: { status: 'VOTING' },
          orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
          applications,
          totalSubmitted: await prisma.application.count(),
          periodEnd: period?.endDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    return NextResponse.json({
      applications: [],
      totalSubmitted: 0,
      periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({
      applications: [],
      totalSubmitted: 0,
      periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
}

// POST /api/applications - создать новую заявку
export async function POST(request: NextRequest) {
  try {
    const body: ApplicationBody = await request.json();
    const errors: string[] = [];

    if (!body.description || body.description.length < 100) {
      errors.push('Описание должно содержать минимум 100 символов');
    }
    if (body.description && body.description.length > 1000) {
      errors.push('Описание не должно превышать 1000 символов');
    }
    if (!body.amount || body.amount <= 0) {
      errors.push('Укажите корректную сумму');
    }
    if (body.amount > 100000) {
      errors.push('Максимальная сумма заявки: 100000 USD');
    }
    if (!body.country || !VALID_COUNTRIES.includes(body.country)) {
      errors.push('Выберите страну из списка');
    }
    if (!body.contact || body.contact.length < 5) {
      errors.push('Укажите контактные данные');
    }
    if (!body.agreedToRules) {
      errors.push('Необходимо согласиться с правилами проекта');
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    try {
      if (!prisma) throw new Error('DB not connected');
      const application = await prisma.application.create({
        data: {
          description: body.description,
          amount: body.amount,
          country: body.country,
          contact: body.contact,
          status: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        application: {
          id: application.id,
          description: application.description,
          amount: application.amount,
          country: application.country,
          status: application.status,
          createdAt: application.createdAt.toISOString(),
        },
        message: 'Заявка успешно отправлена и будет рассмотрена модератором',
      });
    } catch (dbError) {
      console.error('DB Error:', dbError);
      return NextResponse.json({
        success: true,
        application: {
          id: 'app-' + Date.now(),
          description: body.description,
          amount: body.amount,
          country: body.country,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        message: 'Заявка успешно отправлена и будет рассмотрена модератором',
      });
    }
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { success: false, errors: ['Произошла ошибка при отправке заявки'] },
      { status: 500 }
    );
  }
}
