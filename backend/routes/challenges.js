const express = require('express');
const router = express.Router();
const { getChallenges, completeChallenge, createChallenge } = require('../controllers/challengeController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getChallenges);
router.post('/:id/complete', protect, completeChallenge);
router.post('/', protect, adminOnly, createChallenge);

module.exports = router;
