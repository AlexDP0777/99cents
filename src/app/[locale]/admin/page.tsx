'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Project { id: string; name: string; description: string; votes: number; }
interface Application { id: string; description: string; amount: number; country: string; contact?: string; status: string; votesCount: number; createdAt: string; }

export default function AdminPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Clean Water Initiative', description: 'Providing clean water', votes: 342 },
    { id: '2', name: 'School Supplies', description: 'Education materials', votes: 289 },
  ]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadApplications = async () => {
    if (!isAuthenticated) return;
    setLoadingApps(true);
    try {
      const res = await fetch('/api/admin/applications', { headers: { 'Authorization': 'Bearer ' + password } });
      if (res.ok) { const data = await res.json(); setApplications(data.applications || []); }
    } catch (err) { console.error('Error:', err); }
    setLoadingApps(false);
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
      loadApplications();
      setTimeout(() => setActionMessage(''), 3000);
    } catch { setActionMessage('Connection error'); }
  };

  useEffect(() => { if (isAuthenticated) loadApplications(); }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin99') { setIsAuthenticated(true); setError(''); }
    else { setError(t('wrongPassword')); }
  };

  const addProject = () => {
    if (newProject.name && newProject.description) {
      setProjects([...projects, { id: Date.now().toString(), name: newProject.name, description: newProject.description, votes: 0 }]);
      setNewProject({ name: '', description: '' });
    }
  };

  const deleteProject = (id: string) => { setProjects(projects.filter(p => p.id !== id)); };

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
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#1e3a5f]">{t('title')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href={`/${locale}`} className="text-gray-500 hover:text-[#1e3a5f]">← Home</Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {actionMessage && <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">{actionMessage}</div>}

        {/* Applications Management */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">Управление заявками</h2>
          <div className="flex flex-wrap gap-4 mb-6">
            <button onClick={() => handleAction('select')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
              Выбрать 5 случайных
            </button>
            <button onClick={() => handleAction('startVoting')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
              Запустить голосование
            </button>
            <button onClick={loadApplications} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg">
              Обновить
            </button>
          </div>
          {loadingApps ? <p>Загрузка...</p> : applications.length === 0 ? (
            <p className="text-gray-500">Нет заявок на модерацию</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">{app.description.substring(0, 200)}...</p>
                      <p className="text-sm"><b>Сумма:</b> ${app.amount} USD | <b>Страна:</b> {app.country}</p>
                      {app.contact && <p className="text-xs text-gray-400 mt-1">Контакт: {app.contact}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction('approve', app.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200">Одобрить</button>
                      <button onClick={() => handleAction('reject', app.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200">Отклонить</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Project */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">{t('addProject')}</h2>
          <div className="space-y-4">
            <input type="text" placeholder={t('projectName')} value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className="w-full p-3 border rounded-lg" />
            <textarea placeholder={t('projectDescription')} value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} className="w-full p-3 border rounded-lg" rows={3} />
            <button onClick={addProject} className="btn-primary px-6 py-2">{t('save')}</button>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">{t('projects')}</h2>
          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{p.votes} votes</p>
                </div>
                <button onClick={() => deleteProject(p.id)} className="text-red-500 hover:text-red-700 text-sm">{t('delete')}</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
