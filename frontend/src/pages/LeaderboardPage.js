import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { leaderboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getLevelInfo, formatNumber, getRankIcon } from '../utils/constants';

const PERIODS = [
  { key: 'all',    label: 'All Time' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly',label: 'This Month' },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [onlineFlash, setOnlineFlash] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data } = await leaderboardAPI.get(period);
      setLeaders(data.leaderboard || []);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Live updates via socket
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      setOnlineFlash(true);
      setTimeout(() => setOnlineFlash(false), 1000);
      fetchLeaderboard();
    };
    socket.on('leaderboard:update', handler);
    return () => socket.off('leaderboard:update', handler);
  }, [socket, fetchLeaderboard]);

  const myRank = leaders.findIndex(l => (l._id || l.id) === user?._id) + 1;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">🏆 Leaderboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">See where you stand among eco warriors</p>
          </div>
          <motion.div
            animate={{ scale: onlineFlash ? [1, 1.3, 1] : 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-eco-50 dark:bg-eco-900/20 rounded-full border border-eco-200 dark:border-eco-700"
          >
            <span className="w-2 h-2 rounded-full bg-eco-500 animate-pulse" />
            <span className="text-xs font-medium text-eco-600 dark:text-eco-400">Live</span>
          </motion.div>
        </div>

        {/* Period filter */}
        <div className="flex gap-2 mt-4">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p.key
                  ? 'bg-eco-600 text-white shadow-md shadow-eco-600/20'
                  : 'bg-white dark:bg-[#1a2e1f] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-eco-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* My rank card */}
      {myRank > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="card p-4 mb-4 border-eco-200 dark:border-eco-700 bg-eco-50 dark:bg-eco-900/20 flex items-center gap-3"
        >
          <span className="text-2xl font-bold text-eco-600 dark:text-eco-400 min-w-[48px] text-center">#{myRank}</span>
          <span className="text-2xl">{user?.avatar || '🌱'}</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">You ({user?.username})</p>
            <p className="text-sm text-eco-600 dark:text-eco-400">{formatNumber(user?.xp)} XP · Level {user?.level}</p>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Your rank</span>
        </motion.div>
      )}

      {/* Top 3 podium */}
      {!loading && leaders.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-end justify-center gap-3 mb-6 pt-4"
        >
          {[leaders[1], leaders[0], leaders[2]].map((leader, podiumIdx) => {
            if (!leader) return null;
            const realRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
            const heights = [' h-24', 'h-32', 'h-20'];
            const colors = ['bg-gray-200 dark:bg-gray-700', 'bg-yellow-400', 'bg-amber-600'];
            const levelInfo = getLevelInfo(leader.level || 1);
            return (
              <motion.div
                key={leader._id || realRank}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + podiumIdx * 0.1 }}
                className="flex flex-col items-center flex-1 max-w-[120px]"
              >
                <span className="text-3xl mb-1">{leader.avatar || '🌱'}</span>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-full text-center">{leader.username}</p>
                <p className="text-xs text-gray-400 mb-2">{formatNumber(leader.xp || leader.periodXP)} XP</p>
                <div className={`w-full ${heights[podiumIdx]} ${colors[podiumIdx]} rounded-t-xl flex items-start justify-center pt-2`}>
                  <span className="text-xl">{getRankIcon(realRank)}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Full list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(10)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : leaders.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-2">🌱</p>
            <p>No data yet — be the first!</p>
          </div>
        ) : (
          <AnimatePresence>
            {leaders.map((leader, i) => {
              const isMe = (leader._id || leader.id)?.toString() === user?._id?.toString();
              const levelInfo = getLevelInfo(leader.level || 1);
              return (
                <motion.div
                  key={leader._id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors ${
                    isMe ? 'bg-eco-50 dark:bg-eco-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {/* Rank */}
                  <span className="text-lg font-bold min-w-[36px] text-center text-gray-500 dark:text-gray-400">
                    {i < 3 ? getRankIcon(i + 1) : `${i + 1}`}
                  </span>

                  {/* Avatar */}
                  <span className="text-2xl flex-shrink-0">{leader.avatar || '🌱'}</span>

                  {/* Name + level */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isMe ? 'text-eco-700 dark:text-eco-300' : 'text-gray-900 dark:text-gray-100'}`}>
                      {leader.username} {isMe && <span className="text-xs font-normal">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-400">{levelInfo.icon} {levelInfo.title}</p>
                  </div>

                  {/* Badges count */}
                  {leader.badges?.length > 0 && (
                    <span className="text-xs text-gray-400 hidden sm:block">
                      🏅 {leader.badges.length}
                    </span>
                  )}

                  {/* XP */}
                  <div className="text-right">
                    <p className="font-bold text-eco-600 dark:text-eco-400 text-sm">
                      {formatNumber(leader.xp || leader.periodXP)} XP
                    </p>
                    <p className="text-xs text-gray-400">Lv. {leader.level}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
