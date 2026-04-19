import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (user?._id) socket.emit('user:join', user._id);
      socket.emit('leaderboard:join');
    });

    socket.on('users:online', (count) => setOnlineCount(count));

    socket.on('level:up', ({ newLevel }) => {
      addNotification({ type: 'level_up', title: 'Level Up! 🎉', message: `You reached Level ${newLevel}!`, icon: '⬆️' });
    });

    socket.on('badge:earned', ({ badges }) => {
      badges.forEach(badge => {
        addNotification({ type: 'badge', title: 'Badge Unlocked!', message: `You earned "${badge.name}" ${badge.icon}`, icon: badge.icon });
      });
    });

    socket.on('activity:reviewed', ({ status, xpAwarded, activityTitle, note }) => {
      if (status === 'approved') {
        addNotification({ type: 'activity_approved', title: 'Activity Approved! ✅', message: `"${activityTitle}" was approved! +${xpAwarded} XP`, icon: '✅' });
      } else {
        addNotification({ type: 'activity_rejected', title: 'Activity Needs Revision', message: `"${activityTitle}" was not approved.${note ? ' ' + note : ''}`, icon: '❌' });
      }
    });

    socket.on('mission:complete', ({ missionTitle, xpEarned }) => {
      addNotification({ type: 'mission_complete', title: 'Mission Complete! 🏆', message: `You completed "${missionTitle}" and earned ${xpEarned} XP!`, icon: '🏆' });
    });

    socket.on('disconnect', () => {});

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [isAuthenticated, user?._id]);

  const addNotification = (notif) => {
    const id = Date.now();
    setNotifications(prev => [{ ...notif, id }, ...prev.slice(0, 4)]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const dismissNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, onlineCount,
      notifications, dismissNotification, addNotification,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
