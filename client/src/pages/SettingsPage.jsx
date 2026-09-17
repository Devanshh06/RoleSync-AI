import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings, Sun, Moon, Download, Lock, Save, Eye, EyeOff,
  CheckCircle2, Palette, FileSpreadsheet, Shield, Mail, RefreshCw,
  Loader2, ExternalLink, AlertCircle, Inbox, Zap
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchTasks } from '../services/taskService';
import { updateStaffProfile } from '../services/staffService';
import { supabase } from '../lib/supabaseClient';
import apiClient from '../api/client';

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

  // Gmail Sync
  const [gmailForm, setGmailForm] = useState({
    address: '',
    appPassword: ''
  });
  const [isSavingGmail, setIsSavingGmail] = useState(false);
  const [gmailMessage, setGmailMessage] = useState('');
  
  // Background sync state
  const [syncState, setSyncState] = useState({
    isActive: false,
    jobId: null,
    status: null, // 'running' | 'completed' | 'failed'
    tasksCreated: [],
    totalProcessed: 0,
    totalEmails: 0,
    error: null
  });
  const pollIntervalRef = useRef(null);
  
  const [hasAppKey, setHasAppKey] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');

  // Fetch current Gmail status
  useEffect(() => {
    if (user?.id) {
      const fetchGmailStatus = async () => {
        try {
          const { data } = await supabase
            .from('staff')
            .select('gmail_address, gmail_app_password')
            .eq('id', user.id)
            .single();
          if (data?.gmail_address && data?.gmail_app_password) {
            setHasAppKey(true);
            setSavedEmail(data.gmail_address);
          }
        } catch (err) {
          console.error('Failed to fetch Gmail status:', err);
        }
      };
      fetchGmailStatus();
    }
  }, [user]);

  // Cleanup poll interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Export
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportCSV = async () => {
    if (!user?.id) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const tasks = await fetchTasks(user.id);

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

  const handleSaveGmail = async () => {
    if (!user?.id) return;
    setGmailMessage('');
    if (!gmailForm.address || !gmailForm.appPassword) {
      setGmailMessage('Please enter both Gmail address and App Password.');
      return;
    }
    setIsSavingGmail(true);
    try {
      await apiClient.post('/gmail/save-credentials', {
        staffId: user.id,
        gmailAddress: gmailForm.address,
        gmailAppPassword: gmailForm.appPassword
      });
      
      setGmailMessage('✅ App Key updated successfully!');
      setHasAppKey(true);
      setSavedEmail(gmailForm.address);
      setGmailForm(prev => ({ ...prev, appPassword: '' }));
    } catch (err) {
      setGmailMessage('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSavingGmail(false);
    }
  };

  // ─── Background Sync with Polling ──────────────────────────

  const pollSyncStatus = useCallback(async (jobId) => {
    try {
      const res = await apiClient.get(`/gmail/sync-status/${jobId}`);
      const data = res.data;

      setSyncState(prev => ({
        ...prev,
        status: data.status,
        tasksCreated: data.tasksCreated || [],
        totalProcessed: data.totalProcessed || 0,
        totalEmails: data.totalEmails || 0,
        error: data.error
      }));

      // Stop polling if completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setSyncState(prev => ({ ...prev, isActive: false }));
      }
    } catch (err) {
      console.error('Failed to poll sync status:', err);
      // Don't stop polling on transient errors
    }
  }, []);

  const handleSyncGmail = async () => {
    if (!user?.id || syncState.isActive) return;

    // Reset sync state
    setSyncState({
      isActive: true,
      jobId: null,
      status: 'starting',
      tasksCreated: [],
      totalProcessed: 0,
      totalEmails: 0,
      error: null
    });

    try {
      const res = await apiClient.post('/gmail/sync', {
        staffId: user.id
      });

      const jobId = res.data.jobId;
      setSyncState(prev => ({ ...prev, jobId, status: 'running' }));

      // Start polling every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        pollSyncStatus(jobId);
      }, 3000);

    } catch (err) {
      setSyncState({
        isActive: false,
        jobId: null,
        status: 'failed',
        tasksCreated: [],
        totalProcessed: 0,
        totalEmails: 0,
        error: err.response?.data?.error || err.message
      });
    }
  };

  // ─── Sync Status UI Component ──────────────────────────────

  const renderSyncStatus = () => {
    if (!syncState.status) return null;

    // Running state — show animated progress
    if (syncState.status === 'running' || syncState.status === 'starting') {
      const progress = syncState.totalEmails > 0 
        ? Math.round((syncState.totalProcessed / syncState.totalEmails) * 100) 
        : 0;

      return (
        <div className="mb-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div className="absolute inset-0 w-5 h-5 rounded-full bg-blue-400/20 animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Syncing emails in background...
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  {syncState.totalEmails > 0 
                    ? `Processing ${syncState.totalProcessed} of ${syncState.totalEmails} email(s)...`
                    : 'Connecting to Gmail and searching for unread emails...'
                  }
                </p>
              </div>
              {syncState.tasksCreated.length > 0 && (
                <span className="shrink-0 px-2.5 py-1 bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                  {syncState.tasksCreated.length} task(s) found
                </span>
              )}
            </div>
            
            {/* Progress bar */}
            {syncState.totalEmails > 0 && (
              <div className="w-full bg-blue-200/50 dark:bg-blue-800/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(progress, 5)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Completed state
    if (syncState.status === 'completed') {
      return (
        <div className="mb-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Sync complete! {syncState.tasksCreated.length} task(s) created from {syncState.totalProcessed} email(s).
              </p>
            </div>

            {syncState.tasksCreated.length > 0 && (
              <div className="mt-3 space-y-1.5 pl-8">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2">
                  Tasks Created:
                </p>
                {syncState.tasksCreated.map((title, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <Zap className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span>{title}</span>
                  </div>
                ))}
                <a 
                  href="/tasks" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 mt-3 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View in Tasks page
                </a>
              </div>
            )}

            {syncState.tasksCreated.length === 0 && syncState.totalProcessed > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 pl-8 mt-1">
                No actionable college/educational tasks were found in the processed emails.
              </p>
            )}

            {syncState.totalProcessed === 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 pl-8 mt-1 flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5" />
                No emails found in your inbox.
              </p>
            )}
          </div>
        </div>
      );
    }

    // Failed state
    if (syncState.status === 'failed') {
      return (
        <div className="mb-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">Sync failed</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  {syncState.error || 'An unknown error occurred. Please check your credentials and try again.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
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

        {/* Gmail Integration */}
        <Card hover={false}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gmail Integration</h3>
                <p className="text-sm text-slate-500">
                  Connect your Gmail to auto-create tasks from college & educational emails.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              icon={syncState.isActive ? Loader2 : RefreshCw}
              onClick={handleSyncGmail}
              disabled={syncState.isActive || !hasAppKey}
            >
              {syncState.isActive ? 'Syncing...' : 'Sync Emails Now'}
            </Button>
          </div>

          {/* Sync Status Panel */}
          {renderSyncStatus()}

          <div className="space-y-4 max-w-sm">
            {hasAppKey && savedEmail ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 text-sm rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Connected to: <strong>{savedEmail}</strong>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-lg border border-blue-200 dark:border-blue-800">
                Note: You must generate a 16-character <strong>App Password</strong> from your Google Account settings. Your regular password will not work.
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Gmail Address</label>
              <input
                type="email"
                value={gmailForm.address}
                onChange={(e) => setGmailForm(prev => ({ ...prev, address: e.target.value }))}
                className="input-field"
                placeholder="faculty@college.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">App Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={gmailForm.appPassword}
                  onChange={(e) => setGmailForm(prev => ({ ...prev, appPassword: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="16-character app password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {gmailMessage && (
              <p className={`text-sm font-medium ${gmailMessage.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>
                {gmailMessage}
              </p>
            )}

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 shrink-0" />
                Syncs your <strong>latest 5 emails</strong> (read &amp; unread) and creates tasks from college/educational content only.
              </p>
            </div>

            <Button
              variant="primary"
              icon={Save}
              onClick={handleSaveGmail}
              loading={isSavingGmail}
              disabled={!gmailForm.address || !gmailForm.appPassword || isSavingGmail}
            >
              {hasAppKey ? 'Update App Key' : 'Save Credentials'}
            </Button>
          </div>

          {/* Info box: Only educational emails */}
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-xs rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Smart Filtering:</strong> Only emails related to college work, academic duties, examinations, 
              committee work, and official department communications will be converted to tasks. 
              Personal, promotional, and spam emails are automatically ignored.
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
            <details className="group cursor-pointer">
              <summary className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 outline-none">
                <span className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs group-open:bg-blue-100 dark:group-open:bg-blue-900/50 transition-colors">
                  ?
                </span>
                How to generate a Gmail App Password
              </summary>
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 space-y-2 pl-6 pb-2">
                <p>An App Password is a 16-digit passcode that gives a non-Google app permission to access your Google Account securely.</p>
                <ol className="list-decimal space-y-1 pl-4 marker:text-blue-500 font-medium">
                  <li>Go to your <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Account Security page</a>.</li>
                  <li>Ensure <strong>2-Step Verification</strong> is turned ON.</li>
                  <li>In the search bar at the top, type <strong>"App Passwords"</strong> and select it.</li>
                  <li>Enter a name for the app (e.g. "RoleSync AI") and click <strong>Create</strong>.</li>
                  <li>Copy the 16-character password in the yellow bar (you can ignore the spaces).</li>
                  <li>Paste it into the <strong>App Password</strong> field above.</li>
                </ol>
              </div>
            </details>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
