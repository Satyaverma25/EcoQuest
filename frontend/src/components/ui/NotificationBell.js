import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationAPI } from '../../services/api';
import { timeAgo } from '../../utils/constants';

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchNotifs = () => {
    notificationAPI.getAll()
      .then(r => { setNotifs(r.data.notifications || []); setUnread(r.data.unreadCount || 0); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAll = async () => {
    await notificationAPI.markAllRead();
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const TYPE_ICONS = {
    badge: '🏅', level_up: '⬆️', activity_approved: '✅',
    activity_rejected: '❌', mission_complete: '🏆', challenge_complete: '🎯', system: '🔔',
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1a2e1f] border border-gray-100 dark:border-[#2d4a35] rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifications</h3>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-eco-600 dark:text-eco-400 hover:underline">Mark all read</button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  <p className="text-3xl mb-2">🔔</p>No notifications yet
                </div>
              ) : notifs.map(n => (
                <div key={n._id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0 transition-colors ${!n.isRead ? 'bg-eco-50/50 dark:bg-eco-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                  <span className="text-xl flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-eco-500 flex-shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
