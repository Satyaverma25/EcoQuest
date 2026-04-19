const mongoose = require('mongoose');

// Each step a student must complete in a mission
const stepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['quiz', 'activity', 'reading'],
    default: 'activity',
  },
  xpReward: { type: Number, default: 20 },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
});

// Per-student progress within a mission
const studentProgressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedSteps: [{ type: Number }], // step order numbers completed
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  totalXpEarned: { type: Number, default: 0 },
});

const missionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  topic: {
    type: String,
    enum: ['climateChange', 'recycling', 'biodiversity', 'oceanHealth', 'renewableEnergy', 'general'],
    default: 'general',
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  icon: { type: String, default: '🎯' },
  totalXpReward: { type: Number, default: 100 },
  steps: [stepSchema],
  // Per-student progress stored here so many students can work on same mission
  studentProgress: [studentProgressSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  completionCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Mission', missionSchema);
