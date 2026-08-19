import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Flame, Crown, Star, Zap, Gift, Target, Award, TrendingUp, TrendingDown, Minus, Calendar, Loader2, CheckCircle2, Plus, X, ChevronRight, FileText, Link, Code, Image, Upload, AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { gamificationAPI } from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';

// ─── Step type icons ─────────────────────────────────────────
const STEP_TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <FileText size={14} />,
  link: <Link size={14} />,
  code: <Code size={14} />,
  image: <Image size={14} />,
  file: <Upload size={14} />,
};

const STEP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  not_started:    { label: 'Not Started',    color: 'var(--color-tertiary)', bg: 'var(--bg-main)' },
  submitted:      { label: 'Submitted',      color: 'var(--color-warning)',  bg: '#fef3c7' },
  evaluating:     { label: 'Evaluating…',   color: 'var(--color-warning)',  bg: '#fef3c7' },
  passed:         { label: 'Passed ✓',       color: 'var(--color-success)',  bg: '#dcfce7' },
  failed:         { label: 'Failed',         color: 'var(--color-danger)',   bg: '#fee2e2' },
  manual_review:  { label: 'Under Review',   color: '#9333ea',               bg: '#f3e8ff' },
};

// ─── Create Challenge Modal (with step builder) ───────────────
const CreateChallengeModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreated: () => void }> = ({ isOpen, onClose, onCreated }) => {
  const defaultStep = () => ({ title: '', instructions: '', submission_type: 'text', evaluation_rubric: '', xp_value: 200, reference_url: '' });
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'weekly', difficulty: 'Medium',
    category: 'Learning', end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    bonus_badge: '🎯', color: '#7c3aed', is_active: true
  });
  const [steps, setSteps] = useState([defaultStep()]);
  const [loading, setLoading] = useState(false);

  const totalXP = steps.reduce((sum, s) => sum + (Number(s.xp_value) || 0), 0);

  const addStep = () => setSteps(prev => [...prev, defaultStep()]);
  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: string, value: any) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.length === 0) { alert('Add at least one step.'); return; }
    for (const s of steps) {
      if (!s.title || !s.instructions || !s.evaluation_rubric) {
        alert('Every step needs a title, instructions, and evaluation rubric.'); return;
      }
    }
    setLoading(true);
    try {
      await gamificationAPI.createChallenge({
        ...formData,
        end_date: new Date(formData.end_date).toISOString(),
        steps: steps.map((s, i) => ({ ...s, step_order: i + 1, xp_value: Number(s.xp_value) || 200 })),
      });
      onCreated();
      onClose();
      setSteps([defaultStep()]);
    } catch (err) {
      console.error('Failed to create challenge', err);
      alert('Failed to create challenge. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Challenge">
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
        {/* — Challenge metadata — */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-secondary mb-1">Challenge Title *</label>
            <input required type="text" className="w-full input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Master Communicator" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-secondary mb-1">Description / Objective *</label>
            <textarea required rows={2} className="w-full input-field resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Category</label>
            <select className="w-full input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {['Learning','Knowledge','Skill','Innovation','Engagement','Wellness','Collaboration'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Difficulty</label>
            <select className="w-full input-field" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
              {['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Type</label>
            <select className="w-full input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              {['daily','weekly','monthly'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Deadline</label>
            <input required type="date" className="w-full input-field" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Bonus Badge (emoji)</label>
            <input type="text" className="w-full input-field" value={formData.bonus_badge} onChange={e => setFormData({...formData, bonus_badge: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Color</label>
            <input type="color" className="w-full h-9 rounded-lg border border-[var(--border-subtle)] cursor-pointer" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
          </div>
        </div>

        {/* — XP total bar — */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-xs font-bold text-secondary">Total XP (auto-summed from steps)</span>
          <span className="text-lg font-extrabold text-primary">{totalXP.toLocaleString()} XP</span>
        </div>

        {/* — Steps — */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-primary">Steps ({steps.length})</h4>
            <button type="button" onClick={addStep} className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={12} /> Add Step
            </button>
          </div>
          {steps.map((step, i) => (
            <div key={i} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-primary">Step {i + 1}</span>
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(i)} className="text-danger hover:bg-danger/10 p-1 rounded-md transition-colors"><Trash2 size={12}/></button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Step Title *</label>
                <input required type="text" className="w-full input-field" value={step.title} onChange={e => updateStep(i,'title',e.target.value)} placeholder="e.g. Write a reflection" />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Instructions — what the employee must do *</label>
                <textarea required rows={3} className="w-full input-field resize-none text-xs" value={step.instructions} onChange={e => updateStep(i,'instructions',e.target.value)} placeholder="Describe the exact task in detail..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Submission Type</label>
                  <select className="w-full input-field" value={step.submission_type} onChange={e => updateStep(i,'submission_type',e.target.value)}>
                    {['text','link','code','image','file'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">XP for this step</label>
                  <input type="number" min={0} className="w-full input-field" value={step.xp_value} onChange={e => updateStep(i,'xp_value',parseInt(e.target.value)||0)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Evaluation Rubric — what the AI checks for *</label>
                <textarea required rows={3} className="w-full input-field resize-none text-xs" value={step.evaluation_rubric} onChange={e => updateStep(i,'evaluation_rubric',e.target.value)} placeholder="e.g. The submission must include: 1) at least 3 specific examples, 2) a clear conclusion, 3) reference to the provided framework..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Reference Material URL (optional)</label>
                <input type="url" className="w-full input-field" value={step.reference_url} onChange={e => updateStep(i,'reference_url',e.target.value)} placeholder="https://..." />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)] sticky bottom-0 bg-white">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating…' : `Create Challenge (${totalXP} XP)`}</Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Challenge Detail Drawer ──────────────────────────────────
const ChallengeDetailDrawer: React.FC<{
  challengeId: string;
  employeeId: string;
  onClose: () => void;
  onProgressUpdate: () => void;
}> = ({ challengeId, employeeId, onClose, onProgressUpdate }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<any>(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const loadDetail = () => {
    setLoading(true);
    gamificationAPI.getChallengeDetail(employeeId, challengeId)
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadDetail(); }, [challengeId, employeeId]);

  const handleSubmit = async () => {
    if (!submitContent.trim() || !activeStep) return;
    setSubmitting(true);
    setEvalResult(null);
    try {
      const result = await gamificationAPI.submitStep(employeeId, challengeId, activeStep.id, submitContent);
      setEvalResult(result);
      setSubmitContent('');
      // Reload to reflect new statuses
      loadDetail();
      onProgressUpdate();
    } catch (err: any) {
      const msg = err?.message || 'Submission failed.';
      setEvalResult({ error: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const openStep = (step: any) => { setActiveStep(step); setEvalResult(null); setSubmitContent(''); };

  const DIFF_COLORS: Record<string, string> = { Easy: 'var(--color-success)', Medium: 'var(--color-warning)', Hard: 'var(--color-danger)' };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ backdropFilter: 'blur(2px)', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="ml-auto h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]">
          {activeStep ? (
            <button onClick={() => { setActiveStep(null); setEvalResult(null); }} className="flex items-center gap-2 text-sm font-bold text-secondary hover:text-primary transition-colors">
              <ArrowLeft size={16} /> Back to steps
            </button>
          ) : (
            <div />
          )}
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors text-tertiary hover:text-primary">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : !detail ? (
          <div className="flex-1 flex items-center justify-center text-secondary text-sm">Could not load challenge details.</div>
        ) : activeStep ? (
          /* ── Step submission view ── */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-tertiary uppercase tracking-wider">Step {activeStep.step_order}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: STEP_STATUS_CONFIG[activeStep.status]?.bg, color: STEP_STATUS_CONFIG[activeStep.status]?.color }}>
                  {STEP_STATUS_CONFIG[activeStep.status]?.label || activeStep.status}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-primary">{activeStep.title}</h2>
              <div className="flex items-center gap-1 mt-1 text-xs font-bold text-success">
                <Zap size={12} /> {activeStep.xp_value} XP
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-2">📋 Task Instructions</h4>
              <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{activeStep.instructions}</p>
            </div>

            {activeStep.reference_url && (
              <a href={activeStep.reference_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                <Link size={12} /> Reference material →
              </a>
            )}

            {/* Previous result */}
            {activeStep.status !== 'not_started' && activeStep.latest_feedback && !evalResult && (
              <div className={`p-4 rounded-xl border ${activeStep.status === 'passed' ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
                <h4 className="text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: activeStep.status === 'passed' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {activeStep.status === 'passed' ? '✅ Previous Result — Passed' : '❌ Previous Result — Failed'}
                </h4>
                <p className="text-sm leading-relaxed text-secondary">{activeStep.latest_feedback}</p>
                {activeStep.latest_score != null && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs font-bold text-tertiary">Score: <span className="text-primary">{activeStep.latest_score}/100</span></span>
                    <span className="text-xs font-bold text-success">+{activeStep.xp_awarded} XP awarded</span>
                  </div>
                )}
              </div>
            )}

            {/* New evaluation result */}
            {evalResult && !evalResult.error && (
              <div className={`p-4 rounded-xl border animate-fade-in ${evalResult.passed ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
                <h4 className="text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: evalResult.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {evalResult.passed ? '🎯 Passed!' : '❌ Not quite — try again'}
                </h4>
                <p className="text-sm leading-relaxed text-secondary mb-3">{evalResult.feedback}</p>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-tertiary">AI Score: <span className="text-primary text-base">{evalResult.ai_score}</span>/100</span>
                  {evalResult.xp_awarded > 0 && <span className="text-success">+{evalResult.xp_awarded} XP awarded 🎉</span>}
                </div>
                {/* Score bar */}
                <div className="mt-3 h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${evalResult.ai_score}%`, background: evalResult.passed ? 'var(--color-success)' : 'var(--color-danger)' }} />
                </div>
              </div>
            )}
            {evalResult?.error && (
              <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 flex items-center gap-2 text-sm text-danger">
                <AlertCircle size={16} /> {evalResult.error}
              </div>
            )}

            {/* Submission form — only if not already passed */}
            {activeStep.status !== 'passed' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-secondary uppercase tracking-wider">Your Submission</label>
                  <span className="flex items-center gap-1 text-xs text-tertiary font-medium">{STEP_TYPE_ICONS[activeStep.submission_type]} {activeStep.submission_type}</span>
                </div>
                {activeStep.submission_type === 'code' ? (
                  <textarea
                    rows={10}
                    className="w-full input-field resize-y font-mono text-xs"
                    value={submitContent}
                    onChange={e => setSubmitContent(e.target.value)}
                    placeholder={`// Paste your ${activeStep.submission_type} here...`}
                  />
                ) : activeStep.submission_type === 'link' ? (
                  <input type="url" className="w-full input-field" value={submitContent} onChange={e => setSubmitContent(e.target.value)} placeholder="https://..." />
                ) : activeStep.submission_type === 'file' || activeStep.submission_type === 'image' ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-tertiary">Upload your file and paste the public URL here. (Use any file host, e.g. Google Drive share link)</p>
                    <input type="url" className="w-full input-field" value={submitContent} onChange={e => setSubmitContent(e.target.value)} placeholder="https://drive.google.com/..." />
                  </div>
                ) : (
                  <textarea
                    rows={6}
                    className="w-full input-field resize-y text-sm"
                    value={submitContent}
                    onChange={e => setSubmitContent(e.target.value)}
                    placeholder="Write your response here…"
                  />
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !submitContent.trim()}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Evaluating with AI…</> : 'Submit for AI Evaluation'}
                </button>
                <p className="text-[10px] text-tertiary text-center">Your submission will be graded immediately by AI against the step's rubric.</p>
              </div>
            )}
            {activeStep.status === 'passed' && (
              <div className="p-4 rounded-xl bg-success/5 border border-success/20 text-center">
                <CheckCircle2 className="mx-auto text-success mb-2" size={28} />
                <p className="text-sm font-bold text-success">Step complete! You earned {activeStep.xp_awarded} XP.</p>
                <p className="text-xs text-tertiary mt-1">Go back to submit the next step.</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Steps list view ── */
          <div className="flex-1 overflow-y-auto">
            {/* Challenge header */}
            <div className="p-6 border-b border-[var(--border-subtle)]" style={{ borderLeft: `4px solid ${detail.color || '#7c3aed'}` }}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{detail.bonus_badge || '🏆'}</span>
                <div>
                  <h2 className="text-xl font-extrabold text-primary">{detail.title}</h2>
                  <p className="text-sm text-secondary mt-1">{detail.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] font-bold px-2 py-1 rounded-md border" style={{ color: DIFF_COLORS[detail.difficulty], borderColor: DIFF_COLORS[detail.difficulty], background: `${DIFF_COLORS[detail.difficulty]}15` }}>{detail.difficulty}</span>
                <span className="text-[10px] font-bold text-secondary bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-1 rounded-md">{detail.type}</span>
                <span className="text-[10px] font-bold text-secondary bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-1 rounded-md">{detail.category}</span>
                <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-1 rounded-md">Total: {detail.total_xp} XP</span>
                <span className="text-[10px] font-bold text-tertiary bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-1 rounded-md"><Calendar size={9} className="inline mr-1"/>{detail.days_left}d left</span>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold text-tertiary mb-1">
                  <span>Overall Progress</span><span>{detail.progress}%</span>
                </div>
                <div className="h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${detail.progress}%`, background: detail.color || 'var(--color-primary)' }} />
                </div>
              </div>
            </div>

            {/* Steps list */}
            <div className="p-4 flex flex-col gap-3">
              <h3 className="text-xs font-extrabold text-secondary uppercase tracking-wider px-2">Steps ({detail.steps?.length || 0})</h3>
              {(!detail.steps || detail.steps.length === 0) && (
                <div className="p-6 text-center text-sm text-tertiary">
                  This challenge has no steps defined. It uses the legacy manual progress system.
                </div>
              )}
              {(detail.steps || []).map((step: any) => {
                const cfg = STEP_STATUS_CONFIG[step.status] || STEP_STATUS_CONFIG.not_started;
                const canSubmit = step.status !== 'passed';
                return (
                  <button
                    key={step.id}
                    onClick={() => openStep(step)}
                    className="w-full text-left p-4 rounded-xl border border-[var(--border-subtle)] bg-white hover:border-primary hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-extrabold shrink-0"
                          style={{ borderColor: cfg.color, color: cfg.color, background: cfg.bg }}>
                          {step.step_order}
                        </div>
                        <div>
                          <h4 className="font-bold text-primary text-sm group-hover:text-primary transition-colors">{step.title}</h4>
                          <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">{step.instructions}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 6, border: `1px solid ${cfg.color}30` }}>
                              {cfg.label}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-secondary">{STEP_TYPE_ICONS[step.submission_type]} {step.submission_type}</span>
                            <span className="text-[10px] font-bold text-success">+{step.xp_value} XP</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-tertiary group-hover:text-primary shrink-0 mt-1 transition-colors" />
                    </div>
                    {step.latest_score != null && (
                      <div className="mt-2 ml-10 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                          <div className="h-full rounded-full" style={{ width: `${step.latest_score}%`, background: step.status === 'passed' ? 'var(--color-success)' : 'var(--color-danger)' }} />
                        </div>
                        <span className="text-[10px] font-bold text-tertiary">{step.latest_score}/100</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

const Challenges: React.FC<{ onOpenDetail: (id: string) => void }> = ({ onOpenDetail }) => {
  const { currentEmployee } = useEmployee();
  const [challenges, setChallenges] = useState<any[]>([]);

  const loadChallenges = () => {
    if (!currentEmployee) return;
    gamificationAPI.getChallenges(currentEmployee.id).then(data => setChallenges(Array.isArray(data) ? data : data?.challenges || []));
  };

  useEffect(() => {
    loadChallenges();
  }, [currentEmployee]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {challenges.map((ch) => (
        <div
          key={ch.id}
          className="p-4 bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary group cursor-pointer"
          onClick={() => onOpenDetail(ch.id)}
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

            {ch.progress === 100 && !ch.completed && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-center gap-2 text-xs font-bold text-warning bg-warning/5 py-2 rounded-md border border-warning/20">
                <Loader2 size={14} className="animate-spin" /> Pending Verification
              </div>
            )}
            {ch.progress === 100 && ch.completed && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-center gap-2 text-xs font-bold text-success bg-success/5 py-2 rounded-md border border-success/20">
                <CheckCircle2 size={14} /> Completed
              </div>
            )}
            {ch.progress < 100 && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-center gap-1 text-[10px] font-bold text-primary">
                <ChevronRight size={12} /> Click to view steps &amp; submit work
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Admin Verifications ──────────────────────────────────────
const AdminVerifications: React.FC<{ refreshKey: number, onVerified: () => void }> = ({ refreshKey, onVerified }) => {
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    gamificationAPI.getPendingVerifications().then(setPending);
  }, [refreshKey]);

  if (pending.length === 0) return null;

  const handleVerify = async (empId: string, chalId: string, approve: boolean) => {
    try {
      await gamificationAPI.verifyChallenge(empId, chalId, approve);
      gamificationAPI.getPendingVerifications().then(setPending);
      onVerified();
    } catch (err) {
      console.error(err);
      alert('Failed to verify challenge');
    }
  };

  return (
    <Card className="glass-panel p-6 flex flex-col gap-4 border border-warning/30 bg-warning/5 transition-all duration-300">
      <h3 className="text-lg font-extrabold text-warning flex items-center gap-3 border-b border-warning/20 pb-3">
        <div className="p-2 bg-white rounded-lg border border-warning/30 shadow-sm text-warning"><CheckCircle2 size={20} /></div>
        Admin: Pending Verifications
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {pending.map((p: any) => (
          <div key={p.id} className="p-4 bg-white rounded-xl border border-warning/30 flex justify-between items-center shadow-sm">
            <div>
              <h4 className="font-bold text-primary text-sm">{p.challenges?.title}</h4>
              <p className="text-xs text-secondary font-medium">Completed by <span className="text-tertiary font-bold">{p.employees?.full_name}</span></p>
              <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-md mt-1 inline-block">+{p.challenges?.xp_reward} XP pending</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleVerify(p.employee_id, p.challenge_id, false)}
                className="py-1.5 px-3 text-xs font-bold text-danger bg-danger/10 hover:bg-danger/20 rounded-md transition-colors border border-danger/20"
              >
                Reject
              </button>
              <button 
                onClick={() => handleVerify(p.employee_id, p.challenge_id, true)}
                className="py-1.5 px-3 text-xs font-bold text-white bg-success hover:bg-success/90 rounded-md transition-colors shadow-sm"
              >
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
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
  const { currentEmployee } = useEmployee();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [refreshChallengesKey, setRefreshChallengesKey] = useState(0);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

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
        <div className="flex flex-col gap-6">
          <AdminVerifications 
            refreshKey={refreshChallengesKey} 
            onVerified={() => setRefreshChallengesKey(k => k + 1)} 
          />

          <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-4">
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-3">
                <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Target size={20} /></div>
                All Active Challenges
              </h3>
              <Button size="sm" onClick={() => setShowCreateChallenge(true)} className="flex items-center gap-2">
                <Plus size={16} /> New Challenge
              </Button>
            </div>
            <Challenges key={refreshChallengesKey} onOpenDetail={setSelectedChallengeId} />
            
            <CreateChallengeModal 
              isOpen={showCreateChallenge} 
              onClose={() => setShowCreateChallenge(false)} 
              onCreated={() => setRefreshChallengesKey(k => k + 1)} 
            />
          </Card>
        </div>
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

      {selectedChallengeId && currentEmployee && (
        <ChallengeDetailDrawer
          challengeId={selectedChallengeId}
          employeeId={currentEmployee.id}
          onClose={() => setSelectedChallengeId(null)}
          onProgressUpdate={() => setRefreshChallengesKey(k => k + 1)}
        />
      )}
    </div>
  );
};
