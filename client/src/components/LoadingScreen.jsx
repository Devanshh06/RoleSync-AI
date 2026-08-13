import React from 'react';
import { GraduationCap } from 'lucide-react';

const LoadingScreen = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
    {/* Animated gradient background */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-conic from-blue-500/10 via-transparent to-indigo-500/10 animate-spin" style={{ animationDuration: '8s' }} />
    </div>

    <div className="relative animate-fade-in">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-600/20">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">RoleSync</div>
          <div className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider w-fit">AI</div>
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-loading-bar" />
      </div>
      <p className="text-xs text-slate-400 mt-4 text-center">Loading your workspace...</p>
    </div>

    <style>{`
      @keyframes loading-bar {
        0% { width: 0; }
        50% { width: 80%; }
        100% { width: 100%; }
      }
      .animate-loading-bar {
        animation: loading-bar 1.5s ease-in-out infinite;
      }
    `}</style>
  </div>
);

export default LoadingScreen;
