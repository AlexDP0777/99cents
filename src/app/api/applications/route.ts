import { NextRequest, NextResponse } from 'next/server';

// Список стран для валидации
const VALID_COUNTRIES = [
  'Россия', 'США', 'Великобритания', 'Германия', 'Франция', 'Испания', 'Италия',
  'Китай', 'Япония', 'Южная Корея', 'Индия', 'Бразилия', 'Мексика', 'Канада',
  'Австралия', 'Украина', 'Польша', 'Нидерланды', 'Бельгия', 'Швейцария',
  'Австрия', 'Швеция', 'Норвегия', 'Дания', 'Финляндия', 'Чехия', 'Португалия',
  'Греция', 'Турция', 'Израиль', 'ОАЭ', 'Саудовская Аравия', 'Египет', 'ЮАР',
  'Аргентина', 'Чили', 'Колумбия', 'Перу', 'Венесуэла', 'Индонезия', 'Таиланд',
  'Вьетнам', 'Филиппины', 'Малайзия', 'Сингапур', 'Новая Зеландия', 'Ирландия',
  'Другая'
];

interface ApplicationBody {
  description: string;
  amount: number;
  country: string;
  contact: string;
  agreedToRules: boolean;
}

// GET /api/applications - получить заявки (для голосования - только SELECTED)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Для MVP возвращаем mock данные
  // TODO: Подключить реальную БД
  const mockApplications = [
    {
      id: '1',
      description: 'Нужна помощь с оплатой лечения ребёнка. Диагноз: ДЦП. Требуется курс реабилитации.',
      amount: 5000,
      country: 'Украина',
      status: 'SELECTED',
      votesCount: 127,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      description: 'Сбор средств на строительство колодца в деревне. 500 жителей не имеют доступа к чистой воде.',
      amount: 3000,
      country: 'Кения',
      status: 'SELECTED',
      votesCount: 89,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      description: 'Покупка школьных принадлежностей для 50 детей из малообеспеченных семей.',
      amount: 1500,
      country: 'Индия',
      status: 'SELECTED',
      votesCount: 156,
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      description: 'Восстановление дома после пожара. Семья с тремя детьми осталась без крыши над головой.',
      amount: 8000,
      country: 'Россия',
      status: 'SELECTED',
      votesCount: 203,
      createdAt: new Date().toISOString(),
    },
    {
      id: '5',
      description: 'Оплата операции для бездомных животных в приюте. 20 собак нуждаются в стерилизации.',
      amount: 2000,
      country: 'Бразилия',
      status: 'SELECTED',
      votesCount: 78,
      createdAt: new Date().toISOString(),
    },
  ];

  if (status === 'SELECTED') {
    return NextResponse.json({
      applications: mockApplications,
      totalSubmitted: 47, // всего подано заявок
      periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // через неделю
    });
  }

  return NextResponse.json({ applications: mockApplications });
}

// POST /api/applications - создать новую заявку
export async function POST(request: NextRequest) {
  try {
    const body: ApplicationBody = await request.json();

    // Валидация
    const errors: string[] = [];

    // Описание: 200-1000 символов
    if (!body.description || body.description.length < 200) {
      errors.push('Описание должно содержать минимум 200 символов');
    }
    if (body.description && body.description.length > 1000) {
      errors.push('Описание не должно превышать 1000 символов');
    }

    // Сумма: положительное число
    if (!body.amount || body.amount <= 0) {
      errors.push('Укажите корректную сумму');
    }
    if (body.amount > 100000) {
      errors.push('Максимальная сумма заявки: $100,000');
    }

    // Страна
    if (!body.country || !VALID_COUNTRIES.includes(body.country)) {
      errors.push('Выберите страну из списка');
    }

    // Контакт
    if (!body.contact || body.contact.length < 5) {
      errors.push('Укажите контактные данные (email или мессенджер)');
    }

    // Согласие с правилами
    if (!body.agreedToRules) {
      errors.push('Необходимо согласиться с правилами проекта');
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // TODO: Сохранить в БД через Prisma
    // const application = await prisma.application.create({
    //   data: {
    //     description: body.description,
    //     amount: body.amount,
    //     country: body.country,
    //     contact: body.contact,
    //     status: 'PENDING',
    //   },
    // });

    // Для MVP возвращаем успех
    const mockApplication = {
      id: `app-${Date.now()}`,
      description: body.description,
      amount: body.amount,
      country: body.country,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      application: mockApplication,
      message: 'Заявка успешно отправлена и будет рассмотрена модератором',
    });

  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { success: false, errors: ['Произошла ошибка при отправке заявки'] },
      { status: 500 }
    );
  }
}
