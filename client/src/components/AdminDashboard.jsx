import React, { useEffect, useState } from 'react';
import { getAdminMetrics } from '../services/mockApi';
import { Users, CheckCircle2, Clock, BarChart3, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    getAdminMetrics().then(setMetrics);
  }, []);

  if (!metrics) return <div className="p-8 text-center animate-pulse text-slate-500">Loading analytics...</div>;

  const stats = [
    { label: 'Active Transitions', value: metrics.totalHandovers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Completed Handovers', value: metrics.completedHandovers, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Pending Handovers', value: metrics.pendingHandovers, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">HOD Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Monitor institutional continuity and handover compliance across departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass dark:glass-dark rounded-2xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass dark:glass-dark rounded-2xl p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-blue-500" />
            <h2 className="text-xl font-bold">Departmental Progress</h2>
          </div>
          <div className="space-y-6 flex-1">
            {metrics.departments.map((dept) => (
              <div key={dept.name}>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{dept.name}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{dept.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${dept.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="glass dark:glass-dark rounded-2xl p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-indigo-500" />
            <h2 className="text-xl font-bold">Continuity Health Score</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset="56" className="text-indigo-500 transition-all duration-1000" />
              </svg>
              <div className="absolute text-5xl font-black text-slate-800 dark:text-white">80<span className="text-2xl text-slate-400">%</span></div>
            </div>
            <p className="text-center text-slate-600 dark:text-slate-400 max-w-sm">
              Institutional memory retention is <span className="font-bold text-green-500">Good</span>. 
              The majority of key roles have submitted their handover briefs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
