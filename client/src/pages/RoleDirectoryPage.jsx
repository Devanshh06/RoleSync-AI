import React, { useState, useEffect } from 'react';
import { FolderOpen, Search, Plus, UserCircle, Building2, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { supabase } from '../lib/supabaseClient';

const RoleDirectoryPage = () => {
  const [directory, setDirectory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDept, setNewRoleDept] = useState('');

  useEffect(() => {
    loadDirectory();
  }, []);

  const loadDirectory = async () => {
    setIsLoading(true);
    try {
      // Fetch all staff with their task counts
      const { data: staffData, error: staffErr } = await supabase
        .from('staff')
        .select('id, full_name, email, department, designation, status, avatar_url')
        .order('full_name');

      if (staffErr) throw staffErr;

      // Fetch task stats per staff
      const { data: tasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('assigned_to, status');

      // Build task stats per staff
      const statsMap = {};
      if (!tasksErr && tasks) {
        tasks.forEach(t => {
          if (!statsMap[t.assigned_to]) {
            statsMap[t.assigned_to] = { total: 0, done: 0 };
          }
          statsMap[t.assigned_to].total++;
          if (t.status === 'Done') statsMap[t.assigned_to].done++;
        });
      }

      // Group staff by department
      const deptMap = {};
      (staffData || []).forEach(s => {
        const dept = s.department || 'Unassigned';
        if (!deptMap[dept]) {
          deptMap[dept] = { department: dept, roles: [] };
        }
        const stats = statsMap[s.id] || { total: 0, done: 0 };
        const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

        deptMap[dept].roles.push({
          id: s.id,
          name: s.designation || 'Faculty',
          holder: s.full_name,
          holderStatus: s.status,
          email: s.email,
          taskCount: stats.total,
          progress,
        });
      });

      setDirectory(Object.values(deptMap).sort((a, b) => a.department.localeCompare(b.department)));
    } catch (err) {
      console.error('Failed to load directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    // Insert a new category (closest to "roles" concept)
    try {
      await supabase.from('task_categories').insert([{
        name: newRoleName,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      }]);
      setShowCreateModal(false);
      setNewRoleName('');
      setNewRoleDept('');
    } catch (err) {
      alert('Failed to create: ' + err.message);
    }
  };

  const filteredDirectory = directory
    .map(dept => ({
      ...dept,
      roles: dept.roles.filter(
        r =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.holder && r.holder.toLowerCase().includes(searchQuery.toLowerCase())) ||
          dept.department.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(dept => dept.roles.length > 0);

  const totalRoles = directory.reduce((acc, d) => acc + d.roles.length, 0);
  const leavingCount = directory.reduce(
    (acc, d) => acc + d.roles.filter(r => r.holderStatus === 'Leaving').length,
    0
  );
  const activeCount = directory.reduce(
    (acc, d) => acc + d.roles.filter(r => r.holderStatus === 'Active').length,
    0
  );
  const allDepartments = [...new Set(directory.map(d => d.department))];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
            <FolderOpen className="text-blue-500" />
            Role Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Who holds what — across all departments.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Staff', value: totalRoles, color: 'text-blue-600' },
          { label: 'Active', value: activeCount, color: 'text-emerald-600' },
          { label: 'Leaving', value: leavingCount, color: 'text-amber-600' },
        ].map((stat) => (
          <Card key={stat.label} padding="p-4" className="text-center">
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search roles, names, or departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-slate-500">Loading directory...</p>
        </div>
      ) : filteredDirectory.length === 0 ? (
        <Card hover={false}>
          <EmptyState
            icon={FolderOpen}
            title="No roles match your search"
            description="Try a different keyword or clear the search."
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredDirectory.map((dept) => (
            <div key={dept.department}>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{dept.department}</h2>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                  {dept.roles.length} members
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dept.roles.map((role) => (
                  <Card key={role.id} padding="p-4" className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{role.name}</div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <UserCircle className="w-4 h-4" />
                        <span>{role.holder}</span>
                        <span className="text-xs text-slate-400">
                          · {role.taskCount} tasks
                        </span>
                      </div>
                      {role.taskCount > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-700 ${
                                role.progress === 100 ? 'bg-green-500' : role.progress > 50 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${role.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500">{role.progress}%</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <StatusBadge status={role.holderStatus || 'Active'} size="xs" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Task Category"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Plus} disabled={!newRoleName.trim()} onClick={handleCreateRole}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category Name</label>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="e.g. Placement Coordinator"
              className="input-field"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleDirectoryPage;
