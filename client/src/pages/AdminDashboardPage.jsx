import React, { useEffect, useState } from 'react';
import { getAdminMetrics } from '../services/taskService';
import { Users, CheckCircle2, Clock, BarChart3, TrendingUp, Filter, Building2 } from 'lucide-react';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

// Mock ongoing handovers
const MOCK_HANDOVERS = [
  { id: 'h1', faculty: 'Devansh Sharma', department: 'Computer Science', role: 'Internship Coordinator', progress: 65, status: 'In Progress' },
  { id: 'h2', faculty: 'Dr. Priya Nair', department: 'Electronics', role: 'Lab In-Charge', progress: 30, status: 'In Progress' },
  { id: 'h3', faculty: 'Prof. R. Kumar', department: 'Mechanical', role: 'Workshop Coordinator', progress: 100, status: 'Done' },
  { id: 'h4', faculty: 'Dr. Sanjay Mishra', department: 'Computer Science', role: 'Exam Controller', progress: 10, status: 'Not Started' },
];

const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [deptFilter, setDeptFilter] = useState('All');

  useEffect(() => {
    getAdminMetrics().then(setMetrics);
  }, []);

  if (!metrics) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <LoadingSkeleton variant="text" lines={2} />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <LoadingSkeleton key={i} variant="card" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Active Transitions', value: metrics.totalHandovers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Completed Handovers', value: metrics.completedHandovers, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Pending Handovers', value: metrics.pendingHandovers, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  const departments = ['All', ...new Set(MOCK_HANDOVERS.map((h) => h.department))];
  const filteredHandovers = deptFilter === 'All'
    ? MOCK_HANDOVERS
    : MOCK_HANDOVERS.filter((h) => h.department === deptFilter);

  const healthScore = 80;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">HOD Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Monitor institutional continuity and handover compliance across departments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Departmental Progress */}
        <Card hover={false} className="flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-blue-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Departmental Progress</h2>
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
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Continuity Health Score */}
        <Card hover={false} gradient className="border-indigo-500/20">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Continuity Health Score</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-indigo-500 transition-all duration-1000" />
              </svg>
              <div className="absolute text-5xl font-black text-slate-800 dark:text-white">{healthScore}<span className="text-2xl text-slate-400">%</span></div>
            </div>
            <p className="text-center text-slate-600 dark:text-slate-400 max-w-sm">
              Institutional memory retention is <span className="font-bold text-green-500">Good</span>.
              The majority of key roles have submitted their handover briefs.
            </p>
          </div>
        </Card>
      </div>

      {/* Ongoing Handovers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Ongoing Handovers
          </h2>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input-field w-auto pr-8 appearance-none cursor-pointer text-sm"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>
        </div>
        <Card hover={false} padding="p-0" className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHandovers.map((h) => (
                <tr key={h.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{h.faculty}</div>
                    <div className="text-xs text-slate-500">{h.department}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{h.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${
                            h.progress === 100 ? 'bg-green-500' : h.progress > 50 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${h.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{h.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={h.status} size="xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
