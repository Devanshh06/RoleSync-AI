import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, Search, Filter, Plus, AlertTriangle, ChevronRight, Mail, Phone, LockKeyhole } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { getDirectoryStaff, updateStaffProfile } from '../services/staffService';
import { requestAccess, fetchMyHandovers } from '../services/handoverService';
import { useAuth } from '../context/AuthContext';

const FacultyListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [faculty, setFaculty] = useState([]);
  const [myHandovers, setMyHandovers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  
  const [confirmLeaving, setConfirmLeaving] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [staffData, handoversData] = await Promise.all([
        getDirectoryStaff(),
        user?.id ? fetchMyHandovers(user.id) : Promise.resolve([])
      ]);
      setFaculty(staffData);
      setMyHandovers(handoversData);
    } catch (err) {
      console.error('Failed to load faculty:', err);
      setError('Failed to load directory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const departments = ['All', ...new Set(faculty.map((f) => f.department).filter(Boolean))];
  const statuses = ['All', 'Active', 'Leaving', 'Exited'];

  const filtered = faculty.filter((f) => {
    const matchesSearch = f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || f.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    const matchesDept = deptFilter === 'All' || f.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleMarkLeaving = async (facultyMember) => {
    setIsProcessing(true);
    try {
      await updateStaffProfile(facultyMember.id, { status: 'Leaving' });
      await loadData();
      setConfirmLeaving(null);
    } catch (err) {
      alert('Failed to mark as leaving: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestAccess = async (e, predecessorId) => {
    e.stopPropagation();
    if (!user?.id) return alert('Please log in first.');
    
    setIsProcessing(true);
    try {
      await requestAccess(predecessorId, user.id);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to check if we already requested access
  const getHandoverStatus = (predId) => {
    const req = myHandovers.find(h => h.predecessor_id === predId && h.successor_id === user?.id);
    return req ? req.status : null;
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
            <UserCog className="text-blue-500" />
            Faculty Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage faculty profiles and request handover access.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
          {error}
        </div>
      )}

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
      {isLoading ? (
        <div className="text-center p-12 text-slate-500">Loading directory...</div>
      ) : filtered.length === 0 ? (
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Handover Access</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const reqStatus = getHandoverStatus(f.id);
                  const isMe = f.id === user?.id;
                  
                  return (
                    <tr
                      key={f.id}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {f.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {f.full_name} {isMe && <span className="text-xs text-blue-500 ml-1">(You)</span>}
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
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isMe && f.status === 'Leaving' && (
                          reqStatus ? (
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              reqStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                              reqStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {reqStatus}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => handleRequestAccess(e, f.id)}
                              disabled={isProcessing}
                              className="text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center justify-end gap-1 ml-auto transition-colors"
                            >
                              <LockKeyhole className="w-3 h-3" />
                              Request Access
                            </button>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {f.status === 'Active' && !isMe && (
                            <button
                              onClick={() => setConfirmLeaving(f)}
                              className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Mark Leaving
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            <Button variant="secondary" onClick={() => setConfirmLeaving(null)} disabled={isProcessing}>Cancel</Button>
            <Button variant="danger" icon={AlertTriangle} onClick={() => handleMarkLeaving(confirmLeaving)} disabled={isProcessing}>
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to mark <span className="font-bold text-slate-800 dark:text-slate-200">{confirmLeaving?.full_name}</span> as leaving?
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                This will allow other staff members to request handover access to their tasks and documents.
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FacultyListPage;
