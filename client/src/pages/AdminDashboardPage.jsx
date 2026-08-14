import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminMetrics } from '../services/taskService';
import { supabase } from '../lib/supabaseClient';
import { Users, CheckCircle2, Clock, BarChart3, TrendingUp, Building2, Loader2, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [handovers, setHandovers] = useState([]);
  const [handoverLoading, setHandoverLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load metrics
      const metricsData = await getAdminMetrics();
      setMetrics(metricsData);

      // Load real handover requests with predecessor & successor info
      setHandoverLoading(true);
      const { data: handoverData, error: handoverErr } = await supabase
        .from('handover_requests')
        .select(`
          *,
          predecessor:staff!handover_requests_predecessor_id_fkey(id, full_name, email, department, designation, avatar_url),
          successor:staff!handover_requests_successor_id_fkey(id, full_name, email, department, designation, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (handoverErr) throw handoverErr;

      // For each handover, compute progress from predecessor's tasks
      const enriched = await Promise.all(
        (handoverData || []).map(async (h) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, status')
            .eq('assigned_to', h.predecessor_id);

          const total = tasks?.length || 0;
          const done = tasks?.filter(t => t.status === 'Done').length || 0;
          const progress = total > 0 ? Math.round((done / total) * 100) : 0;

          return {
            ...h,
            progress,
            taskTotal: total,
            taskDone: done,
          };
        })
      );

      setHandovers(enriched);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setHandoverLoading(false);
    }
  };

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
    { label: 'Total Tasks', value: metrics.totalHandovers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Completed', value: metrics.completedHandovers, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Pending', value: metrics.pendingHandovers, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  const departments = ['All', ...new Set(handovers.map(h => h.predecessor?.department).filter(Boolean))];
  const filteredHandovers = deptFilter === 'All'
    ? handovers
    : handovers.filter(h => h.predecessor?.department === deptFilter);

  // Compute health score from all handovers
  const totalProgress = handovers.reduce((sum, h) => sum + h.progress, 0);
  const healthScore = handovers.length > 0 ? Math.round(totalProgress / handovers.length) : 100;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (healthScore / 100) * circumference;

  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Attention';
  const healthColor = healthScore >= 80 ? 'text-green-500' : healthScore >= 60 ? 'text-blue-500' : healthScore >= 40 ? 'text-amber-500' : 'text-red-500';

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
            {metrics.departments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No department data available.</p>
            ) : (
              metrics.departments.map((dept) => (
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
              ))
            )}
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
              Institutional memory retention is <span className={`font-bold ${healthColor}`}>{healthLabel}</span>.
              {handovers.length > 0
                ? ` Based on ${handovers.length} active handover(s).`
                : ' No active handovers.'}
            </p>
          </div>
        </Card>
      </div>

      {/* Handover Requests Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Handover Requests ({handovers.length})
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

        {handoverLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
            <span className="text-slate-500">Loading handovers...</span>
          </div>
        ) : filteredHandovers.length === 0 ? (
          <Card hover={false} className="text-center py-12">
            <p className="text-slate-500">No handover requests found.</p>
          </Card>
        ) : (
          <Card hover={false} padding="p-0" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Predecessor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Successor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Progress</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHandovers.map((h) => (
                    <tr key={h.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{h.predecessor?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{h.predecessor?.department} · {h.predecessor?.designation}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{h.successor?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{h.successor?.email}</div>
                      </td>
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
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {h.progress}%
                          </span>
                          <span className="text-xs text-slate-400">
                            ({h.taskDone}/{h.taskTotal})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={h.status} size="xs" />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
