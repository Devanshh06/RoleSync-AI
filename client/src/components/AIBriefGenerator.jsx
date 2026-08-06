import React, { useState } from 'react';
import { generateAIBrief } from '../services/mockApi';
import { Sparkles, FileText, Download } from 'lucide-react';

const AIBriefGenerator = () => {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const data = await generateAIBrief('role-123');
    setBrief(data);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Sparkles className="text-blue-500" />
          AI Handover Brief
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Synthesize your task history, pending actions, and contacts into a structured document using Gemini 3 Flash.
        </p>
      </div>

      {!brief && !loading && (
        <div className="glass dark:glass-dark rounded-2xl p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Ready to compile?</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Our AI will read your completed checklist and institutional history to generate a comprehensive handover brief for your successor.
          </p>
          <button onClick={handleGenerate} className="btn-primary flex items-center gap-2 mx-auto">
            <Sparkles className="w-4 h-4" />
            Generate Brief Now
          </button>
        </div>
      )}

      {loading && (
        <div className="glass dark:glass-dark rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto text-blue-600 w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold">Gemini 3 Flash is thinking...</h3>
          <p className="text-slate-500 text-sm mt-2">Aggregating contacts and pending tasks.</p>
        </div>
      )}

      {brief && (
        <div className="animate-slide-up">
          <div className="flex justify-end mb-4">
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export as PDF
            </button>
          </div>
          <div className="glass dark:glass-dark rounded-2xl p-8 shadow-sm">
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300">
                {brief}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIBriefGenerator;
