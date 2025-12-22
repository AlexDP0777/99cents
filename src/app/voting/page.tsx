'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ParticipantsMap = dynamic(() => import('@/components/ParticipantsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-gray-100 rounded-lg animate-pulse" />
  ),
});

interface Project {
  id: string;
  title: string;
  description: string;
  votes: number;
  amount: number;
  isWinner?: boolean;
}

// Моковые проекты
const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Чистая вода для деревни в Кении',
    description: 'Установка системы очистки воды для 500 человек',
    votes: 1234,
    amount: 1221.66,
  },
  {
    id: '2',
    title: 'Школьные принадлежности для детей',
    description: 'Тетради, ручки и рюкзаки для 200 детей из малоимущих семей',
    votes: 987,
    amount: 977.13,
  },
  {
    id: '3',
    title: 'Медикаменты для сельской клиники',
    description: 'Базовые лекарства для клиники в отдалённом районе',
    votes: 756,
    amount: 748.44,
  },
  {
    id: '4',
    title: 'Посадка деревьев',
    description: 'Посадка 1000 деревьев в районах обезлесения',
    votes: 543,
    amount: 537.57,
  },
];

export default function VotingPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [canVote, setCanVote] = useState(false);
  const [hasVotedToday, setHasVotedToday] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const handleVote = (projectId: string) => {
    if (!canVote) {
      alert('Чтобы голосовать, сначала отправьте 99 центов');
      return;
    }
    if (hasVotedToday) {
      alert('Вы уже проголосовали сегодня. Попробуйте завтра.');
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, votes: p.votes + 1, amount: p.amount + 0.99 }
          : p
      )
    );
    setHasVotedToday(true);
    setSelectedProject(projectId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-4 border-b border-gray-100">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-[#1e3a5f]">
            99 центов
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-500 hover:text-[#1e3a5f]">
              Главная
            </Link>
            <Link href="/voting" className="text-[#1e3a5f] font-medium">
              Голосование
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] text-center mb-4">
            Выбор следующей цели
          </h1>
          <p className="text-gray-500 text-center mb-12">
            Голосуйте за проект, который получит собранные средства
          </p>

          {/* Предупреждение для неоплативших */}
          {!canVote && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
              <p className="text-[#1e3a5f]">
                Станьте частью следующего маленького действия
              </p>
              <Link
                href="/"
                className="inline-block mt-3 btn-primary text-sm px-6 py-2"
              >
                Отправить 99 центов
              </Link>
            </div>
          )}

          {/* Карточки проектов */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`project-card ${project.isWinner ? 'winner' : ''}`}
              >
                <h3 className="text-xl font-semibold text-[#1e3a5f] mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-500 mb-4">{project.description}</p>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-2xl font-bold text-[#1e3a5f]">
                      {project.votes.toLocaleString('ru-RU')}
                    </span>
                    <span className="text-gray-400 ml-2">голосов</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-green-600">
                      ${project.amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleVote(project.id)}
                  disabled={!canVote || hasVotedToday}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    canVote && !hasVotedToday
                      ? 'bg-[#1e3a5f] text-white hover:bg-[#2c4a6e]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  } ${selectedProject === project.id ? 'ring-2 ring-green-500' : ''}`}
                >
                  {selectedProject === project.id
                    ? 'Ваш голос учтён'
                    : hasVotedToday
                    ? 'Голос использован'
                    : 'Проголосовать'}
                </button>
              </div>
            ))}
          </div>

          {/* Карта голосующих */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#1e3a5f] mb-4 text-center">
              Участники голосования
            </h2>
            <ParticipantsMap />
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href="/rules" className="footer-link">
            Правила проекта
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/transparency" className="footer-link">
            Прозрачность
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/how-it-works" className="footer-link">
            Как используются средства
          </Link>
        </div>
      </footer>
    </div>
  );
}
