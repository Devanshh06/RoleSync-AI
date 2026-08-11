import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList, Plus, Filter, Search, Loader2,
  BookOpen, FlaskConical, Waypoints, Presentation,
  Briefcase, GraduationCap, ClipboardCheck, Microscope,
  MoreHorizontal, LayoutGrid, List, AlertCircle,
  CheckCircle2, Clock, TrendingUp,
} from 'lucide-react';
import Card from '../components/ui/Card';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import EmptyState from '../components/ui/EmptyState';
import { fetchTasks, fetchTasksByCategory, createTask, updateTask, deleteTask, uploadDocument, fetchCategories } from '../services/taskService';
import { fetchAllStaff } from '../services/staffService';

// Icon mapping for categories
const categoryIcons = {
  BookOpen, FlaskConical, Waypoints, Presentation,
  Briefcase, GraduationCap, ClipboardCheck, Microscope,
  MoreHorizontal,
};

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = "All"
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [categoriesData, staffData] = await Promise.all([
        fetchCategories(),
        fetchAllStaff(),
      ]);
      setCategories(categoriesData);
      setStaffList(staffData);

      // Load tasks for current user
      if (user?.id) {
        const tasksData = await fetchTasks(user.id);
        setTasks(tasksData);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Connection Error: ' + (err.message || err.error_description || 'Check console for details'));
      // Set empty arrays as fallback
      setCategories([]);
      setStaffList([]);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks by category
  const handleCategoryFilter = useCallback(async (categoryId) => {
    setSelectedCategory(categoryId);
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const data = categoryId
        ? await fetchTasksByCategory(user.id, categoryId)
        : await fetchTasks(user.id);
      setTasks(data);
    } catch (err) {
      console.error('Failed to filter tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Create task
  const handleCreateTask = async (formData) => {
    setIsSubmitting(true);
    try {
      let documentUrl = null;
      let documentName = null;

      // Upload document if provided
      if (formData.file) {
        const uploadResult = await uploadDocument(formData.file);
        documentUrl = uploadResult.url;
        documentName = uploadResult.name;
      }

      const taskData = {
        title: formData.title,
        description: formData.description || null,
        category_id: formData.category_id || null,
        assigned_to: user?.id,
        created_by: user?.id,
        priority: formData.priority,
        date_assigned: formData.date_assigned,
        deadline: formData.deadline || null,
        notes: formData.notes || null,
        document_url: documentUrl,
        document_name: documentName,
        status: 'Not Started',
      };

      await createTask(taskData, formData.coordinatorIds);

      // Reload tasks
      const updatedTasks = selectedCategory
        ? await fetchTasksByCategory(user.id, selectedCategory)
        : await fetchTasks(user.id);
      setTasks(updatedTasks);

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update task status
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Search filter (client-side)
  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.category?.name?.toLowerCase().includes(q) ||
      task.notes?.toLowerCase().includes(q)
    );
  });

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'Not Started' || t.status === 'In Progress').length,
    completed: tasks.filter((t) => t.status === 'Done').length,
    overdue: tasks.filter((t) => {
      if (!t.deadline || t.status === 'Done') return false;
      return new Date(t.deadline) < new Date();
    }).length,
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Tasks</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Manage your responsibilities, deadlines, and coordinations
            </p>
          </div>
          <button
            id="add-task-btn"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Tasks', value: stats.total, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} hover={false} padding="p-4" className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Category Filter Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {/* All button */}
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              selectedCategory === null
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All
          </button>

          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat.icon] || MoreHorizontal;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryFilter(cat.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
                style={isActive ? { backgroundColor: cat.color, boxShadow: `0 4px 14px ${cat.color}33` } : {}}
              >
                <IconComponent className="w-4 h-4" />
                <span className="whitespace-nowrap">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, description, or notes..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-5 py-4 mb-6 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Connection Error</p>
            <p className="text-sm opacity-80 mt-0.5">{error}</p>
            <button onClick={loadData} className="text-sm font-semibold underline mt-2 hover:opacity-80">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-slate-500">Loading your tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty state */
        <div className="animate-fade-in">
          <Card hover={false} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-5">
              <ClipboardList className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {searchQuery ? 'No tasks found' : selectedCategory ? 'No tasks in this category' : 'No tasks yet'}
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">
              {searchQuery
                ? `No tasks match "${searchQuery}". Try a different search term.`
                : 'Get started by adding your first task. Track your teaching, coordination, and other responsibilities.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Task
              </button>
            )}
          </Card>
        </div>
      ) : (
        /* Task Grid / List */
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {filteredTasks.map((task, i) => (
            <div key={task.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <TaskCard
                task={task}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        categories={categories}
        staffList={staffList}
        currentUserId={user?.id}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TasksPage;
