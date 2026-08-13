import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ArrowRight, Sparkles, Search, CheckSquare, Users,
  TrendingUp, Clock, ClipboardList, AlertCircle, Plus, Calendar, Loader2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import GanttChart from '../components/GanttChart';
import {
  fetchDashboardStats, fetchUpcomingTasks, fetchRecentActivity, fetchGanttTasks,
} from '../services/taskService';

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';

  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, overdue: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [ganttTasks, setGanttTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setIsLoading(true);
    Promise.all([
      fetchDashboardStats(user.id),
      fetchUpcomingTasks(user.id, 14),
      fetchRecentActivity(user.id, 8),
      fetchGanttTasks(user.id),
    ])
      .then(([s, u, r, g]) => {
        setStats(s);
        setUpcoming(u);
        setRecentActivity(r);
        setGanttTasks(g);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Completed', value: `${completionPct}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
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
            ? 'Manage faculty workloads and monitor departmental progress.'
            : "Here's your work overview and upcoming tasks."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-2">
          <Card hover={false} padding="p-0" className="overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Upcoming Deadlines
              </h3>
              <Link to="/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No upcoming deadlines in the next 2 weeks. 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcoming.map((task) => (
                  <div key={task.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{task.title}</span>
                        {task.created_by && task.created_by !== task.assigned_to && (
                          <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md uppercase shrink-0">HOD</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{task.category?.name || 'Uncategorized'}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <StatusBadge status={task.status} size="xs" />
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <Card gradient className="flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Quick Actions</h3>
          <div className="space-y-2 flex-1">
            {[
              { to: '/tasks', icon: Plus, label: 'Add New Task' },
              { to: '/handover', icon: CheckSquare, label: 'Handover Access' },
              { to: '/ai-brief', icon: Sparkles, label: 'Generate AI Brief' },
              { to: '/search', icon: Search, label: 'Search Tasks' },
              ...(isAdmin ? [{ to: '/faculty', icon: Users, label: 'Manage Faculty' }] : []),
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to + action.label}
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

      {/* Gantt Timeline */}
      {ganttTasks.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-500" />
            Task Timeline
          </h3>
          <Card hover={false} padding="p-0" className="overflow-hidden">
            <GanttChart tasks={ganttTasks} />
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Recent Activity</h3>
        <Card hover={false} padding="p-0">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <p className="text-sm">No recent activity yet. Start by adding tasks.</p>
            </div>
          ) : (
            recentActivity.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${
                  i !== recentActivity.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.title}</span>
                    {item.created_by && item.created_by !== item.assigned_to && (
                      <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md uppercase shrink-0">HOD Assigned</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{item.category?.name || 'Task updated'}</div>
                </div>
                <div className="flex items-center gap-4 ml-4 shrink-0">
                  <StatusBadge status={item.status} size="xs" />
                  <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(item.updated_at)}</span>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
