import React, { useState } from 'react';
import {
  Settings, Sun, Moon, Download, Lock, Save, Eye, EyeOff,
  CheckCircle2, Palette, FileSpreadsheet, Shield,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchTasks } from '../services/taskService';
import { updateStaffProfile } from '../services/staffService';

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  // Export
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportCSV = async () => {
    if (!user?.id) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const tasks = await fetchTasks(user.id);

      // Generate CSV
      const headers = ['Title', 'Category', 'Status', 'Priority', 'Date Assigned', 'Deadline', 'Description', 'Notes'];
      const rows = tasks.map(t => [
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${t.category?.name || 'Uncategorized'}"`,
        t.status,
        t.priority,
        t.date_assigned || '',
        t.deadline || '',
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rolesync_tasks_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.id) return;
    setPasswordMessage('');

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('Passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updateStaffProfile(user.id, { password_hash: passwordForm.newPassword });
      setPasswordMessage('✅ Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMessage('❌ Failed: ' + err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your preferences, data exports, and account security.</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h3>
              <p className="text-sm text-slate-500">Choose your preferred theme.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>Light</div>
                <div className="text-xs text-slate-500">Clean and bright</div>
              </div>
              {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />}
            </button>

            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>Dark</div>
                <div className="text-xs text-slate-500">Easy on the eyes</div>
              </div>
              {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />}
            </button>
          </div>
        </Card>

        {/* Data Export */}
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Export Data</h3>
              <p className="text-sm text-slate-500">Download your task data as a CSV spreadsheet.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              icon={Download}
              onClick={handleExportCSV}
              loading={isExporting}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export Tasks to CSV'}
            </Button>
            {exportSuccess && (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Downloaded!
              </span>
            )}
          </div>
        </Card>

        {/* Change Password */}
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Security</h3>
              <p className="text-sm text-slate-500">Update your login password.</p>
            </div>
          </div>

          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="Enter current password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="input-field"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="input-field"
                placeholder="Repeat new password"
              />
            </div>

            {passwordMessage && (
              <p className={`text-sm font-medium ${passwordMessage.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>
                {passwordMessage}
              </p>
            )}

            <Button
              variant="primary"
              icon={Lock}
              onClick={handleChangePassword}
              loading={isChangingPassword}
              disabled={!passwordForm.newPassword || isChangingPassword}
            >
              Update Password
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
