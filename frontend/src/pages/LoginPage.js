import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// Separate login mode: student or teacher
const MODES = [
  { key: 'student', label: 'Student Login', icon: '📚', color: 'from-eco-600 to-eco-700', accent: 'text-eco-600 dark:text-eco-400' },
  { key: 'teacher', label: 'Teacher Login', icon: '🎓', color: 'from-purple-600 to-purple-700', accent: 'text-purple-600 dark:text-purple-400' },
];

function validateField(name, value) {
  if (name === 'email') {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    if (!value.toLowerCase().endsWith('@gmail.com')) return 'Only Gmail addresses (@gmail.com) are accepted';
  }
  if (name === 'password') {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
  }
  return '';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const currentMode = MODES.find(m => m.key === mode);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
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
    const errs = { email: validateField('email', form.email), password: validateField('password', form.password) };
    setFieldErrors(errs);
    setTouched({ email: true, password: true });
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true);
    try {
      const data = await login(form.email.trim(), form.password);
      // Redirect teacher to teacher dashboard, others to student dashboard
      if (data.user?.role === 'teacher') navigate('/teacher');
      else if (data.user?.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) => {
    const base = 'input-field';
    if (!touched[field]) return base;
    if (fieldErrors[field]) return `${base} border-red-400 focus:ring-red-300 dark:border-red-500`;
    if (form[field]) return `${base} border-eco-400 focus:ring-eco-300`;
    return base;
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      {/* ── Left panel ── */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${currentMode.color} flex-col items-center justify-center p-12 relative overflow-hidden transition-all duration-500`}>
        <div className="absolute inset-0 leaf-pattern opacity-20" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center">
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="text-8xl mb-6">
            {mode === 'teacher' ? '🎓' : '🌍'}
          </motion.div>
          <h1 className="font-display text-4xl font-bold text-white mb-4">
            {mode === 'teacher' ? 'EcoQuest for Teachers' : 'Welcome to EcoQuest'}
          </h1>
          <p className="text-white/80 text-lg max-w-sm leading-relaxed">
            {mode === 'teacher'
              ? 'Create quizzes, manage missions, review student activities and track learning progress.'
              : 'Learn, earn, and protect our planet through gamified environmental education.'}
          </p>
          <div className="mt-8 flex gap-3 justify-center flex-wrap">
            {mode === 'teacher'
              ? ['📝 Create Quizzes', '👥 Track Students', '✅ Review Activities'].map(i => (
                  <div key={i} className="bg-white/10 rounded-xl px-4 py-2 text-white text-sm font-medium border border-white/20">{i}</div>
                ))
              : ['🏆 Leaderboards', '🎯 Missions', '📚 Quizzes'].map(i => (
                  <div key={i} className="bg-white/10 rounded-xl px-4 py-2 text-white text-sm font-medium border border-white/20">{i}</div>
                ))
            }
          </div>
        </motion.div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">{mode === 'teacher' ? '🎓' : '🌍'}</span>
            <h1 className="font-display text-2xl font-bold text-eco-700 dark:text-eco-300 mt-2">EcoQuest</h1>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {MODES.map(m => (
              <button key={m.key} onClick={() => { setMode(m.key); setApiError(''); setForm({ email: '', password: '' }); setTouched({}); setFieldErrors({}); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m.key ? 'bg-white dark:bg-[#1a2e1f] shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                <span>{m.icon}</span>{m.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Sign in</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-7">
                {mode === 'teacher' ? 'Access your teacher dashboard' : 'Continue your environmental journey'}
              </p>

              {apiError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                  <span className="flex-shrink-0">⚠️</span><span>{apiError}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Gmail Address <span className="text-red-500">*</span>
                  </label>
                  <input type="email" name="email" placeholder="yourname@gmail.com"
                    value={form.email} onChange={handleChange} onBlur={handleBlur}
                    className={inputCls('email')} autoComplete="email" autoFocus />
                  {touched.email && fieldErrors.email && <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} name="password" placeholder="Enter your password"
                      value={form.password} onChange={handleChange} onBlur={handleBlur}
                      className={`${inputCls('password')} pr-10`} autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {touched.password && fieldErrors.password && <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.password}</p>}
                </div>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className={`w-full py-3 text-base font-semibold text-white rounded-xl transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r ${currentMode.color}`}>
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>{mode === 'teacher' ? '🎓' : '🌱'}</motion.span> Signing in...</span>
                    : `${mode === 'teacher' ? '🎓 Sign In as Teacher' : '🔓 Sign In'}`
                  }
                </motion.button>
              </form>

              {mode === 'student' && (
                <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
                  New to EcoQuest?{' '}
                  <Link to="/register" className={`font-semibold hover:underline ${currentMode.accent}`}>Create account</Link>
                </p>
              )}

              {mode === 'teacher' && (
                <p className="text-center mt-5 text-gray-500 dark:text-gray-400 text-sm">
                  New to EcoQuest?{' '}
                  <a href="/teacher/register" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                    Sign Up as Teacher
                  </a>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
