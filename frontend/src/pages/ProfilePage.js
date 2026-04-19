import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI, badgeAPI } from '../services/api';
import { getLevelInfo, getXPProgress, TOPICS, RARITY_COLORS, formatNumber, timeAgo, AVATARS } from '../utils/constants';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: authUser, updateUser } = useAuth();
  const isOwnProfile = !id || id === authUser?._id;

  const [stats, setStats] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', avatar: '' });
  const [saving, setSaving] = useState(false);

  const displayUser = isOwnProfile ? authUser : stats?.user;

  useEffect(() => {
    const fetches = isOwnProfile
      ? [userAPI.getStats(), badgeAPI.getAll()]
      : [userAPI.getProfile(id), badgeAPI.getAll()];

    Promise.all(fetches)
      .then(([statsRes, badgesRes]) => {
        setStats(statsRes.data);
        setAllBadges(badgesRes.data.badges || []);
      })
      .finally(() => setLoading(false));
  }, [id, isOwnProfile]);

  const startEdit = () => {
    setEditForm({ username: authUser?.username || '', avatar: authUser?.avatar || '🌱' });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(editForm);
      updateUser(data.user);
      setEditing(false);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="skeleton h-48 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  const user = displayUser;
  const levelInfo = getLevelInfo(user?.level || 1);
  const { progress, remaining } = getXPProgress(user?.xp || 0, user?.level || 1);
  const earnedBadgeIds = new Set((isOwnProfile ? authUser : user)?.badges?.map(b => (b.badgeId?._id || b.badgeId)?.toString()));
  const profileStats = isOwnProfile ? stats : stats?.stats;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Profile hero card */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-eco-gradient relative">
          <div className="absolute inset-0 leaf-pattern opacity-30" />
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-2xl bg-white dark:bg-[#1a2e1f] border-4 border-white dark:border-[#1a2e1f] flex items-center justify-center text-4xl shadow-lg"
            >
              {user?.avatar || '🌱'}
            </motion.div>
            {isOwnProfile && (
              <button onClick={startEdit} className="btn-secondary text-sm py-2">
                ✏️ Edit Profile
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.username}</h1>
              <p className="text-eco-600 dark:text-eco-400 font-medium">{levelInfo.icon} {levelInfo.title}</p>
              {profileStats?.rank && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">🌍 Global Rank #{profileStats.rank}</p>
              )}
            </div>
            <div className="flex gap-4 text-center">
              <div><p className="font-bold text-eco-600 dark:text-eco-400 text-xl">{formatNumber(user?.xp)}</p><p className="text-xs text-gray-400">Total XP</p></div>
              <div><p className="font-bold text-eco-600 dark:text-eco-400 text-xl">{user?.level}</p><p className="text-xs text-gray-400">Level</p></div>
              <div><p className="font-bold text-orange-500 text-xl">🔥{user?.streak}</p><p className="text-xs text-gray-400">Streak</p></div>
            </div>
          </div>

          {/* XP bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Level {user?.level}</span>
              <span>{remaining} XP to next level</span>
            </div>
            <div className="xp-bar h-2.5">
              <motion.div className="xp-bar-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit modal */}
      {editing && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="card p-6 w-full max-w-sm">
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">Edit Profile</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
              <input
                className="input-field"
                value={editForm.username}
                onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                maxLength={20}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    onClick={() => setEditForm(f => ({ ...f, avatar: av }))}
                    className={`text-2xl p-2 rounded-xl transition-all ${editForm.avatar === av ? 'bg-eco-100 dark:bg-eco-900/40 ring-2 ring-eco-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={saveProfile} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Stats grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: '📝', label: 'Quizzes', value: isOwnProfile ? stats?.completedQuizzes : user?.completedQuizzes?.length || 0 },
          { icon: '🎯', label: 'Challenges', value: isOwnProfile ? stats?.completedChallenges : user?.completedChallenges?.length || 0 },
          { icon: '🏅', label: 'Badges', value: user?.badges?.length || 0 },
          { icon: '⭐', label: 'Total Points', value: formatNumber(user?.totalPoints || 0) },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-bold text-xl text-gray-900 dark:text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Student Type card */}
      {user?.studentType && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card p-4 flex items-center gap-4"
        >
          <span className="text-3xl">{user.studentType === 'School Student' ? '📚' : '🎓'}</span>
          <div>
            <p className="text-xs text-gray-400 font-medium">Student Type</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{user.studentType}</p>
            <p className="text-xs text-eco-600 dark:text-eco-400 mt-0.5">Stored securely in database ✓</p>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Topic progress */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">📚 Topic Mastery</h2>
          <div className="space-y-3">
            {Object.entries(TOPICS).filter(([k]) => k !== 'general').map(([key, topic]) => {
              const pct = user?.topicProgress?.[key] || 0;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{topic.icon} {topic.label}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{pct}%</span>
                  </div>
                  <div className="xp-bar">
                    <motion.div className="xp-bar-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent scores */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">📊 Recent Quiz Scores</h2>
          {profileStats?.recentScores?.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {profileStats.recentScores.map((score, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <span className="text-xl">{TOPICS[score.quizId?.topic]?.icon || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{score.quizId?.title || 'Quiz'}</p>
                    <p className="text-xs text-gray-400">{timeAgo(score.createdAt)}</p>
                  </div>
                  <span className={`font-bold text-sm ${score.percentage >= 80 ? 'text-eco-600 dark:text-eco-400' : score.percentage >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {score.percentage}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No quiz scores yet</p>
          )}
        </motion.div>
      </div>

      {/* Badges showcase */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">🏅 Badge Collection ({user?.badges?.length || 0}/{allBadges.length})</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {allBadges.map(badge => {
            const earned = earnedBadgeIds.has(badge._id?.toString());
            return (
              <motion.div
                key={badge._id}
                whileHover={{ scale: 1.05 }}
                title={`${badge.name}: ${badge.description}`}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-default ${
                  earned
                    ? `${RARITY_COLORS[badge.rarity] || ''} border-opacity-100`
                    : 'border-gray-100 dark:border-gray-800 opacity-35 grayscale'
                }`}
              >
                <span className={`text-2xl ${earned ? '' : 'grayscale'}`}>{badge.icon}</span>
                <span className="text-xs text-center leading-tight font-medium text-gray-700 dark:text-gray-300 line-clamp-2">{badge.name}</span>
                {earned && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize rarity-${badge.rarity}`}>
                    {badge.rarity}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
