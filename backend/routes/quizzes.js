const express = require('express');
const router = express.Router();
const { getQuizzes, getQuiz, submitQuiz, createQuiz, updateQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

// Teacher or admin middleware
const teacherOrAdmin = (req, res, next) => {
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Teacher or admin access required' });
  }
  next();
};

router.get('/', protect, getQuizzes);
router.get('/:id', protect, getQuiz);
router.post('/:id/submit', protect, submitQuiz);
router.post('/', protect, teacherOrAdmin, createQuiz);       // Teachers can create
router.put('/:id', protect, teacherOrAdmin, updateQuiz);     // Teachers can update
router.delete('/:id', protect, teacherOrAdmin, deleteQuiz);  // Teachers can delete

module.exports = router;
