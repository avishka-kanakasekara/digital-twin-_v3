import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HandHeart, Loader2, Send, Star, Trash2, Users } from 'lucide-react';
import { employeeAPI, type Employee, type PeerRecommendation, type PeerRecommendationSummary } from '../../../../lib/api';
import { useEmployee } from '../../../../contexts/EmployeeContext';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'communication', label: 'Communication' },
  { value: 'delivery', label: 'Delivery' },
] as const;

function formatWhen(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function initialsOf(name?: string | null, fallback?: string | null) {
  if (fallback) return fallback;
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

const Stars: React.FC<{ value: number }> = ({ value }) => (
  <span className="pd-peer-stars" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={12}
        fill={n <= value ? 'currentColor' : 'none'}
        strokeWidth={2}
        className={n <= value ? 'pd-peer-star--on' : 'pd-peer-star--off'}
      />
    ))}
  </span>
);

const RecCard: React.FC<{
  rec: PeerRecommendation;
  perspective: 'received' | 'sent';
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}> = ({ rec, perspective, canDelete, onDelete, deleting }) => {
  const personName =
    perspective === 'received' ? rec.from_employee_name : rec.to_employee_name;
  const personRole =
    perspective === 'received' ? rec.from_employee_role : rec.to_employee_role;
  const personInitials =
    perspective === 'received' ? rec.from_employee_initials : rec.to_employee_initials;
  const personDept =
    perspective === 'received' ? rec.from_employee_department : rec.to_employee_department;

  return (
    <article className="pd-peer-card">
      <div className="pd-peer-card__top">
        <div className="pd-peer-avatar">{initialsOf(personName, personInitials)}</div>
        <div className="min-w-0 flex-1">
          <div className="pd-peer-card__meta">
            <p className="pd-peer-card__name truncate">
              {perspective === 'received' ? 'From ' : 'To '}
              <strong>{personName || 'Colleague'}</strong>
            </p>
            <span className="pd-peer-card__when">{formatWhen(rec.created_at)}</span>
          </div>
          <p className="pd-peer-card__role truncate">
            {[personRole, personDept].filter(Boolean).join(' · ') || 'Team member'}
          </p>
        </div>
        {canDelete && onDelete ? (
          <button
            type="button"
            className="pd-peer-delete"
            title="Withdraw recommendation"
            disabled={deleting}
            onClick={() => onDelete(rec.id)}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        ) : null}
      </div>

      <p className="pd-peer-card__message">{rec.message}</p>

      <div className="pd-peer-card__footer">
        <span className="pd-peer-chip">{(rec.category || 'general').replace(/^\w/, (c) => c.toUpperCase())}</span>
        {rec.skill ? <span className="pd-peer-chip pd-peer-chip--soft">{rec.skill}</span> : null}
        {typeof rec.rating === 'number' ? <Stars value={rec.rating} /> : null}
      </div>
    </article>
  );
};

