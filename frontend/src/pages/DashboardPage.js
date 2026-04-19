import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { TOPICS, LEVELS, getLevelInfo, getXPProgress, timeAgo, formatNumber } from '../utils/constants';

const card = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getStats().then(r => setStats(r.data.stats)).finally(() => setLoading(false));
  }, []);

  const levelInfo = getLevelInfo(user?.level || 1);
  const { progress, remaining, next } = getXPProgress(user?.xp || 0, user?.level || 1);
  const nextLevelInfo = getLevelInfo((user?.level || 1) + 1);

  const topicEntries = Object.entries(TOPICS).filter(([k]) => k !== 'general');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ─── Hero Banner ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-eco-gradient p-6 md:p-8"
      >
        <div className="absolute inset-0 leaf-pattern opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
              Welcome back, {user?.username}! {user?.avatar}
            </h1>
            <p className="text-eco-100 mt-1">
              {levelInfo.icon} {levelInfo.title} · Level {user?.level}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm text-eco-100">
              <span>🔥 {user?.streak} day streak</span>
              <span>⭐ {formatNumber(user?.xp)} XP</span>
              <span>🏆 Rank #{stats?.rank || '—'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/quizzes" className="bg-white text-eco-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-eco-50 transition-colors text-sm">
              📝 Take Quiz
            </Link>
            <Link to="/challenges" className="bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors text-sm border border-white/30">
              🎯 Challenges
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ─── XP Progress ───────────────────────────────────────── */}
      <motion.div variants={card} initial="hidden" animate="show" className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Level Progress</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{remaining} XP to {nextLevelInfo?.title || 'Max Level'}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-eco-600 dark:text-eco-400">{formatNumber(user?.xp)}</p>
            <p className="text-xs text-gray-400">Total XP</p>
          </div>
        </div>
        <div className="xp-bar h-3">
          <motion.div
            className="xp-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{levelInfo.icon} Lv. {user?.level}</span>
          <span>{progress}%</span>
          <span>{nextLevelInfo?.icon} Lv. {(user?.level || 1) + 1}</span>
        </div>
      </motion.div>

      {/* ─── Stats Grid ────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Quizzes Done', value: stats?.completedQuizzes || 0, icon: '📝', color: 'text-blue-600' },
          { label: 'Challenges', value: stats?.completedChallenges || 0, icon: '🎯', color: 'text-purple-600' },
          { label: 'Badges Earned', value: stats?.badges?.length || 0, icon: '🏅', color: 'text-yellow-600' },
          { label: 'Global Rank', value: stats ? `#${stats.rank}` : '—', icon: '🌍', color: 'text-eco-600' },
        ].map((s) => (
          <motion.div key={s.label} variants={card} className="card p-4 text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ─── Topic Progress ──────────────────────────────────── */}
        <motion.div variants={card} initial="hidden" animate="show" className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">📚 Topic Progress</h2>
          <div className="space-y-3">
            {topicEntries.map(([key, topic]) => {
              const pct = user?.topicProgress?.[key] || 0;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {topic.icon} {topic.label}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{pct}%</span>
                  </div>
                  <div className="xp-bar">
                    <motion.div
                      className="xp-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/quizzes" className="mt-4 inline-flex items-center gap-1 text-sm text-eco-600 dark:text-eco-400 font-medium hover:underline">
            Explore quizzes →
          </Link>
        </motion.div>

        {/* ─── Recent Activity ─────────────────────────────────── */}
        <motion.div variants={card} initial="hidden" animate="show" className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">⚡ Recent Activity</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-xl" />
              ))}
            </div>
          ) : stats?.activityFeed?.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.activityFeed.slice(0, 10).map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-xl flex-shrink-0">
                    {activity.type === 'quiz' ? '📝' : activity.type === 'badge' ? '🏅' : activity.type === 'challenge' ? '🎯' : '⬆️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(activity.timestamp)}</p>
                  </div>
                  {activity.points > 0 && (
                    <span className="text-xs font-semibold text-eco-600 dark:text-eco-400 flex-shrink-0">+{activity.points} XP</span>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🌱</p>
              <p className="text-sm">No activity yet. Take your first quiz!</p>
              <Link to="/quizzes" className="mt-3 inline-block btn-primary text-sm py-2">Start Learning</Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Badges Preview ────────────────────────────────────── */}
      {stats?.badges?.length > 0 && (
        <motion.div variants={card} initial="hidden" animate="show" className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">🏅 Recent Badges</h2>
            <Link to="/profile" className="text-sm text-eco-600 dark:text-eco-400 hover:underline">View all</Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.badges.slice(0, 8).map((b, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 200 }}
                title={b.badgeId?.name}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-eco-50 dark:bg-eco-900/20 border border-eco-100 dark:border-eco-800 min-w-[64px]"
              >
                <span className="text-2xl">{b.badgeId?.icon || '🏅'}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight max-w-[56px] truncate">
                  {b.badgeId?.name || 'Badge'}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
