import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Globe,
  History,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useEmployee } from '../../contexts/EmployeeContext';
import {
  successionAPI,
  type SxCandidate,
  type SxEmployeeView,
  type SxOverview,
  type SxPerson,
  type SxPlan,
  type SxRecord,
  type SxRequirement,
  type SxRole,
  type SxTask,
  type SxTaskStatus,
  type SxTaskType,
} from '../../lib/api';
import './SuccessionKnowledgeTransfer.css';

type Persona = 'hr' | 'manager' | 'employer' | 'employee';

const PERSONAS: { id: Persona; label: string; icon: React.ElementType }[] = [
  { id: 'hr', label: 'HR / Talent Mobility', icon: ShieldCheck },
  { id: 'manager', label: 'Manager', icon: Briefcase },
  { id: 'employer', label: 'Employer', icon: Globe },
  { id: 'employee', label: 'Employee', icon: UserCheck },
];

const SAMPLE_QUESTIONS: Record<Persona, string[]> = {
  hr: ['Which critical roles still need a slate or an approval?', 'Which knowledge-transfer tasks are overdue?'],
  manager: [
    "Which of my business-critical roles have no ready successor, and what's the knowledge-transfer plan for the ones that do?",
  ],
  employer: ['Where is the business most exposed to single-point-of-failure knowledge loss, and how far along is the mitigation?'],
  employee: ["Am I being considered as a successor for a role, and what do I still need to close before I'm ready?"],
};

const TASK_TYPES: SxTaskType[] = ['Shadowing Session', 'Documentation Task', 'Mentor Meeting', 'Handover Checklist Item'];
const TASK_STATUSES: SxTaskStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Complete'];
const TASK_ICON: Record<SxTaskType, React.ElementType> = {
  'Shadowing Session': Eye,
  'Documentation Task': FileText,
  'Mentor Meeting': Users,
  'Handover Checklist Item': ClipboardList,
};
const PAIRING_STEPS = ['Slate Generated', 'Candidate Nominated', 'HR approval', 'Confirmed'] as const;

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const isoIn = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const levelTone = (level?: string) =>
  level === 'Critical' ? 'danger' : level === 'High' ? 'warn' : level === 'Moderate' ? 'info' : 'good';

const bandTone = (band: string) =>
  band === 'Ready now' ? 'good' : band.startsWith('Ready in 6') ? 'info' : band.startsWith('Ready in 1') ? 'warn' : 'muted';

const statusTone = (status?: string) =>
  status === 'Confirmed' ? 'good' : status === 'Candidate Nominated' ? 'warn' : status === 'Slate Generated' ? 'info' : 'muted';

const sourceLabel: Record<SxRole['requirements_source'], string> = {
  incumbent: "Incumbent's Skill DNA",
  market: 'Market research (Gemini)',
  library: 'Role library',
  hr: 'Set by HR',
};

// ── Small pieces ─────────────────────────────────────────────────────────

const Avatar: React.FC<{ person?: SxPerson | null; size?: number }> = ({ person, size = 34 }) => (
  <span className="sx-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
    {person?.avatar_url ? <img src={person.avatar_url} alt="" /> : person?.initials || '?'}
  </span>
);

const Chip: React.FC<{ tone?: string; children: React.ReactNode; title?: string }> = ({ tone = 'muted', children, title }) => (
  <span className={`sx-chip sx-chip--${tone}`} title={title}>
    {children}
  </span>
);

