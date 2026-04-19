/**
 * EcoQuest Backend Server
 * Gamified Environmental Education Platform (GEEP)
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const quizRoutes      = require('./routes/quizzes');
const challengeRoutes = require('./routes/challenges');
const leaderboardRoutes = require('./routes/leaderboard');
const badgeRoutes     = require('./routes/badges');
const adminRoutes     = require('./routes/admin');
const activityRoutes  = require('./routes/activities');
const missionRoutes   = require('./routes/missions');
const notifRoutes     = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const { initSocket }  = require('./socket/socketManager');

const app = express();
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3001', methods: ['GET', 'POST'], credentials: true },
});
app.set('io', io);
initSocket(io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3001', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Serve uploaded activity photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/quizzes',      quizRoutes);
app.use('/api/challenges',   challengeRoutes);
app.use('/api/leaderboard',  leaderboardRoutes);
app.use('/api/badges',       badgeRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/activities',   activityRoutes);
app.use('/api/missions',     missionRoutes);
app.use('/api/notifications',notifRoutes);
app.use('/api/analytics',    analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'EcoQuest GEEP API running 🌱' }));
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ─── DB Connection ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecoquest')
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 EcoQuest server on port ${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

module.exports = { app, server, io };
