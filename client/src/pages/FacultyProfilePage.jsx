import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, Briefcase, Edit2, Save, X, CheckSquare } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';

// Mock data
const MOCK_PROFILES = {
  'u1': { id: 'u1', name: 'Dr. Raghav Mehta', email: 'raghav@rolesync.edu', department: 'Computer Science', designation: 'Head of Department', contact: '+91-9876543210', status: 'Active', userType: 'Admin' },
  'u2': { id: 'u2', name: 'Devansh Sharma', email: 'devansh@rolesync.edu', department: 'Computer Science', designation: 'Assistant Professor', contact: '+91-9876543211', status: 'Leaving', userType: 'Faculty' },
  'u3': { id: 'u3', name: 'Prof. Anita Desai', email: 'anita@rolesync.edu', department: 'Computer Science', designation: 'Associate Professor', contact: '+91-9876543212', status: 'Active', userType: 'Faculty' },
};

const MOCK_ROLES = {
  'u1': [{ id: 'ra1', roleName: 'Head of Department', startDate: '2022-01-15', isActive: true, progress: 100 }],
  'u2': [
    { id: 'ra2', roleName: 'Internship Coordinator', startDate: '2024-01-10', isActive: true, progress: 65 },
    { id: 'ra3', roleName: 'Lab Administrator', startDate: '2023-06-01', isActive: true, progress: 40 },
  ],
  'u3': [{ id: 'ra4', roleName: 'Exam Controller', startDate: '2023-08-20', isActive: true, progress: 100 }],
};

const FacultyProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const profile = MOCK_PROFILES[id];
  const roles = MOCK_ROLES[id] || [];

  if (!profile) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Faculty Not Found</h2>
        <p className="text-slate-500 mb-6">The requested faculty profile does not exist.</p>
        <Button variant="primary" onClick={() => navigate('/faculty')}>Back to Faculty List</Button>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    contact: profile.contact,
    designation: profile.designation,
    department: profile.department,
  });

  const handleSave = () => {
    // In production: call updateUser API
    setIsEditing(false);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        to="/faculty"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Faculty List
      </Link>

      {/* Profile Header */}
      <Card className="relative overflow-hidden mb-6" padding="p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0">
            {profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h1>
              <StatusBadge status={profile.status} />
            </div>
            <p className="text-slate-500">{profile.designation} · {profile.department}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {profile.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {profile.contact}</span>
            </div>
          </div>

          <Button
            variant={isEditing ? 'danger' : 'secondary'}
            icon={isEditing ? X : Edit2}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </Card>

      {/* Edit Form */}
      {isEditing && (
        <Card className="mb-6 animate-slide-up">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Edit Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'name', icon: Briefcase },
              { label: 'Email', key: 'email', icon: Mail },
              { label: 'Contact', key: 'contact', icon: Phone },
              { label: 'Designation', key: 'designation', icon: Briefcase },
              { label: 'Department', key: 'department', icon: Building2 },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                <input
                  type="text"
                  value={formData[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="input-field"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button variant="primary" icon={Save} onClick={handleSave}>Save Changes</Button>
          </div>
        </Card>
      )}

      {/* Roles Held */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-500" />
          Roles Held ({roles.length})
        </h3>
        {roles.length === 0 ? (
          <Card hover={false}>
            <p className="text-center text-slate-500 py-8">No active roles assigned.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <Card key={role.id} padding="p-5" className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{role.roleName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Since {new Date(role.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{role.progress}%</div>
                    <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${role.progress}%` }}
                      />
                    </div>
                  </div>
                  <StatusBadge status={role.isActive ? 'Active' : 'Exited'} size="xs" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyProfilePage;
