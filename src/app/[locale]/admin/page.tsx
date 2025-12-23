'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Application { id: string; description: string; amount: number; country: string; contact?: string; status: string; votesCount: number; createdAt: string; }
interface PeriodInfo {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  selectedApplications: { id: string; description: string; amount: number; country: string; votesCount: number; }[];
  totalVotes: number;
  approvedCount: number;
  pendingCount: number;
}

interface Stats {
  stats: { total: number; pending: number; approved: number; selected: number; rejected: number; winners: number; totalVotes: number };
  byCountry: { country: string; count: number }[];
  completedPeriods: { id: string; startDate: string; endDate: string; winnerId: string | null }[];
}

type TabType = 'dashboard' | 'moderation' | 'history';

export default function AdminPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [applications, setApplications] = useState<Application[]>([]);
  const [period, setPeriod] = useState<PeriodInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        fetch('/api/admin/applications', { headers: { 'Authorization': 'Bearer ' + password } }),
        fetch('/api/admin/stats', { headers: { 'Authorization': 'Bearer ' + password } })
      ]);
      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.applications || []);
        setPeriod(data.period || null);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) { console.error('Error:', err); }
    setLoading(false);
  };

  const handleAction = async (action: string, appId?: string) => {
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + password, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, applicationId: appId })
      });
      const data = await res.json();
      setActionMessage(data.message || (data.success ? 'Done!' : 'Error'));
      loadData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch { setActionMessage('Connection error'); }
  };

  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin99') { setIsAuthenticated(true); setError(''); }
    else { setError(t('wrongPassword')); }
  };

  const filteredApps = applications.filter(app =>
    statusFilter === 'ALL' ? true : app.status === statusFilter
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-6">{t('title')}</h1>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg mb-4" />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button type="submit" className="w-full btn-primary py-3">{t('login')}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white py-4 px-6 border-b">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#1e3a5f]">{t('title')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href={'/' + locale} className="text-gray-500 hover:text-[#1e3a5f]">← Home</Link>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto flex">
          {(['dashboard', 'moderation', 'history'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={'px-6 py-3 font-medium border-b-2 transition-colors ' + (activeTab === tab ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {tab === 'dashboard' ? 'Дашборд' : tab === 'moderation' ? 'Модерация' : 'История'}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto py-8 px-4">
        {actionMessage && <div className="bg-blue-100 text-blue-800 p-4 rounded-lg mb-6">{actionMessage}</div>}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm"><p className="text-3xl font-bold text-[#1e3a5f]">{stats.stats?.total || 0}</p><p className="text-sm text-gray-500">Всего</p></div>
                <div className="bg-white p-4 rounded-lg shadow-sm"><p className="text-3xl font-bold text-yellow-600">{stats.stats?.pending || 0}</p><p className="text-sm text-gray-500">На модерации</p></div>
                <div className="bg-white p-4 rounded-lg shadow-sm"><p className="text-3xl font-bold text-green-600">{stats.stats?.approved || 0}</p><p className="text-sm text-gray-500">Одобрено</p></div>
                <div className="bg-white p-4 rounded-lg shadow-sm"><p className="text-3xl font-bold text-blue-600">{stats.stats?.selected || 0}</p><p className="text-sm text-gray-500">На голосовании</p></div>
                <div className="bg-white p-4 rounded-lg shadow-sm"><p className="text-3xl font-bold text-red-600">{stats.stats?.rejected || 0}</p><p className="text-sm text-gray-500">Отклонено</p></div>
                <div className="bg-white p-4 rounded-lg shadow-sm"><p className="text-3xl font-bold text-purple-600">{stats.stats?.winners || 0}</p><p className="text-sm text-gray-500">Победителей</p></div>
              </div>
            )}
            {period && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">Текущий период</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-xl font-bold text-[#1e3a5f]">{period.status}</p><p className="text-xs text-gray-500">Статус</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-xl font-bold text-[#1e3a5f]">{period.totalVotes}</p><p className="text-xs text-gray-500">Голосов</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-xl font-bold text-[#1e3a5f]">{period.selectedApplications.length}</p><p className="text-xs text-gray-500">На голосовании</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-sm font-medium text-[#1e3a5f]">{new Date(period.endDate).toLocaleDateString()}</p><p className="text-xs text-gray-500">Окончание</p></div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleAction('select')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Выбрать 5 случайных</button>
                  <button onClick={() => handleAction('startVoting')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Запустить голосование</button>
                  <button onClick={() => handleAction('endVoting')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Завершить</button>
                  <button onClick={() => handleAction('newPeriod')} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">Новый период</button>
                  <button onClick={loadData} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm">Обновить</button>
                </div>
                {period.selectedApplications.length > 0 && (
                  <div className="mt-6"><h3 className="font-medium mb-3">На голосовании:</h3>
                    {period.selectedApplications.map((app, idx) => (
                      <div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2">
                        <div><span className="text-lg font-bold text-gray-400 mr-3">#{idx + 1}</span><span className="text-sm">{app.description.substring(0, 60)}...</span></div>
                        <span className="text-xl font-bold text-[#1e3a5f]">{app.votesCount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {stats && stats.byCountry && stats.byCountry.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">Заявки по странам</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {stats.byCountry.map((item) => (
                    <div key={item.country} className="bg-gray-50 p-3 rounded-lg"><p className="font-medium text-[#1e3a5f]">{item.country}</p><p className="text-2xl font-bold">{item.count}</p></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Фильтр:</span>
                {['PENDING', 'APPROVED', 'SELECTED', 'REJECTED', 'ALL'].map((status) => (
                  <button key={status} onClick={() => setStatusFilter(status)}
                    className={'px-3 py-1 rounded-full text-sm ' + (statusFilter === status ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                    {status === 'PENDING' ? 'На модерации' : status === 'APPROVED' ? 'Одобренные' : status === 'SELECTED' ? 'На голосовании' : status === 'REJECTED' ? 'Отклонённые' : 'Все'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <p className="text-center text-gray-500">Загрузка...</p> : filteredApps.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Нет заявок</p>
            ) : (
              <div className="space-y-4">
                {filteredApps.map((app) => (
                  <div key={app.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : app.status === 'SELECTED' ? 'bg-blue-100 text-blue-700' : app.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700')}>{app.status}</span>
                          <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{app.description}</p>
                        <p className="text-sm"><b>Сумма:</b> ${app.amount} | <b>Страна:</b> {app.country}{app.votesCount > 0 && <span> | <b>Голосов:</b> {app.votesCount}</span>}</p>
                        {app.contact && <p className="text-xs text-gray-400 mt-1">Контакт: {app.contact}</p>}
                      </div>
                      {app.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction('approve', app.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200">Одобрить</button>
                          <button onClick={() => handleAction('reject', app.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200">Отклонить</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">История периодов</h2>
            {stats && stats.completedPeriods && stats.completedPeriods.length > 0 ? (
              <div className="space-y-3">
                {stats.completedPeriods.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div><p className="font-medium">Период #{stats.completedPeriods.length - idx}</p><p className="text-sm text-gray-500">{new Date(p.startDate).toLocaleDateString()} — {new Date(p.endDate).toLocaleDateString()}</p></div>
                    <div className="text-right">{p.winnerId ? <span className="text-green-600 font-medium">Есть победитель</span> : <span className="text-gray-400">Без победителя</span>}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Нет завершённых периодов</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
