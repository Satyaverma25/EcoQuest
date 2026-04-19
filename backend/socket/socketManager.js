/**
 * Socket.io Manager
 * Handles real-time events: leaderboard updates, notifications, achievements
 */

let connectedUsers = new Map(); // userId -> socketId

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User joins their personal room for targeted notifications
    socket.on('user:join', (userId) => {
      socket.join(userId);
      connectedUsers.set(userId, socket.id);
      io.emit('users:online', connectedUsers.size);
      console.log(`👤 User ${userId} joined their room`);
    });

    // User joins leaderboard room for live updates
    socket.on('leaderboard:join', () => {
      socket.join('leaderboard');
    });

    socket.on('leaderboard:leave', () => {
      socket.leave('leaderboard');
    });

    // Quiz room (for multiplayer potential)
    socket.on('quiz:join', (quizId) => {
      socket.join(`quiz:${quizId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
      io.emit('users:online', connectedUsers.size);
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // Expose helper to broadcast leaderboard updates
  io.broadcastLeaderboardUpdate = (data) => {
    io.to('leaderboard').emit('leaderboard:update', data);
  };
}

module.exports = { initSocket, connectedUsers };
