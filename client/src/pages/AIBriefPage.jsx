import React, { useState } from 'react';
import { generateAIBrief } from '../services/mockApi';
import { Sparkles, FileText, Download, Users, Clock, ListChecks, ArrowRight, RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const AIBriefPage = () => {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsedBrief, setParsedBrief] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    const data = await generateAIBrief('role-123');
    setBrief(data);

    // Parse mock brief into structured sections
    setParsedBrief({
      generatedAt: new Date().toLocaleString(),
      pendingActions: [
        'Reach out to TCS regarding the upcoming campus drive',
        'Finalize the student spreadsheet for 8th-semester internships',
        'Update the placement cell master tracker',
      ],
      keyContacts: [
        { name: 'Mr. Sharma', org: 'Infosys HR', email: 'sharma@infosys.example.com' },
        { name: 'Neha', org: 'Wipro Onboarding', email: 'neha@wipro.example.com' },
        { name: 'Placement Cell', org: 'Internal', email: 'placements@college.edu' },
      ],
      summary: 'The Internship Coordinator role oversees industry partnerships, student placements, and maintains relationships with recruiting companies. The current handover is 65% complete with key documentation already transferred.',
      nextActions: [
        'Schedule a handover meeting with successor',
        'Transfer shared drive access',
        'Follow up on pending MoU with Cognizant',
      ],
    });

    setLoading(false);
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
            Our AI will read your completed checklist and institutional history to generate a comprehensive handover brief for your successor.
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">AI is compiling your brief...</h3>
          <p className="text-slate-500 text-sm">Aggregating contacts, pending tasks, and institutional history.</p>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-400">
            <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> Analyzing checklist</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Extracting contacts</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Reviewing history</span>
          </div>
        </Card>
      )}

      {/* Generated brief */}
      {parsedBrief && !loading && (
        <div className="animate-slide-up space-y-6">
          {/* Actions bar */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Generated on {parsedBrief.generatedAt}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" icon={RefreshCw} onClick={handleGenerate}>
                Regenerate
              </Button>
              <Button variant="primary" icon={Download}>
                Export as PDF
              </Button>
            </div>
          </div>

          {/* Summary */}
          <Card hover={false}>
            <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Executive Summary
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{parsedBrief.summary}</p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Actions */}
            <Card hover={false}>
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending Actions
              </h3>
              <ul className="space-y-3">
                {parsedBrief.pendingActions.map((action, i) => (
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
                {parsedBrief.nextActions.map((action, i) => (
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
              {parsedBrief.keyContacts.map((contact, i) => (
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
