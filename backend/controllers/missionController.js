const Mission = require('../models/Mission');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { checkAndAwardBadges } = require('../utils/badgeEngine');

// GET /api/missions  — all active missions with student's progress
exports.getMissions = async (req, res) => {
  try {
    const missions = await Mission.find({ isActive: true })
      .select('-studentProgress')
      .sort({ createdAt: -1 });

    // Attach this student's progress
    const missionIds = missions.map(m => m._id);
    const withProgress = await Promise.all(
      missions.map(async (mission) => {
        const full = await Mission.findById(mission._id).select('studentProgress');
        const sp = full.studentProgress.find(p => p.studentId.toString() === req.user._id.toString());
        return {
          ...mission.toObject(),
          myProgress: sp || { status: 'not_started', completedSteps: [], totalXpEarned: 0 },
        };
      })
    );

    res.json({ success: true, missions: withProgress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/missions/:id  — single mission detail
exports.getMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission || !mission.isActive) return res.status(404).json({ success: false, message: 'Mission not found' });

    const sp = mission.studentProgress.find(p => p.studentId.toString() === req.user._id.toString());
    res.json({
      success: true,
      mission: { ...mission.toObject(), myProgress: sp || { status: 'not_started', completedSteps: [], totalXpEarned: 0 } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/missions/:id/start  — student starts a mission
exports.startMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });

    const existing = mission.studentProgress.find(p => p.studentId.toString() === req.user._id.toString());
    if (existing) return res.status(400).json({ success: false, message: 'Mission already started' });

    mission.studentProgress.push({ studentId: req.user._id, status: 'in_progress', startedAt: new Date(), completedSteps: [] });
    await mission.save();

    res.json({ success: true, message: 'Mission started! Good luck 🚀' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/missions/:id/step/:stepOrder  — complete a step
exports.completeStep = async (req, res) => {
  try {
    const { id, stepOrder } = req.params;
    const mission = await Mission.findById(id);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });

    const sp = mission.studentProgress.find(p => p.studentId.toString() === req.user._id.toString());
    if (!sp) return res.status(400).json({ success: false, message: 'Start the mission first' });
    if (sp.status === 'completed') return res.status(400).json({ success: false, message: 'Mission already completed' });

    const stepNum = parseInt(stepOrder);
    if (sp.completedSteps.includes(stepNum)) {
      return res.status(400).json({ success: false, message: 'Step already completed' });
    }

    const step = mission.steps.find(s => s.order === stepNum);
    if (!step) return res.status(404).json({ success: false, message: 'Step not found' });

    sp.completedSteps.push(stepNum);
    sp.totalXpEarned += step.xpReward;

    const user = await User.findById(req.user._id);
    user.addXP(step.xpReward);
    user.addActivity('mission', `Completed step "${step.title}" in mission "${mission.title}"`, step.xpReward);

    // Check if all steps done → mission complete
    let missionCompleted = false;
    if (sp.completedSteps.length >= mission.steps.length) {
      sp.status = 'completed';
      sp.completedAt = new Date();
      mission.completionCount += 1;
      missionCompleted = true;

      user.completedMissions.push({ missionId: mission._id, pointsEarned: sp.totalXpEarned });
      user.addActivity('mission', `Completed mission "${mission.title}"! 🎉`, mission.totalXpReward);

      await Notification.create({
        userId: user._id,
        type: 'mission_complete',
        title: 'Mission Complete! 🎉',
        message: `You completed "${mission.title}" and earned ${sp.totalXpEarned} XP!`,
        icon: '🏆',
        link: '/missions',
      });

      const io = req.app.get('io');
      if (io) io.to(user._id.toString()).emit('mission:complete', { missionTitle: mission.title, xpEarned: sp.totalXpEarned });
    }

    await checkAndAwardBadges(user);
    await user.save();
    await mission.save();

    res.json({ success: true, message: missionCompleted ? `Mission "${mission.title}" completed! 🎉` : `Step completed! +${step.xpReward} XP`, stepXP: step.xpReward, missionCompleted, totalXpEarned: sp.totalXpEarned });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/missions  — teacher/admin creates a mission
exports.createMission = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Teacher or admin access required' });
    }
    const mission = await Mission.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, mission });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/missions/:id  — teacher/admin updates
exports.updateMission = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Teacher or admin access required' });
    }
    const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });
    res.json({ success: true, mission });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/missions/:id  — soft delete
exports.deleteMission = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Teacher or admin access required' });
    }
    await Mission.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Mission deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
