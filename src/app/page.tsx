'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Динамический импорт карты (Leaflet требует window)
const ParticipantsMap = dynamic(() => import('@/components/ParticipantsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Загрузка карты...</span>
    </div>
  ),
});

interface Stats {
  totalParticipants: number;
  totalCountries: number;
  totalAmount: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    totalParticipants: 999,
    totalCountries: 47,
    totalAmount: 989.01,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const handlePayment = async () => {
    setIsConnecting(true);
    // TODO: Интеграция с Web3 кошельком
    setTimeout(() => setIsConnecting(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center px-4 py-12 md:py-20">
        {/* Logo & Title */}
        <div className="text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-4">
            <span className="font-black">99 центов.</span>{' '}
            <span className="font-normal">Маленькое действие.</span>
            <br />
            <span className="font-normal">Выбор сильного человека.</span>
          </h1>

          <p className="text-gray-500 text-lg mt-6">
            Один клик. Без регистрации. Без вознаграждений.
          </p>
        </div>

        {/* Call to Action Block */}
        <div className="mt-12 text-center max-w-xl bg-gray-50 rounded-2xl p-8">
          <p className="text-[#1e3a5f] text-lg mb-6">
            Вы отправляете 99 центов и ничего не получаете взамен.
            <br />
            <span className="font-medium">В этом и есть смысл.</span>
          </p>

          <button
            onClick={handlePayment}
            disabled={isConnecting}
            className="btn-primary text-lg px-12 py-4"
          >
            {isConnecting ? 'Подключение...' : 'Отправить 99 центов'}
          </button>

          <p className="text-gray-400 text-sm mt-4">
            Без регистрации. Без писем. Без условий.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12">
          <div className="text-center">
            <div className="stat-number">{stats.totalParticipants.toLocaleString('ru-RU')}</div>
            <div className="stat-label">человек</div>
          </div>
          <div className="text-center">
            <div className="stat-number">{stats.totalCountries}</div>
            <div className="stat-label">стран</div>
          </div>
          <div className="text-center">
            <div className="stat-number">${stats.totalAmount.toLocaleString('ru-RU')}</div>
            <div className="stat-label">собрано</div>
          </div>
        </div>

        {/* Map */}
        <div className="w-full max-w-5xl mt-12">
          <ParticipantsMap />
          <p className="text-center text-gray-400 text-sm mt-4">
            Каждая точка — один человек, который сделал это.
          </p>
        </div>

        {/* Link to Voting */}
        <div className="mt-12">
          <Link 
            href="/voting" 
            className="text-[#1e3a5f] hover:underline font-medium"
          >
            Голосование за проекты →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href="/rules" className="footer-link">Правила проекта</Link>
          <span className="text-gray-300">·</span>
          <Link href="/transparency" className="footer-link">Прозрачность</Link>
          <span className="text-gray-300">·</span>
          <Link href="/how-it-works" className="footer-link">Как используются средства</Link>
        </div>
      </footer>
    </div>
  );
}
