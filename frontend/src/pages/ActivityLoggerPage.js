import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { activityAPI } from '../services/api';
import { timeAgo } from '../utils/constants';

const CATEGORIES = [
  { value: 'reducing_waste',    label: 'Reducing Waste',       icon: '🗑️', xp: 30 },
  { value: 'saving_energy',     label: 'Saving Energy',        icon: '⚡', xp: 35 },
  { value: 'planting_trees',    label: 'Planting Trees',       icon: '🌳', xp: 50 },
  { value: 'recycling',         label: 'Recycling',            icon: '♻️', xp: 25 },
  { value: 'water_conservation',label: 'Water Conservation',   icon: '💧', xp: 30 },
  { value: 'clean_up',          label: 'Clean-up Drive',       icon: '🧹', xp: 40 },
  { value: 'awareness',         label: 'Spreading Awareness',  icon: '📢', xp: 20 },
  { value: 'other',             label: 'Other Eco Action',     icon: '🌿', xp: 15 },
];

const STATUS_STYLES = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300',
  approved: 'bg-eco-50 text-eco-700 border-eco-200 dark:bg-eco-900/20 dark:text-eco-300',
  rejected: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400',
};

export default function ActivityLoggerPage() {
  const [myActivities, setMyActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', locationName: '', photo: null });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    activityAPI.getMy().then(r => setMyActivities(r.data.activities || [])).finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Photo must be under 5MB', 'error'); return; }
    setForm(f => ({ ...f, photo: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.category) e.category = 'Please select a category';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      if (form.locationName) fd.append('locationName', form.locationName);
      if (form.photo) fd.append('photo', form.photo);

      const { data } = await activityAPI.submit(fd);
      setMyActivities(prev => [data.activity, ...prev]);
      setForm({ title: '', description: '', category: '', locationName: '', photo: null });
      setPhotoPreview(null);
      setShowForm(false);
      showToast('Activity submitted! A teacher will review it soon 🌱');
    } catch (err) {
      showToast(err.response?.data?.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-eco-600'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">🌿 Activity Logger</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Log your real-world eco actions and earn XP when approved</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(s => !s)}
          className="btn-primary px-5 py-2.5 text-sm">
          {showForm ? '✕ Cancel' : '+ Log New Activity'}
        </motion.button>
      </motion.div>

      {/* Submission Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card p-6 mb-6 overflow-hidden">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-5">Submit a new eco activity</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category grid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} type="button"
                      onClick={() => { setForm(f => ({ ...f, category: cat.value })); setErrors(e => ({ ...e, category: '' })); }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                        form.category === cat.value ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-eco-300'
                      }`}>
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-center text-gray-700 dark:text-gray-300">{cat.label}</span>
                      <span className="text-eco-600 dark:text-eco-400">+{cat.xp} XP</span>
                    </button>
                  ))}
                </div>
                {errors.category && <p className="mt-1 text-xs text-red-500">⚠ {errors.category}</p>}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Activity Title <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Planted 5 saplings at school garden"
                  className={`input-field ${errors.title ? 'border-red-400' : ''}`} />
                {errors.title && <p className="mt-1 text-xs text-red-500">⚠ {errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Describe what you did, why, and what impact it had..."
                  className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`} />
                {errors.description && <p className="mt-1 text-xs text-red-500">⚠ {errors.description}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">📍 Location (optional)</label>
                  <input value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))}
                    placeholder="e.g., LPU Campus, Phagwara" className="input-field" />
                </div>

                {/* Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">📸 Photo Proof (optional)</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 cursor-pointer hover:border-eco-400 transition-colors">
                    {photoPreview
                      ? <img src={photoPreview} alt="preview" className="h-20 w-full object-cover rounded-lg" />
                      : <><span className="text-2xl mb-1">📷</span><span className="text-xs text-gray-500">Click to upload (max 5MB)</span></>
                    }
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              </div>

              <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="btn-primary w-full py-3">
                {submitting ? '⏳ Submitting...' : '🌱 Submit Activity'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Activities */}
      <div>
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">My Submitted Activities ({myActivities.length})</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : myActivities.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">🌿</p>
            <p className="font-medium">No activities logged yet</p>
            <p className="text-sm mt-1">Click "Log New Activity" to submit your first eco action!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myActivities.map((act, i) => {
              const cat = CATEGORIES.find(c => c.value === act.category) || CATEGORIES[CATEGORIES.length - 1];
              return (
                <motion.div key={act._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card p-4 flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{act.title}</p>
                      <span className={`badge-pill border text-xs ${STATUS_STYLES[act.status]}`}>
                        {act.status === 'pending' ? '⏳ Pending Review' : act.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{act.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>{cat.label}</span>
                      {act.location?.name && <span>📍 {act.location.name}</span>}
                      <span>{timeAgo(act.createdAt)}</span>
                      {act.status === 'approved' && <span className="text-eco-600 dark:text-eco-400 font-semibold">+{act.xpAwarded} XP earned</span>}
                      {act.status === 'rejected' && act.reviewNote && <span className="text-red-500">Note: {act.reviewNote}</span>}
                    </div>
                  </div>
                  {act.photoUrl && (
                    <img src={act.photoUrl} alt="activity" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
