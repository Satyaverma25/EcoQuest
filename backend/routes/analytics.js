const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTeacherAnalytics, getStudentAnalytics } = require('../controllers/analyticsController');

router.get('/teacher', protect, getTeacherAnalytics);
router.get('/student/:id', protect, getStudentAnalytics);

module.exports = router;
