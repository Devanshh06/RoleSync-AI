import React, { useState, useEffect, useRef } from 'react';
import {
  Archive, Upload, FileText, Search, Trash2, Loader2, Plus, X,
  Users, User, Download, Calendar, Filter, UploadCloud, File,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { fetchDocuments, uploadVaultDocument, deleteDocument } from '../services/documentService';
import { fetchAllStaff } from '../services/staffService';
import { useAuth } from '../context/AuthContext';

const DocumentVaultPage = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null,
    targetScope: 'all',
    targetStaffIds: [],
  });
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUpload = async () => {
    setShowUploadModal(true);
    if (staffList.length === 0) {
      try {
        const staff = await fetchAllStaff();
        setStaffList(staff.filter(s => s.id !== user?.id));
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.split('.').slice(0, -1).join('.'),
      }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title.trim()) return;
    setIsUploading(true);
    try {
      await uploadVaultDocument(
        uploadForm.file,
        uploadForm.title.trim(),
        uploadForm.description.trim(),
        uploadForm.targetScope,
        uploadForm.targetStaffIds,
        user?.id
      );
      await loadDocuments();
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', file: null, targetScope: 'all', targetStaffIds: [] });
    } catch (err) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      await deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const toggleStaffTarget = (staffId) => {
    setUploadForm(prev => ({
      ...prev,
      targetStaffIds: prev.targetStaffIds.includes(staffId)
        ? prev.targetStaffIds.filter(id => id !== staffId)
        : [...prev.targetStaffIds, staffId],
    }));
  };

  const filteredDocs = documents.filter(doc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q) ||
      doc.file_name?.toLowerCase().includes(q) ||
      doc.uploader?.full_name?.toLowerCase().includes(q)
    );
  });

  const filteredStaffForPicker = staffList.filter(s =>
    s.full_name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📗';
    if (['ppt', 'pptx'].includes(ext)) return '📙';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['zip', 'rar', '7z'].includes(ext)) return '📦';
    return '📄';
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Archive className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Document Vault
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Shared document repository. Upload documents for all or specific faculty — tasks are auto-created.
          </p>
        </div>
        <button
          onClick={handleOpenUpload}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Documents', value: documents.length, color: 'text-blue-600' },
          { label: 'For All Staff', value: documents.filter(d => d.target_scope === 'all').length, color: 'text-emerald-600' },
          { label: 'For Specific', value: documents.filter(d => d.target_scope === 'specific').length, color: 'text-purple-600' },
        ].map(stat => (
          <Card key={stat.label} padding="p-4" className="text-center">
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents by title, uploader, or filename..."
          className="input-field pl-10"
        />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-slate-500">Loading documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card hover={false} className="text-center py-16">
          <EmptyState
            icon={Archive}
            title={searchQuery ? 'No documents found' : 'No documents yet'}
            description={searchQuery ? 'Try a different search term.' : 'Upload your first document to share with faculty.'}
            action={!searchQuery ? (
              <Button variant="primary" icon={Upload} onClick={handleOpenUpload}>Upload First Document</Button>
            ) : null}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocs.map((doc, i) => (
            <Card
              key={doc.id}
              className="flex flex-col animate-slide-up group"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{getFileIcon(doc.file_name)}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{doc.title}</h3>
                    <p className="text-xs text-slate-500 truncate">{doc.file_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {doc.uploaded_by === user?.id && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {doc.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{doc.description}</p>
              )}

              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                    {doc.uploader?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                  </div>
                  <span className="font-medium text-slate-600 dark:text-slate-400">{doc.uploader?.full_name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    doc.target_scope === 'all'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  }`}>
                    {doc.target_scope === 'all' ? 'All Staff' : 'Specific'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)} disabled={isUploading}>Cancel</Button>
            <Button
              variant="primary"
              icon={Upload}
              onClick={handleUpload}
              loading={isUploading}
              disabled={!uploadForm.file || !uploadForm.title.trim() || isUploading}
            >
              Upload & Share
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : uploadForm.file
                  ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            {uploadForm.file ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">{getFileIcon(uploadForm.file.name)}</span>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{uploadForm.file.name}</div>
                  <div className="text-xs text-slate-500">{(uploadForm.file.size / 1024).toFixed(1)} KB</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadForm(prev => ({ ...prev, file: null })); }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors ml-2"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Drop a file here or <span className="text-blue-600 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOC, XLS, PPT, Images — up to 50MB</p>
              </>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Syllabus for Data Structures"
              className="input-field"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description (optional)</label>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the document..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Target Scope */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Share With</label>
            <div className="flex gap-3">
              <button
                onClick={() => setUploadForm(prev => ({ ...prev, targetScope: 'all', targetStaffIds: [] }))}
                className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  uploadForm.targetScope === 'all'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Users className="w-4 h-4" /> All Staff
              </button>
              <button
                onClick={() => setUploadForm(prev => ({ ...prev, targetScope: 'specific' }))}
                className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  uploadForm.targetScope === 'specific'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <User className="w-4 h-4" /> Specific Staff
              </button>
            </div>
          </div>

          {/* Staff Picker */}
          {uploadForm.targetScope === 'specific' && (
            <div className="animate-slide-up">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff..."
                  className="input-field pl-9"
                />
              </div>

              {/* Selected tags */}
              {uploadForm.targetStaffIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploadForm.targetStaffIds.map(id => {
                    const s = staffList.find(s => s.id === id);
                    return (
                      <span key={id} className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-medium">
                        {s?.full_name || 'Unknown'}
                        <button onClick={() => toggleStaffTarget(id)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-100 dark:border-slate-800 rounded-xl p-2">
                {filteredStaffForPicker.slice(0, 10).map(s => {
                  const selected = uploadForm.targetStaffIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleStaffTarget(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        selected
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                        selected ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {selected && '✓'}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                        {s.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{s.full_name}</div>
                        <div className="text-xs text-slate-400">{s.department} · {s.email}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DocumentVaultPage;
