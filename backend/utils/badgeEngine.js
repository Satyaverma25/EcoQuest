const { Badge } = require('../models/GameModels');

/**
 * Check all badge conditions for a user and award any newly unlocked badges
 * @param {Object} user - Mongoose user document
 * @returns {Array} - newly awarded badges
 */
async function checkAndAwardBadges(user) {
  const allBadges = await Badge.find({ isActive: true });
  const earnedBadgeIds = user.badges.map(b => b.badgeId.toString());
  const newBadges = [];

  for (const badge of allBadges) {
    if (earnedBadgeIds.includes(badge._id.toString())) continue;

    let earned = false;
    const { type, value, topic } = badge.requirement;

    switch (type) {
      case 'xp':
        earned = user.xp >= value;
        break;
      case 'level':
        earned = user.level >= value;
        break;
      case 'quizzes':
        earned = user.completedQuizzes.length >= value;
        break;
      case 'challenges':
        earned = user.completedChallenges.length >= value;
        break;
      case 'streak':
        earned = user.streak >= value;
        break;
      case 'topic_progress':
        earned = topic && user.topicProgress[topic] >= value;
        break;
      case 'register':
        earned = true; // First login badge
        break;
      default:
        break;
    }

    if (earned) {
      user.badges.push({ badgeId: badge._id });
      user.addActivity('badge', `Earned "${badge.name}" badge! 🏆`, badge.xpBonus);
      if (badge.xpBonus > 0) {
        user.xp += badge.xpBonus;
        user.totalPoints += badge.xpBonus;
      }
      newBadges.push(badge);
    }
  }

  return newBadges;
}

module.exports = { checkAndAwardBadges };
