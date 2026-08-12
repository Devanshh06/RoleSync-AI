import React, { useState, useEffect } from 'react';
import { fetchTasks, updateTask } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const HandoverChecklist = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id).then(data => {
        setTasks(data);
        setLoading(false);
      });
    }
  }, [user]);

  const handleToggle = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Done' ? 'Not Started' : 'Done';
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await updateTask(taskId, { status: newStatus });
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-500">Loading checklist...</div>;

  const completedCount = tasks.filter(t => t.status === 'Done').length;
  const progress = Math.round((completedCount / tasks.length) * 100) || 0;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Clearance Checklist</h1>
          <p className="text-slate-500 dark:text-slate-400">Complete these mandatory tasks to successfully hand over your role.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{progress}%</div>
          <div className="text-sm font-medium text-slate-500">Completed</div>
        </div>
      </div>

      <div className="glass dark:glass-dark rounded-2xl overflow-hidden shadow-sm">
        {tasks.map((task, index) => (
          <div 
            key={task.id} 
            className={clsx(
              "p-4 flex items-start gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer",
              index !== tasks.length - 1 && "border-b border-slate-100 dark:border-slate-800"
            )}
            onClick={() => handleToggle(task.id, task.status)}
          >
            <div className="mt-0.5">
              {task.status === 'Done' ? (
                <CheckCircle2 className="w-6 h-6 text-green-500 transition-transform hover:scale-110" />
              ) : (
                <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                {task.category?.name || 'Uncategorized'}
              </div>
              <div className={clsx(
                "text-base transition-all duration-300",
                task.status === 'Done' ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-200 font-medium"
              )}>
                {task.title}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {progress === 100 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-xl flex items-center gap-3 border border-green-200 dark:border-green-800 animate-slide-up">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">All tasks completed! You are ready to generate the final handover brief.</span>
        </div>
      )}
    </div>
  );
};

export default HandoverChecklist;
