const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['badge', 'level_up', 'activity_approved', 'activity_rejected', 'mission_complete', 'challenge_complete', 'system'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: { type: String, default: '🔔' },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
}, { timestamps: true });

// Index for fast unread queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
