import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Flame, Crown, Star, Zap, Gift, Target, Award, TrendingUp, TrendingDown, Minus, Calendar, Loader2, CheckCircle2, Plus, X, ChevronRight, FileText, Link, Code, Image, Upload, AlertCircle, ArrowLeft, Trash2, Sparkles } from 'lucide-react';
import './GamificationHub.css';
import { gamificationAPI } from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';

const SectionHead: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="gh-section__head">
    <div className="gh-section__title-row">
      <div className="gh-section__icon">{icon}</div>
      <div>
        <h2 className="gh-section__title">{title}</h2>
        {subtitle ? <p className="gh-section__sub">{subtitle}</p> : null}
      </div>
    </div>
    {action}
  </div>
);

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

const defaultChallengeForm = () => ({
  title: '', description: '', type: 'weekly', difficulty: 'Medium',
  category: 'Learning', end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  bonus_badge: '🎯', color: '#7c3aed', is_active: true,
});

const defaultStep = () => ({ title: '', instructions: '', submission_type: 'text', evaluation_rubric: '', xp_value: 200, reference_url: '' });

const HubNotice: React.FC<{ type: 'success' | 'error' | 'info'; message: string; onDismiss?: () => void }> = ({ type, message, onDismiss }) => (
  <div className={`hub-notice hub-notice-${type}`}>
    {type === 'success' ? <CheckCircle2 size={16} /> : type === 'error' ? <AlertCircle size={16} /> : <Loader2 size={16} />}
    <span className="flex-1">{message}</span>
    {onDismiss && (
      <button type="button" onClick={onDismiss} className="p-1 hover:opacity-70"><X size={14} /></button>
    )}
  </div>
);

