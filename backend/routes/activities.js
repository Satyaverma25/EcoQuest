const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  submitActivity, getMyActivities, getPendingActivities,
  getAllActivities, reviewActivity,
} = require('../controllers/activityController');

// Multer config — store in /uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/', protect, upload.single('photo'), submitActivity);
router.get('/my', protect, getMyActivities);
router.get('/pending', protect, getPendingActivities);
router.get('/all', protect, getAllActivities);
router.put('/:id/review', protect, reviewActivity);

module.exports = router;
