import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminAPI, quizAPI } from '../services/api';
import { formatNumber, timeAgo, getDifficultyClass, TOPICS } from '../utils/constants';

const TABS = ['Overview', 'Users', 'Quizzes'];

export default function AdminPage() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showQuizForm, setShowQuizForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (tab === 'Overview') {
      adminAPI.getStats().then(r => setStats(r.data.stats)).finally(() => setLoading(false));
    } else if (tab === 'Users') {
      adminAPI.getUsers({ search }).then(r => setUsers(r.data.users || [])).finally(() => setLoading(false));
    } else if (tab === 'Quizzes') {
      quizAPI.getAll({ limit: 50 }).then(r => setQuizzes(r.data.quizzes || [])).finally(() => setLoading(false));
    }
  }, [tab, search]);

  const toggleUserStatus = async (userId, isActive) => {
    await adminAPI.updateUser(userId, { isActive: !isActive });
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !isActive } : u));
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Deactivate this quiz?')) return;
    await quizAPI.delete(quizId);
    setQuizzes(prev => prev.filter(q => q._id !== quizId));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage users, quizzes, and platform settings</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t ? 'bg-eco-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : (
        <>
          {/* ─── Overview Tab ────────────────────────────────────── */}
          {tab === 'Overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '👥', label: 'Total Users', value: stats.totalUsers, color: 'text-blue-600' },
                  { icon: '📝', label: 'Active Quizzes', value: stats.totalQuizzes, color: 'text-eco-600' },
                  { icon: '📊', label: 'Quiz Attempts', value: formatNumber(stats.totalScores), color: 'text-purple-600' },
                  { icon: '⭐', label: 'Avg User XP', value: formatNumber(stats.avgXP), color: 'text-yellow-600' },
                ].map(s => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 text-center">
                    <div className="text-3xl mb-2">{s.icon}</div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">🆕 Recent Users</h3>
                <div className="space-y-2">
                  {stats.recentUsers?.map(u => (
                    <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="w-8 h-8 rounded-full bg-eco-100 dark:bg-eco-900/30 flex items-center justify-center text-sm font-bold text-eco-700 dark:text-eco-300">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.username}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-eco-600 dark:text-eco-400">{u.xp} XP · Lv.{u.level}</p>
                        <p className="text-xs text-gray-400">{timeAgo(u.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Users Tab ───────────────────────────────────────── */}
          {tab === 'Users' && (
            <div>
              <div className="mb-4">
                <input
                  className="input-field max-w-sm"
                  placeholder="🔍 Search by username or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {['User', 'Email', 'XP / Level', 'Joined', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{u.username}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[160px] truncate">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-eco-600 dark:text-eco-400 font-semibold">{u.xp} XP</span>
                          <span className="text-gray-400 ml-1">Lv.{u.level}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{timeAgo(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge-pill ${u.isActive ? 'bg-eco-100 text-eco-700 dark:bg-eco-900/30 dark:text-eco-300' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {u.isActive ? '✓ Active' : '✗ Banned'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleUserStatus(u._id, u.isActive)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                              u.isActive
                                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-eco-600 hover:bg-eco-50 dark:hover:bg-eco-900/20'
                            }`}
                          >
                            {u.isActive ? 'Ban' : 'Unban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="py-12 text-center text-gray-400">No users found</div>
                )}
              </div>
            </div>
          )}

          {/* ─── Quizzes Tab ─────────────────────────────────────── */}
          {tab === 'Quizzes' && (
            <div className="space-y-4">
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {['Quiz', 'Topic', 'Difficulty', 'Questions', 'XP', 'Attempts', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map(q => {
                      const topicMeta = TOPICS[q.topic] || TOPICS.general;
                      return (
                        <tr key={q._id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{q.thumbnail}</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200 max-w-[180px] truncate">{q.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge-pill text-xs ${topicMeta.bg} ${topicMeta.color}`}>
                              {topicMeta.icon} {topicMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge-pill text-xs ${getDifficultyClass(q.difficulty)}`}>{q.difficulty}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{q.questions?.length || 0}</td>
                          <td className="px-4 py-3 text-eco-600 dark:text-eco-400 font-semibold">{q.xpReward}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{q.totalAttempts}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deleteQuiz(q._id)}
                              className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {quizzes.length === 0 && (
                  <div className="py-12 text-center text-gray-400">No quizzes found</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
