import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AVATARS } from '../utils/constants';

// ── Password strength helper ──────────────────────────────────────────────────
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

// ── Inline field validation ───────────────────────────────────────────────────
function validateField(name, value, allValues) {
  switch (name) {
    case 'username':
      if (!value.trim()) return 'Username is required';
      if (value.trim().length < 3) return 'Username must be at least 3 characters';
      if (value.trim().length > 20) return 'Username cannot exceed 20 characters';
      return '';
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
      if (!value.toLowerCase().endsWith('@gmail.com')) return 'Only Gmail addresses (@gmail.com) are allowed on EcoQuest';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return '';
    case 'studentType':
      if (!value) return 'Please select your student type';
      return '';
    default:
      return '';
  }
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '', email: '', password: '', avatar: '🌱', studentType: '', institution: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const strength = getStrength(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value, form) }));
    }
    setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value, form) }));
  };

  const handleStudentType = (type) => {
    setForm(f => ({ ...f, studentType: type }));
    setTouched(t => ({ ...t, studentType: true }));
    setFieldErrors(prev => ({ ...prev, studentType: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validate all fields
    const fields = ['username', 'email', 'password', 'studentType'];
    const errs = {};
    fields.forEach(f => { errs[f] = validateField(f, form[f], form); });
    setFieldErrors(errs);
    setTouched({ username: true, email: true, password: true, studentType: true });
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.avatar, form.studentType, form.institution);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) => {
    const base = 'input-field';
    if (!touched[field]) return base;
    if (fieldErrors[field]) return `${base} border-red-400 focus:ring-red-300 dark:border-red-500`;
    if (form[field]) return `${base} border-eco-400 focus:ring-eco-300`;
    return base;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-5xl mb-3"
          >
            {form.avatar}
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">Join EcoQuest</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Start your environmental journey today</p>
        </div>

        <div className="card p-8">
          {/* API error */}
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2"
            >
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <span>{apiError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Choose your avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(av => (
                  <motion.button
                    key={av} type="button"
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(f => ({ ...f, avatar: av }))}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      form.avatar === av
                        ? 'bg-eco-100 dark:bg-eco-900/40 ring-2 ring-eco-500'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >{av}</motion.button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="username" placeholder="EcoHero123"
                value={form.username} onChange={handleChange} onBlur={handleBlur}
                className={inputClass('username')} autoComplete="username"
              />
              {touched.username && fieldErrors.username && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span>{fieldErrors.username}
                </p>
              )}
            </div>

            {/* Email — Gmail only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Gmail Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email" name="email" placeholder="yourname@gmail.com"
                value={form.email} onChange={handleChange} onBlur={handleBlur}
                className={inputClass('email')} autoComplete="email"
              />
              {touched.email && fieldErrors.email ? (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span>{fieldErrors.email}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  🔒 Only @gmail.com addresses are accepted
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} name="password"
                  placeholder="Min. 6 characters"
                  value={form.password} onChange={handleChange} onBlur={handleBlur}
                  className={`${inputClass('password')} pr-10`} autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span>{fieldErrors.password}
                </p>
              )}
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : '#e5e7eb' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strength.color }}>
                    Password strength: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Student Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                I am a <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'School Student', icon: '📚', sub: 'Grade 1–12' },
                  { value: 'College Student', icon: '🎓', sub: 'UG / PG / PhD' },
                ].map(opt => (
                  <motion.button
                    key={opt.value}
                    type="button"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleStudentType(opt.value)}
                    className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                      form.studentType === opt.value
                        ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-eco-300 dark:hover:border-eco-700'
                    }`}
                  >
                    {form.studentType === opt.value && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-eco-500 text-white text-xs flex items-center justify-center">✓</span>
                    )}
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{opt.value}</span>
                    <span className="text-xs text-gray-400">{opt.sub}</span>
                  </motion.button>
                ))}
              </div>
              {touched.studentType && fieldErrors.studentType && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span>{fieldErrors.studentType}
                </p>
              )}
            </div>


            {/* Institution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                🏫 Institution / School Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text" name="institution" placeholder="e.g., Lovely Professional University"
                value={form.institution} onChange={handleChange}
                className="input-field" autoComplete="organization"
              />
            </div>

                        {/* Submit */}
            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="btn-primary w-full py-3 text-base"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🌱</motion.span>
                    Creating account...
                  </span>
                : '🚀 Start My Journey'
              }
            </motion.button>
          </form>

          <p className="text-center mt-5 text-gray-500 dark:text-gray-400 text-sm">
            Already a member?{' '}
            <Link to="/login" className="text-eco-600 dark:text-eco-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
