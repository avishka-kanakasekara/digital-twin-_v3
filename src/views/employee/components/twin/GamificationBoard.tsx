import React from 'react';
import { Trophy, Target, Award, Flame, Crown, CheckCircle2 } from 'lucide-react';

interface GamificationBoardProps {
  gamification: any;
  onCompleteMission: (idx: number) => void;
}

const ACHIEVEMENT_COLORS = [
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', glow: 'rgba(245,158,11,0.4)' },
  { color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)', glow: 'rgba(124,58,237,0.4)' },
  { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', glow: 'rgba(6,182,212,0.4)' },
  { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.4)' },
  { color: '#ec4899', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)', glow: 'rgba(236,72,153,0.4)' },
  { color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)', glow: 'rgba(249,115,22,0.4)' },
];

export const GamificationBoard: React.FC<GamificationBoardProps> = ({ gamification, onCompleteMission }) => {
  const progressPercent = (gamification.xp / gamification.nextLevelXp) * 100;

  const streaks = [
    { label: 'Learning', value: `${gamification.streaks.learning}d`, icon: <Flame size={13} />, color: '#f97316' },
    { label: 'Project', value: `${gamification.streaks.project}d`, icon: <Flame size={13} />, color: '#06b6d4' },
    { label: 'Rank', value: 'Top 5%', icon: <Crown size={13} />, color: '#f59e0b' },
  ];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.8)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      borderRadius: '24px',
      padding: '1.75rem',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient accent */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-40px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 style={{
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#64748b',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
          }}>
            <Trophy size={14} style={{ color: '#f59e0b' }} /> Gamification Board
          </h3>
          <p style={{ fontSize: '11px', color: '#475569' }}>Level up your AI Identity and unlock rewards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* XP & Level Section */}
        <div className="flex flex-col gap-5">
          {/* Level Display */}
          <div className="flex items-center gap-4">
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 25px rgba(245,158,11,0.4)',
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 900, fontSize: '28px', color: 'white', lineHeight: 1 }}>
                {gamification.level}
              </span>
            </div>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Current Level
              </p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                {gamification.xp.toLocaleString()} <span style={{ fontSize: '13px', color: '#64748b' }}>XP</span>
              </p>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                Next: {gamification.nextLevelXp.toLocaleString()} XP
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
                borderRadius: '99px',
                boxShadow: '0 0 12px rgba(245,158,11,0.6)',
                transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ textAlign: 'right', marginTop: '6px', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
              {Math.floor(gamification.nextLevelXp - gamification.xp).toLocaleString()} XP to next level
            </div>
          </div>

          {/* Streak Chips */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
            {streaks.map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '10px 8px', borderRadius: '14px', textAlign: 'center',
                background: `${s.color}12`,
                border: `1px solid ${s.color}25`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: s.color, marginBottom: '3px' }}>
                  {s.icon}
                </div>
                <p style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>{s.value}</p>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Missions */}
        <div className="flex flex-col gap-3">
          <h4 style={{
            fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#64748b',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Target size={12} style={{ color: '#7c3aed' }} /> Daily Missions
          </h4>
          <div className="space-y-2">
            {gamification.missions.map((mission: any, idx: number) => (
              <div
                key={idx}
                onClick={() => !mission.completed && onCompleteMission(idx)}
                style={{
                  padding: '12px 14px', borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: mission.completed ? 'default' : 'pointer',
                  background: mission.completed ? 'rgba(248, 250, 252, 0.8)' : 'rgba(255,255,255,0.9)',
                  border: mission.completed ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid rgba(226, 232, 240, 0.8)',
                  transition: 'all 0.2s',
                  opacity: mission.completed ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: mission.completed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                    border: mission.completed ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    color: mission.completed ? '#10b981' : 'transparent',
                  }}>
                    <CheckCircle2 size={12} />
                  </div>
                  <span style={{
                    fontSize: '12px', fontWeight: 600,
                    color: mission.completed ? '#64748b' : '#0f172a',
                    textDecoration: mission.completed ? 'line-through' : 'none',
                  }}>
                    {mission.name}
                  </span>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 800,
                  background: mission.completed ? 'rgba(248, 250, 252, 0.8)' : 'rgba(245,158,11,0.12)',
                  color: mission.completed ? '#64748b' : '#f59e0b',
                  border: mission.completed ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid rgba(245,158,11,0.25)',
                }}>
                  +{mission.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <h4 style={{
          fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: '#64748b',
          display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px',
        }}>
          <Award size={12} style={{ color: '#f59e0b' }} /> Unlocked Achievements
        </h4>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
          {gamification.achievements.map((ach: any, i: number) => {
            const c = ACHIEVEMENT_COLORS[i % ACHIEVEMENT_COLORS.length];
            return (
              <div
                key={ach.id}
                title={ach.description}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  width: '72px', flexShrink: 0,
                  opacity: ach.unlocked ? 1 : 0.35,
                  filter: ach.unlocked ? 'none' : 'grayscale(1)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '18px',
                  background: ach.unlocked ? c.bg : 'rgba(255,255,255,0.04)',
                  border: ach.unlocked ? `1px solid ${c.border}` : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: ach.unlocked ? `0 0 16px ${c.glow}` : 'none',
                  fontSize: '1.5rem',
                }}>
                  ⭐
                </div>
                <span style={{ fontSize: '9px', fontWeight: 700, textAlign: 'center', lineHeight: 1.3, color: ach.unlocked ? '#0f172a' : '#64748b' }}>
                  {ach.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
