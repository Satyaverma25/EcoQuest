const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: v => /^[^\s@]+@gmail\.com$/.test(v),
      message: 'Only Gmail addresses (@gmail.com) are allowed',
    },
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  // studentType is required for students, optional for teachers/admins
  studentType: {
    type: String,
    enum: {
      values: ['School Student', 'College Student', 'Teacher'],
      message: 'Invalid student type',
    },
    default: null,
  },
  institution: { type: String, trim: true, default: '' },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student',
  },
  avatar: { type: String, default: '🌱' },

  // Gamification
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  totalPoints: { type: Number, default: 0 },
  badges: [{ badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }, earnedAt: { type: Date, default: Date.now } }],
  completedQuizzes: [{ quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }, score: Number, completedAt: { type: Date, default: Date.now } }],
  completedChallenges: [{ challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }, completedAt: { type: Date, default: Date.now }, pointsEarned: Number }],
  completedMissions: [{ missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' }, completedAt: { type: Date, default: Date.now }, pointsEarned: Number }],
  topicProgress: {
    climateChange: { type: Number, default: 0 },
    recycling: { type: Number, default: 0 },
    biodiversity: { type: Number, default: 0 },
    oceanHealth: { type: Number, default: 0 },
    renewableEnergy: { type: Number, default: 0 },
  },
  streak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  activityFeed: [{ type: { type: String }, description: String, points: Number, timestamp: { type: Date, default: Date.now } }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.virtual('levelTitle').get(function () {
  const levels = [
    { min: 0, title: 'Eco Seedling' }, { min: 100, title: 'Green Sprout' },
    { min: 300, title: 'Nature Explorer' }, { min: 600, title: 'Eco Warrior' },
    { min: 1000, title: 'Green Guardian' }, { min: 1500, title: 'Planet Protector' },
    { min: 2500, title: 'Earth Champion' }, { min: 4000, title: 'Sustainability Sage' },
    { min: 6000, title: 'Eco Legend' },
  ];
  return ([...levels].reverse().find(l => this.xp >= l.min) || levels[0]).title;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.addXP = function (points) {
  this.xp += points;
  this.totalPoints += points;
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
  let newLevel = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (this.xp >= thresholds[i]) { newLevel = i + 1; break; }
  }
  const leveledUp = newLevel > this.level;
  this.level = newLevel;
  return { leveledUp, newLevel };
};

userSchema.methods.addActivity = function (type, description, points = 0) {
  this.activityFeed.unshift({ type, description, points });
  if (this.activityFeed.length > 50) this.activityFeed = this.activityFeed.slice(0, 50);
};

module.exports = mongoose.model('User', userSchema);
