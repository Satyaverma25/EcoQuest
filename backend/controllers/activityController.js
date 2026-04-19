const Activity = require('../models/Activity');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { checkAndAwardBadges } = require('../utils/badgeEngine');
const path = require('path');

const ACTIVITY_XP = {
  reducing_waste: 30, saving_energy: 35, planting_trees: 50,
  recycling: 25, water_conservation: 30, clean_up: 40, awareness: 20, other: 15,
};

// POST /api/activities  — student submits a real-world activity
exports.submitActivity = async (req, res) => {
  try {
    const { title, description, category, locationName, lat, lng } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, description and category are required' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const activity = await Activity.create({
      studentId: req.user._id,
      title,
      description,
      category,
      photoUrl,
      location: { name: locationName || '', lat: lat || null, lng: lng || null },
    });

    res.status(201).json({
      success: true,
      message: 'Activity submitted! A teacher will review it soon. 🌱',
      activity,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/activities/my  — student sees their own submissions
exports.getMyActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ studentId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/activities/pending  — teacher sees all pending activities
exports.getPendingActivities = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Teacher or admin access required' });
    }
    const activities = await Activity.find({ status: 'pending' })
      .populate('studentId', 'username email avatar institution studentType')
      .sort({ createdAt: -1 });
    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/activities/all  — teacher/admin sees all activities
exports.getAllActivities = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Teacher or admin access required' });
    }
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const activities = await Activity.find(filter)
      .populate('studentId', 'username avatar institution studentType')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    const total = await Activity.countDocuments(filter);
    res.json({ success: true, activities, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/activities/:id/review  — teacher approves or rejects
exports.reviewActivity = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Teacher or admin access required' });
    }

    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    if (activity.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Activity already reviewed' });
    }

    activity.status = status;
    activity.reviewedBy = req.user._id;
    activity.reviewedAt = new Date();
    activity.reviewNote = reviewNote || '';

    let xpAwarded = 0;
    if (status === 'approved') {
      xpAwarded = ACTIVITY_XP[activity.category] || 20;
      activity.xpAwarded = xpAwarded;

      // Award XP to student
      const student = await User.findById(activity.studentId);
      if (student) {
        const { leveledUp, newLevel } = student.addXP(xpAwarded);
        student.addActivity('activity', `Real-world activity approved: "${activity.title}"`, xpAwarded);
        await checkAndAwardBadges(student);
        await student.save();

        // Persist notification
        await Notification.create({
          userId: student._id,
          type: 'activity_approved',
          title: 'Activity Approved! 🎉',
          message: `Your activity "${activity.title}" was approved! You earned ${xpAwarded} XP.`,
          icon: '✅',
          link: '/activities',
        });

        // Real-time notification
        const io = req.app.get('io');
        if (io) {
          io.to(student._id.toString()).emit('activity:reviewed', { status: 'approved', xpAwarded, activityTitle: activity.title });
          if (leveledUp) io.to(student._id.toString()).emit('level:up', { newLevel });
          io.emit('leaderboard:update', { userId: student._id, xp: student.xp });
        }
      }
    } else {
      // Rejected notification
      await Notification.create({
        userId: activity.studentId,
        type: 'activity_rejected',
        title: 'Activity Needs Revision',
        message: `Your activity "${activity.title}" was not approved. ${reviewNote ? 'Note: ' + reviewNote : ''}`,
        icon: '❌',
        link: '/activities',
      });
      const io = req.app.get('io');
      if (io) io.to(activity.studentId.toString()).emit('activity:reviewed', { status: 'rejected', activityTitle: activity.title, note: reviewNote });
    }

    await activity.save();
    res.json({ success: true, message: `Activity ${status}`, activity, xpAwarded });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
