import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { getLevelInfo, getXPProgress } from '../../utils/constants';
import NotificationBell from './NotificationBell';

// Nav items differ by role
const studentNav = [
  { to: '/dashboard',   icon: '🏠', label: 'Dashboard' },
  { to: '/quizzes',     icon: '📝', label: 'Quizzes' },
  { to: '/missions',    icon: '🎯', label: 'Missions' },
  { to: '/challenges',  icon: '⚡', label: 'Challenges' },
  { to: '/activities',  icon: '🌿', label: 'Activity Logger' },
  { to: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  { to: '/profile',     icon: '👤', label: 'Profile' },
];

const teacherNav = [
  { to: '/dashboard',  icon: '🏠', label: 'Dashboard' },
  { to: '/teacher',    icon: '🎓', label: 'Teacher Panel' },
  { to: '/quizzes',    icon: '📝', label: 'Quizzes' },
  { to: '/missions',   icon: '🎯', label: 'Missions' },
  { to: '/activities', icon: '🌿', label: 'Activity Logger' },
  { to: '/leaderboard',icon: '🏆', label: 'Leaderboard' },
  { to: '/profile',    icon: '👤', label: 'Profile' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const { onlineCount } = useSocket();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const levelInfo = getLevelInfo(user?.level || 1);
  const { progress, remaining } = getXPProgress(user?.xp || 0, user?.level || 1);

  const isTeacher = user?.role === 'teacher';
  const navItems = isTeacher ? teacherNav : studentNav;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-[#2d4a35]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-eco-gradient flex items-center justify-center text-xl shadow-md">🌍</div>
          <div>
            <h1 className="font-display font-bold text-eco-700 dark:text-eco-300 text-lg leading-none">EcoQuest</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">GEEP Platform</p>
          </div>
        </div>
      </div>

      {/* User XP card */}
      <div className="p-4 mx-3 mt-4 rounded-xl bg-eco-50 dark:bg-eco-900/20 border border-eco-100 dark:border-eco-800">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-2xl">{user?.avatar || '🌱'}</span>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{user?.username}</p>
            <p className="text-xs text-eco-600 dark:text-eco-400">{levelInfo.icon} {levelInfo.title}</p>
            {user?.studentType && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {user.studentType === 'School Student' ? '📚' : '🎓'} {user.studentType}
              </p>
            )}
            {user?.role === 'teacher' && (
              <p className="text-xs text-purple-500 font-semibold">🎓 Teacher</p>
            )}
            {user?.role === 'admin' && (
              <p className="text-xs text-orange-500 font-semibold">⚙️ Admin</p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{user?.xp?.toLocaleString()} XP</span>
            <span>{remaining} to next</span>
          </div>
          <div className="xp-bar">
            <motion.div className="xp-bar-fill" initial={{ width: 0 }}
              animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">Lv. {user?.level}</span>
          <span className="text-xs text-orange-500">🔥 {user?.streak}d streak</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-eco-gradient text-white shadow-md shadow-eco-600/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-eco-50 dark:hover:bg-eco-900/20 hover:text-eco-700 dark:hover:text-eco-300'
              }`
            }>
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`
            }>
            <span className="text-base">⚙️</span>Admin Panel
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-[#2d4a35] space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-400">
          <span>🟢 {onlineCount} online</span>
          <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
          🚪 Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-full bg-white dark:bg-[#1a2e1f] border-r border-gray-100 dark:border-[#2d4a35] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex lg:hidden">
            <div className="w-64 h-full bg-white dark:bg-[#1a2e1f] shadow-2xl flex flex-col">
              <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-[#2d4a35]">
                <span className="font-display font-bold text-eco-700 dark:text-eco-300">🌍 EcoQuest</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col">
                <SidebarContent />
              </div>
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with notification bell */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1a2e1f] border-b border-gray-100 dark:border-[#2d4a35]">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">☰</button>
          <span className="font-display font-bold text-eco-700 dark:text-eco-300">🌍 EcoQuest</span>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">{dark ? '☀️' : '🌙'}</button>
          </div>
        </header>

        {/* Desktop top bar with notification bell */}
        <div className="hidden lg:flex items-center justify-end px-6 py-3 border-b border-gray-100 dark:border-[#2d4a35] bg-white dark:bg-[#1a2e1f]">
          <NotificationBell />
        </div>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
