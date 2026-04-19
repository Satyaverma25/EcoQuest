import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-[#0d1a12] flex flex-col items-center justify-center z-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="text-5xl mb-4"
      >
        🌍
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="font-display font-bold text-eco-700 dark:text-eco-300 text-xl">EcoQuest</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Loading your journey...</p>
      </motion.div>
      <div className="mt-6 w-32 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-eco-gradient rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
