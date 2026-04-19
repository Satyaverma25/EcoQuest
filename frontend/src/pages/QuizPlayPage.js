import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TOPICS, getDifficultyClass } from '../utils/constants';

export default function QuizPlayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('intro'); // intro | playing | results
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    quizAPI.getOne(id)
      .then(r => { setQuiz(r.data.quiz); setTimeLeft(r.data.quiz.timeLimit); })
      .catch(() => navigate('/quizzes'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startQuiz = () => {
    setPhase('playing');
    startTimeRef.current = Date.now();
    setAnswers(new Array(quiz.questions.length).fill(null));
  };

  const selectAnswer = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      handleSubmit(false);
    }
  };

  const handleSubmit = useCallback(async (timedOut = false) => {
    if (submitting) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTimeTaken(elapsed);
    try {
      const finalAnswers = timedOut
        ? [...answers.slice(0, currentQ + 1), ...new Array(quiz.questions.length - currentQ - 1).fill(null)]
        : answers;
      const { data } = await quizAPI.submit(id, finalAnswers, elapsed);
      setResults(data.results);
      setPhase('results');
      if (data.results.leveledUp) {
        updateUser({ level: data.results.newLevel, xp: data.results.userXP });
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }, [answers, currentQ, id, quiz, submitting, updateUser]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const timerDanger = timeLeft <= 30 && phase === 'playing';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-5xl">🌍</motion.div>
    </div>
  );
  if (!quiz) return null;

  const topicMeta = TOPICS[quiz.topic] || TOPICS.general;
  const question = quiz.questions[currentQ];
  const progress = ((currentQ + (revealed ? 1 : 0)) / quiz.questions.length) * 100;

  // ─── INTRO ────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)]">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <button onClick={() => navigate('/quizzes')} className="mb-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 text-sm">
          ← Back to Quizzes
        </button>
        <div className="card p-8 text-center">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-6xl mb-4">
            {quiz.thumbnail}
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{quiz.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{quiz.description}</p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: '❓', label: `${quiz.questions.length} Questions` },
              { icon: '⏱️', label: `${Math.floor(quiz.timeLimit / 60)} Minutes` },
              { icon: '⭐', label: `${quiz.xpReward} XP Reward` },
            ].map(s => (
              <div key={s.label} className="bg-eco-50 dark:bg-eco-900/20 rounded-xl p-3">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 justify-center mb-6">
            <span className={`badge-pill ${getDifficultyClass(quiz.difficulty)}`}>{quiz.difficulty}</span>
            <span className={`badge-pill ${topicMeta.bg} ${topicMeta.color}`}>{topicMeta.icon} {topicMeta.label}</span>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startQuiz} className="btn-primary w-full py-4 text-lg">
            🚀 Start Quiz
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  // ─── RESULTS ──────────────────────────────────────────────────────────────
  if (phase === 'results' && results) return (
    <div className="min-h-screen p-6 bg-[var(--bg-base)]">
      <div className="max-w-2xl mx-auto">
        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 text-center mb-6 ${
            results.percentage >= 80 ? 'bg-eco-gradient' :
            results.percentage >= 50 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
            'bg-gradient-to-br from-gray-600 to-gray-700'
          } text-white`}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="text-6xl mb-3">
            {results.percentage === 100 ? '🏆' : results.percentage >= 80 ? '🎉' : results.percentage >= 50 ? '👍' : '💪'}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="text-6xl font-bold mb-1">{results.percentage}%</div>
            <div className="text-white/80 text-lg">{results.score} / {results.maxScore} points</div>
          </motion.div>

          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">+{results.xpEarned}</div>
              <div className="text-white/70 text-xs">XP Earned</div>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.floor(timeTaken / 60)}:{String(timeTaken % 60).padStart(2,'0')}</div>
              <div className="text-white/70 text-xs">Time Taken</div>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-bold">{results.gradedAnswers?.filter(a => a.isCorrect).length}/{quiz.questions.length}</div>
              <div className="text-white/70 text-xs">Correct</div>
            </div>
          </div>
        </motion.div>

        {/* Level up banner */}
        <AnimatePresence>
          {results.leveledUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="card p-4 mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700 flex items-center gap-3"
            >
              <span className="text-3xl animate-bounce-subtle">⬆️</span>
              <div>
                <p className="font-bold text-yellow-700 dark:text-yellow-300">Level Up!</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">You reached Level {results.newLevel}! Keep going!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New badges */}
        {results.newBadges?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-4 mb-6">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-3">🏅 New Badges Unlocked!</p>
            <div className="flex flex-wrap gap-3">
              {results.newBadges.map(badge => (
                <div key={badge._id} className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl px-3 py-2">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">{badge.name}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Answer review */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">📋 Review Answers</h3>
          <div className="space-y-4">
            {quiz.questions.map((q, i) => {
              const graded = results.gradedAnswers?.[i];
              return (
                <div key={i} className={`rounded-xl p-4 border ${graded?.isCorrect ? 'bg-eco-50 dark:bg-eco-900/20 border-eco-200 dark:border-eco-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span>{graded?.isCorrect ? '✅' : '❌'}</span>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{q.question}</p>
                  </div>
                  <div className="ml-6 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>Your answer: <span className={graded?.isCorrect ? 'text-eco-600 font-semibold' : 'text-red-500 font-semibold'}>
                      {graded?.selectedAnswer !== null && graded?.selectedAnswer !== undefined ? q.options?.[graded.selectedAnswer] : 'Skipped'}
                    </span></p>
                    {!graded?.isCorrect && <p>Correct: <span className="text-eco-600 dark:text-eco-400 font-semibold">{q.options?.[graded?.correctAnswer]}</span></p>}
                    {graded?.explanation && <p className="italic mt-1 text-gray-500 dark:text-gray-500">💡 {graded.explanation}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="flex gap-3">
          <button onClick={() => navigate('/quizzes')} className="btn-secondary flex-1 py-3">Browse More Quizzes</button>
          <button onClick={() => { setPhase('intro'); setCurrentQ(0); setAnswers([]); setSelected(null); setRevealed(false); }} className="btn-primary flex-1 py-3">Retake Quiz</button>
        </div>
      </div>
    </div>
  );

  // ─── PLAYING ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Top bar */}
      <div className="bg-white dark:bg-[#1a2e1f] border-b border-gray-100 dark:border-[#2d4a35] px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/quizzes')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm">✕</button>
        <div className="flex-1 xp-bar h-2.5">
          <motion.div className="xp-bar-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{currentQ + 1}/{quiz.questions.length}</span>
        <span className={`font-mono font-bold text-sm min-w-[48px] text-right ${timerDanger ? 'timer-danger' : 'text-gray-700 dark:text-gray-200'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                Question {currentQ + 1}
              </div>
              <h2 className="font-display text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 leading-snug">
                {question.question}
              </h2>

              <div className="grid gap-3">
                {question.options?.map((opt, i) => {
                  let style = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2e1f] hover:border-eco-400 hover:bg-eco-50 dark:hover:bg-eco-900/20';
                  if (revealed) {
                    if (i === results?.gradedAnswers?.[currentQ]?.correctAnswer || (!results && selected === i)) {
                      // We don't know correct answer client-side until submit
                      style = selected === i
                        ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/30'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2e1f] opacity-60';
                    }
                    if (i === selected) {
                      style = 'border-eco-500 bg-eco-50 dark:bg-eco-900/30 dark:border-eco-600';
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      whileHover={!revealed ? { scale: 1.01 } : {}}
                      whileTap={!revealed ? { scale: 0.99 } : {}}
                      onClick={() => selectAnswer(i)}
                      disabled={revealed}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium text-gray-800 dark:text-gray-200 ${style} disabled:cursor-default`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {['A','B','C','D'][i]}
                        </span>
                        {opt}
                        {revealed && i === selected && <span className="ml-auto">✓</span>}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {revealed && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={nextQuestion}
                    className="btn-primary px-8 py-3"
                    disabled={submitting}
                  >
                    {submitting ? '⏳ Submitting...' : currentQ < quiz.questions.length - 1 ? 'Next →' : '🏁 Finish Quiz'}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* XP indicator */}
      <div className="text-center pb-4 text-xs text-gray-400">
        ⭐ Up to {quiz.xpReward} XP on completion
      </div>
    </div>
  );
}
