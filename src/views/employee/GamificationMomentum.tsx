import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Flame,
  Loader2,
  Target,
  Zap,
} from 'lucide-react';
import { gamificationAPI } from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';
import { Card } from '../../components/Card';
import './GamificationHub.css';

interface MomentumProps {
  onOpenChallenge?: (id: string) => void;
  refreshKey?: number;
}

export const GamificationMomentum: React.FC<MomentumProps> = ({
  onOpenChallenge,
  refreshKey = 0,
}) => {
  const { currentEmployee } = useEmployee();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [todayXp, setTodayXp] = useState(0);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!currentEmployee) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      gamificationAPI.getStreak(currentEmployee.id),
      gamificationAPI.getMissions(currentEmployee.id),
      gamificationAPI.getActivity(currentEmployee.id),
    ])
      .then(([streakData, missionData, activityData]) => {
        if (cancelled) return;
        setStreak(streakData);
        const list = Array.isArray(missionData)
          ? missionData
          : (missionData?.missions || []);
        setMissions(list);
        setTodayXp(Number(missionData?.today_xp) || 0);
        setActivity(Array.isArray(activityData) ? activityData.slice(0, 6) : []);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || 'Failed to load momentum');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentEmployee, refreshKey]);

  if (loading) {
    return (
      <Card glass={false} className="glass-panel p-8 text-center">
        <Loader2 className="animate-spin mx-auto text-primary" size={24} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card glass={false} className="glass-panel p-4">
        <div className="bg-danger/10 text-danger rounded-xl flex items-center gap-2 p-3 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      </Card>
    );
  }

  const calendar = (streak?.calendar || []).slice(-14);
  const doneCount = missions.filter((m) => m.completed).length;
  const streakDays = streak?.streak_days ?? 0;
  const longest = streak?.longest_streak ?? 0;

  const openMission = (mission: any) => {
    if (mission?.type === 'challenge' && mission.id && onOpenChallenge) {
      onOpenChallenge(mission.id);
      return;
    }
    if (mission?.type === 'learning') {
      navigate('/learning-hub');
    }
  };

  return (
    <Card glass={false} className="glass-panel p-5 gh-momentum">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">
            <Flame size={16} className="text-orange-500" /> Today&apos;s Momentum
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            Live streak, open challenges, and XP from your ledger
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-primary leading-none">{streakDays}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-secondary mt-1">day streak</p>
        </div>
      </div>

      <div className="gh-momentum__streak-meta mb-4">
        <span>Best: <strong>{longest}d</strong></span>
        <span>Today: <strong>+{todayXp} XP</strong></span>
        <span>{doneCount}/{missions.length || 0} done</span>
      </div>

      {calendar.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-tertiary mb-2">Last 14 days</p>
          <div className="gh-streak-grid" aria-label="Activity streak calendar">
            {calendar.map((day: any) => (
              <div
                key={day.date}
                className={`gh-streak-cell gh-streak-cell--i${day.intensity || 0}`}
                title={`${day.date}: ${day.xp || 0} XP`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-extrabold text-primary flex items-center gap-1.5">
            <Target size={13} /> Open missions
          </h4>
        </div>
        {missions.length === 0 ? (
          <p className="text-xs text-tertiary">No open missions. Create or join a challenge to get started.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {missions.map((mission) => {
              const clickable = mission.type === 'challenge' || mission.type === 'learning';
              const subtitle = mission.next_step
                ? `Next: ${mission.next_step}`
                : mission.detail
                  || (mission.steps_total
                    ? `${mission.steps_passed || 0}/${mission.steps_total} steps`
                    : null);
              return (
                <button
                  key={mission.id}
                  type="button"
                  disabled={!clickable && mission.type !== 'daily'}
                  onClick={() => openMission(mission)}
                  className={`gh-mission-row ${mission.completed ? 'gh-mission-row--done' : ''} ${clickable ? 'gh-mission-row--clickable' : ''}`}
                >
                  <div className={`gh-mission-check ${mission.completed ? 'is-done' : ''}`}>
                    {mission.completed ? <CheckCircle2 size={14} /> : <span />}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-bold text-primary truncate">{mission.name}</p>
                    {subtitle && (
                      <p className="text-[10px] text-tertiary truncate mt-0.5">{subtitle}</p>
                    )}
                    <div className="gh-mission-bar mt-1.5">
                      <div
                        className="gh-mission-bar__fill"
                        style={{ width: `${Math.min(100, Number(mission.progress) || (mission.completed ? 100 : 0))}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-[11px] font-extrabold text-amber-600">
                    <Zap size={11} /> +{mission.xp || 0}
                    {clickable && !mission.completed && <ChevronRight size={12} className="text-tertiary" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-extrabold text-primary mb-3 flex items-center gap-1.5">
          <Zap size={13} /> Recent XP
        </h4>
        {activity.length === 0 ? (
          <p className="text-xs text-tertiary">No XP activity yet. Complete a challenge step to start the feed.</p>
        ) : (
          <ul className="gh-activity-list">
            {activity.map((item, idx) => (
              <li key={`${item.action}-${item.time}-${idx}`} className="gh-activity-item">
                <span className="gh-activity-emoji">{item.emoji || '⚡'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-primary truncate">{item.action}</p>
                  <p className="text-[10px] text-tertiary">{item.time}</p>
                </div>
                <span className={`text-xs font-extrabold ${Number(item.xp) >= 0 ? 'text-success' : 'text-danger'}`}>
                  {Number(item.xp) >= 0 ? '+' : ''}{item.xp}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};
