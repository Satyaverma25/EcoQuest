const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const { Badge, Challenge, Score } = require('../models/GameModels');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/stats - Platform overview stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalQuizzes, totalScores, totalChallenges] = await Promise.all([
      User.countDocuments({ isActive: true, role: 'user' }),
      Quiz.countDocuments({ isActive: true }),
      Score.countDocuments(),
      Challenge.countDocuments({ isActive: true }),
    ]);

    const recentUsers = await User.find({ role: 'user' })
      .select('username email xp level createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    const avgXP = await User.aggregate([
      { $match: { role: 'user', isActive: true } },
      { $group: { _id: null, avg: { $avg: '$xp' } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalQuizzes,
        totalScores,
        totalChallenges,
        avgXP: Math.round(avgXP[0]?.avg || 0),
        recentUsers,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users - All users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'user' };
    if (search) filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id - Update user (ban/unban, role change)
router.put('/users/:id', async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const update = {};
    if (typeof isActive !== 'undefined') update.isActive = isActive;
    if (role) update.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
