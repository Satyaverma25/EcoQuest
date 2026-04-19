const User = require('../models/User');
const { Score } = require('../models/GameModels');
const Activity = require('../models/Activity');
const Mission = require('../models/Mission');

// GET /api/analytics/teacher  — teacher dashboard data
exports.getTeacherAnalytics = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Teacher or admin access required' });
    }

    const [totalStudents, pendingActivities, approvedActivities, totalQuizAttempts] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      Activity.countDocuments({ status: 'pending' }),
      Activity.countDocuments({ status: 'approved' }),
      Score.countDocuments(),
    ]);

    // Top performing students
    const topStudents = await User.find({ role: 'student', isActive: true })
      .select('username avatar xp level studentType institution streak')
      .sort({ xp: -1 })
      .limit(10);

    // Recent activity submissions
    const recentActivities = await Activity.find()
      .populate('studentId', 'username avatar studentType')
      .sort({ createdAt: -1 })
      .limit(10);

    // Quiz completion stats per topic
    const topicStats = await Score.aggregate([
      { $lookup: { from: 'quizzes', localField: 'quizId', foreignField: '_id', as: 'quiz' } },
      { $unwind: '$quiz' },
      { $group: { _id: '$quiz.topic', count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
    ]);

    // Student type breakdown
    const studentTypeBreakdown = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$studentType', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      analytics: {
        totalStudents,
        pendingActivities,
        approvedActivities,
        totalQuizAttempts,
        topStudents,
        recentActivities,
        topicStats,
        studentTypeBreakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/analytics/student/:id  — detailed view of one student (teacher)
exports.getStudentAnalytics = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Teacher or admin access required' });
    }

    const student = await User.findById(req.params.id)
      .select('-password')
      .populate('badges.badgeId', 'name icon');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const [scores, activities] = await Promise.all([
      Score.find({ userId: req.params.id }).populate('quizId', 'title topic difficulty').sort({ createdAt: -1 }).limit(15),
      Activity.find({ studentId: req.params.id }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({ success: true, student, scores, activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
