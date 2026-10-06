import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Flame,
  Globe,
  Hammer,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Target,
  Timer,
  Upload,
  UserPlus,
  Award,
  Users,
} from 'lucide-react';

import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useEmployee } from '../../contexts/EmployeeContext';
import {
  careerCoachAPI,
  type CoachAction,
  type CoachMarket,
  type CoachMilestone,
  type CoachPhase,
  type CoachPlan,
  type CoachRolePreview,
} from '../../lib/api';
import './CareerCoach.css';

type Tab = 'plan' | 'skills' | 'people' | 'manager' | 'ask';
type ChatMessage = { role: 'user' | 'assistant'; content: string; grounding?: string[] };

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'plan', label: 'Plan', icon: CalendarClock },
  { id: 'skills', label: 'Skill bar', icon: Target },
  { id: 'people', label: 'People & roles', icon: Users },
  { id: 'manager', label: 'Manager conversation', icon: Briefcase },
  { id: 'ask', label: 'Ask the coach', icon: MessageSquare },
];

const PHASE_META: Record<CoachPhase['phase'], { label: string; icon: React.ElementType }> = {
  learn: { label: 'Learn', icon: BookOpen },
  apply: { label: 'Apply', icon: Hammer },
  prove: { label: 'Confirm', icon: ClipboardCheck },
};

