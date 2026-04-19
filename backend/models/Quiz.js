const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String },
  points: { type: Number, default: 10 },
  questionType: {
    type: String,
    enum: ['mcq', 'true_false'],
    default: 'mcq',
  },
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  topic: {
    type: String,
    required: true,
    enum: ['climateChange', 'recycling', 'biodiversity', 'oceanHealth', 'renewableEnergy'],
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  // NEW: target which student type this quiz is for
  targetAudience: {
    type: String,
    enum: ['all', 'School Student', 'College Student'],
    default: 'all',
  },
  questions: [questionSchema],
  timeLimit: { type: Number, default: 300 },
  xpReward: { type: Number, default: 50 },
  thumbnail: { type: String, default: '🌱' },
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
