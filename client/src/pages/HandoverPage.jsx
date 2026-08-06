import React, { useState, useEffect } from 'react';
import {
  CheckSquare, FileText, ListTodo, CheckCircle2, Circle, AlertCircle,
  Upload, Download, Trash2, Plus, Clock, Calendar, Save, X, ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { getHandoverChecklist, toggleChecklistTask } from '../services/mockApi';

// Mock documents
const MOCK_DOCUMENTS = [
  { id: 'd1', title: 'TCS Placement MoU 2025', category: 'Placement', fileUrl: '#', uploadedBy: 'Devansh Sharma', uploadedAt: '2025-11-15' },
  { id: 'd2', title: 'Internship Guidelines 2025-26', category: 'Academic', fileUrl: '#', uploadedBy: 'Devansh Sharma', uploadedAt: '2025-09-01' },
  { id: 'd3', title: 'Company Contact Directory', category: 'Contacts', fileUrl: '#', uploadedBy: 'Devansh Sharma', uploadedAt: '2025-12-01' },
];

// Mock tasks
const MOCK_TASKS = [
  { id: 'tk1', title: 'Transfer list of active recruiting companies', status: 'In Progress', deadline: '2026-08-15', notes: 'Need to include Infosys and TCS contacts' },
  { id: 'tk2', title: 'Finalize 8th-sem internship spreadsheet', status: 'Not Started', deadline: '2026-08-20', notes: '' },
  { id: 'tk3', title: 'Brief successor on placement cell workflow', status: 'Done', deadline: '2026-08-10', notes: 'Completed during handover meeting' },
  { id: 'tk4', title: 'Upload final MoU documents to shared drive', status: 'Pending', deadline: '2026-08-12', notes: '' },
];

const TABS = [
  { key: 'checklist', label: 'Checklist', icon: CheckSquare },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'tasks', label: 'Tasks', icon: ListTodo },
];

const HandoverPage = () => {
  const [activeTab, setActiveTab] = useState('checklist');
  const [checklistTasks, setChecklistTasks] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [documents] = useState(MOCK_DOCUMENTS);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Load checklist
  useEffect(() => {
    getHandoverChecklist('role-123').then((data) => {
      setChecklistTasks(data);
      setChecklistLoading(false);
    });
  }, []);

  const handleToggleChecklist = async (taskId, currentStatus) => {
    setChecklistTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: currentStatus === 'pending' ? 'completed' : 'pending' } : t))
    );
    await toggleChecklistTask(taskId, currentStatus);
  };

  const completedCount = checklistTasks.filter((t) => t.status === 'completed').length;
  const progress = checklistTasks.length > 0 ? Math.round((completedCount / checklistTasks.length) * 100) : 0;

  const handleTaskStatusChange = (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Handover Workspace</h1>
            <p className="text-slate-500 dark:text-slate-400">Internship Coordinator · Dept. of Computer Science</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{progress}%</div>
            <div className="text-xs font-medium text-slate-500">Overall Progress</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Checklist Tab */}
      {activeTab === 'checklist' && (
        <div className="animate-fade-in">
          {checklistLoading ? (
            <Card hover={false} padding="p-8">
              <div className="text-center animate-pulse text-slate-500">Loading checklist...</div>
            </Card>
          ) : (
            <>
              <Card hover={false} padding="p-0" className="overflow-hidden">
                {checklistTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={clsx(
                      'p-4 flex items-start gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer',
                      index !== checklistTasks.length - 1 && 'border-b border-slate-100 dark:border-slate-800'
                    )}
                    onClick={() => handleToggleChecklist(task.id, task.status)}
                  >
                    <div className="mt-0.5">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500 transition-transform hover:scale-110" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                        {task.category}
                      </div>
                      <div
                        className={clsx(
                          'text-base transition-all duration-300',
                          task.status === 'completed'
                            ? 'text-slate-400 line-through'
                            : 'text-slate-800 dark:text-slate-200 font-medium'
                        )}
                      >
                        {task.task}
                      </div>
                    </div>
                  </div>
                ))}
              </Card>

              {progress === 100 && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-xl flex items-center gap-3 border border-green-200 dark:border-green-800 animate-slide-up">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">All tasks completed! You are ready to generate the final handover brief.</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="animate-fade-in">
          <div className="flex justify-end mb-4">
            <Button variant="primary" icon={Upload} onClick={() => setShowUploadModal(true)}>
              Upload Document
            </Button>
          </div>

          {documents.length === 0 ? (
            <Card hover={false}>
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Upload role-related documents for your successor."
                actionLabel="Upload Document"
                onAction={() => setShowUploadModal(true)}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} padding="p-4" className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-medium">
                          {doc.category}
                        </span>
                        <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="animate-fade-in">
          <div className="flex justify-end mb-4">
            <Button variant="primary" icon={Plus} onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
              Add Task
            </Button>
          </div>

          {tasks.length === 0 ? (
            <Card hover={false}>
              <EmptyState
                icon={ListTodo}
                title="No tasks yet"
                description="Create tasks to track handover action items."
                actionLabel="Add Task"
                onAction={() => setShowTaskModal(true)}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} padding="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{task.title}</div>
                      {task.notes && (
                        <div className="text-sm text-slate-500 mb-2">{task.notes}</div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                        className={clsx(
                          'text-xs font-semibold rounded-lg px-3 py-1.5 border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 appearance-none',
                          task.status === 'Done' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                          task.status === 'In Progress' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                          task.status === 'Not Started' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                          task.status === 'Pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        )}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Upload} onClick={() => setShowUploadModal(false)}>Upload</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Document Title</label>
            <input type="text" placeholder="e.g. Placement MoU 2026" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
            <select className="input-field appearance-none cursor-pointer">
              <option value="">Select category...</option>
              <option value="Academic">Academic</option>
              <option value="Placement">Placement</option>
              <option value="Administrative">Administrative</option>
              <option value="Contacts">Contacts</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">File</label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Drag & drop or click to upload</p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOC, XLSX up to 10MB</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTaskModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Save} onClick={() => setShowTaskModal(false)}>
              {editingTask ? 'Save Changes' : 'Add Task'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Task Title</label>
            <input type="text" placeholder="e.g. Transfer student contact list" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Deadline</label>
            <input type="date" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
            <textarea rows={3} placeholder="Optional notes..." className="input-field resize-none" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HandoverPage;
