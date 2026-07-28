// ============================================================
// Gamification Hub — Rich Mock Data
// ============================================================

export const playerProfile = {
  name: 'Alex Carter',
  initials: 'AC',
  level: 12,
  title: 'AI Pioneer',
  xp: 4250,
  nextLevelXp: 5000,
  totalXpEarned: 18450,
  companyRank: 7,
  departmentRank: 2,
  totalPlayers: 312,
  departmentPlayers: 28,
  streakDays: 14,
  longestStreak: 23,
};

export const leaderboard = [
  { rank: 1, name: 'Priya Sharma', initials: 'PS', level: 18, xp: 9840, department: 'AI Research', badge: '🥇', trend: 'up' },
  { rank: 2, name: 'Marcus Lee', initials: 'ML', level: 16, xp: 8210, department: 'Engineering', badge: '🥈', trend: 'up' },
  { rank: 3, name: 'Sofia Reyes', initials: 'SR', level: 15, xp: 7450, department: 'Product', badge: '🥉', trend: 'stable' },
  { rank: 4, name: 'James O\'Brien', initials: 'JO', level: 14, xp: 6900, department: 'Leadership', badge: '⭐', trend: 'down' },
  { rank: 5, name: 'Aisha Khan', initials: 'AK', level: 14, xp: 6600, department: 'Engineering', badge: '⭐', trend: 'up' },
  { rank: 6, name: 'David Chen', initials: 'DC', level: 13, xp: 5200, department: 'Data Science', badge: '⭐', trend: 'down' },
  { rank: 7, name: 'Alex Carter', initials: 'AC', level: 12, xp: 4250, department: 'Engineering', badge: '⭐', trend: 'up', isMe: true },
  { rank: 8, name: 'Riya Patel', initials: 'RP', level: 12, xp: 4100, department: 'Product', badge: '⭐', trend: 'stable' },
  { rank: 9, name: 'Tom Wright', initials: 'TW', level: 11, xp: 3800, department: 'Leadership', badge: '⭐', trend: 'up' },
  { rank: 10, name: 'Nina Osei', initials: 'NO', level: 11, xp: 3500, department: 'AI Research', badge: '⭐', trend: 'stable' },
];

export const challenges = [
  {
    id: 'ch1',
    title: 'AI Certification Sprint',
    description: 'Complete any AI/ML certification from the approved list within 7 days',
    xpReward: 1500,
    bonusBadge: '🤖',
    deadline: 'Jul 31',
    daysLeft: 3,
    progress: 65,
    category: 'Learning',
    difficulty: 'Hard',
    participants: 47,
    type: 'weekly',
    color: '#7c3aed',
  },
  {
    id: 'ch2',
    title: 'Collaboration Champion',
    description: 'Receive 5 peer recognitions this week for exceptional teamwork',
    xpReward: 800,
    bonusBadge: '🤝',
    deadline: 'Jul 30',
    daysLeft: 2,
    progress: 80,
    category: 'Teamwork',
    difficulty: 'Medium',
    participants: 89,
    type: 'weekly',
    color: '#06b6d4',
  },
  {
    id: 'ch3',
    title: 'Knowledge Sharer',
    description: 'Upload 3 documents or knowledge articles to your Twin knowledge base',
    xpReward: 600,
    bonusBadge: '📚',
    deadline: 'Aug 5',
    daysLeft: 8,
    progress: 33,
    category: 'Knowledge',
    difficulty: 'Easy',
    participants: 123,
    type: 'monthly',
    color: '#10b981',
  },
  {
    id: 'ch4',
    title: 'Project Ace',
    description: 'Achieve 90%+ success score on an active project milestone',
    xpReward: 1200,
    bonusBadge: '🎯',
    deadline: 'Aug 10',
    daysLeft: 13,
    progress: 45,
    category: 'Projects',
    difficulty: 'Hard',
    participants: 31,
    type: 'monthly',
    color: '#f59e0b',
  },
];

