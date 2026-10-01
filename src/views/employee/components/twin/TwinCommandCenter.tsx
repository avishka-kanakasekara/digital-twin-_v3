import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Brain, CheckCircle2, Crosshair, Flame, HandHeart,
  Loader2, Sparkles, Target, Trophy, Zap,
} from 'lucide-react';
import { employeeAPI, type TwinCommandCenter, type TwinFocusItem } from '../../../../lib/api';
import { useEmployee } from '../../../../contexts/EmployeeContext';

const HUB_ICON: Record<string, React.ReactNode> = {
  career: <Crosshair size={14} />,
  learning: <Brain size={14} />,
  gamification: <Trophy size={14} />,
  peers: <HandHeart size={14} />,
  dashboard: <Sparkles size={14} />,
};

function timeAgo(iso?: string) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export const TwinCommandCenter: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const navigate = useNavigate();
  const [data, setData] = useState<TwinCommandCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentEmployee?.id) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await employeeAPI.getCommandCenter(currentEmployee.id);
      setData(payload);
    } catch (err: any) {
      setError(err?.message || 'Could not load your twin command center.');
    } finally {
      setLoading(false);
    }
  }, [currentEmployee?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFocus = async (item: TwinFocusItem) => {
    if (item.action === 'checkin') {
      if (!currentEmployee?.id || checkingIn) return;
      setCheckingIn(true);
      setNotice(null);
      try {
        const res = await employeeAPI.dailyCheckin(currentEmployee.id);
        setData(res.command_center);
        setNotice(res.already ? 'Already checked in today. Streak is safe.' : `Checked in — +${res.xp_awarded} XP`);
      } catch (err: any) {
        setError(err?.message || 'Check-in failed.');
      } finally {
        setCheckingIn(false);
      }
      return;
    }
    if (item.id === 'give-rec' || item.hub === 'peers') {
      navigate('/employee-twin?tab=peers');
      return;
    }
    navigate(item.href);
  };

  if (!currentEmployee) {
    return <div className="pd-empty">Select an employee to open their twin.</div>;
  }

  if (loading && !data) {
    return (
      <div className="pd-empty">
        <Loader2 size={18} className="animate-spin inline-block mr-2" />
        Assembling your live twin…
      </div>
    );
  }

  if (error && !data) {
    return <p className="pd-peer-error">{error}</p>;
  }

  if (!data) return null;

  const { twin, career, learning, gamification: game, social, weekly_focus, activity } = data;
  const xpPct = Math.min(100, Math.round(((game.xp || 0) / Math.max(1, game.next_level_xp || 1)) * 100));

  return (
    <div className="pd-cc">
      {notice ? <p className="pd-peer-notice">{notice}</p> : null}
      {error ? <p className="pd-peer-error">{error}</p> : null}

      <div className="pd-cc-hero">
        <div>
          <p className="pd-cc-kicker">This week on your twin</p>
          <h3 className="pd-cc-headline">
            {career.has_goal
              ? `${career.readiness_score}% ready for ${career.target_role}`
              : 'Set a target role and the twin will build your week'}
          </h3>
          <p className="pd-cc-sub">
            {career.next_action?.title
              ? `Next move: ${career.next_action.title}`
              : twin.missing[0] || 'Keep the twin current so coaching stays accurate.'}
          </p>
        </div>
        <button
          type="button"
          className="pd-cc-checkin"
          disabled={checkingIn || data.checked_in_today}
          onClick={() => handleFocus({
            id: 'checkin', hub: 'dashboard', href: '/employee-twin',
            title: 'Check in', detail: '', cta: '', priority: 'low', done: false, action: 'checkin',
          })}
        >
          {checkingIn ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {data.checked_in_today ? 'Checked in today' : 'Daily check-in +25 XP'}
        </button>
      </div>

      <div className="pd-cc-stats">
        <button type="button" className="pd-cc-stat" onClick={() => navigate('/career-coach')}>
          <span>Career readiness</span>
          <strong>{career.has_goal ? `${career.readiness_score}%` : '—'}</strong>
          <em>{career.target_role || 'No goal yet'}</em>
        </button>
        <button type="button" className="pd-cc-stat" onClick={() => navigate('/learning-hub')}>
          <span>Learning</span>
          <strong>{learning.courses_in_progress}</strong>
          <em>{learning.active_path?.title || `${learning.courses_completed} completed`}</em>
        </button>
        <button type="button" className="pd-cc-stat" onClick={() => navigate('/gamification-hub')}>
          <span>Level {game.level}</span>
          <strong>{(game.xp || 0).toLocaleString()}</strong>
          <em>{game.streak_days}d streak · {game.rank_pct ? `Top ${game.rank_pct}%` : game.title}</em>
        </button>
        <button type="button" className="pd-cc-stat" onClick={() => navigate('/employee-twin')}>
          <span>Peer recs</span>
          <strong>{social.received}</strong>
          <em>{social.latest_from ? `Latest from ${social.latest_from}` : `${social.given} given`}</em>
        </button>
      </div>

      <div className="pd-cc-xp">
        <div className="pd-cc-xp__row">
          <span><Zap size={12} /> XP to next level</span>
          <span>{xpPct}%</span>
        </div>
        <div className="pd-progress-track">
          <div className="pd-progress-fill" style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,#f59e0b,#f97316)' }} />
        </div>
      </div>

      <div className="pd-cc-split">
        <div>
          <p className="pd-cc-label">Weekly focus</p>
          <div className="pd-cc-focus">
            {(weekly_focus || []).length === 0 ? (
              <div className="pd-empty">You’re clear this week. Enrich the twin or start a challenge.</div>
            ) : (
              weekly_focus.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`pd-cc-focus__item ${item.done ? 'is-done' : ''}`}
                  onClick={() => handleFocus(item)}
                >
                  <span className="pd-cc-focus__icon">{HUB_ICON[item.hub] || <Target size={14} />}</span>
                  <span className="min-w-0 text-left">
                    <strong>{item.title}</strong>
                    <em>{item.detail}</em>
                  </span>
                  <span className="pd-cc-focus__cta">
                    {item.meta || item.cta} <ArrowRight size={12} />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <p className="pd-cc-label"><Flame size={12} /> Recent XP</p>
          {(activity || []).length === 0 ? (
            <div className="pd-empty">No XP yet. Check in or complete a challenge.</div>
          ) : (
            <ul className="pd-cc-activity">
              {activity.slice(0, 6).map((row, i) => (
                <li key={`${row.created_at}-${i}`}>
                  <span className="pd-cc-activity__xp">+{row.amount}</span>
                  <span className="truncate">{row.reason}</span>
                  <span className="pd-cc-activity__when">{timeAgo(row.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
