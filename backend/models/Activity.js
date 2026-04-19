const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['reducing_waste', 'saving_energy', 'planting_trees', 'recycling', 'water_conservation', 'clean_up', 'awareness', 'other'],
  },
  photoUrl: { type: String, default: '' },   // Cloudinary / local upload path
  location: {
    name: { type: String, default: '' },
    lat: { type: Number },
    lng: { type: Number },
  },
  // Approval workflow: student submits → teacher reviews → points awarded
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String, default: '' },
  xpAwarded: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
