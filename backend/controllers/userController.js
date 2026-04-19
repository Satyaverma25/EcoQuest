const User = require('../models/User');
const { Score } = require('../models/GameModels');

/**
 * GET /api/leaderboard - Global leaderboard
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', limit = 50 } = req.query;

    let leaders;

    if (period === 'all') {
      leaders = await User.find({ isActive: true, role: 'user' })
        .select('username avatar xp level totalPoints streak badges')
        .sort({ xp: -1 })
        .limit(Number(limit));
    } else {
      // Weekly/monthly - aggregate scores
      const dateFilter = period === 'weekly'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const scores = await Score.aggregate([
        { $match: { createdAt: { $gte: dateFilter } } },
        { $group: { _id: '$userId', periodXP: { $sum: '$xpEarned' } } },
        { $sort: { periodXP: -1 } },
        { $limit: Number(limit) },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        {
          $project: {
            username: '$user.username',
            avatar: '$user.avatar',
            level: '$user.level',
            xp: '$user.xp',
            periodXP: 1,
            badges: '$user.badges',
          },
        },
      ]);

      leaders = scores;
    }

    // Add rank
    const ranked = leaders.map((user, index) => ({
      ...user.toObject ? user.toObject() : user,
      rank: index + 1,
    }));

    res.json({ success: true, leaderboard: ranked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/users/:id/profile - Get user profile
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('badges.badgeId')
      .populate('completedQuizzes.quizId', 'title topic difficulty');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get rank
    const rank = await User.countDocuments({ xp: { $gt: user.xp }, isActive: true }) + 1;

    res.json({ success: true, user: { ...user.toObject(), rank } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/users/profile - Update own profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const update = {};
    if (username) update.username = username;
    if (avatar) update.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/users/me/stats - Get current user's statistics
 */
exports.getMyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('badges.badgeId');
    const rank = await User.countDocuments({ xp: { $gt: user.xp }, isActive: true }) + 1;

    const recentScores = await Score.find({ userId: req.user.id })
      .populate('quizId', 'title topic')
      .sort({ createdAt: -1 })
      .limit(10);

    const xpToNextLevel = getXPToNextLevel(user.level, user.xp);

    res.json({
      success: true,
      stats: {
        xp: user.xp,
        level: user.level,
        totalPoints: user.totalPoints,
        rank,
        streak: user.streak,
        badges: user.badges,
        topicProgress: user.topicProgress,
        completedQuizzes: user.completedQuizzes.length,
        completedChallenges: user.completedChallenges.length,
        recentScores,
        activityFeed: user.activityFeed.slice(0, 20),
        xpToNextLevel,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function getXPToNextLevel(level, currentXP) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
  const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1];
  return Math.max(0, nextThreshold - currentXP);
}
