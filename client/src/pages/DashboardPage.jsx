import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ArrowRight, Sparkles, Search, CheckSquare, Users, TrendingUp, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';

  const stats = [
    { label: 'Active Roles', value: '3', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Pending Tasks', value: '7', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Completion', value: '65%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  ];

  const recentActivity = [
    { id: 1, action: 'Completed checklist item', detail: 'Hand over current syllabus progress', time: '2 hours ago', status: 'Done' },
    { id: 2, action: 'Document uploaded', detail: 'TCS Placement MoU 2025.pdf', time: '5 hours ago', status: 'Done' },
    { id: 3, action: 'Task assigned', detail: 'Transfer recruiting company contacts', time: '1 day ago', status: 'Pending' },
    { id: 4, action: 'AI Brief generated', detail: 'Internship Coordinator role brief', time: '2 days ago', status: 'Done' },
  ];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          {user?.status === 'Leaving' && <StatusBadge status="Leaving" />}
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          {isAdmin
            ? 'Monitor institutional continuity and handover compliance across departments.'
            : "Here's your RoleSync continuity overview."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Role Card */}
        <div className="lg:col-span-2">
          <Card className="relative overflow-hidden" padding="p-8">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <LayoutDashboard className="w-32 h-32 text-blue-500" />
            </div>
            <div className="relative z-10">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                Current Primary Role
              </div>
              <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">Internship Coordinator</h2>
              <p className="text-slate-500 text-sm mb-6">Dept. of Computer Science · Since Jan 2024</p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/handover"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                >
                  <CheckSquare className="w-4 h-4" />
                  Handover Workspace
                </Link>
                <Link
                  to="/ai-brief"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate AI Brief
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card gradient className="flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Quick Actions</h3>
          <div className="space-y-2 flex-1">
            {[
              { to: '/handover', icon: CheckSquare, label: 'Handover Checklist' },
              { to: '/ai-brief', icon: Sparkles, label: 'Generate AI Brief' },
              { to: '/search', icon: Search, label: 'Query Institutional DB' },
              ...(isAdmin ? [{ to: '/faculty', icon: Users, label: 'Manage Faculty' }] : []),
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl font-medium hover:shadow-md transition-all text-sm text-slate-700 dark:text-slate-300 group"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  {action.label}
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Recent Activity</h3>
        <Card hover={false} padding="p-0">
          {recentActivity.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${
                i !== recentActivity.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.action}</div>
                <div className="text-xs text-slate-500 truncate">{item.detail}</div>
              </div>
              <div className="flex items-center gap-4 ml-4 shrink-0">
                <StatusBadge status={item.status} size="xs" />
                <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
