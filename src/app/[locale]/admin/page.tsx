'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Project {
  id: string;
  name: string;
  description: string;
  votes: number;
}

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin99') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError(t('wrongPassword'));
    }
  };

  const addProject = () => {
    if (newProject.name && newProject.description) {
      setProjects([...projects, { 
        id: Date.now().toString(), 
        name: newProject.name, 
        description: newProject.description, 
        votes: 0 
      }]);
      setNewProject({ name: '', description: '' });
    }
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-6">{t('title')}</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button type="submit" className="w-full btn-primary py-3">
              {t('login')}
            </button>
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
            <Link href={`/${locale}`} className="text-gray-500 hover:text-[#1e3a5f]">
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">{t('addProject')}</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder={t('projectName')}
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
            <textarea
              placeholder={t('projectDescription')}
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full p-3 border rounded-lg"
              rows={3}
            />
            <button onClick={addProject} className="btn-primary px-6 py-2">
              {t('save')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">{t('projects')}</h2>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{project.votes} votes</p>
                </div>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  {t('delete')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