const Bar: React.FC<{ pct: number; tone?: string; label?: string }> = ({ pct, tone = 'accent', label }) => (
  <div className="sx-bar" aria-label={label}>
    <div className={`sx-bar__fill sx-bar__fill--${tone}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
  </div>
);

const Ring: React.FC<{ pct: number; size?: number; tone?: string }> = ({ pct, size = 76, tone = 'accent' }) => {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} className={`sx-ring sx-ring--${tone}`}>
      <circle cx={size / 2} cy={size / 2} r={r} className="sx-ring__track" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="sx-ring__value"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="sx-ring__label">
        {Math.round(v)}%
      </text>
    </svg>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string; tone?: string; icon: React.ElementType }> = ({ label, value, hint, tone = 'accent', icon: Icon }) => (
  <div className={`sx-stat sx-stat--${tone}`}>
    <span className="sx-stat__icon">
      <Icon size={18} />
    </span>
    <div>
      <div className="sx-stat__value">{value}</div>
      <div className="sx-stat__label">{label}</div>
      {hint && <div className="sx-stat__hint">{hint}</div>}
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="sx-field">
    <span className="sx-field__label">{label}</span>
    {children}
    {hint && <span className="sx-field__hint">{hint}</span>}
  </label>
);

// ── Candidate slate ──────────────────────────────────────────────────────

const CandidateRow: React.FC<{
  candidate: SxCandidate;
  nominated: boolean;
  canNominate: boolean;
  busy: boolean;
  onNominate: () => void;
}> = ({ candidate, nominated, canNominate, busy, onNominate }) => {
  const [open, setOpen] = useState(false);
  const c = candidate.components;
  return (
    <li className={`sx-cand ${nominated ? 'sx-cand--nominated' : ''}`}>
      <div className="sx-cand__main">
        <span className="sx-cand__rank">#{candidate.rank_position}</span>
        <Avatar person={candidate.employee} />
        <div className="sx-cand__who">
          <strong>{candidate.employee.full_name}</strong>
          <span className="sx-muted">
            {candidate.employee.role || 'Role not recorded'} · {candidate.employee.department || 'No department'}
          </span>
        </div>
        <div className="sx-cand__score">
          <div className="sx-cand__nums">
            <strong>{candidate.candidate_readiness_score}</strong>
            <span className="sx-muted">readiness</span>
          </div>
          <Bar pct={candidate.candidate_readiness_score} tone={bandTone(candidate.readiness_band)} />
        </div>
        <div className="sx-cand__gap">
          <strong>{candidate.candidate_skill_gap_pct}%</strong>
          <span className="sx-muted">skill gap</span>
        </div>
        <Chip tone={bandTone(candidate.readiness_band)}>{candidate.readiness_band}</Chip>
        <div className="sx-cand__actions">
          {nominated ? (
            <Chip tone="warn">
              <UserCheck size={12} /> Nominee
            </Chip>
          ) : (
            canNominate && (
              <button type="button" className="sx-btn sx-btn--soft" disabled={busy} onClick={onNominate}>
                Nominate
              </button>
            )
          )}
          <button type="button" className="sx-icon-btn" onClick={() => setOpen(!open)} aria-label="Show breakdown">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="sx-cand__detail">
          <div className="sx-breakdown">
            {(
              [
                ['Skill coverage', c.skills, 70, `${c.coverage_pct}% of required levels`],
                ['Verified skills', c.verified, 10, 'Verified entries in Skill DNA'],
                ['Experience', c.experience, 10, c.years_experience ? `${c.years_experience} years` : 'Years not recorded'],
                ['Role context', c.context, 10, [c.same_department && 'same department', c.same_role_family && 'same role family'].filter(Boolean).join(', ') || 'different area'],
              ] as const
            ).map(([label, value, max, hint]) => (
              <div key={label} className="sx-breakdown__row">
                <span>{label}</span>
                <Bar pct={(value / max) * 100} />
                <span className="sx-breakdown__val">
                  {value}/{max}
                </span>
                <span className="sx-muted sx-breakdown__hint">{hint}</span>
              </div>
            ))}
          </div>
          <div className="sx-gaps">
            <div>
              <h5>Still to close</h5>
              {candidate.gaps.length === 0 ? (
                <p className="sx-muted">Meets every required level.</p>
              ) : (
                candidate.gaps.map((g) => (
                  <div key={g.skill} className="sx-gap">
                    <span>{g.skill}</span>
                    <span className="sx-muted">
                      {g.current} → {g.required} · ~{g.hours_to_close}h
                    </span>
                  </div>
                ))
              )}
            </div>
            <div>
              <h5>Already at the bar</h5>
              {candidate.strengths.length === 0 ? (
                <p className="sx-muted">None yet.</p>
              ) : (
                candidate.strengths.map((g) => (
                  <div key={g.skill} className="sx-gap sx-gap--good">
                    <span>{g.skill}</span>
                    <span className="sx-muted">
                      {g.current}/{g.required}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

// ── Knowledge transfer plan ──────────────────────────────────────────────

const TaskRow: React.FC<{
  task: SxTask;
  canEdit: boolean;
  canChangeStatus: boolean;
  busy: boolean;
  onStatus: (status: SxTaskStatus) => void;
  onDelete?: () => void;
  showRole?: boolean;
}> = ({ task, canEdit, canChangeStatus, busy, onStatus, onDelete, showRole }) => {
  const Icon = TASK_ICON[task.task_type];
  const [pending, setPending] = useState<SxTaskStatus | null>(null);
  useEffect(() => {
    if (!busy) setPending(null);
  }, [busy, task.status]);
  const shown = pending ?? task.status;
  return (
    <li className={`sx-task ${task.overdue_flag ? 'sx-task--overdue' : ''} ${task.status === 'Complete' ? 'sx-task--done' : ''}`}>
      <span className="sx-task__icon">
        <Icon size={16} />
      </span>
      <div className="sx-task__body">
        <div className="sx-task__title">
          {task.title}
          {task.overdue_flag && (
            <Chip tone="danger">
              <AlertTriangle size={11} /> Overdue {task.days_overdue}d
            </Chip>
          )}
        </div>
        {task.description && <p className="sx-muted">{task.description}</p>}
        <div className="sx-task__meta">
          <span>{task.task_type}</span>
          {showRole && task.role_title && <span>{task.role_title}</span>}
          {task.knowledge_area && <span>{task.knowledge_area}</span>}
          <span>Owner: {task.owner?.full_name || '—'}</span>
          <span>
            Due {fmtDate(task.due_date)}
            {task.days_left !== null && task.days_left !== undefined && ` · ${task.days_left}d left`}
          </span>
        </div>
      </div>
      <div className="sx-task__actions">
        {canChangeStatus ? (
          <select
            className={`sx-select sx-select--${shown === 'Complete' ? 'good' : shown === 'Blocked' ? 'danger' : 'plain'}`}
            value={shown}
            disabled={busy}
            onChange={(e) => {
              const next = e.target.value as SxTaskStatus;
              setPending(next);
              onStatus(next);
            }}
            aria-label="Task status"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <Chip tone={task.status === 'Complete' ? 'good' : 'muted'}>{task.status}</Chip>
        )}
        {canEdit && onDelete && (
          <button type="button" className="sx-icon-btn" disabled={busy} onClick={onDelete} aria-label="Remove task">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </li>
  );
};

const PlanPanel: React.FC<{
  plan: SxPlan;
  canEdit: boolean;
  busy: boolean;
  onStatus: (task: SxTask, status: SxTaskStatus) => void;
  onDelete: (task: SxTask) => void;
  onAdd: () => void;
}> = ({ plan, canEdit, busy, onStatus, onDelete, onAdd }) => {
  const [filter, setFilter] = useState<'all' | SxTaskType | 'overdue'>('all');
  const tasks = plan.tasks.filter((t) => (filter === 'all' ? true : filter === 'overdue' ? t.overdue_flag : t.task_type === filter));
  return (
    <div className="sx-plan">
      <div className="sx-plan__head">
        <Ring pct={plan.overall_progress_pct} tone={plan.overdue_tasks ? 'warn' : 'good'} />
        <div className="sx-plan__facts">
          <div>
            <strong>
              {plan.completed_tasks} of {plan.total_tasks} tasks complete
            </strong>
            <span className="sx-muted"> · overall_progress_pct = completed ÷ total</span>
          </div>
          <div className="sx-plan__meta">
            <Chip tone="info">{plan.status}</Chip>
            <Chip tone="muted">Opened: {plan.opened_reason}</Chip>
            <Chip tone="muted">
              <CalendarClock size={11} /> Handover {fmtDate(plan.target_handover_date)}
              {plan.days_to_handover !== null && ` (${plan.days_to_handover}d)`}
            </Chip>
            {plan.drafted_by && (
              <Chip tone={plan.drafted_by === 'Gemini' ? 'accent' : 'muted'}>
                <Sparkles size={11} /> Drafted by {plan.drafted_by}
              </Chip>
            )}
          </div>
          <div className="sx-plan__people">
            <Avatar person={plan.incumbent} size={26} /> {plan.incumbent?.full_name}
            <ArrowRight size={14} />
            <Avatar person={plan.successor} size={26} /> {plan.successor?.full_name || 'Successor to be confirmed'}
          </div>
        </div>
        {canEdit && (
          <button type="button" className="sx-btn sx-btn--soft" onClick={onAdd} disabled={busy}>
            <Plus size={15} /> Add task
          </button>
        )}
      </div>

      {plan.overdue_flags.length > 0 && (
        <div className="sx-overdue">
          <AlertTriangle size={16} />
          <div>
            <strong>
              {plan.overdue_flags.length} overdue task{plan.overdue_flags.length > 1 ? 's' : ''}
            </strong>
            <ul>
              {plan.overdue_flags.map((f) => (
                <li key={f.task_id}>
                  {f.title} — due {fmtDate(f.due_date)}, {f.days_overdue}d late ({f.owner?.full_name || 'no owner'})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="sx-filter">
        <button type="button" className={filter === 'all' ? 'is-on' : ''} onClick={() => setFilter('all')}>
          All {plan.total_tasks}
        </button>
        {TASK_TYPES.map((t) => (
          <button key={t} type="button" className={filter === t ? 'is-on' : ''} onClick={() => setFilter(t)}>
            {t} {plan.by_type[t] || 0}
          </button>
        ))}
        {plan.overdue_tasks > 0 && (
          <button type="button" className={`sx-filter--danger ${filter === 'overdue' ? 'is-on' : ''}`} onClick={() => setFilter('overdue')}>
            Overdue {plan.overdue_tasks}
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="sx-muted sx-empty-line">No tasks in this view.</p>
      ) : (
        <ul className="sx-tasks">
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              canEdit={canEdit}
              canChangeStatus={canEdit}
              busy={busy}
              onStatus={(s) => onStatus(t, s)}
              onDelete={() => onDelete(t)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Role detail (HR workspace; read-only for managers) ───────────────────

const RequirementsEditor: React.FC<{
  role: SxRole;
  canEdit: boolean;
  busy: boolean;
  onSave: (items: SxRequirement[]) => void;
  onDerive: (source: 'incumbent' | 'market') => void;
}> = ({ role, canEdit, busy, onSave, onDerive }) => {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<SxRequirement[]>(role.requirements);
  const [newSkill, setNewSkill] = useState('');
  useEffect(() => setItems(role.requirements), [role.requirements]);

  return (
    <section className="sx-card">
      <div className="sx-card__title">
        <BookOpen size={17} /> Critical knowledge the successor needs
        <Chip tone={role.requirements_source === 'market' ? 'accent' : 'muted'}>{sourceLabel[role.requirements_source]}</Chip>
      </div>
      {role.requirements_summary && <p className="sx-muted sx-mb">{role.requirements_summary}</p>}
      {editing ? (
        <div className="sx-req-edit">
          {items.map((item, i) => (
            <div key={item.skill} className="sx-req-edit__row">
              <span>{item.skill}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={item.level}
                onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, level: Number(e.target.value) } : it)))}
              />
              <strong>{item.level}/10</strong>
              <button type="button" className="sx-icon-btn" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Remove skill">
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="sx-req-edit__add">
            <input className="sx-input" placeholder="Add a skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
            <button
              type="button"
              className="sx-btn sx-btn--soft"
              disabled={newSkill.trim().length < 2}
              onClick={() => {
                setItems([...items, { skill: newSkill.trim(), level: 7 }]);
                setNewSkill('');
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="sx-row-end">
            <button type="button" className="sx-btn sx-btn--ghost" onClick={() => { setItems(role.requirements); setEditing(false); }}>
              Cancel
            </button>
            <button type="button" className="sx-btn" disabled={busy || items.length === 0} onClick={() => { onSave(items); setEditing(false); }}>
              Save requirements
            </button>
          </div>
        </div>
      ) : (
        <div className="sx-reqs">
          {role.requirements.map((r) => (
            <div key={r.skill} className="sx-req" title={r.why || undefined}>
              <span>{r.skill}</span>
              <strong>{r.level}/10</strong>
            </div>
          ))}
        </div>
      )}
      {role.requirements_sources.length > 0 && !editing && (
        <div className="sx-sources">
          {role.requirements_sources.slice(0, 5).map((s) => (
            <a key={s.uri} href={s.uri} target="_blank" rel="noreferrer">
              {s.title}
            </a>
          ))}
        </div>
      )}
      {canEdit && !editing && (
        <div className="sx-row-end sx-mt">
          <button type="button" className="sx-btn sx-btn--ghost" disabled={busy} onClick={() => onDerive('incumbent')}>
            <RefreshCw size={14} /> Rebuild from incumbent Skill DNA
          </button>
          <button type="button" className="sx-btn sx-btn--ghost" disabled={busy} onClick={() => onDerive('market')}>
            <Sparkles size={14} /> Research with Gemini
          </button>
          <button type="button" className="sx-btn sx-btn--soft" disabled={busy} onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
      )}
    </section>
  );
};

const PairingStepper: React.FC<{ record: SxRecord }> = ({ record }) => {
  const index =
    record.pairing_status === 'Confirmed' ? 3 : record.pairing_status === 'Candidate Nominated' ? 2 : record.pairing_status === 'Slate Generated' ? 0 : -1;
  return (
    <ol className="sx-stepper">
      {PAIRING_STEPS.map((step, i) => (
        <li key={step} className={i < index || (i === index && step === 'Confirmed') ? 'is-done' : i === index ? 'is-current' : ''}>
          <span>{i < index || (i === 3 && index === 3) ? <Check size={12} /> : i + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
};

const RoleDetail: React.FC<{
  role: SxRole;
  record: SxRecord | null;
  canEdit: boolean;
  busy: boolean;
  run: (fn: () => Promise<unknown>, message?: string) => void;
  onAddTask: (plan: SxPlan) => void;
  onAsk: (kind: 'flag' | 'hr_request' | 'approve' | 'decline' | 'withdraw' | 'plan') => void;
}> = ({ role, record, canEdit, busy, run, onAddTask, onAsk }) => {
  const [showAudit, setShowAudit] = useState(false);
  const exposure = role.exposure;
  const plan = record?.plan ?? role.plan ?? null;
  const active = record && record.pairing_status !== 'Withdrawn' ? record : null;
  const canNominate = !!active && canEdit && active.pairing_status !== 'Confirmed';

  return (
    <div className="sx-detail">
      <section className="sx-card sx-role-head">
        <div className="sx-role-head__top">
          <div>
            <div className="sx-eyebrow">{role.department || 'No department'}</div>
            <h2>{role.role_title}</h2>
            <div className="sx-role-head__people">
              <span>
                <Avatar person={role.incumbent} size={24} /> Incumbent: <strong>{role.incumbent?.full_name}</strong>
              </span>
              <span>
                <Briefcase size={14} /> Owner: <strong>{role.owner?.full_name || 'Not set'}</strong>
              </span>
              <span>
                <CalendarClock size={14} /> Expected departure: <strong>{fmtDate(role.expected_departure_date)}</strong>
              </span>
            </div>
          </div>
          <div className="sx-role-head__flags">
            {role.is_business_critical ? (
              <Chip tone="danger">
                <Flag size={12} /> Business-critical
              </Chip>
            ) : (
              <Chip tone="muted">Not flagged business-critical</Chip>
            )}
            <Chip tone={role.departure_risk === 'High' ? 'danger' : role.departure_risk === 'Medium' ? 'warn' : 'good'}>
              Departure risk: {role.departure_risk}
            </Chip>
            {canEdit && (
              <button type="button" className="sx-btn sx-btn--ghost" disabled={busy} onClick={() => onAsk('flag')}>
                <Flag size={14} /> {role.is_business_critical ? 'Edit flag' : 'Flag as business-critical'}
              </button>
            )}
          </div>
        </div>
        {role.criticality_reason && (
          <p className="sx-reason">
            <ShieldAlert size={14} /> {role.criticality_reason}
            {role.flagged_by && <span className="sx-muted"> — flagged by {role.flagged_by} on {fmtDate(role.flagged_at)}</span>}
          </p>
        )}
        {exposure && (
          <div className="sx-exposure">
            <div className={`sx-exposure__score sx-tone--${levelTone(exposure.level)}`}>
              <strong>{exposure.score}</strong>
              <span>{exposure.level} exposure</span>
            </div>
            <div className="sx-exposure__bars">
              <div>
                <span>Succession cover</span>
                <Bar pct={exposure.succession_cover} tone="good" />
                <strong>{Math.round(exposure.succession_cover)}%</strong>
              </div>
              <div>
                <span>Knowledge captured</span>
                <Bar pct={exposure.knowledge_captured} tone="accent" />
                <strong>{Math.round(exposure.knowledge_captured)}%</strong>
              </div>
              <p className="sx-muted">{exposure.explanation}</p>
            </div>
          </div>
        )}
      </section>

      <RequirementsEditor
        role={role}
        canEdit={canEdit}
        busy={busy}
        onSave={(items) => run(() => successionAPI.updateRole(role.id, { requirements: items }), 'Requirements saved. Regenerate the slate to re-rank.')}
        onDerive={(source) =>
          run(
            () => successionAPI.deriveRequirements(role.id, source),
            source === 'market' ? 'Requirements researched from current postings.' : "Requirements rebuilt from the incumbent's Skill DNA.",
          )
        }
      />

      <section className="sx-card">
        <div className="sx-card__title">
          <Users size={17} /> Successor slate
          {active && <Chip tone={statusTone(active.pairing_status)}>{active.pairing_status}</Chip>}
          {active && (
            <Chip tone="muted" title={active.trigger_note || undefined}>
              Trigger: {active.trigger_reason}
            </Chip>
          )}
        </div>

        {!active ? (
          <div className="sx-empty">
            <p>
              {role.is_business_critical
                ? 'This role is flagged business-critical. Generate a ranked slate of up to five successors.'
                : 'A slate is generated for roles flagged business-critical, or on an explicit HR request with a recorded reason.'}
            </p>
            {canEdit && (
              <div className="sx-row-center">
                {role.is_business_critical && (
                  <button
                    type="button"
                    className="sx-btn"
                    disabled={busy}
                    onClick={() => run(() => successionAPI.generateSlate(role.id, 'business_critical'), 'Successor slate generated.')}
                  >
                    <Sparkles size={15} /> Generate slate
                  </button>
                )}
                <button type="button" className="sx-btn sx-btn--ghost" disabled={busy} onClick={() => onAsk('hr_request')}>
                  <FileText size={15} /> Raise an HR request
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <PairingStepper record={active} />
            {active.trigger_note && <p className="sx-muted sx-mb">Request reason: {active.trigger_note}</p>}
            {active.candidates.length === 0 ? (
              <div className="sx-empty">
                <p>No employee matches any required skill yet. Widen the requirements or record more Skill DNA, then regenerate.</p>
              </div>
            ) : (
              <>
                <div className="sx-slate-head">
                  <span>Ranked by readiness, then lower skill gap · top {active.candidates.length}</span>
                  {!active.has_ready_successor && (
                    <Chip tone="warn">
                      <AlertTriangle size={11} /> No candidate is ready now
                    </Chip>
                  )}
                </div>
                <ul className="sx-slate">
                  {active.candidates.map((c) => (
                    <CandidateRow
                      key={c.id}
                      candidate={c}
                      nominated={active.nominee?.employee_id === c.employee_id}
                      canNominate={canNominate}
                      busy={busy}
                      onNominate={() => run(() => successionAPI.nominate(active.succession_record_id, c.employee_id), `${c.employee.full_name} nominated. HR approval is next.`)}
                    />
                  ))}
                </ul>
              </>
            )}
            {canEdit && (
              <div className="sx-row-end sx-mt">
                <button
                  type="button"
                  className="sx-btn sx-btn--ghost"
                  disabled={busy}
                  onClick={() => run(() => successionAPI.share(active.succession_record_id, !active.shared_with_candidates), active.shared_with_candidates ? 'Slate is HR-only again.' : 'Candidates can now see where they stand.')}
                >
                  {active.shared_with_candidates ? <EyeOff size={14} /> : <Eye size={14} />}
                  {active.shared_with_candidates ? 'Hide from candidates' : 'Share with candidates'}
                </button>
                {active.pairing_status !== 'Confirmed' && (
                  <button
                    type="button"
                    className="sx-btn sx-btn--ghost"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => successionAPI.generateSlate(role.id, role.is_business_critical ? 'business_critical' : 'hr_request', active.trigger_note || ''),
                        'Slate re-ranked with current skills.',
                      )
                    }
                  >
                    <RefreshCw size={14} /> Re-rank
                  </button>
                )}
                <button type="button" className="sx-btn sx-btn--ghost sx-btn--danger" disabled={busy} onClick={() => onAsk('withdraw')}>
                  Withdraw pairing
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {active && (
        <section className={`sx-card sx-gate ${active.pairing_status === 'Confirmed' ? 'sx-gate--ok' : ''}`}>
          <div className="sx-card__title">
            <ShieldCheck size={17} /> HR approval gate
            <Chip tone={active.approved_by_hr ? 'good' : 'warn'}>approved_by_hr: {active.approved_by_hr ? 'TRUE' : 'FALSE'}</Chip>
          </div>
          {active.pairing_status === 'Confirmed' ? (
            <p>
              <BadgeCheck size={15} className="sx-inline-icon" /> <strong>{active.nominee?.employee.full_name}</strong> confirmed as successor by{' '}
              {active.approved_by} on {fmtDate(active.approved_at)}.
              {active.decision_note && <span className="sx-muted"> “{active.decision_note}”</span>}
            </p>
          ) : active.pairing_status === 'Candidate Nominated' && active.nominee ? (
            <>
              <p className="sx-mb">
                <strong>{active.nominee.employee.full_name}</strong> is nominated at {active.nominee.candidate_readiness_score} readiness (
                {active.nominee.readiness_band}). The pairing becomes Confirmed once HR approves it.
              </p>
              {canEdit && (
                <div className="sx-row-end">
                  <button type="button" className="sx-btn sx-btn--ghost sx-btn--danger" disabled={busy} onClick={() => onAsk('decline')}>
                    Decline
                  </button>
                  <button type="button" className="sx-btn sx-btn--good" disabled={busy} onClick={() => onAsk('approve')}>
                    <CheckCircle2 size={15} /> Approve pairing
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="sx-muted">
              Nominate a candidate from the slate. Every pairing waits here for HR approval before it is finalised.
              {active.decision_note && <> Last decision note: “{active.decision_note}”.</>}
            </p>
          )}
        </section>
      )}

      {active && (
        <section className="sx-card">
          <div className="sx-card__title">
            <ClipboardList size={17} /> Knowledge transfer plan
          </div>
          {plan ? (
            <PlanPanel
              plan={plan}
              canEdit={canEdit}
              busy={busy}
              onAdd={() => onAddTask(plan)}
              onStatus={(task, status) => run(() => successionAPI.updateTask(task.id, { status }), status === 'Complete' ? 'Task complete. Progress updated.' : undefined)}
              onDelete={(task) => run(() => successionAPI.deleteTask(task.id), 'Task removed.')}
            />
          ) : (
            <div className="sx-empty">
              <p>
                The plan opens automatically when HR confirms the pairing.
                {canEdit && ' HR can also open it earlier, for example when the incumbent is leaving soon.'}
              </p>
              {canEdit && (
                <button type="button" className="sx-btn sx-btn--soft" disabled={busy} onClick={() => onAsk('plan')}>
                  <Plus size={15} /> Open plan now (HR discretion)
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {record?.audit && record.audit.length > 0 && (
        <section className="sx-card">
          <button type="button" className="sx-card__title sx-card__title--toggle" onClick={() => setShowAudit(!showAudit)}>
            <History size={17} /> Decision trail ({record.audit.length})
            {showAudit ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {showAudit && (
            <ul className="sx-audit">
              {record.audit.map((a, i) => (
                <li key={i}>
                  <span className="sx-audit__when">{new Date(a.created_at).toLocaleString()}</span>
                  <strong>{a.action.replace(/_/g, ' ')}</strong>
                  <span>{a.actor}</span>
                  {a.detail && <span className="sx-muted">{a.detail}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

// ── Role list ────────────────────────────────────────────────────────────

const RoleList: React.FC<{ roles: SxRole[]; selected: string | null; onSelect: (id: string) => void }> = ({ roles, selected, onSelect }) => (
  <ul className="sx-roles">
    {roles.map((r) => (
      <li key={r.id}>
        <button type="button" className={`sx-role ${selected === r.id ? 'is-on' : ''}`} onClick={() => onSelect(r.id)}>
          <div className="sx-role__top">
            <strong>{r.role_title}</strong>
            {r.exposure && <Chip tone={levelTone(r.exposure.level)}>{r.exposure.score}</Chip>}
          </div>
          <div className="sx-role__sub">
            <Avatar person={r.incumbent} size={20} /> {r.incumbent?.full_name}
          </div>
          <div className="sx-role__chips">
            {r.is_business_critical && (
              <Chip tone="danger">
                <Flag size={10} /> Critical
              </Chip>
            )}
            <Chip tone={statusTone(r.record?.pairing_status)}>{r.record?.pairing_status || 'No slate'}</Chip>
            {r.plan && (
              <Chip tone={r.plan.overdue_tasks ? 'danger' : 'info'}>
                KT {Math.round(r.plan.overall_progress_pct)}%{r.plan.overdue_tasks ? ` · ${r.plan.overdue_tasks} late` : ''}
              </Chip>
            )}
          </div>
        </button>
      </li>
    ))}
  </ul>
);

// ── Employer board ───────────────────────────────────────────────────────

const ExposureBoard: React.FC<{ data: SxOverview; onOpen: (id: string) => void }> = ({ data, onOpen }) => {
  const departments = useMemo(() => {
    const map = new Map<string, { name: string; roles: number; worst: number; critical: number }>();
    data.roles.forEach((r) => {
      const key = r.department || 'Unassigned';
      const row = map.get(key) || { name: key, roles: 0, worst: 0, critical: 0 };
      row.roles += 1;
      row.worst = Math.max(row.worst, r.exposure?.score || 0);
      if (r.is_business_critical) row.critical += 1;
      map.set(key, row);
    });
    return [...map.values()].sort((a, b) => b.worst - a.worst);
  }, [data.roles]);
  const t = data.totals;
  const confirmedPct = t.business_critical ? Math.round((100 * t.confirmed_pairings) / t.business_critical) : 0;

  return (
    <div className="sx-board">
      <section className="sx-card">
        <div className="sx-card__title">
          <ShieldAlert size={17} /> Single-point-of-failure exposure by role
        </div>
        <p className="sx-muted sx-mb">
          Exposure = (100 − mitigation) × departure-risk weight. Mitigation is 60% succession cover and 40% knowledge captured.
        </p>
        <ul className="sx-expo-list">
          {data.roles.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => onOpen(r.id)}>
                <div className="sx-expo-list__name">
                  <strong>{r.role_title}</strong>
                  <span className="sx-muted">
                    {r.incumbent?.full_name} · {r.department || 'Unassigned'}
                  </span>
                </div>
                <div className="sx-expo-list__bar">
                  <Bar pct={r.exposure?.score || 0} tone={levelTone(r.exposure?.level)} />
                </div>
                <Chip tone={levelTone(r.exposure?.level)}>
                  {r.exposure?.level} · {r.exposure?.score}
                </Chip>
                <span className="sx-expo-list__mit">
                  Successor {Math.round(r.exposure?.succession_cover || 0)}% · Knowledge {Math.round(r.exposure?.knowledge_captured || 0)}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <div className="sx-board__side">
        <section className="sx-card">
          <div className="sx-card__title">
            <CheckCircle2 size={17} /> Mitigation progress
          </div>
          <div className="sx-mit">
            <div>
              <Ring pct={confirmedPct} tone="good" />
              <span>Critical roles with a confirmed successor</span>
            </div>
            <div>
              <Ring pct={t.avg_kt_progress_pct} tone="accent" />
              <span>Average knowledge-transfer progress</span>
            </div>
          </div>
          <div className="sx-levels">
            {(['Critical', 'High', 'Moderate', 'Low'] as const).map((l) => (
              <div key={l} className={`sx-levels__item sx-tone--${levelTone(l)}`}>
                <strong>{t.exposure_by_level[l]}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="sx-card">
          <div className="sx-card__title">
            <Globe size={17} /> By department
          </div>
          <ul className="sx-dept">
            {departments.map((d) => (
              <li key={d.name}>
                <span>{d.name}</span>
                <span className="sx-muted">
                  {d.roles} role{d.roles > 1 ? 's' : ''}, {d.critical} critical
                </span>
                <Bar pct={d.worst} tone={d.worst >= 70 ? 'danger' : d.worst >= 45 ? 'warn' : 'good'} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

// ── Employee view ────────────────────────────────────────────────────────

const EmployeePanel: React.FC<{ view: SxEmployeeView; busy: boolean; onStatus: (task: SxTask, status: SxTaskStatus) => void }> = ({ view, busy, onStatus }) => (
  <div className="sx-emp">
    <section className="sx-card">
      <div className="sx-card__title">
        <UserCheck size={17} /> Roles you are being considered for
      </div>
      {view.considered.length === 0 ? (
        <div className="sx-empty">
          <p>
            You are not on a shared successor slate right now. HR shares a slate with candidates when the succession plan for a role is ready to
            discuss, and a confirmed successor always sees their pairing here.
          </p>
        </div>
      ) : (
        <div className="sx-emp__list">
          {view.considered.map((c) => (
            <article key={c.succession_record_id} className="sx-emp__card">
              <div className="sx-emp__head">
                <Ring pct={c.candidate_readiness_score} tone={bandTone(c.readiness_band)} />
                <div>
                  <Chip tone={c.status === 'Confirmed successor' ? 'good' : 'info'}>{c.status}</Chip>
                  <h3>{c.role_title}</h3>
                  <p className="sx-muted">
                    Held by {c.incumbent?.full_name} · rank {c.rank_position} of {c.slate_size} · {c.readiness_band} · {c.candidate_skill_gap_pct}% skill gap
                  </p>
                </div>
              </div>
              <h5>What to close before you are ready</h5>
              {c.gaps.length === 0 ? (
                <p className="sx-muted">You already meet every required level for this role.</p>
              ) : (
                <ul className="sx-emp__gaps">
                  {c.gaps.map((g) => (
                    <li key={g.skill}>
                      <div>
                        <strong>{g.skill}</strong>
                        <span className="sx-muted">
                          {g.current}/10 now → {g.required}/10 needed · about {g.hours_to_close}h
                        </span>
                        <Bar pct={(g.current / g.required) * 100} tone="warn" />
                      </div>
                      <Link to={`/learning-hub?skill=${encodeURIComponent(g.skill)}`} className="sx-btn sx-btn--soft">
                        Close in Learning <ArrowRight size={13} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {c.hours_to_close > 0 && <p className="sx-muted sx-mt">Roughly {c.hours_to_close} hours of focused development in total.</p>}
              {c.plan && (
                <p className="sx-mt">
                  Knowledge transfer: <strong>{Math.round(c.plan.overall_progress_pct)}%</strong> complete, handover on {fmtDate(c.plan.target_handover_date)}.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
    <section className="sx-card">
      <div className="sx-card__title">
        <ClipboardList size={17} /> Your handover tasks
      </div>
      {view.my_tasks.length === 0 ? (
        <p className="sx-muted">No open knowledge-transfer tasks are assigned to you.</p>
      ) : (
        <ul className="sx-tasks">
          {view.my_tasks.map((t) => (
            <TaskRow key={t.id} task={t} canEdit={false} canChangeStatus busy={busy} onStatus={(s) => onStatus(t, s)} showRole />
          ))}
        </ul>
      )}
      {view.incumbent_roles.length > 0 && (
        <p className="sx-muted sx-mt">
          You hold {view.incumbent_roles.map((r) => r.role_title).join(', ')}. Your documentation and mentoring tasks keep that knowledge in the business.
        </p>
      )}
    </section>
  </div>
);

// ── Ask panel ────────────────────────────────────────────────────────────

const AskPanel: React.FC<{ persona: Persona; employeeId?: string; managerId?: string }> = ({ persona, employeeId, managerId }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; source: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setAnswer(null);
    setError(null);
  }, [persona, employeeId, managerId]);

  const ask = async (q: string) => {
    if (q.trim().length < 3 || asking) return;
    if (persona === 'employee' && !employeeId) return;
    if (persona === 'manager' && !managerId) {
      setError('Choose a manager first.');
      return;
    }
    setQuestion(q);
    setAsking(true);
    setError(null);
    try {
      const res = await successionAPI.ask({ persona, question: q, employee_id: employeeId, manager_id: managerId });
      setAnswer({ text: res.answer, source: res.source });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not answer right now.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <section className="sx-card sx-ask">
      <div className="sx-card__title">
        <MessageSquare size={17} /> Ask about succession
      </div>
      <div className="sx-ask__samples">
        {SAMPLE_QUESTIONS[persona].map((q) => (
          <button key={q} type="button" onClick={() => ask(q)} disabled={asking}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="sx-ask__form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input className="sx-input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about successors, exposure, or handover…" />
        <button type="submit" className="sx-btn" disabled={asking || question.trim().length < 3}>
          {asking ? <Loader2 size={15} className="sx-spin" /> : <Send size={15} />}
        </button>
      </form>
      {error && <div className="sx-alert">{error}</div>}
      {answer && (
        <div className="sx-ask__answer">
          <ReactMarkdown>{answer.text}</ReactMarkdown>
          <span className="sx-muted">{answer.source === 'gemini' ? 'Gemini, grounded in the succession register' : 'Answered from the succession register'}</span>
        </div>
      )}
    </section>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────

type Prompt = null | 'role' | 'flag' | 'hr_request' | 'approve' | 'decline' | 'withdraw' | 'plan' | 'task';

export const SuccessionKnowledgeTransfer: React.FC = () => {
  const { employees, currentEmployee } = useEmployee();
  const [persona, setPersona] = useState<Persona>('hr');
  const [managerId, setManagerId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [data, setData] = useState<SxOverview | null>(null);
  const [record, setRecord] = useState<SxRecord | null>(null);
  const [empView, setEmpView] = useState<SxEmployeeView | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [taskPlan, setTaskPlan] = useState<SxPlan | null>(null);

  const [note, setNote] = useState('');
  const [handover, setHandover] = useState(isoIn(90));
  const [useAi, setUseAi] = useState(true);
  const [flagForm, setFlagForm] = useState({ critical: true, reason: '', risk: 'Medium' as 'Low' | 'Medium' | 'High', departure: '', owner: '' });
  const emptyRoleForm = {
    role_title: '',
    incumbent_employee_id: '',
    owner_manager_id: '',
    department: '',
    is_business_critical: true,
    criticality_reason: '',
    departure_risk: 'Medium' as 'Low' | 'Medium' | 'High',
    expected_departure_date: '',
    requirements_source: 'incumbent' as 'incumbent' | 'market',
  };
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const openRoleForm = () => {
    setRoleForm(emptyRoleForm);
    setPrompt('role');
  };
  const [taskForm, setTaskForm] = useState({ task_type: 'Shadowing Session' as SxTaskType, title: '', description: '', knowledge_area: '', due_date: isoIn(14), owner_employee_id: '' });

  useEffect(() => {
    if (!employeeId && currentEmployee) setEmployeeId(currentEmployee.id);
  }, [currentEmployee, employeeId]);

  const role = useMemo(() => data?.roles.find((r) => r.id === selected) || null, [data, selected]);
  const recordId = role?.record?.succession_record_id;

  const load = useCallback(async () => {
    setError(null);
    try {
      if (persona === 'employee') {
        if (employeeId) setEmpView(await successionAPI.employee(employeeId));
        return;
      }
      if (persona === 'manager' && !managerId) {
        const all = await successionAPI.overview();
        setData({ ...all, roles: [] });
        return;
      }
      const next = await successionAPI.overview(persona === 'manager' ? managerId : undefined);
      setData(next);
      setSelected((cur) => (cur && next.roles.some((r) => r.id === cur) ? cur : next.roles[0]?.id || null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load succession data.');
    } finally {
      setLoading(false);
    }
  }, [persona, managerId, employeeId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const recordWanted = recordId && persona !== 'employee' && persona !== 'employer' ? recordId : null;
  const recordRef = useRef(recordWanted);
  recordRef.current = recordWanted;

  useEffect(() => {
    if (!recordWanted) {
      setRecord(null);
      return;
    }
    let live = true;
    successionAPI
      .record(recordWanted)
      .then((r) => live && setRecord(r))
      .catch(() => live && setRecord(null));
    return () => {
      live = false;
    };
  }, [recordWanted]);

  const reloadRecord = useCallback(async () => {
    const id = recordRef.current;
    if (!id) return;
    try {
      const fresh = await successionAPI.record(id);
      if (recordRef.current === id) setRecord(fresh);
    } catch {
      if (recordRef.current === id) setRecord(null);
    }
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const run = useCallback(
    async (fn: () => Promise<unknown>, message?: string) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        await Promise.all([load(), reloadRecord()]);
        if (message) setNotice(message);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'That did not work.');
      } finally {
        setBusy(false);
      }
    },
    [load, reloadRecord],
  );

  const close = () => {
    setPrompt(null);
    setNote('');
  };

  const askFor = (kind: Exclude<Prompt, null | 'role' | 'task'>) => {
    setNote('');
    if (kind === 'flag' && role) {
      setFlagForm({
        critical: true,
        reason: role.criticality_reason || '',
        risk: role.departure_risk,
        departure: role.expected_departure_date || '',
        owner: role.owner?.id || '',
      });
    }
    if (kind === 'plan' && role) setHandover(role.expected_departure_date && role.expected_departure_date > isoIn(7) ? role.expected_departure_date : isoIn(90));
    setPrompt(kind);
  };

  const submitPrompt = async () => {
    if (!role) return;
    const rid = role.record?.succession_record_id;
    if (prompt === 'flag') {
      await run(
        () =>
          successionAPI.updateRole(role.id, {
            is_business_critical: flagForm.critical,
            criticality_reason: flagForm.reason,
            departure_risk: flagForm.risk,
            expected_departure_date: flagForm.departure || null,
            owner_manager_id: flagForm.owner || null,
          }),
        flagForm.critical ? 'Role flagged business-critical.' : 'Role flag updated.',
      );
    } else if (prompt === 'hr_request') {
      await run(() => successionAPI.generateSlate(role.id, 'hr_request', note), 'Slate generated on HR request.');
    } else if (prompt === 'approve' && rid) {
      await run(() => successionAPI.decide(rid, true, note), 'Pairing confirmed. The knowledge transfer plan is open.');
    } else if (prompt === 'decline' && rid) {
      await run(() => successionAPI.decide(rid, false, note), 'Pairing declined. The slate is open for a new nominee.');
    } else if (prompt === 'withdraw' && rid) {
      await run(() => successionAPI.withdraw(rid, note), 'Pairing withdrawn.');
    } else if (prompt === 'plan' && rid) {
      await run(() => successionAPI.openPlan(rid, { hr_discretion: true, target_handover_date: handover, use_ai: useAi }), 'Knowledge transfer plan opened.');
    }
    close();
  };

  const submitRole = async () => {
    await run(async () => {
      const created = await successionAPI.createRole({
        ...roleForm,
        owner_manager_id: roleForm.owner_manager_id || null,
        department: roleForm.department || null,
        expected_departure_date: roleForm.expected_departure_date || null,
      });
      setSelected(created.id);
    }, 'Role added to the succession register.');
    setPrompt(null);
  };

  const submitTask = async () => {
    if (!taskPlan) return;
    await run(
      () =>
        successionAPI.addTask(taskPlan.id, {
          ...taskForm,
          description: taskForm.description || null,
          knowledge_area: taskForm.knowledge_area || null,
          owner_employee_id: taskForm.owner_employee_id || null,
        }),
      'Task added.',
    );
    setPrompt(null);
  };

  const managers = useMemo(() => {
    const owners = data?.role_owners || [];
    const ids = new Set(owners.map((o) => o.id));
    const rest = employees.filter((e) => !ids.has(e.id)).map((e) => ({ id: e.id, full_name: e.full_name, initials: '', role: e.role, department: e.department }) as SxPerson);
    return { owners, rest };
  }, [data, employees]);

  const t = data?.totals;
  const canEdit = persona === 'hr';
  const flagReasonOk = !flagForm.critical || flagForm.reason.trim().length >= 5;
  const roleFormOk =
    roleForm.role_title.trim().length >= 3 && !!roleForm.incumbent_employee_id && (!roleForm.is_business_critical || roleForm.criticality_reason.trim().length >= 5);

  return (
    <div className="succession">
      <header className="sx-head">
        <div>
          <div className="sx-eyebrow">Organization Twin · Succession</div>
          <h1>Succession & Knowledge Transfer</h1>
          <p className="sx-muted">
            Ranked successors for business-critical roles, an HR-approved pairing, and a tracked handover so critical knowledge stays when an
            incumbent leaves.
          </p>
        </div>
        <div className="sx-head__actions">
          <div className="sx-seg" role="tablist" aria-label="View as">
            {PERSONAS.map((p) => (
              <button key={p.id} type="button" role="tab" aria-selected={persona === p.id} className={persona === p.id ? 'is-on' : ''} onClick={() => setPersona(p.id)}>
                <p.icon size={14} /> {p.label}
              </button>
            ))}
          </div>
          {persona === 'hr' && (
            <Button onClick={openRoleForm} disabled={busy}>
              <Plus size={16} className="mr-1" /> Register a role
            </Button>
          )}
        </div>
      </header>

      {persona === 'manager' && (
        <div className="sx-scope">
          <span>Manager</span>
          <select className="sx-select" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
            <option value="">Choose a manager…</option>
            {managers.owners.length > 0 && (
              <optgroup label="Role owners">
                {managers.owners.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Everyone else">
              {managers.rest.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      )}
      {persona === 'employee' && (
        <div className="sx-scope">
          <span>Employee</span>
          <select className="sx-select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="sx-alert">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="sx-center">
          <Loader2 size={26} className="sx-spin" /> Loading the succession register…
        </div>
      ) : persona === 'employee' ? (
        empView && (
          <>
            <EmployeePanel view={empView} busy={busy} onStatus={(task, status) => run(() => successionAPI.updateTask(task.id, { status }), 'Task updated.')} />
            <AskPanel persona="employee" employeeId={employeeId} />
          </>
        )
      ) : (
        data &&
        t && (
          <>
            {!(persona === 'manager' && !managerId) && <div className="sx-stats">
              <Stat icon={Flag} tone="danger" label="Business-critical roles" value={t.business_critical} hint={`${t.roles} in the register`} />
              <Stat icon={ShieldAlert} tone="warn" label="Without a ready successor" value={t.critical_without_ready_successor} hint={`${t.critical_without_slate} without a slate`} />
              <Stat icon={ShieldCheck} tone="info" label="Awaiting HR approval" value={t.pending_hr_approval} hint={`${t.confirmed_pairings} confirmed`} />
              <Stat icon={ClipboardList} tone="good" label="Knowledge transfer progress" value={`${Math.round(t.avg_kt_progress_pct)}%`} hint={`${t.plans_open} plan${t.plans_open === 1 ? '' : 's'} open`} />
              <Stat icon={AlertTriangle} tone={t.overdue_tasks ? 'danger' : 'good'} label="Overdue tasks" value={t.overdue_tasks} hint="Past due and not complete" />
            </div>}

            {persona === 'manager' && !managerId ? (
              <div className="sx-card sx-empty">
                <p>Choose a manager to see the business-critical roles they own.</p>
              </div>
            ) : data.roles.length === 0 ? (
              <div className="sx-card sx-empty sx-empty--big">
                <ShieldCheck size={34} />
                <h3>{persona === 'manager' ? 'No roles in the register for this manager' : 'The succession register is empty'}</h3>
                <p>
                  {persona === 'hr'
                    ? 'Register a role, record its incumbent, and flag it business-critical. The successor slate and handover plan follow from there.'
                    : 'HR adds roles to the register and flags the business-critical ones.'}
                </p>
                {persona === 'hr' && (
                  <button type="button" className="sx-btn" onClick={openRoleForm}>
                    <Plus size={15} /> Register a role
                  </button>
                )}
              </div>
            ) : persona === 'employer' ? (
              <ExposureBoard
                data={data}
                onOpen={(id) => {
                  setSelected(id);
                  setPersona('hr');
                }}
              />
            ) : (
              <>
                {persona === 'manager' && (
                  <div className="sx-manager-split">
                    <section className="sx-card">
                      <div className="sx-card__title">
                        <ShieldAlert size={17} /> No ready successor
                      </div>
                      {data.roles.filter((r) => r.is_business_critical && !r.has_ready_successor).length === 0 ? (
                        <p className="sx-muted">Every business-critical role you own has a successor ready now.</p>
                      ) : (
                        data.roles
                          .filter((r) => r.is_business_critical && !r.has_ready_successor)
                          .map((r) => (
                            <button key={r.id} type="button" className="sx-mini" onClick={() => setSelected(r.id)}>
                              <strong>{r.role_title}</strong>
                              <span className="sx-muted">
                                {r.record?.pairing_status || 'No slate'} · best candidate {r.record?.candidates[0]?.candidate_readiness_score ?? '—'}
                              </span>
                            </button>
                          ))
                      )}
                    </section>
                    <section className="sx-card">
                      <div className="sx-card__title">
                        <ClipboardList size={17} /> Knowledge transfer plans
                      </div>
                      {data.roles.filter((r) => r.plan).length === 0 ? (
                        <p className="sx-muted">No plans are open for your roles yet.</p>
                      ) : (
                        data.roles
                          .filter((r) => r.plan)
                          .map((r) => (
                            <button key={r.id} type="button" className="sx-mini" onClick={() => setSelected(r.id)}>
                              <strong>{r.role_title}</strong>
                              <Bar pct={r.plan!.overall_progress_pct} tone={r.plan!.overdue_tasks ? 'warn' : 'good'} />
                              <span className="sx-muted">
                                {Math.round(r.plan!.overall_progress_pct)}% · {r.plan!.overdue_tasks} overdue · handover {fmtDate(r.plan!.target_handover_date)}
                              </span>
                            </button>
                          ))
                      )}
                    </section>
                  </div>
                )}
                <div className="sx-work">
                  <aside className="sx-work__list">
                    <RoleList roles={data.roles} selected={selected} onSelect={setSelected} />
                  </aside>
                  <div className="sx-work__detail">
                    {role ? (
                      <RoleDetail
                        role={role}
                        record={record && record.succession_record_id === recordId ? record : role.record || null}
                        canEdit={canEdit}
                        busy={busy}
                        run={run}
                        onAsk={askFor}
                        onAddTask={(plan) => {
                          setTaskPlan(plan);
                          setTaskForm({ task_type: 'Shadowing Session', title: '', description: '', knowledge_area: '', due_date: isoIn(14), owner_employee_id: plan.successor?.id || '' });
                          setPrompt('task');
                        }}
                      />
                    ) : (
                      <div className="sx-card sx-empty">Select a role.</div>
                    )}
                  </div>
                </div>
              </>
            )}
            <AskPanel persona={persona} managerId={managerId || undefined} />
          </>
        )
      )}

      {/* Register role */}
      <Modal isOpen={prompt === 'role'} onClose={() => setPrompt(null)} title="Register a role" maxWidthClass="max-w-2xl">
        <div className="sx-form">
          <Field label="Role title">
            <input className="sx-input" value={roleForm.role_title} onChange={(e) => setRoleForm({ ...roleForm, role_title: e.target.value })} placeholder="e.g. Payments Platform Lead" />
          </Field>
          <div className="sx-form__grid">
            <Field label="Current incumbent">
              <select
                className="sx-select"
                value={roleForm.incumbent_employee_id}
                onChange={(e) => {
                  const emp = employees.find((x) => x.id === e.target.value);
                  setRoleForm({
                    ...roleForm,
                    incumbent_employee_id: e.target.value,
                    department: roleForm.department || emp?.department || '',
                    role_title: roleForm.role_title || emp?.role || '',
                  });
                }}
              >
                <option value="">Choose…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} — {e.role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Role owner (manager)" hint="Defaults to the incumbent's manager.">
              <select className="sx-select" value={roleForm.owner_manager_id} onChange={(e) => setRoleForm({ ...roleForm, owner_manager_id: e.target.value })}>
                <option value="">Incumbent's manager</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Department">
              <input className="sx-input" value={roleForm.department} onChange={(e) => setRoleForm({ ...roleForm, department: e.target.value })} />
            </Field>
            <Field label="Expected departure (optional)">
              <input type="date" className="sx-input" value={roleForm.expected_departure_date} onChange={(e) => setRoleForm({ ...roleForm, expected_departure_date: e.target.value })} />
            </Field>
            <Field label="Departure risk">
              <select className="sx-select" value={roleForm.departure_risk} onChange={(e) => setRoleForm({ ...roleForm, departure_risk: e.target.value as 'Low' | 'Medium' | 'High' })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </Field>
            <Field label="Required skills from">
              <select className="sx-select" value={roleForm.requirements_source} onChange={(e) => setRoleForm({ ...roleForm, requirements_source: e.target.value as 'incumbent' | 'market' })}>
                <option value="incumbent">Incumbent's Skill DNA (instant)</option>
                <option value="market">Market research with Gemini (about 90s)</option>
              </select>
            </Field>
          </div>
          <label className="sx-check">
            <input type="checkbox" checked={roleForm.is_business_critical} onChange={(e) => setRoleForm({ ...roleForm, is_business_critical: e.target.checked })} />
            Flag as business-critical
          </label>
          {roleForm.is_business_critical && (
            <Field label="Why is this role business-critical?">
              <textarea
                className="sx-input"
                rows={3}
                value={roleForm.criticality_reason}
                onChange={(e) => setRoleForm({ ...roleForm, criticality_reason: e.target.value })}
                placeholder="e.g. Only person who can run month-end ledger reconciliation."
              />
            </Field>
          )}
          <div className="sx-row-end">
            <button type="button" className="sx-btn sx-btn--ghost" onClick={() => setPrompt(null)}>
              Cancel
            </button>
            <button type="button" className="sx-btn" disabled={busy || !roleFormOk} onClick={submitRole}>
              {busy ? <Loader2 size={15} className="sx-spin" /> : <Check size={15} />}
              {busy && roleForm.requirements_source === 'market' ? 'Researching…' : 'Add to register'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Flag */}
      <Modal isOpen={prompt === 'flag'} onClose={close} title="Business-critical flag">
        <div className="sx-form">
          <label className="sx-check">
            <input type="checkbox" checked={flagForm.critical} onChange={(e) => setFlagForm({ ...flagForm, critical: e.target.checked })} />
            This role is business-critical
          </label>
          {flagForm.critical && (
            <Field label="Reason">
              <textarea className="sx-input" rows={3} value={flagForm.reason} onChange={(e) => setFlagForm({ ...flagForm, reason: e.target.value })} />
            </Field>
          )}
          <div className="sx-form__grid">
            <Field label="Departure risk">
              <select className="sx-select" value={flagForm.risk} onChange={(e) => setFlagForm({ ...flagForm, risk: e.target.value as 'Low' | 'Medium' | 'High' })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </Field>
            <Field label="Expected departure">
              <input type="date" className="sx-input" value={flagForm.departure} onChange={(e) => setFlagForm({ ...flagForm, departure: e.target.value })} />
            </Field>
          </div>
          <Field label="Owning manager">
            <select className="sx-select" value={flagForm.owner} onChange={(e) => setFlagForm({ ...flagForm, owner: e.target.value })}>
              <option value="">Incumbent's line manager</option>
              {employees
                .filter((e) => e.id !== role?.incumbent?.id)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name}
                  </option>
                ))}
            </select>
          </Field>
          <div className="sx-row-end">
            <button type="button" className="sx-btn sx-btn--ghost" onClick={close}>
              Cancel
            </button>
            <button type="button" className="sx-btn" disabled={busy || !flagReasonOk} onClick={submitPrompt}>
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Note-driven prompts */}
      <Modal
        isOpen={prompt === 'hr_request' || prompt === 'approve' || prompt === 'decline' || prompt === 'withdraw'}
        onClose={close}
        title={
          prompt === 'hr_request' ? 'Explicit HR request' : prompt === 'approve' ? 'Approve pairing' : prompt === 'decline' ? 'Decline pairing' : 'Withdraw pairing'
        }
      >
        <div className="sx-form">
          {prompt === 'approve' && role?.record?.nominee && (
            <p>
              Confirm <strong>{role.record.nominee.employee.full_name}</strong> as successor for <strong>{role.role_title}</strong>. This sets
              approved_by_hr to TRUE, moves the pairing to Confirmed, and opens the knowledge transfer plan.
            </p>
          )}
          {prompt === 'hr_request' && <p className="sx-muted">The reason is stored on the succession record as the trigger.</p>}
          <Field label={prompt === 'approve' ? 'Approval note (optional)' : 'Reason'}>
            <textarea className="sx-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="sx-row-end">
            <button type="button" className="sx-btn sx-btn--ghost" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className={`sx-btn ${prompt === 'approve' ? 'sx-btn--good' : prompt === 'decline' || prompt === 'withdraw' ? 'sx-btn--dangerfill' : ''}`}
              disabled={busy || (prompt !== 'approve' && note.trim().length < 5)}
              onClick={submitPrompt}
            >
              {busy && <Loader2 size={15} className="sx-spin" />}
              {prompt === 'hr_request' ? 'Generate slate' : prompt === 'approve' ? (busy ? 'Approving and drafting the plan…' : 'Approve') : prompt === 'decline' ? 'Decline' : 'Withdraw'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Open plan early */}
      <Modal isOpen={prompt === 'plan'} onClose={close} title="Open knowledge transfer plan">
        <div className="sx-form">
          <p className="sx-muted">Opening before confirmation is an HR discretion decision and is recorded as such.</p>
          <Field label="Target handover date">
            <input type="date" className="sx-input" value={handover} onChange={(e) => setHandover(e.target.value)} />
          </Field>
          <label className="sx-check">
            <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} />
            Draft tasks with Gemini from the role's critical knowledge and the successor's gaps
          </label>
          <div className="sx-row-end">
            <button type="button" className="sx-btn sx-btn--ghost" onClick={close}>
              Cancel
            </button>
            <button type="button" className="sx-btn" disabled={busy || !handover} onClick={submitPrompt}>
              {busy ? <Loader2 size={15} className="sx-spin" /> : <ClipboardList size={15} />} {busy ? 'Drafting…' : 'Open plan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add task */}
      <Modal isOpen={prompt === 'task'} onClose={() => setPrompt(null)} title="Add a knowledge transfer task">
        <div className="sx-form">
          <div className="sx-form__grid">
            <Field label="Type">
              <select className="sx-select" value={taskForm.task_type} onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value as SxTaskType })}>
                {TASK_TYPES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" className="sx-input" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            </Field>
          </div>
          <Field label="Title">
            <input className="sx-input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          </Field>
          <Field label="What is the output?">
            <textarea className="sx-input" rows={2} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </Field>
          <div className="sx-form__grid">
            <Field label="Knowledge area">
              <input className="sx-input" value={taskForm.knowledge_area} onChange={(e) => setTaskForm({ ...taskForm, knowledge_area: e.target.value })} />
            </Field>
            <Field label="Owner">
              <select className="sx-select" value={taskForm.owner_employee_id} onChange={(e) => setTaskForm({ ...taskForm, owner_employee_id: e.target.value })}>
                {taskPlan?.successor && <option value={taskPlan.successor.id}>{taskPlan.successor.full_name} (successor)</option>}
                {taskPlan?.incumbent && <option value={taskPlan.incumbent.id}>{taskPlan.incumbent.full_name} (incumbent)</option>}
                {!taskPlan?.successor && <option value="">Incumbent</option>}
              </select>
            </Field>
          </div>
          <div className="sx-row-end">
            <button type="button" className="sx-btn sx-btn--ghost" onClick={() => setPrompt(null)}>
              Cancel
            </button>
            <button type="button" className="sx-btn" disabled={busy || taskForm.title.trim().length < 3 || !taskForm.due_date} onClick={submitTask}>
              Add task
            </button>
          </div>
        </div>
      </Modal>

      {notice && (
        <div className="sx-toast">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}
    </div>
  );
};