export const PeerRecommendations: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentEmployee, employees } = useEmployee();
  const [received, setReceived] = useState<PeerRecommendation[]>([]);
  const [sent, setSent] = useState<PeerRecommendation[]>([]);
  const [summary, setSummary] = useState<PeerRecommendationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'received' | 'give' | 'sent'>(compact ? 'received' : 'received');

  const [toId, setToId] = useState('');
  const [category, setCategory] = useState('collaboration');
  const [skill, setSkill] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');

  const colleagues = useMemo(
    () => (employees || []).filter((e: Employee) => e.id !== currentEmployee?.id),
    [employees, currentEmployee?.id],
  );

  const refresh = useCallback(async () => {
    if (!currentEmployee?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [recv, given, sum] = await Promise.all([
        employeeAPI.getPeerRecommendations(currentEmployee.id),
        employeeAPI.getPeerRecommendationsSent(currentEmployee.id),
        employeeAPI.getPeerRecommendationsSummary(currentEmployee.id),
      ]);
      setReceived(recv || []);
      setSent(given || []);
      setSummary(sum || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load peer recommendations.');
    } finally {
      setLoading(false);
    }
  }, [currentEmployee?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee?.id || !toId || message.trim().length < 10) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const created = await employeeAPI.createPeerRecommendation(currentEmployee.id, {
        to_employee_id: toId,
        message: message.trim(),
        category,
        skill: skill.trim() || undefined,
        rating,
      });
      setMessage('');
      setSkill('');
      setRating(5);
      setNotice(
        created?.xp_awarded
          ? `Recommendation sent. ${created.to_employee_name || 'Colleague'} earned ${created.xp_awarded} XP.`
          : 'Recommendation sent.',
      );
      setPanel('sent');
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Could not send recommendation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentEmployee?.id) return;
    setDeletingId(id);
    setError(null);
    try {
      await employeeAPI.deletePeerRecommendation(currentEmployee.id, id);
      setNotice('Recommendation withdrawn.');
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Could not withdraw recommendation.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!currentEmployee) {
    return <div className="pd-empty">Select an employee to view peer recommendations.</div>;
  }

  if (compact) {
    return (
      <div className="pd-peer">
        <div className="pd-peer-stats">
          <div className="pd-peer-stat">
            <span className="pd-peer-stat__label">Received</span>
            <strong className="pd-peer-stat__value">{summary?.received_count ?? received.length}</strong>
          </div>
          <div className="pd-peer-stat">
            <span className="pd-peer-stat__label">Given</span>
            <strong className="pd-peer-stat__value">{summary?.given_count ?? sent.length}</strong>
          </div>
          <div className="pd-peer-stat">
            <span className="pd-peer-stat__label">Avg rating</span>
            <strong className="pd-peer-stat__value">
              {summary?.average_rating != null ? summary.average_rating.toFixed(1) : '—'}
            </strong>
          </div>
        </div>
        {error ? <p className="pd-peer-error">{error}</p> : null}
        {loading ? (
          <div className="pd-empty">
            <Loader2 size={18} className="animate-spin inline-block mr-2" />
            Loading…
          </div>
        ) : received.length === 0 ? (
          <div className="pd-empty">No recommendations received yet. Open Peers to recommend a colleague.</div>
        ) : (
          <div className="pd-peer-list">
            {received.slice(0, 3).map((rec) => (
              <RecCard key={rec.id} rec={rec} perspective="received" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pd-peer">
      <div className="pd-peer-stats">
        <div className="pd-peer-stat">
          <span className="pd-peer-stat__label">Received</span>
          <strong className="pd-peer-stat__value">{summary?.received_count ?? received.length}</strong>
        </div>
        <div className="pd-peer-stat">
          <span className="pd-peer-stat__label">Given</span>
          <strong className="pd-peer-stat__value">{summary?.given_count ?? sent.length}</strong>
        </div>
        <div className="pd-peer-stat">
          <span className="pd-peer-stat__label">Avg rating</span>
          <strong className="pd-peer-stat__value">
            {summary?.average_rating != null ? summary.average_rating.toFixed(1) : '—'}
          </strong>
        </div>
      </div>

      <div className="pd-peer-panels" role="tablist">
        <button
          type="button"
          className={`pd-peer-panel-btn ${panel === 'received' ? 'is-active' : ''}`}
          onClick={() => setPanel('received')}
        >
          <Users size={14} /> Received
        </button>
        <button
          type="button"
          className={`pd-peer-panel-btn ${panel === 'give' ? 'is-active' : ''}`}
          onClick={() => setPanel('give')}
        >
          <HandHeart size={14} /> Give
        </button>
        <button
          type="button"
          className={`pd-peer-panel-btn ${panel === 'sent' ? 'is-active' : ''}`}
          onClick={() => setPanel('sent')}
        >
          <Send size={14} /> Sent
        </button>
      </div>

      {notice ? <p className="pd-peer-notice">{notice}</p> : null}
      {error ? <p className="pd-peer-error">{error}</p> : null}

      {loading ? (
        <div className="pd-empty">
          <Loader2 size={18} className="animate-spin inline-block mr-2" />
          Loading recommendations…
        </div>
      ) : null}

      {!loading && panel === 'received' && (
        received.length === 0 ? (
          <div className="pd-empty">
            No peer recommendations yet. Ask a colleague to recommend you from their dashboard.
          </div>
        ) : (
          <div className="pd-peer-list">
            {received.map((rec) => (
              <RecCard key={rec.id} rec={rec} perspective="received" />
            ))}
          </div>
        )
      )}

      {!loading && panel === 'sent' && (
        sent.length === 0 ? (
          <div className="pd-empty">You have not recommended anyone yet. Use Give to write one.</div>
        ) : (
          <div className="pd-peer-list">
            {sent.map((rec) => (
              <RecCard
                key={rec.id}
                rec={rec}
                perspective="sent"
                canDelete
                onDelete={handleDelete}
                deleting={deletingId === rec.id}
              />
            ))}
          </div>
        )
      )}

      {!loading && panel === 'give' && (
        <form className="pd-peer-form" onSubmit={handleSubmit}>
          <label className="pd-peer-field">
            <span>Colleague</span>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              required
            >
              <option value="">Select a teammate…</option>
              {colleagues.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}{e.role ? ` — ${e.role}` : ''}{e.department ? ` (${e.department})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="pd-peer-form-row">
            <label className="pd-peer-field">
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="pd-peer-field">
              <span>Skill (optional)</span>
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g. System design"
                maxLength={60}
              />
            </label>
          </div>

          <label className="pd-peer-field">
            <span>Rating</span>
            <div className="pd-peer-rating-pick">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pd-peer-rate-btn ${rating >= n ? 'is-on' : ''}`}
                  onClick={() => setRating(n)}
                  aria-label={`${n} stars`}
                >
                  <Star size={16} fill={rating >= n ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </label>

          <label className="pd-peer-field">
            <span>Recommendation</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              minLength={10}
              maxLength={1000}
              placeholder="What did they do well? Be specific so it helps their twin and career story."
            />
            <span className="pd-peer-hint">{message.trim().length}/1000 · min 10 characters</span>
          </label>

          <button type="submit" className="pd-peer-submit" disabled={submitting || !toId || message.trim().length < 10}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <HandHeart size={16} />}
            {submitting ? 'Sending…' : 'Send recommendation'}
          </button>
        </form>
      )}
    </div>
  );
};
