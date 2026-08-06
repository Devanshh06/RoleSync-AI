import React, { useState } from 'react';
import { FolderOpen, Search, Plus, UserCircle, Building2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

// Mock role directory data
const MOCK_ROLE_DIRECTORY = [
  {
    department: 'Computer Science',
    roles: [
      { id: 'r1', name: 'Head of Department', holder: 'Dr. Raghav Mehta', holderStatus: 'Active', since: '2022-01-15' },
      { id: 'r2', name: 'Internship Coordinator', holder: 'Devansh Sharma', holderStatus: 'Leaving', since: '2024-01-10' },
      { id: 'r3', name: 'Lab Administrator', holder: 'Devansh Sharma', holderStatus: 'Leaving', since: '2023-06-01' },
      { id: 'r4', name: 'Exam Controller', holder: 'Prof. Anita Desai', holderStatus: 'Active', since: '2023-08-20' },
    ],
  },
  {
    department: 'Mechanical',
    roles: [
      { id: 'r5', name: 'Workshop Coordinator', holder: 'Dr. Vikram Singh', holderStatus: 'Active', since: '2023-02-01' },
      { id: 'r6', name: 'Head of Department', holder: 'Prof. Sunita Rao', holderStatus: 'Active', since: '2021-07-01' },
    ],
  },
  {
    department: 'Electronics',
    roles: [
      { id: 'r7', name: 'Lab In-Charge', holder: null, holderStatus: null, since: null },
      { id: 'r8', name: 'Head of Department', holder: 'Dr. Amit Patel', holderStatus: 'Active', since: '2022-09-15' },
    ],
  },
];

const RoleDirectoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDept, setNewRoleDept] = useState('');

  const filteredDirectory = MOCK_ROLE_DIRECTORY.map((dept) => ({
    ...dept,
    roles: dept.roles.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.holder && r.holder.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter((dept) => dept.roles.length > 0);

  const totalRoles = MOCK_ROLE_DIRECTORY.reduce((acc, d) => acc + d.roles.length, 0);
  const vacantRoles = MOCK_ROLE_DIRECTORY.reduce((acc, d) => acc + d.roles.filter((r) => !r.holder).length, 0);
  const atRiskRoles = MOCK_ROLE_DIRECTORY.reduce((acc, d) => acc + d.roles.filter((r) => r.holderStatus === 'Leaving').length, 0);

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
          Create Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Roles', value: totalRoles, color: 'text-blue-600' },
          { label: 'Vacant', value: vacantRoles, color: 'text-red-600' },
          { label: 'At Risk (Leaving)', value: atRiskRoles, color: 'text-amber-600' },
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
          placeholder="Search roles or holders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Directory by Department */}
      {filteredDirectory.length === 0 ? (
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
                  {dept.roles.length} roles
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dept.roles.map((role) => (
                  <Card key={role.id} padding="p-4" className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{role.name}</div>
                      {role.holder ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <UserCircle className="w-4 h-4" />
                          <span>{role.holder}</span>
                          {role.since && (
                            <span className="text-xs text-slate-400">
                              · since {new Date(role.since).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-red-500 italic">Vacant — needs assignment</div>
                      )}
                    </div>
                    <div>
                      {role.holderStatus ? (
                        <StatusBadge status={role.holderStatus} size="xs" />
                      ) : (
                        <StatusBadge status="Blocked" size="xs" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Plus} disabled={!newRoleName.trim()} onClick={() => setShowCreateModal(false)}>
              Create Role
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Role Name</label>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="e.g. Placement Coordinator"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
            <select
              value={newRoleDept}
              onChange={(e) => setNewRoleDept(e.target.value)}
              className="input-field appearance-none cursor-pointer"
            >
              <option value="">Select department...</option>
              {MOCK_ROLE_DIRECTORY.map((d) => (
                <option key={d.department} value={d.department}>{d.department}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleDirectoryPage;
