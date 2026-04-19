const express = require('express');
const router = express.Router();
const { Badge } = require('../models/GameModels');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/badges - Get all badges
router.get('/', protect, async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true }).sort({ rarity: 1 });
    res.json({ success: true, badges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/badges - Create badge (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const badge = await Badge.create(req.body);
    res.status(201).json({ success: true, badge });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/badges/:id - Delete badge (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Badge.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Badge deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
