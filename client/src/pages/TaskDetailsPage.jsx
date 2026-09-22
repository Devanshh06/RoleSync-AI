import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Calendar, AlertCircle, FileText, 
  CheckCircle2, Building2, UserCircle, Users, Activity,
  Download, Loader2 
} from 'lucide-react';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import { fetchTaskById } from '../services/taskService';

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Urgent': return 'text-rose-600 bg-rose-100 dark:bg-rose-900/30';
    case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    case 'Medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    case 'Low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
  }
};

const TaskDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTask = async () => {
      try {
        const data = await fetchTaskById(id);
        if (!data) {
          setError('Task not found');
        } else {
          setTask(data);
        }
      } catch (err) {
        setError('Failed to load task details: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading task details...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Card className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-slate-500 mb-6">{error || 'Task could not be found.'}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="text-blue-600 font-semibold hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Card className="mb-6 relative overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{task.title}</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <StatusBadge status={task.status} />
              
              {task.priority && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${getPriorityColor(task.priority)}`}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {task.priority} Priority
                </span>
              )}
              
              {task.category && (
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  {task.category.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Description
              </h3>
              <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                {task.description || 'No description provided.'}
              </div>
            </div>

            {task.notes && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Internal Notes
                </h3>
                <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  {task.notes}
                </div>
              </div>
            )}
            
            {task.document_url && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  Reference Document
                </h3>
                <a 
                  href={task.document_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {task.document_name || 'Download Attached Document'}
                </a>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card padding="p-4" className="bg-slate-50 dark:bg-slate-800/50 border-none shadow-none">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Dates & Deadlines</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Assigned On</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {task.date_assigned ? new Date(task.date_assigned).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Done' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Deadline</div>
                    <div className={`text-sm font-semibold ${task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Done' ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'}`}>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="p-4" className="bg-slate-50 dark:bg-slate-800/50 border-none shadow-none">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">People</h3>
              <div className="space-y-4">
                {task.creator && (
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1.5 flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" /> Assigned By</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold">
                         {task.creator.full_name?.substring(0, 2).toUpperCase() || 'AD'}
                       </div>
                       {task.creator.full_name}
                    </div>
                  </div>
                )}

                {task.assignee && (
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1.5 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Primary Assignee</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                         {task.assignee.full_name?.substring(0, 2).toUpperCase() || 'FA'}
                       </div>
                       {task.assignee.full_name}
                    </div>
                  </div>
                )}

                {task.coordinators && task.coordinators.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Co-Coordinators</div>
                    <div className="space-y-2">
                      {task.coordinators.map((c) => (
                        <div key={c.staff?.id} className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-[9px] text-white font-bold">
                            {c.staff?.full_name?.substring(0, 2).toUpperCase() || 'CO'}
                          </div>
                          {c.staff?.full_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TaskDetailsPage;
