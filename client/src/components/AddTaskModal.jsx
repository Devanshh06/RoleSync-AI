import React, { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, Clock, Upload, FileText, Users, Tag,
  AlertCircle, Loader2, CheckCircle2, ChevronDown,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const priorityStyles = {
  Low:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  High:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const AddTaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  staffList = [],
  currentUserId,
  isSubmitting = false,
}) => {
  const overlayRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'Medium',
    date_assigned: new Date().toISOString().split('T')[0],
    deadline: '',
    notes: '',
    coordinatorIds: [],
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [coordSearch, setCoordSearch] = useState('');
  const [showCoordDropdown, setShowCoordDropdown] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setForm({
        title: '',
        description: '',
        category_id: '',
        priority: 'Medium',
        date_assigned: new Date().toISOString().split('T')[0],
        deadline: '',
        notes: '',
        coordinatorIds: [],
      });
      setFile(null);
      setErrors({});
      setCoordSearch('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.category_id) newErrors.category_id = 'Select a category';
    if (!form.date_assigned) newErrors.date_assigned = 'Assign date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, file });
  };

  // File handling
  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  // Co-coordinator filtering
  const filteredStaff = staffList.filter(
    (s) =>
      s.id !== currentUserId &&
      !form.coordinatorIds.includes(s.id) &&
      (s.full_name?.toLowerCase().includes(coordSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(coordSearch.toLowerCase()))
  );

  const addCoordinator = (staffId) => {
    updateField('coordinatorIds', [...form.coordinatorIds, staffId]);
    setCoordSearch('');
    setShowCoordDropdown(false);
  };

  const removeCoordinator = (staffId) => {
    updateField('coordinatorIds', form.coordinatorIds.filter((id) => id !== staffId));
  };

  const selectedCoordinators = staffList.filter((s) => form.coordinatorIds.includes(s.id));

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Task</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the details for your new responsibility</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Task Title <span className="text-red-400">*</span>
              </label>
              <input
                id="task-title"
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Prepare lab manual for Semester 6"
                className={clsx(
                  'input-field',
                  errors.title && 'ring-2 ring-red-400 border-red-400'
                )}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
            </div>

            {/* Category + Priority row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Tag className="w-3.5 h-3.5 inline mr-1" />
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="task-category"
                  value={form.category_id}
                  onChange={(e) => updateField('category_id', e.target.value)}
                  className={clsx(
                    'input-field appearance-none cursor-pointer',
                    errors.category_id && 'ring-2 ring-red-400 border-red-400'
                  )}
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.category_id}</p>}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Priority
                </label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateField('priority', p)}
                      className={clsx(
                        'flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200',
                        form.priority === p
                          ? priorityStyles[p] + ' ring-2 ring-offset-1 ring-current shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                id="task-description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the task in detail..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Date Assigned <span className="text-red-400">*</span>
                </label>
                <input
                  id="task-date-assigned"
                  type="date"
                  value={form.date_assigned}
                  onChange={(e) => updateField('date_assigned', e.target.value)}
                  className={clsx(
                    'input-field',
                    errors.date_assigned && 'ring-2 ring-red-400 border-red-400'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Deadline
                </label>
                <input
                  id="task-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => updateField('deadline', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Co-Coordinators */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                Co-Coordinators
              </label>

              {/* Selected coordinators */}
              {selectedCoordinators.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedCoordinators.map((person) => (
                    <span
                      key={person.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium"
                    >
                      <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[7px] font-bold text-white">
                        {person.full_name?.charAt(0)}
                      </span>
                      {person.full_name}
                      <button
                        type="button"
                        onClick={() => removeCoordinator(person.id)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={coordSearch}
                  onChange={(e) => {
                    setCoordSearch(e.target.value);
                    setShowCoordDropdown(true);
                  }}
                  onFocus={() => setShowCoordDropdown(true)}
                  placeholder="Search staff to add..."
                  className="input-field"
                />
                {/* Dropdown */}
                {showCoordDropdown && coordSearch.length > 0 && filteredStaff.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {filteredStaff.slice(0, 6).map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => addCoordinator(person.id)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {person.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{person.full_name}</div>
                          <div className="text-xs text-slate-400 truncate">{person.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showCoordDropdown && coordSearch.length > 0 && filteredStaff.length === 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-400">
                    No staff found
                  </div>
                )}
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                Document Upload
              </label>

              {!file ? (
                <div
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, XLS, PPT, images (max 10MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Additional Notes
              </label>
              <textarea
                id="task-notes"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Any additional notes, instructions, or context..."
                rows={2}
                className="input-field resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              id="task-submit"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
