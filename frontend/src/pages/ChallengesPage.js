import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { challengeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TOPICS } from '../utils/constants';

const TYPE_COLORS = {
  daily:   'bg-eco-100 text-eco-700 dark:bg-eco-900/40 dark:text-eco-300',
  weekly:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  special: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

export default function ChallengesPage() {
  const { user, updateUser } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    challengeAPI.getAll()
      .then(r => setChallenges(r.data.challenges || []))
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = async (challengeId) => {
    setCompleting(challengeId);
    try {
      const { data } = await challengeAPI.complete(challengeId);
      setChallenges(prev => prev.map(c => c._id === challengeId ? { ...c, completed: true } : c));
      updateUser({ xp: data.userXP });
      setToast({ message: `+${data.xpEarned} XP earned! 🎉`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to complete', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setCompleting(null);
    }
  };

  const filtered = filter === 'all' ? challenges : challenges.filter(c => c.type === filter);
  const completedCount = challenges.filter(c => c.completed).length;
  const totalXP = challenges.filter(c => c.completed).reduce((s, c) => s + c.xpReward, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl font-semibold shadow-xl text-white text-sm ${
              toast.type === 'success' ? 'bg-eco-600' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">🎯 Challenges</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Complete challenges to earn bonus XP and badges</p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        {[
          { icon: '✅', value: `${completedCount}/${challenges.length}`, label: 'Completed' },
          { icon: '⭐', value: `${totalXP} XP`, label: 'Earned' },
          { icon: '🎯', value: `${challenges.length - completedCount}`, label: 'Remaining' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'daily', 'weekly', 'special'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-eco-600 text-white shadow-md shadow-eco-600/20'
                : 'bg-white dark:bg-[#1a2e1f] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-eco-300'
            }`}
          >
            {f === 'all' ? '🌍 All' : f === 'daily' ? '📅 Daily' : f === 'weekly' ? '📆 Weekly' : '⭐ Special'}
          </button>
        ))}
      </div>

      {/* Challenge grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">🎯</p>
          <p>No {filter !== 'all' ? filter : ''} challenges available</p>
        </div>
      ) : (
        <motion.div
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="grid sm:grid-cols-2 gap-4"
        >
          {filtered.map(challenge => {
            const topicMeta = TOPICS[challenge.topic] || TOPICS.general;
            return (
              <motion.div
                key={challenge._id}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className={`card p-5 relative overflow-hidden transition-all ${
                  challenge.completed ? 'opacity-75' : 'hover:shadow-md'
                }`}
              >
                {/* Completed overlay */}
                {challenge.completed && (
                  <div className="absolute inset-0 bg-eco-50/60 dark:bg-eco-900/30 flex items-center justify-center rounded-2xl">
                    <div className="bg-eco-600 text-white text-lg font-bold px-4 py-2 rounded-full shadow-lg">
                      ✓ Completed
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl flex-shrink-0">{challenge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge-pill text-xs ${TYPE_COLORS[challenge.type] || ''}`}>
                        {challenge.type}
                      </span>
                      <span className={`badge-pill text-xs ${topicMeta.bg} ${topicMeta.color}`}>
                        {topicMeta.icon} {topicMeta.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{challenge.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{challenge.description}</p>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-eco-600 dark:text-eco-400 text-sm">+{challenge.xpReward} XP</span>
                  {!challenge.completed && (
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleComplete(challenge._id)}
                      disabled={completing === challenge._id}
                      className="btn-primary text-sm py-2 px-4"
                    >
                      {completing === challenge._id ? '⏳ Claiming...' : '🎯 Claim'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
