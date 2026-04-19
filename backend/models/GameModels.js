const mongoose = require('mongoose');

// ─── Badge Model ─────────────────────────────────────────────────────────────
const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // emoji or icon name
  category: {
    type: String,
    enum: ['milestone', 'quiz', 'challenge', 'streak', 'social', 'special'],
    default: 'milestone',
  },
  requirement: {
    type: { type: String }, // 'xp', 'quizzes', 'streak', 'challenges', 'level'
    value: Number,
    topic: String,
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  xpBonus: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ─── Challenge Model ──────────────────────────────────────────────────────────
const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'special'],
    default: 'daily',
  },
  category: {
    type: String,
    enum: ['quiz', 'action', 'social', 'learning'],
    default: 'quiz',
  },
  topic: {
    type: String,
    enum: ['climateChange', 'recycling', 'biodiversity', 'oceanHealth', 'renewableEnergy', 'general'],
    default: 'general',
  },
  xpReward: { type: Number, required: true },
  icon: { type: String, default: '🎯' },
  requirement: {
    action: String, // 'complete_quiz', 'earn_points', 'maintain_streak'
    value: Number,
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  },
  expiresAt: { type: Date },
  completions: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ─── Score Model ──────────────────────────────────────────────────────────────
const scoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timeTaken: { type: Number }, // seconds
  answers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
    pointsEarned: Number,
  }],
  xpEarned: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = {
  Badge: mongoose.model('Badge', badgeSchema),
  Challenge: mongoose.model('Challenge', challengeSchema),
  Score: mongoose.model('Score', scoreSchema),
};