const PACE_META = {
  on_track: { label: 'On track', tone: 'good' },
  at_risk: { label: 'Behind target', tone: 'warn' },
  complete: { label: 'Ready', tone: 'good' },
} as const;

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtHours = (hours: number) => `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;

const daysAgo = (days: number | null | undefined) => {
  if (days === null || days === undefined) return 'No activity logged yet';
  if (days <= 0) return 'Active today';
  if (days === 1) return 'Active yesterday';
  return `Last active ${days} days ago`;
};

const gapLink = (gapId?: string | null, skill?: string) => {
  const params = new URLSearchParams();
  if (gapId) params.set('gap', gapId);
  if (skill) params.set('skill', skill);
  return `/learning-hub?${params.toString()}`;
};

// ── Small pieces ─────────────────────────────────────────────────────────

const Ring: React.FC<{ pct: number; size?: number }> = ({ pct, size = 112 }) => {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} className="cc-ring" aria-label={`${value}% ready`}>
      <circle cx={size / 2} cy={size / 2} r={radius} className="cc-ring__track" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        className="cc-ring__value"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="cc-ring__label">
        {value}%
      </text>
    </svg>
  );
};

const LevelBar: React.FC<{ start?: number; current: number; required: number }> = ({ start, current, required }) => (
  <div className="cc-level" aria-label={`${current} of ${required} out of 10`}>
    <div className="cc-level__track">
      {start !== undefined && start < current && (
        <div className="cc-level__start" style={{ width: `${start * 10}%` }} />
      )}
      <div className={`cc-level__fill ${current >= required ? 'cc-level__fill--met' : ''}`} style={{ width: `${Math.min(current, 10) * 10}%` }} />
      <div className="cc-level__bar" style={{ left: `${required * 10}%` }} title={`Role needs ${required}/10`} />
    </div>
    <span className="cc-level__text">
      {current}/10 <span>· needs {required}</span>
    </span>
  </div>
);

const StatusIcon: React.FC<{ status: CoachPhase['status'] }> = ({ status }) => {
  if (status === 'achieved') return <CheckCircle2 className="cc-status cc-status--done" size={20} />;
  if (status === 'in_progress') return <Timer className="cc-status cc-status--active" size={20} />;
  return <Circle className="cc-status" size={20} />;
};

const Stepper: React.FC<{ value: number; min: number; max: number; suffix: string; onChange: (value: number) => void; disabled?: boolean }> = ({
  value,
  min,
  max,
  suffix,
  onChange,
  disabled,
}) => (
  <div className="cc-stepper">
    <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label="Decrease">
      <Minus size={14} />
    </button>
    <span>
      {value} {suffix}
    </span>
    <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Increase">
      <Plus size={14} />
    </button>
  </div>
);

const Resources: React.FC<{ items?: CoachMilestone['phases'][number]['resources'] }> = ({ items }) =>
  items && items.length > 0 ? (
    <div className="cc-resources">
      <span className="cc-resources__label">
        <Award size={12} /> Recognized by employers
      </span>
      {items.map((item) => (
        <span key={item.name} className="cc-resource">
          {item.name}
          {item.provider && <small> · {item.provider}</small>}
        </span>
      ))}
    </div>
  ) : null;

const MarketPanel: React.FC<{ market?: CoachMarket; role: string; busy: boolean; onRefresh?: () => void }> = ({ market, role, busy, onRefresh }) => {
  if (!market) return null;
  const researched = market.source === 'market';
  return (
    <div className={`cc-market ${researched ? '' : 'cc-market--library'}`}>
      <div className="cc-market__head">
        <span className="cc-market__badge">
          <Globe size={13} />
          {researched ? `Researched with Gemini from current ${role} postings` : 'Company role library'}
          {market.generated_at && <small> · {fmtDate(market.generated_at)}</small>}
        </span>
        {onRefresh && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={onRefresh}>
            <RefreshCw size={13} className={`mr-1 ${busy ? 'animate-spin' : ''}`} />
            {busy ? 'Researching…' : researched ? 'Refresh research' : 'Research the market'}
          </Button>
        )}
      </div>
      {market.summary && <p>{market.summary}</p>}
      {market.sources.length > 0 && (
        <div className="cc-market__sources">
          {market.sources.map((source) => (
            <a key={source.uri} href={source.uri} target="_blank" rel="noreferrer">
              {source.title} <ExternalLink size={11} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Goal setup ───────────────────────────────────────────────────────────

const GoalSetup: React.FC<{
  employeeId: string;
  roles: string[];
  initialRole?: string;
  initialMonths?: number;
  initialHours?: number;
  initialVisible?: boolean;
  busy: boolean;
  onSubmit: (data: { target_role: string; target_months: number; hours_per_week: number; visible_to_manager: boolean }) => void;
}> = ({ employeeId, roles, initialRole, initialMonths, initialHours, initialVisible, busy, onSubmit }) => {
  const [role, setRole] = useState(initialRole || '');
  const [months, setMonths] = useState(Math.max(3, Math.min(36, initialMonths || 12)));
  const [hours, setHours] = useState(initialHours || 5);
  const [visible, setVisible] = useState(!!initialVisible);
  const [preview, setPreview] = useState<CoachRolePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [researched, setResearched] = useState(initialRole || '');

  useEffect(() => {
    const value = researched.trim();
    if (value.length < 3) {
      setPreview(null);
      return;
    }
    let live = true;
    setPreviewLoading(true);
    careerCoachAPI
      .roles(employeeId, value)
      .then((res) => live && setPreview(res.preview || null))
      .catch(() => live && setPreview(null))
      .finally(() => live && setPreviewLoading(false));
    return () => {
      live = false;
    };
  }, [employeeId, researched]);

  const pick = (name: string) => {
    setRole(name);
    setResearched(name);
  };

  const weeks = preview ? Math.ceil(preview.total_hours / hours) : 0;
  const fits = preview ? weeks <= months * 4.35 : true;

  return (
    <div className="cc-setup">
      <div className="cc-setup__form">
        <label className="cc-field">
          <span>Role you are aiming for</span>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onBlur={() => setResearched(role.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setResearched(role.trim());
              }
            }}
            placeholder="e.g. Cloud Architect"
            list="cc-role-options"
          />
          <datalist id="cc-role-options">
            {roles.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <div className="cc-chips">
          {roles.slice(0, 10).map((name) => (
            <button key={name} type="button" className={`cc-chip ${role === name ? 'cc-chip--on' : ''}`} onClick={() => pick(name)}>
              {name}
            </button>
          ))}
        </div>
        <div className="cc-setup__row">
          <label className="cc-field">
            <span>Target: {months} months</span>
            <input type="range" min={3} max={36} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </label>
          <div className="cc-field">
            <span>Time you can give each week</span>
            <Stepper value={hours} min={1} max={20} suffix="h / week" onChange={setHours} />
          </div>
        </div>
        <label className="cc-check">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          Share this goal and progress with my manager
        </label>
        <Button
          disabled={busy || previewLoading || role.trim().length < 3}
          onClick={() => onSubmit({ target_role: role.trim(), target_months: months, hours_per_week: hours, visible_to_manager: visible })}
        >
          {busy ? <Loader2 size={16} className="animate-spin mr-2" /> : <Target size={16} className="mr-2" />}
          Build my plan
        </Button>
      </div>

      <div className="cc-setup__preview">
        {!preview && !previewLoading && <p className="cc-muted">Pick a role to see what it asks of you compared with your profile.</p>}
        {previewLoading && (
          <div className="cc-researching">
            <Loader2 size={18} className="animate-spin" />
            <div>
              <strong>Researching current {researched} postings</strong>
              <p className="cc-muted">
                Gemini is reading job postings and certification paths, then mapping them onto your Skill DNA. The first look at a role takes about a minute.
              </p>
            </div>
          </div>
        )}
        {preview && !previewLoading && (
          <>
            <MarketPanel market={preview.market} role={preview.target_role} busy={false} />
            <div className="cc-setup__score">
              <Ring pct={preview.readiness_pct} size={88} />
              <div>
                <strong>
                  {preview.met.length} of {preview.met.length + preview.to_build.length} skills already at the bar
                </strong>
                <p className="cc-muted">
                  {preview.to_build.length
                    ? `About ${preview.total_hours} hours of focused work. At ${hours}h a week that is ${weeks} weeks.`
                    : 'You already meet every skill this role asks for.'}
                </p>
                {preview.to_build.length > 0 && (
                  <span className={`cc-pill cc-pill--${fits ? 'good' : 'warn'}`}>
                    {fits ? `Fits in ${months} months` : `Needs about ${Math.ceil(preview.total_hours / (months * 4.35))}h a week for ${months} months`}
                  </span>
                )}
              </div>
            </div>
            {preview.to_build.length > 0 && (
              <div className="cc-setup__list">
                <h4>To build</h4>
                {preview.to_build.map((row) => (
                  <div key={row.skill} className="cc-setup__skill">
                    <span>{row.skill}</span>
                    <LevelBar current={row.current} required={row.required} />
                  </div>
                ))}
              </div>
            )}
            {preview.met.length > 0 && (
              <div className="cc-setup__list">
                <h4>Already strong</h4>
                <div className="cc-chips">
                  {preview.met.map((row) => (
                    <span key={row.skill} className="cc-chip cc-chip--met">
                      <Check size={12} /> {row.skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Milestone ────────────────────────────────────────────────────────────

const MilestoneCard: React.FC<{
  milestone: CoachMilestone;
  index: number;
  busy: boolean;
  onLearn: (milestone: CoachMilestone) => void;
  onEvidence: (phase: CoachPhase, milestone: CoachMilestone) => void;
  onReopen: (phase: CoachPhase) => void;
}> = ({ milestone, index, busy, onLearn, onEvidence, onReopen }) => {
  const done = milestone.phases.filter((phase) => phase.status === 'achieved').length;
  return (
    <article className={`cc-milestone cc-milestone--${milestone.status}`}>
      <div className="cc-milestone__rail">
        <span className="cc-milestone__dot">{milestone.met ? <Check size={14} /> : index + 1}</span>
      </div>
      <div className="cc-milestone__body">
        <header className="cc-milestone__head">
          <div>
            <h3>{milestone.skill}</h3>
            <p className="cc-muted">{milestone.why}</p>
            {milestone.market_signal && <p className="cc-signal">“{milestone.market_signal}”</p>}
          </div>
          <div className="cc-milestone__meta">
            <LevelBar start={milestone.start_level} current={milestone.current} required={milestone.required} />
            <span className="cc-muted">
              {milestone.met ? 'At the bar' : `${done} of 3 done · finish by ${fmtDate(milestone.due)}`}
            </span>
          </div>
        </header>

        <ol className="cc-phases">
          {milestone.phases.map((phase) => {
            const meta = PHASE_META[phase.phase];
            const Icon = meta.icon;
            return (
              <li key={phase.id} className={`cc-phase cc-phase--${phase.status}`}>
                <StatusIcon status={phase.status} />
                <div className="cc-phase__main">
                  <div className="cc-phase__title">
                    <span className="cc-phase__tag">
                      <Icon size={12} /> {meta.label}
                    </span>
                    <strong>{phase.title}</strong>
                  </div>
                  <p>{phase.detail}</p>
                  {phase.phase === 'learn' && phase.status !== 'achieved' && <Resources items={phase.resources} />}
                  {phase.phase === 'learn' && milestone.learning.plan_id && milestone.learning.courses.length > 0 && (
                    <ul className="cc-courses">
                      {milestone.learning.courses.map((course) => (
                        <li key={course.id} className={course.status === 'Completed' ? 'is-done' : ''}>
                          {course.status === 'Completed' ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                          {course.title}
                          <span>{course.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {phase.phase === 'learn' && !milestone.learning.plan_id && milestone.learning.suggested_courses.length > 0 && phase.status !== 'achieved' && (
                    <ul className="cc-courses">
                      {milestone.learning.suggested_courses.map((course) => (
                        <li key={course.id}>
                          <BookOpen size={13} />
                          {course.title}
                          <span>{fmtHours(course.hours)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {phase.phase === 'learn' && milestone.learning.plan_id && phase.status !== 'achieved' && (
                    <div className="cc-progress">
                      <div style={{ width: `${phase.progress_pct}%` }} />
                    </div>
                  )}
                  {phase.evidence.length > 0 && (
                    <p className="cc-evidence-note">
                      <Upload size={12} /> {phase.evidence[0].description || 'Evidence attached'}
                    </p>
                  )}
                  <div className="cc-phase__foot">
                    <span className="cc-muted">
                      {phase.status === 'achieved'
                        ? `Done${phase.completed_at ? ` ${fmtDate(phase.completed_at)}` : ''}`
                        : `${fmtHours(phase.hours_remaining)} left · ${fmtDate(phase.starts)} → ${fmtDate(phase.due)}`}
                    </span>
                    {!milestone.met && (
                      <div className="cc-phase__actions">
                        {phase.phase === 'learn' && phase.status !== 'achieved' && (
                          <>
                            <Button size="sm" onClick={() => onLearn(milestone)}>
                              {milestone.learning.plan_id ? 'Continue learning' : 'Choose courses'}
                              <ArrowRight size={13} className="ml-1" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => onEvidence(phase, milestone)} disabled={busy}>
                              Learned elsewhere
                            </Button>
                          </>
                        )}
                        {phase.phase === 'apply' && phase.status !== 'achieved' && (
                          <Button size="sm" onClick={() => onEvidence(phase, milestone)} disabled={busy}>
                            <Upload size={13} className="mr-1" /> Add what you did
                          </Button>
                        )}
                        {phase.phase === 'prove' && (
                          <Button size="sm" variant="secondary" onClick={() => onLearn(milestone)}>
                            Take the assessment <ArrowRight size={13} className="ml-1" />
                          </Button>
                        )}
                        {phase.phase !== 'prove' && phase.status === 'achieved' && (
                          <Button size="sm" variant="ghost" onClick={() => onReopen(phase)} disabled={busy}>
                            <RotateCcw size={13} className="mr-1" /> Reopen
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </article>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────

export const CareerCoach: React.FC = () => {
  const navigate = useNavigate();
  const { currentEmployee, loading: employeeLoading } = useEmployee();
  const employeeId = currentEmployee?.id;

  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('plan');

  const [goalOpen, setGoalOpen] = useState(false);
  const [evidenceFor, setEvidenceFor] = useState<{ phase: CoachPhase; milestone: CoachMilestone } | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinHours, setCheckinHours] = useState(2);
  const [checkinSkill, setCheckinSkill] = useState('');
  const [checkinNote, setCheckinNote] = useState('');

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      setPlan(await careerCoachAPI.getPlan(employeeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your career plan.');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chat, asking]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const run = async (action: () => Promise<CoachPlan>, message?: string) => {
    setBusy(true);
    setError(null);
    try {
      setPlan(await action());
      if (message) setNotice(message);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not save. Try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const [researching, setResearching] = useState(false);
  const refreshMarket = async () => {
    if (!employeeId) return;
    setResearching(true);
    await run(() => careerCoachAPI.refreshMarket(employeeId), 'Requirements refreshed from current postings.');
    setResearching(false);
  };

  const openLearning = (milestone: CoachMilestone) => navigate(gapLink(milestone.gap_id, milestone.skill));

  const openEvidence = (phase: CoachPhase, milestone: CoachMilestone) => {
    setEvidenceFor({ phase, milestone });
    setEvidenceText('');
    setEvidenceFile(null);
  };

  const openCheckin = (skill?: string) => {
    setCheckinSkill(skill || plan?.milestones?.find((m) => !m.met)?.skill || '');
    setCheckinHours(Math.min(plan?.settings?.hours_per_week || 2, 8));
    setCheckinNote('');
    setCheckinOpen(true);
  };

  const doAction = (action: CoachAction) => {
    if (!plan || !employeeId) return;
    const milestone = plan.milestones?.find((m) => m.gap_id === action.gap_id);
    if (action.kind === 'learning' || action.kind === 'assessment') {
      navigate(gapLink(action.gap_id, milestone?.skill));
    } else if (action.kind === 'evidence' && milestone) {
      const phase = milestone.phases.find((p) => p.id === action.step_id);
      if (phase) openEvidence(phase, milestone);
    } else if (action.kind === 'mentor' && action.mentor_id) {
      run(() => careerCoachAPI.requestIntro(employeeId, action.mentor_id!, action.skill || ''), 'Introduction requested.');
    } else if (action.kind === 'checkin') {
      openCheckin();
    }
  };

  const ask = async (text: string) => {
    const message = text.trim();
    if (!message || !employeeId || asking) return;
    const history = chat.map(({ role, content }) => ({ role, content }));
    setChat((rows) => [...rows, { role: 'user', content: message }]);
    setQuestion('');
    setAsking(true);
    try {
      const res = await careerCoachAPI.ask(employeeId, message, history);
      setChat((rows) => [...rows, { role: 'assistant', content: res.answer, grounding: res.grounding }]);
    } catch (err) {
      setChat((rows) => [...rows, { role: 'assistant', content: err instanceof Error ? err.message : 'The coach is unavailable right now.' }]);
    } finally {
      setAsking(false);
    }
  };

  const openMilestones = useMemo(() => (plan?.milestones || []).filter((m) => !m.met), [plan]);
  const doneMilestones = useMemo(() => (plan?.milestones || []).filter((m) => m.met), [plan]);

  if (employeeLoading || (loading && !plan)) {
    return (
      <div className="career-coach cc-center">
        <Loader2 className="animate-spin" size={28} />
        <p className="cc-muted">Building your career plan…</p>
        <p className="cc-muted">The first plan for a role includes live market research and can take about a minute.</p>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="career-coach cc-center">
        <AlertCircle size={28} />
        <p>Sign in to see your career plan.</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="career-coach cc-center">
        <AlertCircle size={28} />
        <p>{error || 'Could not load your career plan.'}</p>
        <Button onClick={load}>Try again</Button>
      </div>
    );
  }

  const header = (
    <header className="cc-head">
      <div>
        <p className="cc-eyebrow">Career Coach</p>
        <h1>{plan.goal ? `Your path to ${plan.goal.target_role}` : 'Where do you want to go next?'}</h1>
        <p className="cc-muted">
          {plan.goal
            ? `From ${plan.employee.role || 'your current role'} · started ${fmtDate(plan.settings?.started_at)} · target ${fmtDate(plan.settings?.target_date)}`
            : 'Choose a role. Your coach compares it with your profile and turns the difference into a dated, weekly plan.'}
        </p>
      </div>
      {plan.goal && (
        <div className="cc-head__actions">
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => run(() => careerCoachAPI.setVisibility(employeeId, !plan.goal!.visible_to_manager), plan.goal!.visible_to_manager ? 'Goal is now private.' : 'Your manager can now see this goal.')}
          >
            {plan.goal.visible_to_manager ? <Eye size={14} className="mr-1" /> : <EyeOff size={14} className="mr-1" />}
            {plan.goal.visible_to_manager ? 'Shared with manager' : 'Private'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setGoalOpen(true)}>
            <Target size={14} className="mr-1" /> Change goal
          </Button>
        </div>
      )}
    </header>
  );

  if (!plan.goal) {
    return (
      <div className="career-coach">
        {header}
        {error && <div className="cc-alert">{error}</div>}
        <section className="cc-card">
          <GoalSetup
            employeeId={employeeId}
            roles={plan.role_options}
            busy={busy}
            onSubmit={(data) => run(() => careerCoachAPI.setGoal(employeeId, data), 'Your plan is ready.')}
          />
        </section>
      </div>
    );
  }

  const readiness = plan.readiness!;
  const timeline = plan.timeline!;
  const settings = plan.settings!;
  const momentum = plan.momentum!;
  const pace = PACE_META[timeline.pace];
  const fourWeekPct = momentum.planned_last_4_weeks ? Math.min(100, Math.round((100 * momentum.hours_last_4_weeks) / momentum.planned_last_4_weeks)) : 0;

  return (
    <div className="career-coach">
      {header}
      {error && (
        <div className="cc-alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {notice && (
        <div className="cc-toast">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}

      <section className="cc-hero">
        <div className="cc-card cc-stat">
          <Ring pct={readiness.pct} />
          <div>
            <h4>Readiness</h4>
            <strong>
              {readiness.met} of {readiness.total} skills at the bar
            </strong>
            <p className="cc-muted">
              {readiness.pct > readiness.start_pct ? `Up from ${readiness.start_pct}% when you started.` : `${readiness.total - readiness.met} skill${readiness.total - readiness.met === 1 ? '' : 's'} left to build.`}
            </p>
          </div>
        </div>

        <div className="cc-card cc-stat cc-stat--col">
          <div className="cc-stat__row">
            <h4>Timeline</h4>
            <span className={`cc-pill cc-pill--${pace.tone}`}>{pace.label}</span>
          </div>
          <div className="cc-dates">
            <div>
              <span className="cc-muted">Projected</span>
              <strong>{fmtDate(timeline.projected_finish)}</strong>
            </div>
            <div>
              <span className="cc-muted">Your target</span>
              <strong>{fmtDate(timeline.target_date)}</strong>
            </div>
          </div>
          <div className="cc-stat__row">
            <Stepper
              value={settings.hours_per_week}
              min={1}
              max={20}
              suffix="h / week"
              disabled={busy}
              onChange={(value) => run(() => careerCoachAPI.updateSettings(employeeId, { hours_per_week: value }))}
            />
            <span className="cc-muted" title="Hours of milestone work still open. Milestones close on finished courses, evidence, and confirmed levels.">
              {fmtHours(timeline.remaining_hours)} of milestones open
            </span>
          </div>
          {timeline.pace === 'at_risk' && timeline.hours_per_week_needed && (
            <p className="cc-hint">
              {timeline.hours_per_week_needed <= 20 ? (
                <>
                  Give it <strong>{timeline.hours_per_week_needed}h a week</strong> to land on your target date.{' '}
                  <button type="button" disabled={busy} onClick={() => run(() => careerCoachAPI.updateSettings(employeeId, { hours_per_week: timeline.hours_per_week_needed! }), 'Weekly hours updated.')}>
                    Use {timeline.hours_per_week_needed}h
                  </button>
                </>
              ) : (
                <>Your target needs more than 20h a week. Move the date for a realistic plan.</>
              )}
            </p>
          )}
        </div>

        <div className="cc-card cc-stat cc-stat--col">
          <div className="cc-stat__row">
            <h4>Momentum</h4>
            {momentum.streak_weeks > 0 && (
              <span className="cc-pill cc-pill--good">
                <Flame size={12} /> {momentum.streak_weeks}-week streak
              </span>
            )}
            {momentum.stalled && momentum.streak_weeks === 0 && (
              <span className="cc-pill cc-pill--warn">{momentum.last_activity ? `Quiet for ${momentum.days_since_activity} days` : 'Not started'}</span>
            )}
          </div>
          <div className="cc-dates">
            <div>
              <span className="cc-muted">This week</span>
              <strong>
                {fmtHours(momentum.hours_this_week)} <small>of {settings.hours_per_week}h</small>
              </strong>
            </div>
            <div>
              <span className="cc-muted">Last 4 weeks</span>
              <strong>{fourWeekPct}% <small>of plan</small></strong>
            </div>
          </div>
          <div className="cc-stat__row">
            <span className="cc-muted">{daysAgo(momentum.days_since_activity)}</span>
            <Button size="sm" onClick={() => openCheckin()}>
              <Plus size={13} className="mr-1" /> Log hours
            </Button>
          </div>
        </div>
      </section>

      {plan.this_week && plan.this_week.length > 0 && (
        <section className="cc-week">
          <h2>This week</h2>
          <div className="cc-week__grid">
            {plan.this_week.map((action) => (
              <button key={action.id} type="button" className={`cc-action cc-action--${action.kind}`} onClick={() => doAction(action)} disabled={busy}>
                <span className="cc-action__icon">
                  {action.kind === 'learning' && <BookOpen size={18} />}
                  {action.kind === 'evidence' && <Hammer size={18} />}
                  {action.kind === 'assessment' && <ClipboardCheck size={18} />}
                  {action.kind === 'mentor' && <UserPlus size={18} />}
                  {action.kind === 'checkin' && <Timer size={18} />}
                </span>
                <span className="cc-action__text">
                  <strong>{action.title}</strong>
                  <span>{action.detail}</span>
                </span>
                <ArrowRight size={16} className="cc-action__go" />
              </button>
            ))}
          </div>
        </section>
      )}

      <nav className="cc-tabs" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`cc-tab ${tab === id ? 'cc-tab--on' : ''}`} onClick={() => setTab(id)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      {tab === 'plan' && (
        <section className="cc-card">
          <MarketPanel market={plan.market} role={plan.goal.target_role} busy={researching} onRefresh={refreshMarket} />
          {openMilestones.length === 0 ? (
            <div className="cc-empty">
              <CheckCircle2 size={28} />
              <h3>Every required skill is at the bar</h3>
              <p className="cc-muted">Share your plan with your manager and look at the open roles under People & roles.</p>
            </div>
          ) : (
            <p className="cc-muted cc-plan-intro">
              Built from what employers ask of {plan.goal.target_role} today and the skills already in your Skill DNA. One skill at a time, biggest gap first. Each skill closes in three steps: learn it, use it in real work, then get the new level confirmed.
            </p>
          )}
          <div className="cc-milestones">
            {[...openMilestones, ...doneMilestones].map((milestone, index) => (
              <MilestoneCard
                key={milestone.gap_id}
                milestone={milestone}
                index={index}
                busy={busy}
                onLearn={openLearning}
                onEvidence={openEvidence}
                onReopen={(phase) => run(() => careerCoachAPI.reopenStep(employeeId, phase.id), 'Step reopened.')}
              />
            ))}
          </div>
        </section>
      )}

      {tab === 'skills' && (
        <section className="cc-card">
          <MarketPanel market={plan.market} role={plan.goal.target_role} busy={researching} onRefresh={refreshMarket} />
          <p className="cc-muted cc-plan-intro">
            What {plan.goal.target_role} asks for, measured against your Skill DNA on a 0–10 scale.
            {plan.unused_profile_skills ? ` ${plan.unused_profile_skills} other profile skill${plan.unused_profile_skills === 1 ? ' is' : 's are'} outside this role's bar.` : ''}
          </p>
          <div className="cc-bar-list">
            {(plan.requirements || []).map((row) => (
              <div key={row.requirement} className={`cc-bar-row ${row.gap === 0 ? 'is-met' : ''}`}>
                <div className="cc-bar-row__name">
                  {row.gap === 0 ? <CheckCircle2 size={16} className="cc-status--done" /> : <Circle size={16} className="cc-status" />}
                  <div>
                    <strong>{row.skill}</strong>
                    <span className="cc-muted">
                      {row.category}
                      {row.recorded_as && row.recorded_as !== row.skill ? ` · from your ${row.recorded_as}` : ''}
                    </span>
                  </div>
                </div>
                <LevelBar current={row.current} required={row.required} />
                <div className="cc-bar-row__why">
                  <p className="cc-muted">{row.why}</p>
                  {row.market_signal && <p className="cc-signal">“{row.market_signal}”</p>}
                  {row.gap > 0 && row.related && row.related.length > 0 && (
                    <p className="cc-muted">Related in your Skill DNA: {row.related.join(', ')}. These help; the role asks for {row.skill} directly.</p>
                  )}
                  {row.gap > 0 && row.proof && (
                    <p className="cc-muted">
                      <strong>Accepted proof:</strong> {row.proof}
                    </p>
                  )}
                  {row.gap > 0 && <Resources items={row.resources} />}
                </div>
                <div className="cc-bar-row__cta">
                  {row.gap > 0 ? (
                    <Button size="sm" variant="ghost" onClick={() => navigate(gapLink(row.gap_id, row.skill))}>
                      Close in Learning <ArrowRight size={13} className="ml-1" />
                    </Button>
                  ) : (
                    <span className="cc-pill cc-pill--good">At the bar</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'people' && (
        <div className="cc-two">
          <section className="cc-card">
            <h3 className="cc-card__title">
              <UserPlus size={16} /> Colleagues already at the bar
            </h3>
            {(plan.mentors || []).length === 0 ? (
              <p className="cc-muted">
                Nobody in the directory has {openMilestones.map((m) => m.skill).join(' or ') || 'these skills'} recorded at the required level yet. Ask your manager who
                owns this work today; they are the best first conversation.
              </p>
            ) : (
              <div className="cc-people">
                {plan.mentors!.map((mentor) => (
                  <div key={`${mentor.employee_id}-${mentor.skill}`} className="cc-person">
                    <span className="cc-avatar">{mentor.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                    <div>
                      <strong>{mentor.name}</strong>
                      <span className="cc-muted">{[mentor.role, mentor.department].filter(Boolean).join(' · ')}</span>
                      <span className="cc-pill">
                        {mentor.recorded_as} {mentor.level}/10
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={mentor.intro_requested ? 'ghost' : 'primary'}
                      disabled={busy || mentor.intro_requested}
                      onClick={() => run(() => careerCoachAPI.requestIntro(employeeId, mentor.employee_id, mentor.skill), `Introduction to ${mentor.name} requested.`)}
                    >
                      {mentor.intro_requested ? 'Requested' : 'Ask for intro'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="cc-card">
            <h3 className="cc-card__title">
              <Briefcase size={16} /> Open roles and your fit
            </h3>
            {(plan.opportunities || []).length === 0 ? (
              <p className="cc-muted">
                No internal roles are open right now. Openings appear here with your fit as soon as HR lists them.
              </p>
            ) : (
              <div className="cc-roles">
                {plan.opportunities!.map((role) => (
                  <div key={role.role_id} className="cc-role">
                    <div className="cc-role__head">
                      <div>
                        <strong>{role.title}</strong>
                        <span className="cc-muted">
                          {role.department}
                          {role.same_track ? ' · same track as your goal' : ''}
                        </span>
                      </div>
                      <span className={`cc-fit ${role.overall_fit_pct >= 80 ? 'cc-fit--high' : ''}`}>{role.overall_fit_pct}%</span>
                    </div>
                    <div className="cc-progress">
                      <div style={{ width: `${role.overall_fit_pct}%` }} />
                    </div>
                    <p className="cc-muted">
                      {role.missing_requirements.length ? `Missing: ${role.missing_requirements.slice(0, 3).join(', ')}` : 'You meet every listed requirement.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'manager' && (
        <section className="cc-card cc-manager">
          <div className="cc-manager__head">
            <div>
              <h3 className="cc-card__title">
                <Briefcase size={16} /> Talking points for your next one-to-one
              </h3>
              <p className="cc-muted">
                {plan.manager ? `For ${plan.manager.name}${plan.manager.role ? `, ${plan.manager.role}` : ''}.` : 'No manager is recorded on your profile.'}{' '}
                {plan.goal.visible_to_manager ? 'Your manager can see this goal.' : 'This goal is private until you share it.'}
              </p>
            </div>
            <div className="cc-head__actions">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(plan.manager_brief || '');
                  setNotice('Copied to clipboard.');
                }}
              >
                <Copy size={13} className="mr-1" /> Copy
              </Button>
              <Button
                size="sm"
                variant={plan.goal.visible_to_manager ? 'ghost' : 'primary'}
                disabled={busy}
                onClick={() => run(() => careerCoachAPI.setVisibility(employeeId, !plan.goal!.visible_to_manager), plan.goal!.visible_to_manager ? 'Goal is now private.' : 'Your manager can now see this goal.')}
              >
                {plan.goal.visible_to_manager ? 'Make private' : 'Share with manager'}
              </Button>
            </div>
          </div>
          <blockquote className="cc-brief">{plan.manager_brief}</blockquote>
          {(plan.checkins || []).length > 0 && (
            <div className="cc-log">
              <h4>Recent check-ins</h4>
              {plan.checkins!.map((row) => (
                <div key={row.id} className="cc-log__row">
                  <span>{fmtDate(row.created_at)}</span>
                  <strong>{fmtHours(row.hours)}</strong>
                  <span>{row.skill || 'General'}</span>
                  <span className="cc-muted">{row.note}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'ask' && (
        <section className="cc-card cc-chat">
          <div className="cc-chat__log">
            {chat.length === 0 && (
              <div className="cc-chat__start">
                <p className="cc-muted">Answers use your plan, your skills, courses in the catalogue, and colleagues in the directory.</p>
                <div className="cc-chips">
                  {[
                    'What should I focus on this week?',
                    `How do I get to ${plan.goal.target_role} faster?`,
                    openMilestones[0] ? `How do I show ${openMilestones[0].skill} in my current work?` : 'What should I ask my manager for?',
                    'What should I ask my manager for?',
                  ]
                    .filter((value, index, all) => all.indexOf(value) === index)
                    .map((prompt) => (
                      <button key={prompt} type="button" className="cc-chip" onClick={() => ask(prompt)}>
                        {prompt}
                      </button>
                    ))}
                </div>
              </div>
            )}
            {chat.map((message, index) => (
              <div key={index} className={`cc-msg cc-msg--${message.role}`}>
                <div className="cc-msg__bubble">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.grounding && message.grounding.length > 0 && (
                  <div className="cc-msg__ground">
                    {message.grounding.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {asking && (
              <div className="cc-msg cc-msg--assistant">
                <div className="cc-msg__bubble">
                  <Loader2 size={14} className="animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          <form
            className="cc-chat__input"
            onSubmit={(event) => {
              event.preventDefault();
              ask(question);
            }}
          >
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about your plan…" maxLength={1000} />
            <Button type="submit" disabled={asking || !question.trim()}>
              <Send size={15} />
            </Button>
          </form>
        </section>
      )}

      <Modal isOpen={goalOpen} onClose={() => setGoalOpen(false)} title="Change your goal" maxWidthClass="max-w-4xl">
        <div className="career-coach cc-modal">
          <p className="cc-muted cc-plan-intro">
            A new goal starts a fresh plan. Your evidence, check-ins, and learning plans stay on your profile.
          </p>
          <GoalSetup
            employeeId={employeeId}
            roles={plan.role_options}
            initialRole={plan.goal.target_role}
            initialMonths={settings.target_months}
            initialHours={settings.hours_per_week}
            initialVisible={plan.goal.visible_to_manager}
            busy={busy}
            onSubmit={async (data) => {
              if (await run(() => careerCoachAPI.setGoal(employeeId, data), 'Your new plan is ready.')) {
                setGoalOpen(false);
                setTab('plan');
              }
            }}
          />
        </div>
      </Modal>

      <Modal isOpen={!!evidenceFor} onClose={() => setEvidenceFor(null)} title={evidenceFor ? evidenceFor.phase.title : 'Add evidence'}>
        {evidenceFor && (
          <form
            className="career-coach cc-modal cc-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await run(() => careerCoachAPI.addEvidence(employeeId, evidenceFor.phase.id, evidenceText, evidenceFile), 'Milestone completed.')) {
                setEvidenceFor(null);
              }
            }}
          >
            <p className="cc-muted">
              {evidenceFor.phase.phase === 'learn'
                ? `Tell us which ${evidenceFor.milestone.skill} course or programme you finished outside the catalogue. Attach the certificate if you have one.`
                : `Describe the ${evidenceFor.milestone.skill} work you did: what you owned, what changed, and who reviewed it.`}
            </p>
            <textarea
              rows={5}
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              placeholder={evidenceFor.phase.phase === 'learn' ? 'e.g. Completed the FinOps Practitioner course, 16 hours.' : 'e.g. Ran a cost review of the payments workload and cut spend 18%.'}
            />
            <label className="cc-file">
              <Upload size={14} />
              {evidenceFile ? evidenceFile.name : 'Attach a file (optional, up to 10 MB)'}
              <input type="file" onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)} />
            </label>
            <div className="cc-form__foot">
              <Button type="button" variant="ghost" onClick={() => setEvidenceFor(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy || (evidenceText.trim().length < 20 && !evidenceFile)}>
                {busy && <Loader2 size={14} className="animate-spin mr-2" />}
                Save and complete
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={checkinOpen} onClose={() => setCheckinOpen(false)} title="Log this week's hours">
        <form
          className="career-coach cc-modal cc-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await run(() => careerCoachAPI.checkin(employeeId, { hours: checkinHours, skill: checkinSkill || undefined, note: checkinNote || undefined }), 'Check-in saved.')) {
              setCheckinOpen(false);
            }
          }}
        >
          <div className="cc-field">
            <span>Hours spent</span>
            <Stepper value={checkinHours} min={1} max={40} suffix="hours" onChange={setCheckinHours} />
          </div>
          <label className="cc-field">
            <span>Skill</span>
            <select value={checkinSkill} onChange={(e) => setCheckinSkill(e.target.value)}>
              <option value="">General</option>
              {(plan.milestones || []).map((m) => (
                <option key={m.gap_id} value={m.skill}>
                  {m.skill}
                </option>
              ))}
            </select>
          </label>
          <label className="cc-field">
            <span>What did you do? (optional)</span>
            <textarea rows={3} value={checkinNote} onChange={(e) => setCheckinNote(e.target.value)} placeholder="e.g. Finished module 2 and reviewed our tagging policy." />
          </label>
          <div className="cc-form__foot">
            <Button type="button" variant="ghost" onClick={() => setCheckinOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 size={14} className="animate-spin mr-2" />}
              Save check-in
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CareerCoach;
