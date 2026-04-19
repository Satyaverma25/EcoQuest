import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { analyticsAPI, activityAPI } from '../services/api';
import { TOPICS, timeAgo, formatNumber } from '../utils/constants';

const STATUS_TAB_STYLES = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300',
  approved: 'bg-eco-50 text-eco-700 border-eco-200 dark:bg-eco-900/20 dark:text-eco-300',
  rejected: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400',
};

const ACTIVITY_LABELS = {
  reducing_waste: { label: 'Reducing Waste', icon: '🗑️', xp: 30 },
  saving_energy: { label: 'Saving Energy', icon: '⚡', xp: 35 },
  planting_trees: { label: 'Planting Trees', icon: '🌳', xp: 50 },
  recycling: { label: 'Recycling', icon: '♻️', xp: 25 },
  water_conservation: { label: 'Water Conservation', icon: '💧', xp: 30 },
  clean_up: { label: 'Clean-up Drive', icon: '🧹', xp: 40 },
  awareness: { label: 'Spreading Awareness', icon: '📢', xp: 20 },
  other: { label: 'Other Eco Action', icon: '🌿', xp: 15 },
};

export default function TeacherDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [pending, setPending] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getTeacher(),
      activityAPI.getPending(),
    ]).then(([aRes, pRes]) => {
      setAnalytics(aRes.data.analytics);
      setPending(pRes.data.activities || []);
    }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleReview = async (activityId, status) => {
    setReviewing(activityId + status);
    try {
      await activityAPI.review(activityId, { status, reviewNote });
      setPending(prev => prev.filter(a => a._id !== activityId));
      setAnalytics(prev => prev ? { ...prev, pendingActivities: prev.pendingActivities - 1, approvedActivities: status === 'approved' ? prev.approvedActivities + 1 : prev.approvedActivities } : prev);
      setReviewNote('');
      showToast(`Activity ${status} successfully ✅`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Review failed', 'error');
    } finally {
      setReviewing(null);
    }
  };

  if (loading) return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-eco-600'}`}>
          {toast.msg}
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">🎓 Teacher Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor student progress, review activities, and view analytics</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'pending', label: `⏳ Pending Reviews ${pending.length > 0 ? `(${pending.length})` : ''}` },
          { key: 'students', label: '👥 Top Students' },
          { key: 'topics', label: '📚 Topic Stats' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-eco-600 text-white' : 'bg-white dark:bg-[#1a2e1f] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-eco-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && analytics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '👥', label: 'Total Students', value: analytics.totalStudents, color: 'text-blue-600' },
              { icon: '⏳', label: 'Pending Reviews', value: analytics.pendingActivities, color: 'text-yellow-600' },
              { icon: '✅', label: 'Activities Approved', value: analytics.approvedActivities, color: 'text-eco-600' },
              { icon: '📝', label: 'Quiz Attempts', value: formatNumber(analytics.totalQuizAttempts), color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="card p-5 text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Student type breakdown */}
          {analytics.studentTypeBreakdown?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">📊 Student Type Breakdown</h3>
              <div className="flex gap-6">
                {analytics.studentTypeBreakdown.map(s => (
                  <div key={s._id} className="flex items-center gap-3">
                    <span className="text-2xl">{s._id === 'School Student' ? '📚' : '🎓'}</span>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{s.count}</p>
                      <p className="text-xs text-gray-500">{s._id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent activities */}
          {analytics.recentActivities?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">⚡ Recent Activity Submissions</h3>
              <div className="space-y-3">
                {analytics.recentActivities.map(act => {
                  const cat = ACTIVITY_LABELS[act.category] || ACTIVITY_LABELS.other;
                  return (
                    <div key={act._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <span className="text-xl">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{act.title}</p>
                        <p className="text-xs text-gray-400">{act.studentId?.username} · {timeAgo(act.createdAt)}</p>
                      </div>
                      <span className={`badge-pill border text-xs ${STATUS_TAB_STYLES[act.status]}`}>{act.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Pending Reviews ── */}
      {tab === 'pending' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {pending.length === 0 ? (
            <div className="card p-16 text-center text-gray-400">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-medium">No pending activities to review</p>
              <p className="text-sm mt-1">All caught up! Check back later.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(act => {
                const cat = ACTIVITY_LABELS[act.category] || ACTIVITY_LABELS.other;
                const isRev = reviewing?.startsWith(act._id);
                return (
                  <div key={act._id} className="card p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-3xl flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{act.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{act.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                          <span>👤 {act.studentId?.username} ({act.studentId?.studentType})</span>
                          {act.location?.name && <span>📍 {act.location.name}</span>}
                          <span>🕒 {timeAgo(act.createdAt)}</span>
                          <span className="text-eco-600 dark:text-eco-400 font-medium">+{cat.xp} XP if approved</span>
                        </div>
                      </div>
                      {act.photoUrl && (
                        <img src={act.photoUrl} alt="proof" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
                      )}
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                      <input
                        placeholder="Review note (optional — shown to student on rejection)"
                        className="input-field mb-3 text-sm"
                        onChange={e => setReviewNote(e.target.value)}
                      />
                      <div className="flex gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => handleReview(act._id, 'approved')}
                          disabled={!!reviewing}
                          className="btn-primary flex-1 py-2.5 text-sm">
                          {reviewing === act._id + 'approved' ? '⏳ Approving...' : '✅ Approve'}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => handleReview(act._id, 'rejected')}
                          disabled={!!reviewing}
                          className="flex-1 py-2.5 text-sm rounded-xl border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold transition-all">
                          {reviewing === act._id + 'rejected' ? '⏳ Rejecting...' : '❌ Reject'}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Top Students ── */}
      {tab === 'students' && analytics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {['#', 'Student', 'Type', 'Institution', 'XP', 'Level', 'Streak'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.topStudents.map((s, i) => (
                <tr key={s._id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.avatar}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{s.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.studentType === 'School Student' ? '📚' : '🎓'} {s.studentType}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[120px]">{s.institution || '—'}</td>
                  <td className="px-4 py-3 font-bold text-eco-600 dark:text-eco-400">{formatNumber(s.xp)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Lv.{s.level}</td>
                  <td className="px-4 py-3 text-orange-500">🔥{s.streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* ── Topic Stats ── */}
      {tab === 'topics' && analytics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-5">📚 Quiz Performance by Topic</h3>
          <div className="space-y-4">
            {analytics.topicStats.map(ts => {
              const meta = TOPICS[ts._id] || TOPICS.general;
              const avg = Math.round(ts.avgScore);
              return (
                <div key={ts._id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{meta.icon} {meta.label}</span>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>{ts.count} attempts</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{avg}% avg</span>
                    </div>
                  </div>
                  <div className="xp-bar h-3">
                    <motion.div className="xp-bar-fill" initial={{ width: 0 }}
                      animate={{ width: `${avg}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              );
            })}
            {analytics.topicStats.length === 0 && (
              <p className="text-gray-400 text-center py-8">No quiz data yet</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
