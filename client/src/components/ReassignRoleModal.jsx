import React, { useState, useEffect } from 'react';
import { UserPlus, Calendar } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

// Mock faculty list for development
const MOCK_FACULTY = [
  { id: 'u1', name: 'Dr. Raghav Mehta', department: 'Computer Science' },
  { id: 'u2', name: 'Devansh Sharma', department: 'Computer Science' },
  { id: 'u3', name: 'Prof. Anita Desai', department: 'Computer Science' },
  { id: 'u4', name: 'Dr. Vikram Singh', department: 'Mechanical' },
];

const ReassignRoleModal = ({
  isOpen,
  onClose,
  roleName,
  currentHolder,
  onConfirm,
  facultyList,
}) => {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const faculty = facultyList || MOCK_FACULTY;

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setSelectedFaculty('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedFaculty || !startDate) return;
    setSubmitting(true);
    try {
      await onConfirm?.({ userId: selectedFaculty, startDate });
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  const availableFaculty = faculty.filter((f) => f.id !== currentHolder?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Role"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            icon={UserPlus}
            loading={submitting}
            disabled={!selectedFaculty || !startDate}
            onClick={handleConfirm}
          >
            Confirm Reassignment
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Role info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            Role being reassigned
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{roleName || 'Unnamed Role'}</div>
          {currentHolder && (
            <div className="text-sm text-slate-500 mt-1">
              Currently held by: <span className="font-medium text-slate-700 dark:text-slate-300">{currentHolder.name}</span>
            </div>
          )}
        </div>

        {/* Select new faculty */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Assign to
          </label>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="input-field"
          >
            <option value="">Select a faculty member...</option>
            {availableFaculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.department}
              </option>
            ))}
          </select>
        </div>

        {/* Start date */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <Calendar className="inline w-4 h-4 mr-1 -mt-0.5" />
            Effective from
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ReassignRoleModal;
