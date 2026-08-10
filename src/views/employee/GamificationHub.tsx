import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Crown, Star, Zap, Gift, Target, Award, TrendingUp, TrendingDown, Minus, Calendar, BarChart3, Loader2 } from 'lucide-react';
import { gamificationAPI } from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../components/Card';

const DIFF_COLORS: Record<string, string> = { Easy: 'var(--color-success)', Medium: 'var(--color-warning)', Hard: 'var(--color-danger)' };

// ─── XP Hero Banner ───────────────────────────────────────────
const XPProgressBar: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;
    gamificationAPI.getProfile(currentEmployee.id).then(gamData => {
      setProfile({ ...gamData, name: currentEmployee.full_name });
      setLoading(false);
    });
  }, [currentEmployee]);

  if (loading || !profile) return <Card className="glass-panel p-6 flex justify-center"><Loader2 className="animate-spin text-primary" /></Card>;

  const pct = (profile.xp / profile.next_level_xp) * 100;
  
  const quickStats = [
    { label: 'Company Rank', value: `#${profile.company_rank}`, icon: <Crown size={14} />, color: '#f59e0b' },
    { label: 'Dept. Rank',   value: `#${profile.department_rank}`, icon: <Trophy size={14} />, color: '#64748b' },
    { label: 'Total XP',     value: profile.total_xp_earned.toLocaleString(), icon: <Zap size={14} />, color: '#0ea5e9' },
    { label: 'Streak',       value: `${profile.streak_days}d`, icon: <Flame size={14} />, color: '#ef4444' },
  ];

  return (
    <div
      className="relative overflow-hidden mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(255,255,255,0.9) 40%, rgba(139,92,246,0.06) 100%)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        borderRadius: '24px',
        padding: '2rem 2.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 0 40px rgba(59,130,246,0.08)',
      }}
    >
      {/* Background Glow Accents */}
      <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-40px', left: '200px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">

        {/* Level Indicator */}
        <div className="relative shrink-0">
          <div style={{ position: 'absolute', inset: '-4px', borderRadius: '28px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #10b981 100%)', padding: '3px', filter: 'blur(0px)', boxShadow: '0 0 25px rgba(59,130,246,0.2)' }} />
          <div style={{
            position: 'relative', width: '100px', height: '100px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            color: 'white', boxShadow: '0 8px 30px rgba(59,130,246,0.2)',
          }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '21px', background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 100%)' }} />
            <span style={{ position: 'relative', zIndex: 1, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Level</span>
            <span style={{ position: 'relative', zIndex: 1, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{profile.level}</span>
          </div>
          {/* Online Indicator */}
          <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(16,185,129,0.4)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', animation: 'pulse 2s infinite' }} />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-2">
            <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6' }}>
              ✦ {profile.title}
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, background: 'linear-gradient(90deg, #0f172a 0%, #334155 60%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {profile.name}
            </h2>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-slate-800">{profile.xp.toLocaleString()} <span className="text-[10px] font-bold text-slate-500 uppercase">XP</span></span>
            </div>
          </div>
          
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 relative shadow-inner mt-4">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] font-bold text-slate-500">{pct.toFixed(1)}% to next level</span>
            <span className="text-[10px] font-bold text-slate-500">Next Level: {profile.next_level_xp.toLocaleString()} XP</span>
          </div>
        </div>

        {/* Quick Stats Column */}
        <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            {quickStats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '14px', flex: 1, background: 'rgba(255,255,255,0.7)', border: `1px solid ${s.color}40`, boxShadow: `0 0 15px ${s.color}20` }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${s.color}20`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                  <p style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Leaderboard ──────────────────────────────────────────────
const Leaderboard: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!currentEmployee) return;
    gamificationAPI.getLeaderboard({ limit: 10, current_employee_id: currentEmployee.id }).then(setLeaderboard);
  }, [currentEmployee]);

  if (!leaderboard.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {leaderboard.map((player) => (
        <div 
          key={player.rank} 
          className={`p-3 bg-white rounded-xl border ${player.is_me ? 'border-primary shadow-sm bg-primary/5' : 'border-[var(--border-subtle)]'} flex items-center justify-between transition-all hover:shadow-md group`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold text-tertiary w-6 text-center">{player.rank <= 3 ? player.badge : player.rank}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm ${player.is_me ? 'bg-primary' : 'bg-secondary'}`}>
              {player.initials}
            </div>
            <div>
              <h4 className="font-bold text-primary text-sm flex items-center gap-2">
                {player.name}
                {player.is_me && <span className="text-[9px] font-bold text-primary bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md">YOU</span>}
              </h4>
              <p className="text-[10px] text-secondary font-medium">Lv {player.level} • {player.department}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm font-extrabold text-primary">{player.xp.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-secondary uppercase ml-1">XP</span>
            </div>
            <div className="w-5 flex justify-end shrink-0">
              {player.trend === 'up' && <TrendingUp size={14} className="text-success" />}
              {player.trend === 'down' && <TrendingDown size={14} className="text-danger" />}
              {player.trend === 'stable' && <Minus size={14} className="text-tertiary" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Challenges ───────────────────────────────────────────────
const Challenges: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    if (!currentEmployee) return;
    gamificationAPI.getChallenges(currentEmployee.id).then(data => setChallenges(Array.isArray(data) ? data : data?.challenges || []));
  }, [currentEmployee]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {challenges.map((ch) => (
        <div 
          key={ch.id} 
          className="p-4 bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary group"
        >
          <div className="flex items-start gap-4 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
              {ch.bonus_badge || '🏆'}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-primary text-sm group-hover:text-primary transition-colors">{ch.title}</h4>
              <p className="text-[11px] text-secondary mt-1">{ch.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] font-bold px-2 py-1 rounded-md border" style={{ color: DIFF_COLORS[ch.difficulty], borderColor: DIFF_COLORS[ch.difficulty], backgroundColor: `${DIFF_COLORS[ch.difficulty]}15` }}>
                  {ch.difficulty}
                </span>
                <span className="text-[9px] font-bold text-secondary bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-1 rounded-md">{ch.type}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Progress</span>
              <span className="text-[10px] font-bold text-primary">{ch.progress}%</span>
            </div>
            <div className="h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-subtle)] mb-2 shadow-inner">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${ch.progress}%`, backgroundColor: ch.color || 'var(--color-primary)' }} 
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-secondary">
              <span className="flex items-center gap-1"><Calendar size={12}/> {ch.days_left}d left</span>
              <span className="px-2 py-1 rounded-md bg-success/10 text-success border border-success/20">+{ch.xp_reward?.toLocaleString() || 0} XP</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Achievement Gallery ──────────────────────────────────────
const AchievementGallery: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    if (!currentEmployee) return;
    gamificationAPI.getAchievements(currentEmployee.id).then(data => setAchievements(data || []));
  }, [currentEmployee]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {achievements.map((ach: any) => {
        const unlocked = ach.unlocked || !!ach.unlocked_at;
        return (
          <div 
            key={ach.id} 
            className={`p-4 bg-white rounded-xl border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center transition-all ${unlocked ? 'hover:shadow-md hover:-translate-y-1 hover:border-primary shadow-sm' : 'opacity-60 grayscale'}`}
          >
            <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center text-2xl ${unlocked ? 'bg-primary/10 border border-primary/20' : 'bg-[var(--bg-main)] border border-[var(--border-subtle)]'}`}>
              {ach.emoji || '🏆'}
            </div>
            <h4 className="font-bold text-primary text-xs leading-tight mb-1">{ach.name}</h4>
            <span className="text-[9px] font-bold text-secondary uppercase tracking-wider mb-2">{ach.rarity || 'Common'}</span>
            <div className="text-[10px] font-medium text-tertiary">
              {unlocked ? ach.unlockedDate || ach.unlocked_date || 'Unlocked' : `+${ach.xpValue || ach.xp_value || 0} XP`}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Reward Store ─────────────────────────────────────────────
const RewardStore: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [rewards, setRewards] = useState<any[]>([]);
  const [playerXP, setPlayerXP] = useState(0);

  useEffect(() => {
    if (!currentEmployee) return;
    Promise.all([
      gamificationAPI.getRewards(),
      gamificationAPI.getProfile(currentEmployee.id),
    ]).then(([rewardsData, profile]) => {
      setRewards(rewardsData || []);
      setPlayerXP(profile.xp);
    });
  }, [currentEmployee]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {rewards.map((reward) => {
        const isClaimed = claimed.has(reward.id);
        const canAfford = playerXP >= reward.cost;
        return (
          <div 
            key={reward.id} 
            className={`p-5 bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm flex flex-col transition-all hover:shadow-md group ${!reward.available ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {reward.emoji}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${canAfford ? 'bg-primary/10 text-primary border-primary/20' : 'bg-[var(--bg-main)] text-tertiary border-[var(--border-subtle)]'}`}>
                {reward.cost.toLocaleString()} XP
              </span>
            </div>
            
            <div className="flex-1">
              <h4 className="font-bold text-primary text-sm mb-1">{reward.name}</h4>
              <p className="text-xs text-secondary leading-relaxed">{reward.description}</p>
            </div>
            
            <button
              onClick={() => { if (reward.available && canAfford && !isClaimed && currentEmployee) gamificationAPI.claimReward(currentEmployee.id, reward.id).then(() => setClaimed(prev => new Set([...prev, reward.id]))); }}
              disabled={!reward.available || !canAfford || isClaimed}
              className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isClaimed ? 'bg-success text-white' : 
                !reward.available || !canAfford ? 'bg-[var(--bg-main)] text-tertiary border border-[var(--border-subtle)] cursor-not-allowed' : 
                'bg-primary text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
              }`}
            >
              {isClaimed ? <><CheckCircle2 size={14}/> Claimed</> : !reward.available ? 'Unavailable' : !canAfford ? 'Need More XP' : 'Redeem Reward'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
type TabId = 'overview' | 'leaderboard' | 'challenges' | 'achievements' | 'store';

export const GamificationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',      label: 'Overview',      icon: <Star size={14} /> },
    { id: 'leaderboard',   label: 'Leaderboard',   icon: <Crown size={14} /> },
    { id: 'challenges',    label: 'Challenges',    icon: <Target size={14} /> },
    { id: 'achievements',  label: 'Achievements',  icon: <Award size={14} /> },
    { id: 'store',         label: 'Reward Store',  icon: <Gift size={14} /> },
  ];

  return (
    <div className="flex flex-col gap-6 relative pb-8 w-full">
      
      {/* Header */}
      <div className="z-10 mb-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">Gamification Hub</h1>
          <p className="text-base text-slate-500 font-medium mt-0.5">Level up your career, compete with peers, and earn rewards.</p>
        </div>
        
        {/* Simple Tab Switcher matching Workforce Planning style */}
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] p-1.5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-white text-primary shadow-sm border border-[var(--border-subtle)]' 
                  : 'text-secondary hover:text-primary hover:bg-[var(--bg-main)]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <XPProgressBar />

      {/* Main Content Areas */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-6">
            <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Target size={20} /></div>
                Active Challenges
              </h3>
              <Challenges />
            </Card>
            
            <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-4">
                <h3 className="text-lg font-extrabold text-primary flex items-center gap-3">
                  <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Award size={20} /></div>
                  Recent Achievements
                </h3>
                <button onClick={() => setActiveTab('achievements')} className="text-xs font-bold text-primary hover:text-primary-hover transition-colors cursor-pointer p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] hover:shadow-sm">View All</button>
              </div>
              <AchievementGallery />
            </Card>
          </div>
          
          <div className="col-span-1 flex flex-col gap-6">
            <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Crown size={20} /></div>
                Top Leaderboard
              </h3>
              <Leaderboard />
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Crown size={20} /></div>
            Company Leaderboard
          </h3>
          <Leaderboard />
        </Card>
      )}

      {activeTab === 'challenges' && (
        <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Target size={20} /></div>
            All Active Challenges
          </h3>
          <Challenges />
        </Card>
      )}

      {activeTab === 'achievements' && (
        <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Award size={20} /></div>
            Achievement Gallery
          </h3>
          <AchievementGallery />
        </Card>
      )}

      {activeTab === 'store' && (
        <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Gift size={20} /></div>
            Reward Store
          </h3>
          <RewardStore />
        </Card>
      )}

    </div>
  );
};
