const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMissions, getMission, startMission,
  completeStep, createMission, updateMission, deleteMission,
} = require('../controllers/missionController');

router.get('/', protect, getMissions);
router.get('/:id', protect, getMission);
router.post('/:id/start', protect, startMission);
router.post('/:id/step/:stepOrder', protect, completeStep);
router.post('/', protect, createMission);
router.put('/:id', protect, updateMission);
router.delete('/:id', protect, deleteMission);

module.exports = router;
