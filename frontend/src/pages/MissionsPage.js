import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { missionAPI } from '../services/api';
import { TOPICS } from '../utils/constants';

const DIFF_STYLE = { beginner: 'diff-beginner', intermediate: 'diff-intermediate', advanced: 'diff-advanced' };

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    missionAPI.getAll().then(r => setMissions(r.data.missions || [])).finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStart = async (missionId) => {
    try {
      await missionAPI.start(missionId);
      setMissions(prev => prev.map(m => m._id === missionId
        ? { ...m, myProgress: { status: 'in_progress', completedSteps: [], totalXpEarned: 0 } }
        : m
      ));
      showToast('Mission started! Complete each step to earn XP 🚀');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start mission', 'error');
    }
  };

  const handleCompleteStep = async (missionId, stepOrder, stepXP) => {
    setCompleting(`${missionId}-${stepOrder}`);
    try {
      const { data } = await missionAPI.completeStep(missionId, stepOrder);
      setMissions(prev => prev.map(m => {
        if (m._id !== missionId) return m;
        const prevSteps = m.myProgress?.completedSteps || [];
        const newCompleted = [...prevSteps, stepOrder];
        const allDone = newCompleted.length >= m.steps.length;
        return {
          ...m,
          myProgress: {
            ...m.myProgress,
            completedSteps: newCompleted,
            status: allDone ? 'completed' : 'in_progress',
            totalXpEarned: (m.myProgress?.totalXpEarned || 0) + stepXP,
          },
        };
      }));
      showToast(data.message);
      if (data.missionCompleted) setSelected(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete step', 'error');
    } finally {
      setCompleting(null);
    }
  };

  const sel = selected ? missions.find(m => m._id === selected) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-eco-600'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">🎯 Eco Missions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Multi-step missions combining quizzes and real-world actions</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: '🎯', label: 'Total Missions', value: missions.length },
          { icon: '⏳', label: 'In Progress', value: missions.filter(m => m.myProgress?.status === 'in_progress').length },
          { icon: '✅', label: 'Completed', value: missions.filter(m => m.myProgress?.status === 'completed').length },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-bold text-xl text-gray-900 dark:text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mission Detail Modal */}
      <AnimatePresence>
        {sel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{sel.icon}</span>
                  <div>
                    <h2 className="font-display font-bold text-lg text-gray-900 dark:text-gray-100">{sel.title}</h2>
                    <span className={`badge-pill text-xs ${DIFF_STYLE[sel.difficulty]}`}>{sel.difficulty}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">×</button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{sel.description}</p>

              {/* Progress bar */}
              {sel.myProgress && sel.myProgress.status !== 'not_started' && (
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{sel.myProgress.completedSteps?.length || 0}/{sel.steps.length} steps</span>
                    <span>{sel.myProgress.totalXpEarned || 0} XP earned</span>
                  </div>
                  <div className="xp-bar h-2">
                    <motion.div className="xp-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${((sel.myProgress.completedSteps?.length || 0) / sel.steps.length) * 100}%` }}
                      transition={{ duration: 0.6 }} />
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-3 mb-5">
                {sel.steps.map((step, i) => {
                  const done = sel.myProgress?.completedSteps?.includes(step.order);
                  const canDo = sel.myProgress?.status === 'in_progress' && !done;
                  const isLoading = completing === `${sel._id}-${step.order}`;
                  return (
                    <div key={step.order} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${done ? 'bg-eco-50 dark:bg-eco-900/20 border-eco-200 dark:border-eco-700' : 'border-gray-100 dark:border-gray-800'}`}>
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${done ? 'bg-eco-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                        {done ? '✓' : step.order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{step.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500 capitalize">{step.type}</span>
                          <span className="text-xs text-eco-600 dark:text-eco-400 font-medium">+{step.xpReward} XP</span>
                        </div>
                      </div>
                      {canDo && (
                        <button onClick={() => handleCompleteStep(sel._id, step.order, step.xpReward)}
                          disabled={!!completing}
                          className="btn-primary text-xs px-3 py-1.5 flex-shrink-0">
                          {isLoading ? '⏳' : '✓ Done'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action button */}
              {!sel.myProgress || sel.myProgress.status === 'not_started' ? (
                <button onClick={() => handleStart(sel._id)} className="btn-primary w-full py-3">🚀 Start Mission</button>
              ) : sel.myProgress.status === 'completed' ? (
                <div className="text-center py-3 bg-eco-50 dark:bg-eco-900/20 rounded-xl text-eco-600 dark:text-eco-400 font-semibold">🏆 Mission Completed!</div>
              ) : (
                <div className="text-center py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 text-sm font-medium">⏳ Complete the steps above to finish this mission</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {missions.map(mission => {
            const topicMeta = TOPICS[mission.topic] || TOPICS.general;
            const prog = mission.myProgress;
            const pct = prog ? Math.round(((prog.completedSteps?.length || 0) / mission.steps.length) * 100) : 0;
            const statusLabel = !prog || prog.status === 'not_started' ? null : prog.status === 'completed' ? '✅ Completed' : `⏳ ${pct}% done`;
            return (
              <motion.div key={mission._id}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4 }}
                className="card p-5 cursor-pointer"
                onClick={() => setSelected(mission._id)}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{mission.icon}</span>
                  {statusLabel && (
                    <span className={`badge-pill text-xs ${prog.status === 'completed' ? 'diff-beginner' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                      {statusLabel}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{mission.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{mission.description}</p>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`badge-pill text-xs ${DIFF_STYLE[mission.difficulty]}`}>{mission.difficulty}</span>
                  <span className={`badge-pill text-xs ${topicMeta.bg} ${topicMeta.color}`}>{topicMeta.icon} {topicMeta.label}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>📋 {mission.steps.length} steps</span>
                  <span>⭐ {mission.totalXpReward} XP</span>
                </div>
                {prog && prog.status !== 'not_started' && (
                  <div className="xp-bar h-1.5">
                    <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <button className={`mt-3 w-full text-center py-2 rounded-xl text-sm font-semibold transition-all ${
                  prog?.status === 'completed' ? 'bg-eco-50 dark:bg-eco-900/20 text-eco-600 dark:text-eco-400' :
                  prog?.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                  'btn-primary'
                }`}>
                  {prog?.status === 'completed' ? '🏆 View' : prog?.status === 'in_progress' ? '▶ Continue' : '🚀 Start'}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
