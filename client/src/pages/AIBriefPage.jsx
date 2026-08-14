import React, { useState } from 'react';
import { fetchTasks } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { Sparkles, FileText, Download, Users, Clock, ListChecks, ArrowRight, RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const AIBriefPage = () => {
  const { user } = useAuth();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Fetch real tasks for the user
      const tasks = await fetchTasks(user.id);

      const pending = tasks.filter(t => t.status !== 'Done');
      const completed = tasks.filter(t => t.status === 'Done');
      const overdue = tasks.filter(t => t.deadline && t.status !== 'Done' && new Date(t.deadline) < new Date());

      // Extract unique coordinators from tasks
      const contactSet = new Map();
      tasks.forEach(t => {
        if (t.coordinators) {
          t.coordinators.forEach(c => {
            const s = c.staff;
            if (s && s.id !== user.id && !contactSet.has(s.id)) {
              contactSet.set(s.id, {
                name: s.full_name,
                email: s.email,
                org: 'Co-coordinator',
              });
            }
          });
        }
      });

      // Group pending by category
      const categoryGroups = {};
      pending.forEach(t => {
        const cat = t.category?.name || 'Uncategorized';
        if (!categoryGroups[cat]) categoryGroups[cat] = [];
        categoryGroups[cat].push(t.title);
      });

      setBrief({
        generatedAt: new Date().toLocaleString(),
        summary: `You have ${tasks.length} total tasks across ${Object.keys(categoryGroups).length} categories. ${completed.length} tasks are completed (${tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0}% completion rate). ${overdue.length > 0 ? `⚠️ ${overdue.length} task(s) are overdue and need immediate attention.` : '✅ No overdue tasks.'}`,
        pendingActions: pending.length > 0
          ? pending.slice(0, 8).map(t => {
              const cat = t.category?.name ? `[${t.category.name}] ` : '';
              const deadline = t.deadline ? ` — Due: ${new Date(t.deadline).toLocaleDateString()}` : '';
              return `${cat}${t.title}${deadline}`;
            })
          : ['No pending actions. Great job! 🎉'],
        keyContacts: contactSet.size > 0
          ? Array.from(contactSet.values()).slice(0, 6)
          : [{ name: 'No contacts', email: '-', org: 'Add co-coordinators to your tasks' }],
        nextActions: [
          ...(overdue.length > 0 ? [`Address ${overdue.length} overdue task(s) immediately`] : []),
          ...(pending.length > 0 ? [`Complete ${pending.length} remaining pending tasks`] : []),
          'Review and update task deadlines for the current semester',
          'Ensure all handover documents are uploaded',
          ...(completed.length > 0 ? [`Archive ${completed.length} completed tasks for records`] : []),
        ].slice(0, 5),
        overdueCount: overdue.length,
        completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      });
    } catch (err) {
      console.error('Failed to generate brief:', err);
      setBrief({
        generatedAt: new Date().toLocaleString(),
        summary: 'Failed to generate brief. Please check your connection and try again.',
        pendingActions: ['Unable to load task data'],
        keyContacts: [],
        nextActions: ['Retry generating the brief'],
        overdueCount: 0,
        completionRate: 0,
      });
    }

    setLoading(false);
  };

  const handleExportPDF = () => {
    // Create a printable version
    const content = `
ROLESYNC AI — HANDOVER BRIEF
Generated: ${brief.generatedAt}
User: ${user?.name || 'Unknown'}

EXECUTIVE SUMMARY
${brief.summary}

PENDING ACTIONS
${brief.pendingActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

RECOMMENDED NEXT STEPS
${brief.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

KEY CONTACTS
${brief.keyContacts.map(c => `- ${c.name} (${c.org}) — ${c.email}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handover_brief_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Sparkles className="text-blue-600 dark:text-blue-400 w-6 h-6" />
          </div>
          AI Handover Brief
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Synthesize your task history, pending actions, and contacts into a structured document using AI.
        </p>
      </div>

      {/* Pre-generation state */}
      {!brief && !loading && (
        <Card hover={false} className="border-dashed border-2 border-slate-200 dark:border-slate-700 text-center" padding="p-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Ready to compile?</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Our AI will analyze your tasks, deadlines, contacts, and progress to generate a comprehensive handover brief.
          </p>
          <Button variant="primary" size="lg" icon={Sparkles} onClick={handleGenerate}>
            Generate Brief Now
          </Button>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card hover={false} className="text-center" padding="p-12">
          <div className="w-20 h-20 mx-auto mb-5 relative">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
            <Sparkles className="absolute inset-0 m-auto text-blue-600 w-7 h-7 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Analyzing your data...</h3>
          <p className="text-slate-500 text-sm">Aggregating tasks, contacts, deadlines, and progress.</p>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-400">
            <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> Analyzing tasks</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Extracting contacts</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Checking deadlines</span>
          </div>
        </Card>
      )}

      {/* Generated brief */}
      {brief && !loading && (
        <div className="animate-slide-up space-y-6">
          {/* Actions bar */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 flex items-center gap-4">
              <span>Generated on {brief.generatedAt}</span>
              {brief.completionRate !== undefined && (
                <span className={`font-bold ${brief.completionRate >= 80 ? 'text-green-600' : brief.completionRate >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                  {brief.completionRate}% complete
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" icon={RefreshCw} onClick={handleGenerate}>
                Regenerate
              </Button>
              <Button variant="primary" icon={Download} onClick={handleExportPDF}>
                Export
              </Button>
            </div>
          </div>

          {/* Summary */}
          <Card hover={false}>
            <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Executive Summary
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{brief.summary}</p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Actions */}
            <Card hover={false}>
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending Actions
                {brief.overdueCount > 0 && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                    {brief.overdueCount} overdue
                  </span>
                )}
              </h3>
              <ul className="space-y-3">
                {brief.pendingActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Next Actions */}
            <Card hover={false}>
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-emerald-500" />
                Recommended Next Steps
              </h3>
              <ul className="space-y-3">
                {brief.nextActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Key Contacts */}
          <Card hover={false}>
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" />
              Key Contacts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {brief.keyContacts.map((contact, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{contact.name}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{contact.org}</div>
                  <div className="text-xs text-slate-500 mt-1">{contact.email}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIBriefPage;
