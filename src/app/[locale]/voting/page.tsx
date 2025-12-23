'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Application {
  id: string;
  description: string;
  amount: number;
  country: string;
  votesCount: number;
}

// Генерируем уникальный хеш посетителя
function getVisitorHash(): string {
  if (typeof window === 'undefined') return '';

  let hash = localStorage.getItem('visitorHash');
  if (!hash) {
    hash = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('visitorHash', hash);
  }
  return hash;
}

export default function VotingPage() {
  const t = useTranslations('voting');
  const tFooter = useTranslations('footer');
  const locale = useLocale();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [canVote, setCanVote] = useState(true);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);

  // Загрузка заявок
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/applications?status=SELECTED');
        const data = await res.json();
        setApplications(data.applications || []);
        if (data.periodEnd) {
          setPeriodEnd(new Date(data.periodEnd));
        }

        // Проверяем статус голосования
        const hash = getVisitorHash();
        if (hash) {
          const statusRes = await fetch(`/api/vote?hash=${hash}`);
          const status = await statusRes.json();
          setCanVote(status.canVote);
          if (status.todayVotes?.length > 0) {
            setVotedId(status.todayVotes[0]);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (!periodEnd) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = periodEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [periodEnd]);

  const handleVote = async (applicationId: string) => {
    if (!canVote || votedId) return;

    const hash = getVisitorHash();
    if (!hash) return;

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorHash: hash, applicationId })
      });

      const result = await res.json();

      if (result.success) {
        setVotedId(applicationId);
        setCanVote(false);
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, votesCount: app.votesCount + 1 }
              : app
          )
        );
        setMessage(result.message);
      } else {
        setMessage(result.message);
        if (result.message.includes('уже голосовали')) {
          setCanVote(false);
        }
      }
    } catch (error) {
      setMessage('Ошибка при голосовании');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const totalVotes = applications.reduce((sum, a) => sum + a.votesCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link href={`/${locale}`} className="text-2xl font-bold text-[#1e3a5f]">
            99 cents
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">{t('title')}</h1>
          <p className="text-gray-500 mb-8">{t('subtitle')}</p>

          {message && (
            <div className="bg-blue-100 text-blue-800 p-4 rounded-lg mb-6">
              {message}
            </div>
          )}

          {/* Timer */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-center">
            <p className="text-sm text-gray-500 mb-2">{t('endsIn')}</p>
            <div className="flex justify-center gap-4 text-2xl font-bold text-[#1e3a5f]">
              <div>
                <span>{timeLeft.days}</span>
                <span className="text-sm font-normal text-gray-400 ml-1">{t('days')}</span>
              </div>
              <div>
                <span>{timeLeft.hours}</span>
                <span className="text-sm font-normal text-gray-400 ml-1">{t('hours')}</span>
              </div>
              <div>
                <span>{timeLeft.minutes}</span>
                <span className="text-sm font-normal text-gray-400 ml-1">{t('minutes')}</span>
              </div>
            </div>
          </div>

          {/* Applications */}
          <div className="space-y-4">
            {applications.map((app) => {
              const percentage = totalVotes > 0 ? Math.round((app.votesCount / totalVotes) * 100) : 0;
              const isVoted = votedId === app.id;

              return (
                <div
                  key={app.id}
                  className={`bg-white border rounded-lg p-6 ${
                    isVoted ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{app.country}</span>
                        <span className="text-xs text-gray-500">${app.amount.toLocaleString()} USD</span>
                      </div>
                      <p className="text-gray-700 text-sm">{app.description}</p>
                    </div>
                    <button
                      onClick={() => handleVote(app.id)}
                      disabled={!canVote || !!votedId}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isVoted
                          ? 'bg-green-500 text-white'
                          : !canVote || votedId
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#1e3a5f] text-white hover:bg-[#2d4a6f]'
                      }`}
                    >
                      {isVoted ? t('voted') : t('voteButton')}
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">{app.votesCount} {t('votes')}</span>
                      <span className="text-[#1e3a5f] font-medium">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#1e3a5f] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            {t('oneVotePerDay')}
          </p>

          <div className="mt-8 text-center">
            <Link href={`/${locale}`} className="text-[#1e3a5f] hover:underline">
              ← Back
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href={`/${locale}/rules`} className="footer-link">{tFooter('rules')}</Link>
          <span className="text-gray-300">·</span>
          <Link href={`/${locale}/transparency`} className="footer-link">{tFooter('transparency')}</Link>
          <span className="text-gray-300">·</span>
          <Link href={`/${locale}/how-it-works`} className="footer-link">{tFooter('howItWorks')}</Link>
        </div>
      </footer>
    </div>
  );
}
