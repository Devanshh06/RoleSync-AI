import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Building2, Briefcase, Edit2, Save, X, Shield,
  ClipboardList, CheckCircle2, Clock, AlertCircle, Loader2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { updateStaffProfile } from '../services/staffService';
import { fetchDashboardStats } from '../services/taskService';

const ProfilePage = () => {
  const { user, login } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, overdue: 0 });
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact: '',
    designation: '',
    department: '',
  });

  useEffect(() => {
    if (!user) return;
    setFormData({
      full_name: user.name || '',
      email: user.email || '',
      contact: user.contact || '',
      designation: user.designation || '',
      department: user.department || '',
    });

    if (user.id) {
      fetchDashboardStats(user.id)
        .then(setStats)
        .catch(console.error);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await updateStaffProfile(user.id, formData);
      // Update local auth state
      const updatedUser = {
        ...user,
        name: formData.full_name,
        email: formData.email,
        contact: formData.contact,
        designation: formData.designation,
        department: formData.department,
      };
      localStorage.setItem('rolesync_user', JSON.stringify(updatedUser));
      window.location.reload(); // Simplest way to refresh auth context
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
        <span className="text-slate-500">Loading profile...</span>
      </div>
    );
  }

  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Profile Header */}
      <Card className="relative overflow-hidden mb-6" padding="p-0">
        {/* Gradient banner */}
        <div className="h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        </div>

        <div className="px-8 pb-8 -mt-16 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl border-4 border-white dark:border-slate-900 shrink-0">
              {initials}
            </div>

            <div className="flex-1 pt-4 sm:pt-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
                <StatusBadge status={user.status || 'Active'} />
                {user.userType === 'Admin' && (
                  <span className="flex items-center gap-1 text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-lg">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-slate-500">{user.designation} · {user.department}</p>
            </div>

            <Button
              variant={isEditing ? 'danger' : 'secondary'}
              icon={isEditing ? X : Edit2}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Task Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Tasks', value: stats.total, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Completed', value: `${completionPct}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="p-4" className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Profile Details / Edit Form */}
      <Card className={isEditing ? 'animate-slide-up' : ''}>
        <h3 className="text-lg font-bold mb-5 text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          {isEditing ? 'Edit Profile' : 'Profile Details'}
        </h3>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', key: 'full_name', icon: User },
                { label: 'Email', key: 'email', icon: Mail },
                { label: 'Contact', key: 'contact', icon: Phone },
                { label: 'Designation', key: 'designation', icon: Briefcase },
                { label: 'Department', key: 'department', icon: Building2 },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                  <input
                    type="text"
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="input-field"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" icon={Save} onClick={handleSave} loading={isSaving}>Save Changes</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { label: 'Full Name', value: user.name, icon: User },
              { label: 'Email', value: user.email, icon: Mail },
              { label: 'Contact', value: user.contact || 'Not set', icon: Phone },
              { label: 'Designation', value: user.designation || 'Not set', icon: Briefcase },
              { label: 'Department', value: user.department || 'Not set', icon: Building2 },
              { label: 'Role', value: user.userType === 'Admin' ? 'HOD / Admin' : 'Faculty', icon: Shield },
            ].map(field => {
              const Icon = field.icon;
              return (
                <div key={field.label} className="flex items-center gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{field.label}</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{field.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
