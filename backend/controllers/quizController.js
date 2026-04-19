const Quiz = require('../models/Quiz');
const { Score } = require('../models/GameModels');
const User = require('../models/User');
const { checkAndAwardBadges } = require('../utils/badgeEngine');

/**
 * GET /api/quizzes - Get all quizzes
 */
exports.getQuizzes = async (req, res) => {
  try {
    const { topic, difficulty, targetAudience, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    // Filter by audience: return quizzes for this audience OR 'all'
    if (targetAudience && targetAudience !== 'all') {
      filter.$or = [{ targetAudience }, { targetAudience: 'all' }];
    }

    const quizzes = await Quiz.find(filter)
      .select('-questions.correctAnswer -questions.explanation')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Quiz.countDocuments(filter);

    res.json({ success: true, quizzes, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/quizzes/:id - Get single quiz
 */
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Strip correct answers for client
    const quizData = quiz.toObject();
    quizData.questions = quizData.questions.map(q => ({
      ...q,
      correctAnswer: undefined,
      explanation: undefined,
    }));

    res.json({ success: true, quiz: quizData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/quizzes/:id/submit - Submit quiz answers
 */
exports.submitQuiz = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Grade answers
    let score = 0;
    const gradedAnswers = quiz.questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctAnswer;
      const pointsEarned = isCorrect ? q.points : 0;
      score += pointsEarned;
      return {
        questionIndex: i,
        selectedAnswer: answers[i],
        isCorrect,
        pointsEarned,
        explanation: q.explanation,
        correctAnswer: q.correctAnswer,
      };
    });

    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((score / maxScore) * 100);

    // XP calculation
    let xpEarned = Math.round((percentage / 100) * quiz.xpReward);
    if (percentage === 100) xpEarned = Math.round(quiz.xpReward * 1.5); // bonus for perfect

    // Save score
    const scoreDoc = await Score.create({
      userId: req.user.id,
      quizId: quiz._id,
      score,
      maxScore,
      percentage,
      timeTaken,
      answers: gradedAnswers,
      xpEarned,
    });

    // Update user
    const user = await User.findById(req.user.id);
    const { leveledUp, newLevel } = user.addXP(xpEarned);

    // Update topic progress
    const topicKey = quiz.topic;
    const currentProgress = user.topicProgress[topicKey] || 0;
    user.topicProgress[topicKey] = Math.min(100, currentProgress + Math.round(percentage * 0.3));

    // Record completed quiz
    const alreadyCompleted = user.completedQuizzes.some(q => q.quizId.toString() === quiz._id.toString());
    if (!alreadyCompleted) {
      user.completedQuizzes.push({ quizId: quiz._id, score: percentage });
    }

    // Activity
    user.addActivity('quiz', `Completed "${quiz.title}" quiz`, xpEarned);

    // Check badges
    const newBadges = await checkAndAwardBadges(user);
    await user.save();

    // Update quiz stats
    quiz.totalAttempts += 1;
    quiz.averageScore = Math.round(((quiz.averageScore * (quiz.totalAttempts - 1)) + percentage) / quiz.totalAttempts);
    await quiz.save();

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('leaderboard:update', { userId: user._id, username: user.username, xp: user.xp });
      if (leveledUp) {
        io.to(user._id.toString()).emit('level:up', { newLevel, username: user.username });
      }
      if (newBadges.length > 0) {
        io.to(user._id.toString()).emit('badge:earned', { badges: newBadges });
      }
    }

    res.json({
      success: true,
      results: {
        score,
        maxScore,
        percentage,
        xpEarned,
        gradedAnswers,
        leveledUp,
        newLevel,
        newBadges,
        userXP: user.xp,
        userLevel: user.level,
      },
    });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/quizzes - Create quiz (admin)
 */
exports.createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, quiz });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/quizzes/:id - Update quiz (admin)
 */
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, quiz });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/quizzes/:id - Delete quiz (admin)
 */
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, message: 'Quiz deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