// ─── Create Challenge Modal (with step builder) ───────────────
const CreateChallengeModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreated: () => void; onNotice: (msg: string, type: 'success' | 'error') => void }> = ({ isOpen, onClose, onCreated, onNotice }) => {
  const [formData, setFormData] = useState(defaultChallengeForm());
  const [steps, setSteps] = useState([defaultStep()]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalXP = steps.reduce((sum, s) => sum + (Number(s.xp_value) || 0), 0);

  const resetForm = () => {
    setFormData(defaultChallengeForm());
    setSteps([defaultStep()]);
    setFormError(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
  }, [isOpen]);

  const addStep = () => setSteps(prev => [...prev, defaultStep()]);
  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: string, value: any) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    if (steps.length === 0) {
      setFormError('Add at least one step.');
      return;
    }
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (!s.title.trim() || !s.instructions.trim() || !s.evaluation_rubric.trim()) {
        setFormError(`Step ${i + 1} needs a title, instructions, and evaluation rubric.`);
        return;
      }
    }
    setLoading(true);
    try {
      await gamificationAPI.createChallenge({
        ...formData,
        end_date: new Date(formData.end_date).toISOString(),
        steps: steps.map((s, i) => ({ ...s, step_order: i + 1, xp_value: Number(s.xp_value) || 200 })),
      });
      onNotice(`Challenge created with ${totalXP.toLocaleString()} XP across ${steps.length} step(s).`, 'success');
      onCreated();
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to create challenge', err);
      setFormError(err?.message || 'Failed to create challenge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Challenge">
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
        {formError && <HubNotice type="error" message={formError} onDismiss={() => setFormError(null)} />}
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
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDetail = () => {
    setLoading(true);
    setLoadError(null);
    gamificationAPI.getChallengeDetail(employeeId, challengeId)
      .then(d => { setDetail(d); setLoading(false); })
      .catch((err: any) => {
        setLoadError(err?.message || 'Could not load challenge details.');
        setLoading(false);
      });
  };

  useEffect(() => { loadDetail(); }, [challengeId, employeeId]);

  const handleSubmit = async () => {
    if (!submitContent.trim() || !activeStep) return;
    setSubmitting(true);
    setEvalResult(null);
    try {
      const result = await gamificationAPI.submitStep(
        employeeId, challengeId, activeStep.id, submitContent, storagePath || undefined
      );
      setEvalResult(result);
      setSubmitContent('');
      setStoragePath(null);
      setUploadedFileName(null);
      loadDetail();
      onProgressUpdate();
    } catch (err: any) {
      const msg = err?.message || 'Submission failed.';
      setEvalResult({ error: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!activeStep) return;
    setUploading(true);
    setEvalResult(null);
    try {
      const result = await gamificationAPI.uploadSubmission(employeeId, file);
      setSubmitContent(result.content);
      setStoragePath(result.storage_path);
      setUploadedFileName(result.filename);
    } catch (err: any) {
      setEvalResult({ error: err?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const openStep = (step: any) => {
    setActiveStep(step);
    setEvalResult(null);
    setSubmitContent('');
    setStoragePath(null);
    setUploadedFileName(null);
  };

  const DIFF_COLORS: Record<string, string> = { Easy: 'var(--color-success)', Medium: 'var(--color-warning)', Hard: 'var(--color-danger)' };

  return (
    <div className="gh-drawer-overlay" onClick={onClose}>
      <div className="gh-drawer" onClick={e => e.stopPropagation()}>
        <div className="gh-drawer__head">
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
          <div className="gh-loading flex-1"><Loader2 className="animate-spin" size={32} /></div>
        ) : !detail ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="text-danger" size={28} />
            <p className="text-sm text-secondary">{loadError || 'Could not load challenge details.'}</p>
            <button onClick={loadDetail} className="text-xs font-bold text-primary px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5">Retry</button>
          </div>
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

            <div className="gh-instruction-box">
              <h4 className="gh-instruction-box__label">Task instructions</h4>
              <p className="gh-instruction-box__text">{activeStep.instructions}</p>
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
              <div className={`p-4 rounded-xl border animate-fade-in ${evalResult.passed || evalResult.status === 'manual_review' ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
                <h4 className="text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: evalResult.passed ? 'var(--color-success)' : evalResult.status === 'manual_review' ? '#9333ea' : 'var(--color-danger)' }}>
                  {evalResult.status === 'manual_review' ? '⏳ Sent for manual review' : evalResult.passed ? '🎯 Passed!' : '❌ Not quite — try again'}
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
            {activeStep.status !== 'passed' && activeStep.status !== 'manual_review' && (
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
                    placeholder="// Paste your code here..."
                    disabled={submitting || uploading}
                  />
                ) : activeStep.submission_type === 'link' ? (
                  <input type="url" className="w-full input-field" value={submitContent} onChange={e => setSubmitContent(e.target.value)} placeholder="https://..." disabled={submitting || uploading} />
                ) : activeStep.submission_type === 'file' || activeStep.submission_type === 'image' ? (
                  <div className="flex flex-col gap-3">
                    <input ref={fileInputRef} type="file" className="hidden" accept={activeStep.submission_type === 'image' ? 'image/*' : undefined} onChange={onFileInputChange} />
                    <div
                      className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2 text-primary"><Loader2 className="animate-spin" size={24} /><span className="text-xs font-bold">Uploading…</span></div>
                      ) : (
                        <>
                          <Upload size={24} className="mx-auto mb-2 text-tertiary" />
                          <p className="text-sm font-bold text-primary">Drop file here or click to upload</p>
                          <p className="text-[11px] text-tertiary mt-1">Images, PDF, code, or text files up to 10MB</p>
                        </>
                      )}
                    </div>
                    {uploadedFileName && (
                      <div className="flex items-center gap-2 text-xs font-bold text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
                        <CheckCircle2 size={14} /> {uploadedFileName} ready to submit
                        <button type="button" className="ml-auto text-tertiary hover:text-danger" onClick={() => { setUploadedFileName(null); setStoragePath(null); setSubmitContent(''); }}>
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {(activeStep.submission_type === 'file' || activeStep.submission_type === 'image') && (
                      <textarea
                        rows={4}
                        className="w-full input-field resize-y text-xs"
                        value={submitContent}
                        onChange={e => setSubmitContent(e.target.value)}
                        placeholder="Add notes or paste supporting text (required after upload)…"
                        disabled={submitting || uploading}
                      />
                    )}
                  </div>
                ) : (
                  <textarea
                    rows={6}
                    className="w-full input-field resize-y text-sm"
                    value={submitContent}
                    onChange={e => setSubmitContent(e.target.value)}
                    placeholder="Write your response here…"
                    disabled={submitting || uploading}
                  />
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || uploading || !submitContent.trim()}
                  className="gh-submit-btn"
                >
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Evaluating with AI…</> : 'Submit for AI Evaluation'}
                </button>
                <p className="text-[10px] text-tertiary text-center">Evaluation may take up to a minute. Do not close this panel while submitting.</p>
              </div>
            )}
            {activeStep.status === 'manual_review' && (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
                <Loader2 className="mx-auto text-purple-600 mb-2 animate-spin" size={28} />
                <p className="text-sm font-bold text-purple-800">Under admin review</p>
                <p className="text-xs text-purple-600 mt-1">An admin will grade your submission shortly. You'll see results here once reviewed.</p>
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
          <div className="gh-drawer__body">
            <div className="gh-drawer__challenge-head" style={{ ['--gh-drawer-accent' as string]: detail.color || '#6366f1' }}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{detail.bonus_badge || '🏆'}</span>
                <div>
                  <h2 className="gh-drawer__challenge-title">{detail.title}</h2>
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

            <div className="gh-step-list">
              <h3 className="text-xs font-extrabold text-secondary uppercase tracking-wider px-1">Steps ({detail.steps?.length || 0})</h3>
              {(!detail.steps || detail.steps.length === 0) && (
                <div className="p-6 text-center text-sm text-tertiary">
                  This challenge has no steps defined. It uses the legacy manual progress system.
                </div>
              )}
              {(detail.steps || []).map((step: any) => {
                const cfg = STEP_STATUS_CONFIG[step.status] || STEP_STATUS_CONFIG.not_started;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => openStep(step)}
                    className="gh-step-card group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="gh-step-num"
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
  const { currentEmployee, loading: employeeLoading } = useEmployee();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeLoading) return;
    if (!currentEmployee) {
      setLoading(false);
      return;
    }
    gamificationAPI.getProfile(currentEmployee.id)
      .then(gamData => setProfile({ ...gamData, name: currentEmployee.full_name }))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [currentEmployee, employeeLoading]);

  if (loading) return <div className="gh-loading"><Loader2 className="animate-spin" size={28} /></div>;
  if (!profile) return <div className="gh-empty">Could not load your gamification profile. Try refreshing the page.</div>;

  const pct = profile.next_level_xp ? Math.min(100, (profile.xp / profile.next_level_xp) * 100) : 0;

  const quickStats = [
    { label: 'Company Rank', value: `#${profile.company_rank}`, icon: <Crown size={14} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { label: 'Dept. Rank', value: `#${profile.department_rank}`, icon: <Trophy size={14} />, color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
    { label: 'Total XP', value: profile.total_xp_earned.toLocaleString(), icon: <Zap size={14} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)' },
    { label: 'Streak', value: `${profile.streak_days}d`, icon: <Flame size={14} />, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  return (
    <div className="gh-hero">
      <div className="gh-hero__glow gh-hero__glow--tr" />
      <div className="gh-hero__glow gh-hero__glow--bl" />
      <div className="gh-hero__inner">
        <div className="gh-level-badge">
          <div className="gh-level-badge__ring" />
          <div className="gh-level-badge__core">
            <span className="gh-level-badge__label">Level</span>
            <span className="gh-level-badge__num">{profile.level}</span>
          </div>
          <div className="gh-level-badge__live" />
        </div>

        <div className="gh-hero__main">
          <span className="gh-hero__kicker"><Sparkles size={12} /> {profile.title}</span>
          <div className="gh-hero__row">
            <h2 className="gh-hero__name">{profile.name}</h2>
            <div className="gh-hero__xp">
              {profile.xp.toLocaleString()} <span className="gh-hero__xp-unit">XP</span>
            </div>
          </div>
          <div className="gh-xp-bar">
            <div className="gh-xp-bar__fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="gh-xp-bar__meta">
            <span>{pct.toFixed(1)}% to next level</span>
            <span>Next: {profile.next_level_xp.toLocaleString()} XP</span>
          </div>
        </div>

        <div className="gh-stat-grid">
          {quickStats.map((s) => (
            <div key={s.label} className="gh-stat">
              <div className="gh-stat__icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <p className="gh-stat__label">{s.label}</p>
                <p className="gh-stat__value">{s.value}</p>
              </div>
            </div>
          ))}
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
    gamificationAPI.getLeaderboard({ limit: 10, current_employee_id: currentEmployee.id }).then(setLeaderboard).catch(() => setLeaderboard([]));
  }, [currentEmployee]);

  if (!leaderboard.length) return <p className="gh-empty">No leaderboard data yet. Earn XP to appear here.</p>;

  const rowClass = (player: any) => {
    if (player.is_me) return 'gh-lb-row gh-lb-row--me';
    if (player.rank === 1) return 'gh-lb-row gh-lb-row--top1';
    if (player.rank === 2) return 'gh-lb-row gh-lb-row--top2';
    if (player.rank === 3) return 'gh-lb-row gh-lb-row--top3';
    return 'gh-lb-row';
  };

  return (
    <div className="gh-leaderboard">
      {leaderboard.map((player) => (
        <div key={player.rank} className={rowClass(player)}>
          <div className="gh-lb-left">
            <span className="gh-lb-rank">{player.rank <= 3 ? player.badge : player.rank}</span>
            <div className="gh-lb-avatar">{player.initials}</div>
            <div>
              <h4 className="gh-lb-name">
                {player.name}
                {player.is_me && <span className="gh-lb-you">YOU</span>}
              </h4>
              <p className="gh-lb-dept">Lv {player.level} · {player.department}</p>
            </div>
          </div>
          <div className="gh-lb-right">
            <div className="text-right">
              <span className="gh-lb-xp">{player.xp.toLocaleString()}</span>
              <span className="gh-lb-xp-label"> XP</span>
            </div>
            {player.trend === 'up' && <TrendingUp size={14} className="text-success" />}
            {player.trend === 'down' && <TrendingDown size={14} className="text-danger" />}
            {player.trend === 'stable' && <Minus size={14} className="text-tertiary" />}
          </div>
        </div>
      ))}
    </div>
  );
};

const Challenges: React.FC<{ onOpenDetail: (id: string) => void; refreshKey?: number; singleColumn?: boolean }> = ({ onOpenDetail, refreshKey = 0, singleColumn = false }) => {
  const { currentEmployee } = useEmployee();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChallenges = () => {
    if (!currentEmployee) return;
    setLoading(true);
    setError(null);
    gamificationAPI.getChallenges(currentEmployee.id)
      .then(data => setChallenges(Array.isArray(data) ? data : (data as { challenges?: any[] })?.challenges || []))
      .catch((err: any) => {
        setError(err?.message || 'Failed to load challenges');
        setChallenges([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadChallenges();
  }, [currentEmployee, refreshKey]);

  if (loading) return <div className="gh-loading"><Loader2 className="animate-spin" size={28} /></div>;
  if (error) return <HubNotice type="error" message={error} />;
  if (!challenges.length) return <p className="gh-empty">No active challenges. Create one from the Challenges tab.</p>;

  return (
    <div className={`gh-challenge-grid ${singleColumn ? 'gh-challenge-grid--single' : ''}`}>
      {challenges.map((ch) => (
        <div
          key={ch.id}
          role="button"
          tabIndex={0}
          className="gh-challenge-card"
          style={{ ['--gh-challenge-accent' as string]: ch.color || '#6366f1' }}
          onClick={() => onOpenDetail(ch.id)}
          onKeyDown={(e) => e.key === 'Enter' && onOpenDetail(ch.id)}
        >
          <div className="gh-challenge-card__top">
            <div className="gh-challenge-card__emoji">{ch.bonus_badge || '🏆'}</div>
            <div className="flex-1 min-w-0">
              <h4 className="gh-challenge-card__title">{ch.title}</h4>
              <p className="gh-challenge-card__desc">{ch.description}</p>
              <div className="gh-tag-row">
                <span className="gh-tag" style={{ color: DIFF_COLORS[ch.difficulty], borderColor: `${DIFF_COLORS[ch.difficulty]}40`, background: `${DIFF_COLORS[ch.difficulty]}12` }}>
                  {ch.difficulty}
                </span>
                <span className="gh-tag">{ch.type}</span>
                <span className="gh-tag">{ch.category}</span>
              </div>
            </div>
          </div>

          <div className="gh-challenge-card__foot">
            <div className="gh-progress-label">
              <span>Progress</span>
              <span>{ch.progress}%</span>
            </div>
            <div className="gh-progress-track">
              <div className="gh-progress-fill" style={{ width: `${ch.progress}%`, background: ch.color || 'var(--gh-accent)' }} />
            </div>
            <div className="gh-challenge-card__meta">
              <span className="flex items-center gap-1"><Calendar size={12} /> {ch.days_left}d left</span>
              <span className="gh-tag gh-tag--xp">+{ch.xp_reward?.toLocaleString() || 0} XP</span>
            </div>

            {ch.progress === 100 && !ch.completed && (
              <div className="gh-status-banner gh-status-banner--pending">
                <Loader2 size={14} className="animate-spin" /> Pending verification
              </div>
            )}
            {ch.progress === 100 && ch.completed && (
              <div className="gh-status-banner gh-status-banner--done">
                <CheckCircle2 size={14} /> Completed
              </div>
            )}
            {ch.progress < 100 && (
              <div className="gh-challenge-card__cta">
                <ChevronRight size={12} /> View steps & submit work
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Admin Manual Reviews ─────────────────────────────────────
const AdminManualReviews: React.FC<{ refreshKey: number; onReviewed: () => void }> = ({ refreshKey, onReviewed }) => {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    gamificationAPI.getPendingReviews()
      .then(setPending)
      .catch((err: any) => setError(err?.message || 'Could not load pending reviews'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return null;
  if (error) return <HubNotice type="error" message={error} />;
  if (pending.length === 0) return null;

  const handleReview = async (submissionId: string, approve: boolean, score?: number) => {
    setReviewingId(submissionId);
    try {
      await gamificationAPI.reviewSubmission(submissionId, approve, score);
      setPending(prev => prev.filter(p => p.id !== submissionId));
      onReviewed();
    } catch (err: any) {
      setError(err?.message || 'Review failed');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <Card glass={false} className="glass-panel gh-section gh-admin-panel gh-admin-panel--review">
      <h3 className="gh-admin-panel__title">
        <AlertCircle size={20} />
        Manual review queue ({pending.length})
      </h3>
      <div className="flex flex-col gap-3">
        {pending.map((p: any) => (
          <div key={p.id} className="gh-admin-item">
            <div>
              <h4 className="font-bold text-primary text-sm">{p.challenges?.title} — {p.challenge_steps?.title}</h4>
              <p className="text-xs text-secondary">By <span className="font-bold">{p.employees?.full_name}</span> · +{p.challenge_steps?.xp_value} XP</p>
              <p className="text-xs text-tertiary mt-2 line-clamp-3">{p.content}</p>
            </div>
            <div className="gh-admin-actions">
              <button
                disabled={reviewingId === p.id}
                onClick={() => handleReview(p.id, false)}
                className="py-1.5 px-3 text-xs font-bold text-danger bg-danger/10 hover:bg-danger/20 rounded-md border border-danger/20 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                disabled={reviewingId === p.id}
                onClick={() => handleReview(p.id, true, 75)}
                className="py-1.5 px-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-sm disabled:opacity-50 flex items-center gap-1"
              >
                {reviewingId === p.id ? <Loader2 size={12} className="animate-spin" /> : null}
                Approve (75)
              </button>
              <button
                disabled={reviewingId === p.id}
                onClick={() => handleReview(p.id, true, 90)}
                className="py-1.5 px-3 text-xs font-bold text-white bg-success hover:bg-success/90 rounded-md shadow-sm disabled:opacity-50"
              >
                Approve (90)
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─── Admin Verifications ──────────────────────────────────────
const AdminVerifications: React.FC<{ refreshKey: number, onVerified: () => void }> = ({ refreshKey, onVerified }) => {
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    gamificationAPI.getPendingVerifications()
      .then(setPending)
      .catch(() => setPending([]));
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
    <Card glass={false} className="glass-panel gh-section gh-admin-panel gh-admin-panel--verify">
      <h3 className="gh-admin-panel__title">
        <CheckCircle2 size={20} />
        Pending verifications
      </h3>
      <div className="flex flex-col gap-3">
        {pending.map((p: any) => (
          <div key={p.id} className="gh-admin-item flex-row flex-wrap items-center justify-between">
            <div>
              <h4 className="font-bold text-primary text-sm">{p.challenges?.title}</h4>
              <p className="text-xs text-secondary font-medium">Completed by <span className="font-bold">{p.employees?.full_name}</span></p>
              <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-md mt-1 inline-block">+{p.challenges?.xp_reward} XP pending</span>
            </div>
            <div className="gh-admin-actions">
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
    <div className="gh-achievement-grid">
      {achievements.map((ach: any) => {
        const unlocked = ach.unlocked || !!ach.unlocked_at;
        return (
          <div
            key={ach.id}
            className={`gh-achievement ${unlocked ? 'gh-achievement--unlocked' : 'gh-achievement--locked'}`}
          >
            <div className="gh-achievement__icon">{ach.emoji || '🏆'}</div>
            <h4 className="gh-achievement__name">{ach.name}</h4>
            <span className="gh-achievement__rarity">{ach.rarity || 'Common'}</span>
            <div className="gh-achievement__meta">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentEmployee) return;
    setLoading(true);
    Promise.all([
      gamificationAPI.getRewards(),
      gamificationAPI.getProfile(currentEmployee.id),
      gamificationAPI.getRewardClaims(currentEmployee.id).catch(() => []),
    ])
      .then(([rewardsData, profile, claims]) => {
        setRewards(rewardsData || []);
        setPlayerXP(profile.xp);
        setClaimed(new Set(claims || []));
        setError(null);
      })
      .catch((err: any) => setError(err?.message || 'Failed to load reward store'))
      .finally(() => setLoading(false));
  }, [currentEmployee]);

  if (loading) return <div className="gh-loading"><Loader2 className="animate-spin" size={28} /></div>;
  if (error) return <HubNotice type="error" message={error} />;
  if (!rewards.length) return <p className="gh-empty">No rewards available yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      {claimError && <HubNotice type="error" message={claimError} onDismiss={() => setClaimError(null)} />}
      <div className="gh-reward-grid">
      {rewards.map((reward) => {
        const isClaimed = claimed.has(reward.id);
        const canAfford = playerXP >= reward.cost;
        return (
          <div
            key={reward.id}
            className={`gh-reward-card ${!reward.available ? 'opacity-60' : ''}`}
          >
            <div className="gh-reward-card__top">
              <div className="gh-reward-card__emoji">{reward.emoji}</div>
              <span className={`gh-reward-card__cost ${canAfford ? 'gh-reward-card__cost--afford' : ''}`}>
                {reward.cost.toLocaleString()} XP
              </span>
            </div>
            <h4 className="gh-reward-card__name">{reward.name}</h4>
            <p className="gh-reward-card__desc">{reward.description}</p>
            <button
              type="button"
              onClick={() => {
                if (reward.available && canAfford && !isClaimed && currentEmployee) {
                  gamificationAPI.claimReward(currentEmployee.id, reward.id)
                    .then((res) => {
                      setClaimed(prev => new Set([...prev, reward.id]));
                      if (res?.xp_remaining != null) setPlayerXP(res.xp_remaining);
                    })
                    .catch((err) => setClaimError(err.message || 'Redeem failed'));
                }
              }}
              disabled={!reward.available || !canAfford || isClaimed}
              className={`gh-reward-btn ${
                isClaimed ? 'gh-reward-btn--claimed' :
                !reward.available || !canAfford ? 'gh-reward-btn--disabled' :
                'gh-reward-btn--primary'
              }`}
            >
              {isClaimed ? <><CheckCircle2 size={14}/> Claimed</> : !reward.available ? 'Unavailable' : !canAfford ? 'Need More XP' : 'Redeem Reward'}
            </button>
          </div>
        );
      })}
      </div>
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
  const [hubNotice, setHubNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const bumpRefresh = () => setRefreshChallengesKey(k => k + 1);
  const showNotice = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setHubNotice({ message, type });
    window.setTimeout(() => setHubNotice(null), 5000);
  };

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',      label: 'Overview',      icon: <Star size={14} /> },
    { id: 'leaderboard',   label: 'Leaderboard',   icon: <Crown size={14} /> },
    { id: 'challenges',    label: 'Challenges',    icon: <Target size={14} /> },
    { id: 'achievements',  label: 'Achievements',  icon: <Award size={14} /> },
    { id: 'store',         label: 'Reward Store',  icon: <Gift size={14} /> },
  ];

  return (
    <div className="gamification-hub">
      <header className="gh-page-head">
        <div>
          <h1 className="gh-page-head__title">Gamification Hub</h1>
          <p className="gh-page-head__sub">Level up your career, compete with peers, and redeem rewards for your progress.</p>
        </div>
        <div className="gh-tabs-wrap">
          <div className="gh-tabs" role="tablist">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`gh-tab ${activeTab === tab.id ? 'gh-tab--active' : ''}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <XPProgressBar />

      {hubNotice && (
        <HubNotice type={hubNotice.type} message={hubNotice.message} onDismiss={() => setHubNotice(null)} />
      )}

      {activeTab === 'overview' && (
        <div className="gh-overview-grid">
          <div className="gh-stack">
            <Card glass={false} className="glass-panel gh-section">
              <SectionHead icon={<Target size={20} />} title="Active challenges" subtitle="Complete steps to earn XP and badges" />
              <Challenges refreshKey={refreshChallengesKey} onOpenDetail={setSelectedChallengeId} />
            </Card>

            <Card glass={false} className="glass-panel gh-section">
              <SectionHead
                icon={<Award size={20} />}
                title="Recent achievements"
                subtitle="Badges unlocked from your activity"
                action={<button type="button" className="gh-link-btn" onClick={() => setActiveTab('achievements')}>View all</button>}
              />
              <AchievementGallery />
            </Card>
          </div>

          <div className="gh-stack">
            <Card glass={false} className="glass-panel gh-section">
              <SectionHead icon={<Crown size={20} />} title="Top leaderboard" subtitle="Company-wide XP rankings" />
              <Leaderboard />
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <Card glass={false} className="glass-panel gh-section">
          <SectionHead icon={<Crown size={20} />} title="Company leaderboard" subtitle="See how you rank against peers" />
          <Leaderboard />
        </Card>
      )}

      {activeTab === 'challenges' && (
        <div className="gh-stack">
          <AdminManualReviews refreshKey={refreshChallengesKey} onReviewed={bumpRefresh} />
          <AdminVerifications refreshKey={refreshChallengesKey} onVerified={bumpRefresh} />

          <Card glass={false} className="glass-panel gh-section">
            <SectionHead
              icon={<Target size={20} />}
              title="All active challenges"
              subtitle="Multi-step challenges with AI evaluation"
              action={
                <Button size="sm" onClick={() => setShowCreateChallenge(true)} className="flex items-center gap-2">
                  <Plus size={16} /> New challenge
                </Button>
              }
            />
            <Challenges singleColumn refreshKey={refreshChallengesKey} onOpenDetail={setSelectedChallengeId} />

            <CreateChallengeModal
              isOpen={showCreateChallenge}
              onClose={() => setShowCreateChallenge(false)}
              onCreated={bumpRefresh}
              onNotice={showNotice}
            />
          </Card>
        </div>
      )}

      {activeTab === 'achievements' && (
        <Card glass={false} className="glass-panel gh-section">
          <SectionHead icon={<Award size={20} />} title="Achievement gallery" subtitle="Collect badges as you grow" />
          <AchievementGallery />
        </Card>
      )}

      {activeTab === 'store' && (
        <Card glass={false} className="glass-panel gh-section">
          <SectionHead icon={<Gift size={20} />} title="Reward store" subtitle="Spend XP on perks and experiences" />
          <RewardStore />
        </Card>
      )}

      {selectedChallengeId && currentEmployee && (
        <ChallengeDetailDrawer
          challengeId={selectedChallengeId}
          employeeId={currentEmployee.id}
          onClose={() => setSelectedChallengeId(null)}
          onProgressUpdate={bumpRefresh}
        />
      )}
    </div>
  );
};
