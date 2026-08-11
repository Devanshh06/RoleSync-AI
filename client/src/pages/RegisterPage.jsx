import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerStaff } from '../services/staffService';
import {
  GraduationCap, User, Mail, Lock, Phone, Building2,
  Briefcase, Loader2, Eye, EyeOff, ArrowRight, CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Mathematics',
  'Physics',
  'Humanities',
  'Management Studies',
  'Other',
];

// Input wrapper with icon — defined outside RegisterPage to avoid
// re-creating the component on every render (which causes focus loss).
const InputField = ({ icon: Icon, id, label, type = 'text', value, onChange, placeholder, error: fieldErr, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      {children || (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${
            fieldErr ? 'border-red-400/50 ring-1 ring-red-400/30' : 'border-white/10'
          } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
        />
      )}
    </div>
    {fieldErr && <p className="text-xs text-red-400 mt-1">{fieldErr}</p>}
  </div>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    designation: '',
    contact: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (error) setError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.department) errs.department = 'Select a department';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      await registerStaff({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        department: form.department,
        designation: form.designation.trim(),
        contact: form.contact.trim(),
      });
      setStep(2);
    } catch (err) {
      if (err.code === '23505') {
        setError('An account with this email already exists.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-lg px-6 py-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl mb-5 shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            RoleSync <span className="text-blue-400">AI</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Institutional Role Handover Platform
          </p>
        </div>

        {step === 1 ? (
          <div className="animate-scale-in">
            {/* Registration card */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-1">Create your account</h2>
              <p className="text-slate-400 text-sm mb-6">Join your institution's continuity platform</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <InputField
                  id="register-name"
                  icon={User}
                  label="Full Name"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Dr. Raghav Mehta"
                  error={fieldErrors.fullName}
                />

                {/* Email */}
                <InputField
                  id="register-email"
                  icon={Mail}
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@institution.edu"
                  error={fieldErrors.email}
                />

                {/* Password row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-10 py-3 bg-white/5 border ${
                          fieldErrors.password ? 'border-red-400/50 ring-1 ring-red-400/30' : 'border-white/10'
                        } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="register-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-10 py-3 bg-white/5 border ${
                          fieldErrors.confirmPassword ? 'border-red-400/50 ring-1 ring-red-400/30' : 'border-white/10'
                        } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      id="register-department"
                      value={form.department}
                      onChange={(e) => updateField('department', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${
                        fieldErrors.department ? 'border-red-400/50 ring-1 ring-red-400/30' : 'border-white/10'
                      } rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white`}
                    >
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.department && <p className="text-xs text-red-400 mt-1">{fieldErrors.department}</p>}
                </div>

                {/* Designation + Contact row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    id="register-designation"
                    icon={Briefcase}
                    label="Designation"
                    value={form.designation}
                    onChange={(e) => updateField('designation', e.target.value)}
                    placeholder="Assistant Professor"
                  />
                  <InputField
                    id="register-contact"
                    icon={Phone}
                    label="Contact Number"
                    type="tel"
                    value={form.contact}
                    onChange={(e) => updateField('contact', e.target.value)}
                    placeholder="+91-9876543210"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 animate-fade-in">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  id="register-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* Success state */
          <div className="animate-scale-in text-center">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
              <p className="text-slate-400 text-sm mb-8">
                Your staff account has been successfully registered. You can now sign in to access the platform.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Login
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 mt-8">
          © 2026 RoleSync AI · Institutional Continuity Platform
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
