import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';

export default function NotificationToast() {
  const { notifications, dismissNotification } = useSocket();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="pointer-events-auto"
          >
            <div className={`
              relative flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-sm
              ${notif.type === 'level_up'
                ? 'bg-gradient-to-r from-eco-600 to-eco-500 text-white border-eco-400'
                : notif.type === 'badge'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-400'
                  : 'bg-white dark:bg-[#1a2e1f] border-gray-100 dark:border-[#2d4a35]'
              }
            `}>
              <span className="text-2xl flex-shrink-0 animate-bounce-subtle">{notif.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{notif.title}</p>
                <p className="text-xs opacity-90 mt-0.5">{notif.message}</p>
              </div>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="text-white/70 hover:text-white text-lg leading-none flex-shrink-0"
              >
                ×
              </button>

              {/* Progress bar */}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-white/40 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
