import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TOPICS, getDifficultyClass } from '../utils/constants';

const TOPIC_KEYS = ['all', ...Object.keys(TOPICS).filter(k => k !== 'general')];
const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'];

// Audience badge styles
const AUD_STYLE = {
  'School Student': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'College Student': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'all': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};
const AUD_ICON = { 'School Student': '📚', 'College Student': '🎓', 'all': '🌍' };

// ── Teacher: Add Question Modal ───────────────────────────────────────────────
function AddQuizModal({ onClose, onSave }) {
  const [step, setStep] = useState(1); // 1=quiz info, 2=add questions
  const [quiz, setQuiz] = useState({ title: '', description: '', topic: 'climateChange', difficulty: 'beginner', targetAudience: 'all', xpReward: 50, timeLimit: 300, thumbnail: '🌱' });
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 10 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const TOPIC_OPTIONS = Object.entries(TOPICS).filter(([k]) => k !== 'general');
  const THUMBNAILS = ['🌱', '🌡️', '♻️', '🦋', '🌊', '☀️', '🌍', '⚡', '🌿', '🌳'];

  const addQuestion = () => {
    if (!currentQ.question.trim()) { setError('Question text is required'); return; }
    if (currentQ.options.some(o => !o.trim())) { setError('All 4 options must be filled'); return; }
    setQuestions(prev => [...prev, { ...currentQ }]);
    setCurrentQ({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 10 });
    setError('');
  };

  const handleSave = async () => {
    if (questions.length < 3) { setError('Add at least 3 questions before saving'); return; }
    setSaving(true);
    try {
      await onSave({ ...quiz, questions });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-gray-100">
            {step === 1 ? '📝 Create New Quiz' : `➕ Add Questions (${questions.length} added)`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">⚠️ {error}</div>}

          {step === 1 && (
            <>
              {/* Thumbnail picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quiz Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {THUMBNAILS.map(t => (
                    <button key={t} type="button" onClick={() => setQuiz(q => ({ ...q, thumbnail: t }))}
                      className={`text-2xl p-2 rounded-xl transition-all ${quiz.thumbnail === t ? 'bg-eco-100 dark:bg-eco-900/40 ring-2 ring-eco-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quiz Title *</label>
                <input value={quiz.title} onChange={e => setQuiz(q => ({ ...q, title: e.target.value }))} placeholder="e.g., Forest Ecosystems Quiz" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea value={quiz.description} onChange={e => setQuiz(q => ({ ...q, description: e.target.value }))} rows={2} placeholder="Brief description of this quiz..." className="input-field resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Topic *</label>
                  <select value={quiz.topic} onChange={e => setQuiz(q => ({ ...q, topic: e.target.value }))} className="input-field no-icon">
                    {TOPIC_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Difficulty *</label>
                  <select value={quiz.difficulty} onChange={e => setQuiz(q => ({ ...q, difficulty: e.target.value }))} className="input-field no-icon">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target Audience *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['all','🌍','All Students'],['School Student','📚','School Students'],['College Student','🎓','College Students']].map(([v, icon, label]) => (
                    <button key={v} type="button" onClick={() => setQuiz(q => ({ ...q, targetAudience: v }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${quiz.targetAudience === v ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-eco-300'}`}>
                      <span className="text-xl">{icon}</span><span className="text-gray-700 dark:text-gray-300">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">XP Reward</label>
                  <input type="number" value={quiz.xpReward} onChange={e => setQuiz(q => ({ ...q, xpReward: Number(e.target.value) }))} className="input-field" min={10} max={200} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time Limit (seconds)</label>
                  <input type="number" value={quiz.timeLimit} onChange={e => setQuiz(q => ({ ...q, timeLimit: Number(e.target.value) }))} className="input-field" min={60} max={1800} />
                </div>
              </div>
              <button onClick={() => { if (!quiz.title.trim()) { setError('Quiz title is required'); return; } setError(''); setStep(2); }}
                className="btn-primary w-full py-3">Next: Add Questions →</button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Questions added so far */}
              {questions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {questions.map((q, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-eco-50 dark:bg-eco-900/20 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-eco-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{q.question}</p>
                      <button onClick={() => setQuestions(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new question form */}
              <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">New Question</h3>
                <textarea value={currentQ.question} onChange={e => setCurrentQ(q => ({ ...q, question: e.target.value }))}
                  rows={2} placeholder="Enter your question..." className="input-field resize-none text-sm" />
                {currentQ.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button type="button" onClick={() => setCurrentQ(q => ({ ...q, correctAnswer: i }))}
                      className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${currentQ.correctAnswer === i ? 'border-eco-500 bg-eco-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {currentQ.correctAnswer === i && <span className="text-white text-xs flex items-center justify-center w-full h-full">✓</span>}
                    </button>
                    <input value={opt} onChange={e => { const opts = [...currentQ.options]; opts[i] = e.target.value; setCurrentQ(q => ({ ...q, options: opts })); }}
                      placeholder={`Option ${['A','B','C','D'][i]}`} className="input-field text-sm flex-1" />
                  </div>
                ))}
                <p className="text-xs text-gray-400">Click the circle next to the correct answer</p>
                <input value={currentQ.explanation} onChange={e => setCurrentQ(q => ({ ...q, explanation: e.target.value }))}
                  placeholder="Explanation (shown after answering)" className="input-field text-sm" />
                <button onClick={addQuestion} className="btn-secondary w-full py-2 text-sm">+ Add This Question</button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3 text-sm">← Back</button>
                <button onClick={handleSave} disabled={saving || questions.length < 3}
                  className="btn-primary flex-1 py-3 text-sm disabled:opacity-50">
                  {saving ? '⏳ Saving...' : `💾 Save Quiz (${questions.length} questions)`}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main QuizzesPage ──────────────────────────────────────────────────────────
export default function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('mine'); // 'mine' | 'all'
  const [showModal, setShowModal] = useState(false);

  const isTeacher = ['teacher', 'admin'].includes(user?.role);
  const completedIds = user?.completedQuizzes?.map(q => q.quizId?.toString() || q.quizId) || [];

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (topic !== 'all') params.topic = topic;
    if (difficulty !== 'all') params.difficulty = difficulty;
    quizAPI.getAll(params)
      .then(r => setQuizzes(r.data.quizzes || []))
      .finally(() => setLoading(false));
  }, [topic, difficulty]);

  const handleSaveQuiz = async (quizData) => {
    const { data } = await quizAPI.create(quizData);
    setQuizzes(prev => [data.quiz, ...prev]);
  };

  // Filter by audience: show quizzes matching student type OR 'all'
  const filteredQuizzes = isTeacher ? quizzes : quizzes.filter(q =>
    audienceFilter === 'all'
      ? true
      : q.targetAudience === 'all' || q.targetAudience === user?.studentType
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {showModal && <AddQuizModal onClose={() => setShowModal(false)} onSave={handleSaveQuiz} />}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">📝 Quizzes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Test your knowledge and earn XP</p>
        </div>
        {isTeacher && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)} className="btn-primary px-5 py-2.5 text-sm">
            + Create Quiz
          </motion.button>
        )}
      </motion.div>

      {/* Student audience toggle */}
      {!isTeacher && (
        <div className="flex gap-2 mb-4">
          {[['mine', '🎯 My Level'], ['all', '🌍 All Quizzes']].map(([key, label]) => (
            <button key={key} onClick={() => setAudienceFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                audienceFilter === key ? 'bg-eco-600 text-white shadow-md shadow-eco-600/20' : 'bg-white dark:bg-[#1a2e1f] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-eco-300'
              }`}>
              {label}
            </button>
          ))}
          {audienceFilter === 'mine' && (
            <span className="flex items-center text-xs text-gray-400 ml-2">
              Showing {user?.studentType === 'School Student' ? '📚 School' : '🎓 College'} quizzes + general
            </span>
          )}
        </div>
      )}

      {/* Topic filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {TOPIC_KEYS.map(t => {
            const meta = TOPICS[t];
            return (
              <button key={t} onClick={() => setTopic(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  topic === t ? 'bg-eco-600 text-white shadow-md shadow-eco-600/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>
                {meta ? `${meta.icon} ${meta.label}` : '🌍 All Topics'}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                difficulty === d ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}>
              {d === 'all' ? 'All Levels' : d}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">🔍</p>
          <p className="font-medium">No quizzes found for this filter</p>
          {!isTeacher && audienceFilter === 'mine' && (
            <button onClick={() => setAudienceFilter('all')} className="mt-3 text-eco-600 dark:text-eco-400 text-sm hover:underline">
              Show all quizzes
            </button>
          )}
        </div>
      ) : (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map(quiz => {
            const topicMeta = TOPICS[quiz.topic] || TOPICS.general;
            const completed = completedIds.includes(quiz._id);
            const audience = quiz.targetAudience || 'all';
            return (
              <motion.div key={quiz._id}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="card group relative overflow-hidden">
                {completed && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-eco-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">✓ Done</span>
                  </div>
                )}
                <div className={`h-1.5 ${quiz.difficulty === 'beginner' ? 'bg-eco-500' : quiz.difficulty === 'intermediate' ? 'bg-orange-500' : 'bg-red-500'}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{quiz.thumbnail}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight text-sm">{quiz.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className={`badge-pill text-xs ${getDifficultyClass(quiz.difficulty)}`}>{quiz.difficulty}</span>
                        <span className={`badge-pill text-xs ${topicMeta.bg} ${topicMeta.color}`}>{topicMeta.icon} {topicMeta.label}</span>
                        <span className={`badge-pill text-xs ${AUD_STYLE[audience]}`}>{AUD_ICON[audience]} {audience === 'all' ? 'All' : audience === 'School Student' ? 'School' : 'College'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{quiz.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span>❓ {quiz.questions?.length} questions</span>
                    <span>⏱️ {Math.floor(quiz.timeLimit / 60)}min</span>
                    <span>⭐ {quiz.xpReward} XP</span>
                  </div>
                  <Link to={`/quiz/${quiz._id}/play`}
                    className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      completed ? 'bg-eco-50 dark:bg-eco-900/20 text-eco-600 dark:text-eco-400 hover:bg-eco-100' : 'btn-primary'
                    }`}>
                    {completed ? '🔄 Retake' : '▶ Start Quiz'}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
