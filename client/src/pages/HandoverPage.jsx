import React, { useState, useEffect } from 'react';
import {
  ListTodo, CheckCircle2, Clock, Check, X, FolderOpen, AlertCircle,
  UserPlus, Search, FileText, Loader2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { fetchMyHandovers, updateRequestStatus, requestAccess } from '../services/handoverService';
import { fetchPredecessorTasks } from '../services/taskService';
import { fetchAllStaff } from '../services/staffService';
import { useAuth } from '../context/AuthContext';

const HandoverPage = () => {
  const { user } = useAuth();
  
  const [handovers, setHandovers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Request access state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [requestingId, setRequestingId] = useState(null);

  // Workspace state
  const [activeWorkspace, setActiveWorkspace] = useState(null);
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
      const tasks = await fetchPredecessorTasks(handover.predecessor_id);
      setWorkspaceTasks(tasks);
    } catch (err) {
      console.error('Failed to load predecessor tasks:', err);
      alert('Failed to load workspace data.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleShowRequestForm = async () => {
    setShowRequestForm(true);
    if (staffList.length === 0) {
      try {
        const staff = await fetchAllStaff();
        setStaffList(staff.filter(s => s.id !== user?.id));
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    }
  };

  const handleRequestAccess = async (predecessorId) => {
    setRequestingId(predecessorId);
    try {
      await requestAccess(predecessorId, user.id);
      await loadHandovers();
      setShowRequestForm(false);
      setStaffSearch('');
    } catch (err) {
      alert(err.message || 'Failed to send request.');
    } finally {
      setRequestingId(null);
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Please log in to view handovers.</div>;

  const outgoing = handovers.filter(h => h.predecessor_id === user.id);
  const incoming = handovers.filter(h => h.successor_id === user.id);

  // Filter staff for request form
  const existingPredecessorIds = incoming.map(h => h.predecessor_id);
  const filteredStaff = staffList.filter(
    s => !existingPredecessorIds.includes(s.id) &&
      (s.full_name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
       s.email?.toLowerCase().includes(staffSearch.toLowerCase()) ||
       s.department?.toLowerCase().includes(staffSearch.toLowerCase()))
  );

  // Workspace view
  if (activeWorkspace) {
    const predecessor = activeWorkspace.predecessor;
    const tasksWithDocs = workspaceTasks.filter(t => t.document_url);

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
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
            <span className="text-slate-500">Loading workspace...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tasks */}
            <Card hover={false} padding="p-0" className="overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-blue-500" /> 
                  Tasks ({workspaceTasks.length})
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
                        {task.description && (
                          <div className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</div>
                        )}
                        {task.deadline && (
                          <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Due: {new Date(task.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.document_url && (
                          <a
                            href={task.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> Doc
                          </a>
                        )}
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

            {/* Documents summary */}
            {tasksWithDocs.length > 0 && (
              <Card hover={false} padding="p-0" className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Documents ({tasksWithDocs.length})
                  </h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tasksWithDocs.map(task => (
                    <a
                      key={task.id}
                      href={task.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {task.document_name || 'Document'}
                        </div>
                        <div className="text-xs text-slate-400">From: {task.title}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // Main requests view
  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Handover Access</h1>
          <p className="text-slate-500 dark:text-slate-400">Request access to view tasks, documents, and activities from other faculty.</p>
        </div>
        <button
          onClick={handleShowRequestForm}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm shadow-lg shadow-blue-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Request Access
        </button>
      </div>

      {/* Request Access Modal/Form */}
      {showRequestForm && (
        <Card hover={false} className="mb-8 border-2 border-blue-200 dark:border-blue-800 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              Request Faculty Access
            </h3>
            <button onClick={() => { setShowRequestForm(false); setStaffSearch(''); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Search for the faculty member whose workspace you'd like to access.</p>
          
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              placeholder="Search by name, email, or department..."
              className="input-field pl-10"
              autoFocus
            />
          </div>

          {staffSearch.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredStaff.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No matching faculty found.</p>
              ) : (
                filteredStaff.slice(0, 8).map(person => (
                  <div key={person.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {person.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{person.full_name}</div>
                        <div className="text-xs text-slate-400">{person.department || 'No department'} · {person.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRequestAccess(person.id)}
                      disabled={requestingId === person.id}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      {requestingId === person.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Request'
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
          <span className="text-slate-500">Loading requests...</span>
        </div>
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
                <EmptyState icon={AlertCircle} title="No incoming requests" description="Use 'Request Access' above to request access to a faculty member's workspace." />
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
                        <div className="text-xs text-slate-500">{req.predecessor?.email} · {req.predecessor?.department}</div>
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
