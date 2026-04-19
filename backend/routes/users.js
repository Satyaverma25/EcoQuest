const express = require('express');
const router = express.Router();
const { getUserProfile, updateProfile, getMyStats, getLeaderboard } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/me/stats', protect, getMyStats);
router.put('/profile', protect, updateProfile);
router.get('/:id/profile', protect, getUserProfile);

module.exports = router;
