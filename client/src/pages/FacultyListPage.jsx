import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, Search, Filter, Plus, AlertTriangle, ChevronRight, Mail, Phone } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

// Mock faculty data
const MOCK_FACULTY = [
  { id: 'u1', name: 'Dr. Raghav Mehta', email: 'raghav@rolesync.edu', department: 'Computer Science', designation: 'HOD', status: 'Active', contact: '+91-9876543210', roles: ['Head of Department'] },
  { id: 'u2', name: 'Devansh Sharma', email: 'devansh@rolesync.edu', department: 'Computer Science', designation: 'Asst. Professor', status: 'Leaving', contact: '+91-9876543211', roles: ['Internship Coordinator', 'Lab Administrator'] },
  { id: 'u3', name: 'Prof. Anita Desai', email: 'anita@rolesync.edu', department: 'Computer Science', designation: 'Assoc. Professor', status: 'Active', contact: '+91-9876543212', roles: ['Exam Controller'] },
  { id: 'u4', name: 'Dr. Vikram Singh', email: 'vikram@rolesync.edu', department: 'Mechanical', designation: 'Professor', status: 'Active', contact: '+91-9876543213', roles: ['Workshop Coordinator'] },
  { id: 'u5', name: 'Dr. Priya Nair', email: 'priya@rolesync.edu', department: 'Electronics', designation: 'Asst. Professor', status: 'Exited', contact: '+91-9876543214', roles: [] },
];

const FacultyListPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [confirmLeaving, setConfirmLeaving] = useState(null);
  const [faculty, setFaculty] = useState(MOCK_FACULTY);

  const departments = ['All', ...new Set(MOCK_FACULTY.map((f) => f.department))];
  const statuses = ['All', 'Active', 'Leaving', 'Exited'];

  const filtered = faculty.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    const matchesDept = deptFilter === 'All' || f.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleMarkLeaving = (facultyMember) => {
    setFaculty((prev) =>
      prev.map((f) => (f.id === facultyMember.id ? { ...f, status: 'Leaving' } : f))
    );
    setConfirmLeaving(null);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
            <UserCog className="text-blue-500" />
            Faculty Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage faculty profiles, track statuses, and initiate handovers.</p>
        </div>
        <Button variant="primary" icon={Plus}>
          Add Faculty
        </Button>
      </div>

      {/* Filters */}
      <Card hover={false} padding="p-4" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[140px]"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                ))}
              </select>
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input-field pr-8 appearance-none cursor-pointer min-w-[160px]"
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Count */}
      <div className="text-sm text-slate-500 mb-4">
        Showing <span className="font-bold text-slate-700 dark:text-slate-300">{filtered.length}</span> of {faculty.length} faculty members
      </div>

      {/* Faculty Table */}
      {filtered.length === 0 ? (
        <Card hover={false}>
          <EmptyState
            icon={UserCog}
            title="No faculty found"
            description="Try adjusting your search or filter criteria."
          />
        </Card>
      ) : (
        <Card hover={false} padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/faculty/${f.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {f.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {f.name}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {f.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 dark:text-slate-300">{f.department}</div>
                      <div className="text-xs text-slate-500">{f.designation}</div>
                    </td>
                    <td className="px-6 py-4">
                      {f.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {f.roles.map((r) => (
                            <span key={r} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-medium">
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No active roles</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {f.status === 'Active' && (
                          <button
                            onClick={() => setConfirmLeaving(f)}
                            className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Mark Leaving
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirm Mark Leaving Modal */}
      <Modal
        isOpen={!!confirmLeaving}
        onClose={() => setConfirmLeaving(null)}
        title="Mark Faculty as Leaving"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmLeaving(null)}>Cancel</Button>
            <Button variant="danger" icon={AlertTriangle} onClick={() => handleMarkLeaving(confirmLeaving)}>
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to mark <span className="font-bold text-slate-800 dark:text-slate-200">{confirmLeaving?.name}</span> as leaving?
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                This will trigger the handover workflow for all roles held by this faculty member. Their tasks will be flagged for reassignment.
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FacultyListPage;
