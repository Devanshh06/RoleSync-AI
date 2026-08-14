import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, Briefcase, Edit2, Save, X, CheckSquare, Loader2, ClipboardList } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { supabase } from '../lib/supabaseClient';
import { updateStaffProfile } from '../services/staffService';

const FacultyProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [tasksByCategory, setTasksByCategory] = useState([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch staff
      const { data: staff, error: staffErr } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .single();

      if (staffErr) throw staffErr;
      setProfile(staff);
      setFormData({
        full_name: staff.full_name || '',
        email: staff.email || '',
        contact: staff.contact || '',
        designation: staff.designation || '',
        department: staff.department || '',
      });

      // Fetch tasks grouped by category
      const { data: tasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('id, title, status, deadline, category:task_categories(id, name, color)')
        .eq('assigned_to', id)
        .order('created_at', { ascending: false });

      if (!tasksErr && tasks) {
        // Group by category
        const categoryMap = {};
        tasks.forEach(t => {
          const catName = t.category?.name || 'Uncategorized';
          const catId = t.category?.id || 'none';
          if (!categoryMap[catId]) {
            categoryMap[catId] = {
              id: catId,
              name: catName,
              color: t.category?.color || '#64748b',
              tasks: [],
            };
          }
          categoryMap[catId].tasks.push(t);
        });

        const grouped = Object.values(categoryMap).map(cat => ({
          ...cat,
          total: cat.tasks.length,
          completed: cat.tasks.filter(t => t.status === 'Done').length,
          progress: cat.tasks.length > 0
            ? Math.round((cat.tasks.filter(t => t.status === 'Done').length / cat.tasks.length) * 100)
            : 0,
        }));

        setTasksByCategory(grouped);
        setTaskStats({
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'Done').length,
          pending: tasks.filter(t => t.status !== 'Done').length,
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateStaffProfile(id, formData);
      await loadProfile();
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="text" lines={3} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Faculty Not Found</h2>
        <p className="text-slate-500 mb-6">The requested faculty profile does not exist.</p>
        <Button variant="primary" onClick={() => navigate('/faculty')}>Back to Faculty List</Button>
      </div>
    );
  }

  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        to="/faculty"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Faculty List
      </Link>

      {/* Profile Header */}
      <Card className="relative overflow-hidden mb-6" padding="p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0">
            {initials}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h1>
              <StatusBadge status={profile.status} />
            </div>
            <p className="text-slate-500">{profile.designation} · {profile.department}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {profile.email}</span>
              {profile.contact && (
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {profile.contact}</span>
              )}
            </div>
          </div>

          <Button
            variant={isEditing ? 'danger' : 'secondary'}
            icon={isEditing ? X : Edit2}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </Card>

      {/* Task Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Tasks', value: taskStats.total, color: 'text-blue-600' },
          { label: 'Completed', value: taskStats.completed, color: 'text-emerald-600' },
          { label: 'Pending', value: taskStats.pending, color: 'text-amber-600' },
        ].map(stat => (
          <Card key={stat.label} padding="p-4" className="text-center">
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card className="mb-6 animate-slide-up">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Edit Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'full_name', icon: Briefcase },
              { label: 'Email', key: 'email', icon: Mail },
              { label: 'Contact', key: 'contact', icon: Phone },
              { label: 'Designation', key: 'designation', icon: Briefcase },
              { label: 'Department', key: 'department', icon: Building2 },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                <input
                  type="text"
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="input-field"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button variant="primary" icon={Save} onClick={handleSave} loading={isSaving}>Save Changes</Button>
          </div>
        </Card>
      )}

      {/* Roles / Categories Held */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-500" />
          Task Categories ({tasksByCategory.length})
        </h3>
        {tasksByCategory.length === 0 ? (
          <Card hover={false}>
            <p className="text-center text-slate-500 py-8">No tasks assigned yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasksByCategory.map((cat) => (
              <Card key={cat.id} padding="p-5" className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {cat.completed}/{cat.total} tasks completed
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{cat.progress}%</div>
                    <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{
                          width: `${cat.progress}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                  <StatusBadge status={cat.progress === 100 ? 'Done' : 'In Progress'} size="xs" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyProfilePage;
