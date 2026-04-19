const express = require('express');
const router = express.Router();
const { register, registerTeacher, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);               // Student registration
router.post('/register-teacher', registerTeacher); // Teacher registration (NEW)
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