export const achievements = [
  { id: 'a1', name: 'First Steps', emoji: '👣', description: 'Complete your digital twin profile', unlocked: true, xpValue: 100, unlockedDate: 'Jan 2024', rarity: 'Common' },
  { id: 'a2', name: 'AI Pioneer', emoji: '🤖', description: 'Achieve AI Readiness score above 80', unlocked: true, xpValue: 500, unlockedDate: 'Mar 2024', rarity: 'Rare' },
  { id: 'a3', name: 'Skill Architect', emoji: '🏗️', description: 'Add 20+ skills to your DNA matrix', unlocked: true, xpValue: 300, unlockedDate: 'Feb 2024', rarity: 'Uncommon' },
  { id: 'a4', name: 'Team Magnet', emoji: '🧲', description: 'Get matched to 5+ team projects', unlocked: true, xpValue: 400, unlockedDate: 'Apr 2024', rarity: 'Uncommon' },
  { id: 'a5', name: 'Streak Legend', emoji: '🔥', description: 'Maintain a 30-day activity streak', unlocked: false, xpValue: 800, unlockedDate: null, rarity: 'Epic' },
  { id: 'a6', name: 'Knowledge Oracle', emoji: '📖', description: 'Feed 10+ documents to your knowledge base', unlocked: true, xpValue: 450, unlockedDate: 'May 2024', rarity: 'Rare' },
  { id: 'a7', name: 'Top Performer', emoji: '🏆', description: 'Reach Top 5% company ranking', unlocked: false, xpValue: 1000, unlockedDate: null, rarity: 'Legendary' },
  { id: 'a8', name: 'Certified Expert', emoji: '🎓', description: 'Earn 3+ professional certifications', unlocked: true, xpValue: 600, unlockedDate: 'Jun 2024', rarity: 'Rare' },
  { id: 'a9', name: 'Speed Learner', emoji: '⚡', description: 'Complete 5 courses in one month', unlocked: false, xpValue: 700, unlockedDate: null, rarity: 'Epic' },
  { id: 'a10', name: 'Mentor Mind', emoji: '🌟', description: 'Mentor 3 junior team members', unlocked: true, xpValue: 550, unlockedDate: 'Jul 2024', rarity: 'Rare' },
  { id: 'a11', name: 'Innovation Spark', emoji: '💡', description: 'Submit an approved innovation proposal', unlocked: false, xpValue: 900, unlockedDate: null, rarity: 'Epic' },
  { id: 'a12', name: 'Twin Synced', emoji: '🔗', description: 'Achieve 95%+ twin health score', unlocked: false, xpValue: 1200, unlockedDate: null, rarity: 'Legendary' },
];

export const xpHistory = [
  { month: 'Feb', xp: 1200 },
  { month: 'Mar', xp: 2100 },
  { month: 'Apr', xp: 1800 },
  { month: 'May', xp: 2800 },
  { month: 'Jun', xp: 3200 },
  { month: 'Jul', xp: 4250 },
];

export const recentActivity = [
  { action: 'Completed mission: Review AI Projects', xp: 200, time: '2h ago', emoji: '✅' },
  { action: 'Skill DNA updated: +3 new skills', xp: 150, time: '1d ago', emoji: '🧬' },
  { action: 'Knowledge upload: Architecture Design Doc', xp: 100, time: '2d ago', emoji: '📄' },
  { action: 'Peer recognition received from Priya S.', xp: 75, time: '3d ago', emoji: '👏' },
  { action: 'Daily check-in streak: Day 14', xp: 50, time: '4d ago', emoji: '🔥' },
  { action: 'Project milestone achieved: ML Platform v2', xp: 300, time: '5d ago', emoji: '🎯' },
];

export const streakCalendar = (() => {
  const days = [];
  const today = new Date();
  for (let i = 41; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const intensity = i < 14 ? 3 : i < 25 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2);
    days.push({ date: d.toISOString().split('T')[0], intensity });
  }
  return days;
})();

export const rewardStore = [
  { id: 'r1', name: 'Extra WFH Day', description: 'One additional work-from-home day of your choice', cost: 2000, emoji: '🏠', category: 'Flexibility', available: true },
  { id: 'r2', name: 'Learning Budget +$100', description: 'Add $100 to your L&D budget this month', cost: 1500, emoji: '📚', category: 'Learning', available: true },
  { id: 'r3', name: 'Wellness Voucher', description: '$50 wellness and mental health credit', cost: 1200, emoji: '🧘', category: 'Wellness', available: true },
  { id: 'r4', name: 'Conference Pass', description: 'Attend one industry conference of your choice', cost: 5000, emoji: '🎤', category: 'Career', available: false },
  { id: 'r5', name: 'Lunch with Leadership', description: 'Private lunch with C-suite executives', cost: 3500, emoji: '🍽️', category: 'Networking', available: true },
  { id: 'r6', name: 'Early Finish Friday', description: 'Leave 2 hours early any Friday this month', cost: 800, emoji: '🎉', category: 'Flexibility', available: true },
];
