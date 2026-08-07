import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Crown, Star, Zap, Gift, Target, Award, TrendingUp, TrendingDown, Minus, Calendar, BarChart3, Loader2 } from 'lucide-react';
import { gamificationAPI } from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Design tokens ───────────────────────────────────────────
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  borderRadius: '20px',
  backdropFilter: 'blur(20px)',
};

const RARITY_COLORS: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  Common:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)', glow: 'none' },
  Uncommon:  { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', glow: '0 0 12px rgba(16,185,129,0.3)' },
  Rare:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)', glow: '0 0 12px rgba(96,165,250,0.3)' },
  Epic:      { color: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)',  glow: '0 0 15px rgba(124,58,237,0.4)' },
  Legendary: { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)',  glow: '0 0 20px rgba(245,158,11,0.5)' },
};

const DIFF_COLORS: Record<string, string> = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };

// ─── Shared Components ────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="mb-5">
    <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon} {title}
    </h2>
    {subtitle && <p style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>{subtitle}</p>}
  </div>
);

const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ ...GLASS, ...style }}>{children}</div>
);

// ─── XP Hero Banner ───────────────────────────────────────────
const XPProgressBar: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      setLoading(true);
      try {
        const gamData = await gamificationAPI.getProfile(currentEmployee.id);
        setProfile({
          level: gamData.level,
          xp: gamData.xp,
          nextLevelXp: gamData.next_level_xp,
          totalXpEarned: gamData.total_xp_earned,
          companyRank: gamData.company_rank,
          departmentRank: gamData.department_rank,
          streakDays: gamData.streak_days,
          title: gamData.title,
          name: currentEmployee.full_name,
        });
      } catch (error) {
        console.error('Failed to load gamification profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  if (loading || !profile) {
    return <GlassCard style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin text-amber-500" size={24} /></GlassCard>;
  }

  const pct = (profile.xp / profile.nextLevelXp) * 100;
  const quickStats = [
    { label: 'Company Rank', value: `#${profile.companyRank}`, icon: <Crown size={13} />, color: '#fbbf24' },
    { label: 'Dept. Rank',   value: `#${profile.departmentRank}`, icon: <Trophy size={13} />, color: '#a78bfa' },
    { label: 'Total XP',     value: profile.totalXpEarned.toLocaleString(), icon: <Zap size={13} />, color: '#22d3ee' },
    { label: 'Streak',       value: `${profile.streakDays}d 🔥`, icon: <Flame size={13} />, color: '#f97316' },
  ];

  return (
    <GlassCard style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="flex items-center gap-5 relative z-10">
        {/* Level Badge */}
        <div style={{ width: '72px', height: '72px', borderRadius: '22px', flexShrink: 0, background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(245,158,11,0.5)' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>LVL</span>
          <span style={{ fontSize: '28px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{profile.level}</span>
        </div>

        <div style={{ flex: 1 }}>
          <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
            <div>
              <p style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: '6px' }}>{profile.name}</p>
              <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 800, background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' }}>
                {profile.title}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {profile.xp.toLocaleString()} <span style={{ fontSize: '13px', color: '#64748b' }}>XP</span>
              </p>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>Next: {profile.nextLevelXp.toLocaleString()}</p>
            </div>
          </div>

          <div style={{ height: '10px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)', borderRadius: '99px', boxShadow: '0 0 12px rgba(245,158,11,0.6)', transition: 'width 1s ease' }} />
          </div>
          <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginTop: '5px', textAlign: 'right' }}>
            {(profile.nextLevelXp - profile.xp).toLocaleString()} XP to Level {profile.level + 1}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
        {quickStats.map((s, i) => (
          <div key={i} style={{ padding: '10px', borderRadius: '12px', background: `${s.color}12`, border: `1px solid ${s.color}25`, textAlign: 'center' }}>
            <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>{s.icon}</div>
            <p style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{s.value}</p>
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ─── Leaderboard ──────────────────────────────────────────────
const Leaderboard: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      setLoading(true);
      try {
        const rows = await gamificationAPI.getLeaderboard({
          limit: 10,
          current_employee_id: currentEmployee.id,
        });
        setLeaderboard(rows.map((p: any) => ({
          rank: p.rank,
          name: p.name,
          initials: p.initials,
          level: p.level,
          xp: p.xp,
          department: p.department,
          badge: p.badge,
          trend: p.trend,
          isMe: p.is_me,
        })));
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  if (loading) {
    return <GlassCard style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin text-amber-500" size={24} /></GlassCard>;
  }

  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <SectionHeader icon={<Crown size={14} style={{ color: '#fbbf24' }} />} title="Company Leaderboard" subtitle={`Top performers out of ${leaderboard.length} players`} />
      <div className="space-y-2">
        {leaderboard.map((player) => (
          <div key={player.rank} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', background: player.isMe ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(249,115,22,0.08))' : 'rgba(255,255,255,0.9)', border: player.isMe ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(226, 232, 240, 0.8)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: player.rank <= 3 ? '#fbbf24' : '#475569', width: '22px', textAlign: 'center', flexShrink: 0 }}>
              {player.rank <= 3 ? player.badge : `#${player.rank}`}
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white', background: player.isMe ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'rgba(248, 250, 252, 0.8)' }}>
              {player.initials}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: player.isMe ? '#f59e0b' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {player.name}
                {player.isMe && <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '99px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>YOU</span>}
              </p>
              <p style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>Lv {player.level} · {player.department}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{player.xp.toLocaleString()}</p>
              <p style={{ fontSize: '9px', color: '#475569' }}>XP</p>
            </div>
            <div style={{ width: '20px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
              {player.trend === 'up'     && <TrendingUp   size={13} style={{ color: '#10b981' }} />}
              {player.trend === 'down'   && <TrendingDown  size={13} style={{ color: '#ef4444' }} />}
              {player.trend === 'stable' && <Minus         size={13} style={{ color: '#64748b' }} />}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ─── Challenges ───────────────────────────────────────────────
const Challenges: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      setLoading(true);
      try {
        const data = await gamificationAPI.getChallenges(currentEmployee.id);
        const challengesData = Array.isArray(data) ? data : (data?.challenges || []);
        setChallenges(challengesData.map((ch: any) => ({
          id: ch.id,
          title: ch.title,
          description: ch.description,
          difficulty: ch.difficulty,
          type: ch.type,
          color: ch.color,
          xpReward: ch.xp_reward || 0,
          bonusBadge: ch.bonus_badge || '🏆',
          daysLeft: ch.days_left || 0,
          participants: ch.participants || 0,
          progress: ch.progress || 0,
        })));
      } catch (error) {
        console.error('Failed to load challenges:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  if (loading) {
    return <GlassCard style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin text-amber-500" size={24} /></GlassCard>;
  }

  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <SectionHeader icon={<Target size={14} style={{ color: '#a78bfa' }} />} title="Active Challenges" subtitle="Complete for bonus XP and exclusive badges" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((ch) => (
          <div key={ch.id} style={{ padding: '16px', borderRadius: '16px', background: `${ch.color}10`, border: `1px solid ${ch.color}25`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${ch.color}, ${ch.color}88)` }} />
            <div className="flex items-start gap-3 mb-3">
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{ch.bonusBadge}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ padding: '2px 7px', borderRadius: '99px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: `${DIFF_COLORS[ch.difficulty]}18`, color: DIFF_COLORS[ch.difficulty], border: `1px solid ${DIFF_COLORS[ch.difficulty]}35` }}>{ch.difficulty}</span>
                  <span style={{ padding: '2px 7px', borderRadius: '99px', fontSize: '9px', fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>{ch.type}</span>
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{ch.title}</h4>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>{ch.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{ch.progress}% complete</span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: ch.daysLeft <= 3 ? '#ef4444' : '#64748b' }}>⏱ {ch.daysLeft}d left</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ height: '100%', width: `${ch.progress}%`, background: `linear-gradient(90deg, ${ch.color}, ${ch.color}cc)`, borderRadius: '99px', boxShadow: `0 0 8px ${ch.color}60` }} />
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>👥 {ch.participants} enrolled</span>
              <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, background: `${ch.color}20`, color: ch.color, border: `1px solid ${ch.color}38` }}>+{ch.xpReward?.toLocaleString() || 0} XP</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ─── Achievement Gallery ──────────────────────────────────────
const AchievementGallery: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      setLoading(true);
      try {
        const data = await gamificationAPI.getAchievements(currentEmployee.id);
        setAchievements((data || []).map((ach: any) => ({
          id: ach.id,
          name: ach.name,
          emoji: ach.emoji || '🏆',
          rarity: ach.rarity || 'Common',
          unlocked: ach.unlocked || !!ach.unlocked_at,
          unlockedDate: ach.unlocked_date,
          xpValue: ach.xp_value || 0,
        })));
      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  if (loading) {
    return <GlassCard style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin text-amber-500" size={24} /></GlassCard>;
  }

  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <SectionHeader icon={<Award size={14} style={{ color: '#fbbf24' }} />} title="Achievement Gallery" subtitle={`${achievements.filter(a => a.unlocked).length} of ${achievements.length} unlocked`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
        {achievements.map((ach: any) => {
          const unlocked = ach.unlocked || !!ach.unlocked_at;
          const rc = RARITY_COLORS[ach.rarity] || RARITY_COLORS.Common;
          return (
            <div key={ach.id} style={{ padding: '14px', borderRadius: '16px', textAlign: 'center', background: unlocked ? rc.bg : 'rgba(248, 250, 252, 0.8)', border: `1px solid ${unlocked ? rc.border : 'rgba(226, 232, 240, 0.8)'}`, boxShadow: unlocked ? rc.glow : 'none', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(1)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{ach.emoji || '🏆'}</div>
              <p style={{ fontSize: '11px', fontWeight: 800, color: unlocked ? '#0f172a' : '#64748b', lineHeight: 1.3, marginBottom: '4px' }}>{ach.name}</p>
              <span style={{ padding: '1px 6px', borderRadius: '99px', fontSize: '9px', fontWeight: 800, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>{ach.rarity || 'Common'}</span>
              <p style={{ fontSize: '9px', color: '#475569', marginTop: '5px', fontWeight: 600 }}>
                {unlocked ? ach.unlockedDate || ach.unlocked_date || 'Unlocked' : `+${ach.xpValue || ach.xp_value || 0} XP`}
              </p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// ─── XP Chart ─────────────────────────────────────────────────
const XPChart: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [xpHistory, setXpHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      setLoading(true);
      try {
        const data = await gamificationAPI.getXPHistory(currentEmployee.id);
        setXpHistory(data || []);
      } catch (error) {
        console.error('Failed to load XP history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  if (loading) {
    return <GlassCard style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin text-amber-500" size={24} /></GlassCard>;
  }

  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <SectionHeader icon={<BarChart3 size={14} style={{ color: '#22d3ee' }} />} title="XP Growth Timeline" subtitle="Experience earned over 6 months" />
      <div style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={xpHistory} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.8)" />
            <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }} itemStyle={{ color: '#f59e0b' }} labelStyle={{ color: '#0f172a' }} cursor={{ stroke: 'rgba(226, 232, 240, 0.8)' }} />
            <Area type="monotone" dataKey="xp" name="XP Earned" stroke="#f59e0b" strokeWidth={2.5} fill="url(#xpGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

// ─── Streak Calendar ──────────────────────────────────────────
const StreakCalendar: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [streakData, setStreakData] = useState({ streakDays: 0, longestStreak: 0, streakCalendar: [] as any[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      setLoading(true);
      try {
        const data = await gamificationAPI.getStreak(currentEmployee.id);
        setStreakData({
          streakDays: data.streak_days || 0,
          longestStreak: data.longest_streak || 0,
          streakCalendar: data.calendar || [],
        });
      } catch (error) {
        console.error('Failed to load streak data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  if (loading) {
    return <GlassCard style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin text-amber-500" size={24} /></GlassCard>;
  }

  const HEAT_COLORS = ['rgba(248, 250, 252, 0.8)', 'rgba(16,185,129,0.25)', 'rgba(16,185,129,0.55)', 'rgba(16,185,129,0.9)'];
  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <SectionHeader icon={<Calendar size={14} style={{ color: '#10b981' }} />} title="Activity Streak" subtitle={`Current: ${streakData.streakDays}d · Longest: ${streakData.longestStreak}d`} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {streakData.streakCalendar.map((d, i) => (
          <div key={i} title={d.date} style={{ width: '14px', height: '14px', borderRadius: '3px', background: HEAT_COLORS[d.intensity], border: '1px solid rgba(226, 232, 240, 0.8)' }} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>Less</span>
        {HEAT_COLORS.map((c, i) => <div key={i} style={{ width: '12px', height: '12px', borderRadius: '3px', background: c }} />)}
        <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>More</span>
      </div>
    </GlassCard>
  );
};

// ─── Recent Activity Feed ─────────────────────────────────────
const RecentActivity: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      setLoading(true);
      try {
        const data = await gamificationAPI.getActivity(currentEmployee.id);
        setActivity(data || []);
      } catch (error) {
        console.error('Failed to load activity:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  if (loading) {
    return <GlassCard style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin text-amber-500" size={24} /></GlassCard>;
  }

  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <SectionHeader icon={<Zap size={14} style={{ color: '#a78bfa' }} />} title="Recent Activity" />
      <div className="space-y-2">
        {activity.map((act, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{act.emoji || '⚡'}</span>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.action}</p>
              <p style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>{act.time}</p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', flexShrink: 0 }}>+{act.xp} XP</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ─── Reward Store ─────────────────────────────────────────────
const RewardStore: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [rewards, setRewards] = useState<any[]>([]);
  const [playerXP, setPlayerXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      setLoading(true);
      try {
        const [rewardsData, profile] = await Promise.all([
          gamificationAPI.getRewards(),
          gamificationAPI.getProfile(currentEmployee.id),
        ]);
        setRewards(rewardsData || []);
        setPlayerXP(profile.xp);
      } catch (error) {
        console.error('Failed to load rewards:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  if (loading) {
    return <GlassCard style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin text-amber-500" size={24} /></GlassCard>;
  }

  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={14} style={{ color: '#ec4899' }} /> Reward Store
          </h2>
          <p style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>Redeem your XP for real perks</p>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: '99px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '13px', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Zap size={13} /> {playerXP.toLocaleString()} XP
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {rewards.map((reward) => {
          const isClaimed = claimed.has(reward.id);
          const canAfford = playerXP >= reward.cost;
          return (
            <div key={reward.id} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.9)', border: `1px solid ${isClaimed ? 'rgba(16,185,129,0.3)' : 'rgba(226, 232, 240, 0.8)'}`, opacity: !reward.available ? 0.5 : 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '2rem' }}>{reward.emoji}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{reward.name}</p>
                <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4, marginTop: '2px' }}>{reward.description}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <span style={{ fontSize: '12px', fontWeight: 900, color: canAfford ? '#f59e0b' : '#ef4444' }}>{reward.cost.toLocaleString()} XP</span>
                <button
                  onClick={() => { if (reward.available && canAfford && !isClaimed && currentEmployee) gamificationAPI.claimReward(currentEmployee.id, reward.id).then(() => setClaimed(prev => new Set([...prev, reward.id]))); }}
                  style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: reward.available && canAfford && !isClaimed ? 'pointer' : 'not-allowed', background: isClaimed ? 'rgba(16,185,129,0.2)' : canAfford ? 'linear-gradient(135deg, #ec4899, #a855f7)' : 'rgba(248, 250, 252, 0.8)', color: isClaimed ? '#10b981' : canAfford ? 'white' : '#64748b', border: 'none', boxShadow: canAfford && !isClaimed ? '0 0 12px rgba(236,72,153,0.3)' : 'none' }}
                >
                  {isClaimed ? '✓ Claimed' : !reward.available ? 'Unavailable' : !canAfford ? 'Need XP' : 'Redeem'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// ─── Main Page ────────────────────────────────────────────────
type TabId = 'overview' | 'leaderboard' | 'challenges' | 'achievements' | 'store';

export const GamificationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',      label: 'Overview',      icon: <Star size={13} /> },
    { id: 'leaderboard',   label: 'Leaderboard',   icon: <Crown size={13} /> },
    { id: 'challenges',    label: 'Challenges',    icon: <Target size={13} /> },
    { id: 'achievements',  label: 'Achievements',  icon: <Award size={13} /> },
    { id: 'store',         label: 'Reward Store',  icon: <Gift size={13} /> },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 30%, #f1f5f9 60%, #f8fafc 100%)', color: '#0f172a' }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #f59e0b, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(245,158,11,0.45)' }}>
              <Trophy size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>
                Gamification Hub
              </h1>
              <p style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Level up your career · Compete · Earn rewards</p>
            </div>
          </div>
        </div>

        {/* XP Hero */}
        <XPProgressBar />

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '6px', padding: '6px', borderRadius: '16px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226, 232, 240, 0.8)', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, background: activeTab === tab.id ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'transparent', color: activeTab === tab.id ? 'white' : '#64748b', border: 'none', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', boxShadow: activeTab === tab.id ? '0 0 15px rgba(245,158,11,0.35)' : 'none' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <Challenges />
              <AchievementGallery />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <XPChart />
              <StreakCalendar />
              <RecentActivity />
            </div>
          </div>
        )}
        {activeTab === 'leaderboard'  && <Leaderboard />}
        {activeTab === 'challenges'   && <Challenges />}
        {activeTab === 'achievements' && <AchievementGallery />}
        {activeTab === 'store'        && <RewardStore />}
      </div>
    </div>
  );
};
