'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description: string;
  votes: number;
  amount: number;
  isActive: boolean;
}

interface Stats {
  totalParticipants: number;
  totalCountries: number;
  totalAmount: number;
}

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized]);

  const fetchData = async () => {
    const [projectsRes, statsRes] = await Promise.all([
      fetch('/api/projects'),
      fetch('/api/stats'),
    ]);
    setProjects(await projectsRes.json());
    setStats(await statsRes.json());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin99') {
      setIsAuthorized(true);
    } else {
      alert('Wrong password');
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.description) return;

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject),
    });

    if (res.ok) {
      const project = await res.json();
      setProjects([...projects, project]);
      setNewProject({ title: '', description: '' });
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-6 text-center">Admin Panel</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-4"
            />
            <button type="submit" className="w-full btn-primary">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#1e3a5f]">Admin | 99 cents</h1>
          <Link href="/" className="text-gray-500 hover:text-[#1e3a5f]">Back to site</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {stats && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-[#1e3a5f]">{stats.totalParticipants}</div>
              <div className="text-gray-500">Participants</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-[#1e3a5f]">{stats.totalCountries}</div>
              <div className="text-gray-500">Countries</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600">{stats.totalAmount}</div>
              <div className="text-gray-500">Collected</div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">Add Project</h2>
          <form onSubmit={handleAddProject} className="flex gap-4">
            <input
              type="text"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              placeholder="Project name"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
            />
            <input
              type="text"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Description"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
            />
            <button type="submit" className="btn-primary px-6 py-2">Add</button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-[#1e3a5f]">Voting Projects</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {projects.map((project) => (
              <div key={project.id} className="p-6 flex items-center gap-6">
                <div className="flex-1">
                  <h3 className="font-medium text-[#1e3a5f]">{project.title}</h3>
                  <p className="text-gray-500 text-sm">{project.description}</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-[#1e3a5f]">{project.votes}</div>
                  <div className="text-gray-400 text-sm">votes</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{project.amount}</div>
                  <div className="text-gray-400 text-sm">amount</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
