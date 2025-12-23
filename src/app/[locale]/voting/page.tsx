'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Project {
  id: string;
  name: string;
  description: string;
  votes: number;
  target: number;
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Clean Water Initiative',
    description: 'Providing clean drinking water to 500 families in rural areas',
    votes: 342,
    target: 5000,
  },
  {
    id: '2',
    name: 'School Supplies Drive',
    description: 'Educational materials for underprivileged children',
    votes: 289,
    target: 3000,
  },
  {
    id: '3',
    name: 'Medical Equipment Fund',
    description: 'Essential medical equipment for local clinics',
    votes: 198,
    target: 8000,
  },
];

export default function VotingPage() {
  const t = useTranslations('voting');
  const tFooter = useTranslations('footer');
  const locale = useLocale();

  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [votedProject, setVotedProject] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 12, hours: 8, minutes: 45 });

  const totalVotes = projects.reduce((sum, p) => sum + p.votes, 0);

  const handleVote = (projectId: string) => {
    if (votedProject) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, votes: p.votes + 1 } : p))
    );
    setVotedProject(projectId);
  };

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

          {/* Projects */}
          <div className="space-y-4">
            {projects.map((project) => {
              const percentage = Math.round((project.votes / totalVotes) * 100);
              const isVoted = votedProject === project.id;

              return (
                <div
                  key={project.id}
                  className={`bg-white border rounded-lg p-6 ${
                    isVoted ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1e3a5f]">{project.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{project.description}</p>
                    </div>
                    <button
                      onClick={() => handleVote(project.id)}
                      disabled={!!votedProject}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isVoted
                          ? 'bg-green-500 text-white'
                          : votedProject
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
                      <span className="text-gray-500">{project.votes} {t('votes')}</span>
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
              ← {t('title')}
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
