// routes/leaderboard.js
const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getLeaderboard);

module.exports = router;
