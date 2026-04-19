import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-7xl mb-6"
        >
          🌿
        </motion.div>
        <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Lost in the Forest</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">This page doesn't exist. Let's get you back on the eco trail.</p>
        <Link to="/dashboard" className="btn-primary px-8 py-3 inline-block">
          🏠 Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
