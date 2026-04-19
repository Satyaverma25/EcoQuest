import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (s === 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (s === 3) return { score: 3, label: 'Good', color: '#3b82f6' };
  return { score: 4, label: 'Strong', color: '#10b981' };
}

function validateField(name, value) {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      return '';
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
      if (!value.toLowerCase().endsWith('@gmail.com')) return 'Only Gmail addresses (@gmail.com) are allowed';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return '';
    case 'confirmPassword':
      return ''; // checked separately
    default:
      return '';
  }
}

export default function TeacherRegisterPage() {
  const { registerTeacher } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', institution: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getStrength(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
    setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validate all fields
    const fields = ['name', 'email', 'password'];
    const errs = {};
    fields.forEach(f => { errs[f] = validateField(f, form[f]); });

    // Confirm password check
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errs);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      await registerTeacher(form.name.trim(), form.email.trim(), form.password, form.institution.trim());
      navigate('/teacher');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) => {
    const base = 'input-field';
    if (!touched[field]) return base;
    if (fieldErrors[field]) return `${base} border-red-400 focus:ring-red-300 dark:border-red-500`;
    if (form[field]) return `${base} border-purple-400 focus:ring-purple-300`;
    return base;
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-purple-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-20" />
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl mb-6"
          >
            🎓
          </motion.div>
          <h1 className="font-display text-4xl font-bold text-white mb-4">Join as a Teacher</h1>
          <p className="text-white/80 text-lg max-w-sm leading-relaxed">
            Empower your students with gamified environmental education. Create quizzes, manage missions and track progress.
          </p>
          <div className="mt-8 space-y-3">
            {[
              ['📝', 'Create custom quizzes for your class'],
              ['✅', 'Review & approve student activities'],
              ['📊', 'Track student progress with analytics'],
              ['🎯', 'Assign missions to your students'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 text-white text-sm border border-white/20">
                <span className="text-lg flex-shrink-0">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right register panel */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
          className="w-full max-w-md py-6"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <span className="text-5xl">🎓</span>
            <h1 className="font-display text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">EcoQuest Teacher</h1>
          </div>

          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Teacher Sign Up</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-7">Create your teacher account to get started</p>

          {apiError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{apiError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="name" placeholder="Dr. Priya Sharma"
                value={form.name} onChange={handleChange} onBlur={handleBlur}
                className={inputCls('name')} autoComplete="name" autoFocus
              />
              {touched.name && fieldErrors.name && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">⚠ {fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Gmail Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email" name="email" placeholder="yourname@gmail.com"
                value={form.email} onChange={handleChange} onBlur={handleBlur}
                className={inputCls('email')} autoComplete="email"
              />
              {touched.email && fieldErrors.email
                ? <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.email}</p>
                : <p className="mt-1.5 text-xs text-gray-400">🔒 Only @gmail.com addresses are accepted</p>
              }
            </div>

            {/* Institution (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                School / College Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text" name="institution" placeholder="e.g., Lovely Professional University"
                value={form.institution} onChange={handleChange}
                className="input-field" autoComplete="organization"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} name="password"
                  placeholder="Minimum 6 characters"
                  value={form.password} onChange={handleChange} onBlur={handleBlur}
                  className={`${inputCls('password')} pr-10`} autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.password}</p>
              )}
              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : '#e5e7eb' }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strength.color }}>
                    Password strength: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                  className={`${inputCls('confirmPassword')} pr-10`} autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.confirmPassword}</p>
              )}
              {touched.confirmPassword && !fieldErrors.confirmPassword && form.confirmPassword && form.password === form.confirmPassword && (
                <p className="mt-1.5 text-xs text-eco-600 dark:text-eco-400">✓ Passwords match</p>
              )}
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3 text-base font-semibold text-white rounded-xl transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🎓</motion.span>
                    Creating account...
                  </span>
                : '🎓 Create Teacher Account'
              }
            </motion.button>
          </form>

          <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
            Already have a teacher account?{' '}
            <Link to="/login" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
