import React, { useState, useEffect } from 'react';
import {
  ListTodo, CheckCircle2, Clock, Check, X, FolderOpen, AlertCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { fetchMyHandovers, updateRequestStatus } from '../services/handoverService';
import { fetchPredecessorTasks } from '../services/taskService';
import { useAuth } from '../context/AuthContext';

const HandoverPage = () => {
  const { user } = useAuth();
  
  const [handovers, setHandovers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Workspace state
  const [activeWorkspace, setActiveWorkspace] = useState(null); // The selected handover request
  const [workspaceTasks, setWorkspaceTasks] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  useEffect(() => {
    loadHandovers();
  }, [user]);

  const loadHandovers = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const data = await fetchMyHandovers(user.id);
      setHandovers(data);
    } catch (err) {
      console.error('Failed to load handovers:', err);
      setError('Failed to load handover requests.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await updateRequestStatus(requestId, status);
      await loadHandovers();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleOpenWorkspace = async (handover) => {
    setActiveWorkspace(handover);
    setWorkspaceLoading(true);
    try {
      // Fetch the actual tasks of the person who is leaving
      const tasks = await fetchPredecessorTasks(handover.predecessor_id);
      setWorkspaceTasks(tasks);
    } catch (err) {
      console.error('Failed to load predecessor tasks:', err);
      alert('Failed to load workspace data.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Please log in to view handovers.</div>;

  const outgoing = handovers.filter(h => h.predecessor_id === user.id);
  const incoming = handovers.filter(h => h.successor_id === user.id);

  // If a workspace is active, render the workspace view
  if (activeWorkspace) {
    const predecessor = activeWorkspace.predecessor;
    return (
      <div className="animate-fade-in max-w-5xl mx-auto">
        <button 
          onClick={() => setActiveWorkspace(null)}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-6 flex items-center gap-1 transition-colors"
        >
          &larr; Back to Requests
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            Handover Workspace: {predecessor?.full_name || 'Staff'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {predecessor?.designation} · {predecessor?.department}
          </p>
        </div>

        {workspaceLoading ? (
          <div className="text-center p-12 text-slate-500">Loading tasks...</div>
        ) : (
          <Card hover={false} padding="p-0" className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-500" /> 
                Predecessor's Active Tasks ({workspaceTasks.length})
              </h2>
            </div>
            {workspaceTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No active tasks"
                description="This staff member has no tasks assigned to them."
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {workspaceTasks.map(task => (
                  <div key={task.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">
                        {task.category?.name || 'Uncategorized'}
                      </div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {task.title}
                      </div>
                      {task.deadline && (
                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Due: {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        task.status === 'Done' ? 'bg-green-100 text-green-700' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  // Render the Requests list
  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Handover Access</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage incoming and outgoing requests to view tasks and documents.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-12 text-slate-500">Loading requests...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Outgoing Handovers (Where I am predecessor) */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-500" />
              My Outgoing Handovers
            </h2>
            {outgoing.length === 0 ? (
              <Card hover={false}>
                <EmptyState icon={AlertCircle} title="No outgoing requests" description="No one has requested access to your data yet." />
              </Card>
            ) : (
              <div className="space-y-4">
                {outgoing.map(req => (
                  <Card key={req.id} padding="p-5" className="border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Requested by:</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {req.successor?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-xs text-slate-500">{req.successor?.email}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    
                    {req.status === 'Pending' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="primary" icon={Check} onClick={() => handleUpdateStatus(req.id, 'Approved')} className="flex-1 bg-green-600 hover:bg-green-700 ring-green-600">
                          Approve
                        </Button>
                        <Button variant="danger" icon={X} onClick={() => handleUpdateStatus(req.id, 'Rejected')} className="flex-1">
                          Reject
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Handovers (Where I am successor) */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-500" />
              My Incoming Handovers
            </h2>
            {incoming.length === 0 ? (
              <Card hover={false}>
                <EmptyState icon={AlertCircle} title="No incoming requests" description="You have not requested access to anyone's data." />
              </Card>
            ) : (
              <div className="space-y-4">
                {incoming.map(req => (
                  <Card key={req.id} padding="p-5" className="border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Requested from:</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {req.predecessor?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-xs text-slate-500">{req.predecessor?.email}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    
                    {req.status === 'Approved' && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="primary" onClick={() => handleOpenWorkspace(req)} className="w-full">
                          View Workspace
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default HandoverPage;
