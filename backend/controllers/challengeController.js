const { Challenge } = require('../models/GameModels');
const User = require('../models/User');
const { checkAndAwardBadges } = require('../utils/badgeEngine');

/**
 * GET /api/challenges - Get active challenges
 */
exports.getChallenges = async (req, res) => {
  try {
    const now = new Date();
    const challenges = await Challenge.find({
      isActive: true,
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
    }).sort({ type: 1, xpReward: -1 });

    // Mark which ones user completed
    const user = await User.findById(req.user.id);
    const completedIds = user.completedChallenges.map(c => c.challengeId.toString());

    const enriched = challenges.map(c => ({
      ...c.toObject(),
      completed: completedIds.includes(c._id.toString()),
    }));

    res.json({ success: true, challenges: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/challenges/:id/complete - Mark challenge as completed
 */
exports.completeChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const user = await User.findById(req.user.id);

    // Check not already completed
    const alreadyCompleted = user.completedChallenges.some(
      c => c.challengeId.toString() === challenge._id.toString()
    );
    if (alreadyCompleted) {
      return res.status(400).json({ success: false, message: 'Challenge already completed' });
    }

    // Award XP
    const { leveledUp, newLevel } = user.addXP(challenge.xpReward);
    user.completedChallenges.push({ challengeId: challenge._id, pointsEarned: challenge.xpReward });
    user.addActivity('challenge', `Completed "${challenge.title}" challenge`, challenge.xpReward);

    // Check badges
    const newBadges = await checkAndAwardBadges(user);
    await user.save();

    challenge.completions += 1;
    await challenge.save();

    // Emit events
    const io = req.app.get('io');
    if (io) {
      io.emit('leaderboard:update', { userId: user._id, xp: user.xp });
      if (leveledUp) io.to(user._id.toString()).emit('level:up', { newLevel });
      if (newBadges.length) io.to(user._id.toString()).emit('badge:earned', { badges: newBadges });
    }

    res.json({
      success: true,
      message: 'Challenge completed! 🎉',
      xpEarned: challenge.xpReward,
      leveledUp,
      newLevel,
      newBadges,
      userXP: user.xp,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/challenges - Create challenge (admin)
 */
exports.createChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.create(req.body);
    res.status(201).json({ success: true, challenge });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
