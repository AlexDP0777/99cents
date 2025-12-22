import { NextResponse } from 'next/server';

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  votes: number;
  amount: number;
  isActive: boolean;
  isWinner?: boolean;
}

// Моковые данные
const projects: Project[] = [
  {
    id: '1',
    title: 'Чистая вода для деревни в Кении',
    description: 'Установка системы очистки воды для 500 человек',
    votes: 1234,
    amount: 1221.66,
    isActive: true,
  },
  {
    id: '2',
    title: 'Школьные принадлежности для детей',
    description: 'Тетради, ручки и рюкзаки для 200 детей из малоимущих семей',
    votes: 987,
    amount: 977.13,
    isActive: true,
  },
  {
    id: '3',
    title: 'Медикаменты для сельской клиники',
    description: 'Базовые лекарства для клиники в отдалённом районе',
    votes: 756,
    amount: 748.44,
    isActive: true,
  },
  {
    id: '4',
    title: 'Посадка деревьев',
    description: 'Посадка 1000 деревьев в районах обезлесения',
    votes: 543,
    amount: 537.57,
    isActive: true,
  },
];

// GET /api/projects - получить список проектов
export async function GET() {
  // TODO: Получить из базы данных
  return NextResponse.json(projects);
}

// POST /api/projects - создать проект (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Проверить права администратора
    // TODO: Создать проект в БД

    const newProject: Project = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl,
      votes: 0,
      amount: 0,
      isActive: true,
    };

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
