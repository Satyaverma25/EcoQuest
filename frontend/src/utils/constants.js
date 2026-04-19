// Topic metadata
export const TOPICS = {
  climateChange:    { label: 'Climate Change',    icon: '🌡️', color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20' },
  recycling:        { label: 'Recycling',          icon: '♻️', color: 'text-eco-600',    bg: 'bg-eco-50 dark:bg-eco-900/20' },
  biodiversity:     { label: 'Biodiversity',       icon: '🦋', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  oceanHealth:      { label: 'Ocean Health',       icon: '🌊', color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  renewableEnergy:  { label: 'Renewable Energy',   icon: '☀️', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  general:          { label: 'General',            icon: '🌍', color: 'text-gray-600',   bg: 'bg-gray-50 dark:bg-gray-800' },
};

// Level info
export const LEVELS = [
  { level: 1, title: 'Eco Seedling',       minXP: 0,     icon: '🌱' },
  { level: 2, title: 'Green Sprout',       minXP: 100,   icon: '🌿' },
  { level: 3, title: 'Nature Explorer',    minXP: 300,   icon: '🍃' },
  { level: 4, title: 'Eco Warrior',        minXP: 600,   icon: '⚔️' },
  { level: 5, title: 'Green Guardian',     minXP: 1000,  icon: '🛡️' },
  { level: 6, title: 'Planet Protector',   minXP: 1500,  icon: '🌍' },
  { level: 7, title: 'Earth Champion',     minXP: 2500,  icon: '🏆' },
  { level: 8, title: 'Sustainability Sage',minXP: 4000,  icon: '🦉' },
  { level: 9, title: 'Eco Legend',         minXP: 6000,  icon: '⭐' },
  { level: 10,title: 'Earth Deity',        minXP: 10000, icon: '🌟' },
];

export const getLevelInfo = (level) => LEVELS[level - 1] || LEVELS[0];

export const getXPProgress = (xp, level) => {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
  const current = thresholds[level - 1] || 0;
  const next = thresholds[level] || 10000;
  const progress = Math.min(100, Math.round(((xp - current) / (next - current)) * 100));
  const remaining = Math.max(0, next - xp);
  return { progress, remaining, next };
};

export const AVATARS = ['🌱', '🌿', '🍃', '🌲', '🌳', '🌴', '🦋', '🐝', '🐢', '🌊', '⭐', '🔥'];

export const RARITY_COLORS = {
  common:    'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900',
  rare:      'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20',
  epic:      'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20',
  legendary: 'border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20',
};

export const formatNumber = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n?.toString() || '0';
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const getDifficultyClass = (difficulty) => ({
  beginner:     'diff-beginner',
  intermediate: 'diff-intermediate',
  advanced:     'diff-advanced',
}[difficulty] || 'diff-beginner');

export const getRankIcon = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};
