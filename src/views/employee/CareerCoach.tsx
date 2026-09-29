import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  Loader2,
  MessageSquare,
  Milestone,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  UserPlus,
  Zap,
  Brain,
} from 'lucide-react';
import './CareerCoach.css';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import {
  careerAPI,
  type CareerAnalysis,
  type CareerRoadmapStep,
  type CareerSkillGap,
} from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';

type ChatMessage = { role: 'user' | 'assistant'; content: string; grounding?: string[] };

const GOAL_DEFAULTS = {
  target_role: 'Senior Software Engineer',
  timeline: '12 months',
  focus_area: 'Engineering',
  target_industry: 'Technology',
  visible_to_manager: false,
};

const evidenceTypeForStep = (step: CareerRoadmapStep) =>
  step.evidence_type || (step.step_type === 'mentor' ? 'manager_signoff' : step.step_type === 'project' ? 'project' : 'certificate');

const priorityClass = (priority: string) => {
  const key = priority.toLowerCase();
  if (key === 'critical') return 'career-priority--critical';
  if (key === 'high') return 'career-priority--high';
  if (key === 'medium') return 'career-priority--medium';
  return 'career-priority--low';
};

const SectionHead: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="career-section__head">
    <div className="career-section__title-row">
      <div className="career-section__icon">{icon}</div>
      <div>
        <h2 className="career-section__title">{title}</h2>
        {subtitle ? <p className="career-section__sub">{subtitle}</p> : null}
      </div>
    </div>
    {action}
  </div>
);

const ReadinessRing: React.FC<{ score: number }> = ({ score }) => (
  <div className="career-ring-wrap">
    <svg viewBox="0 0 36 36" className="career-ring">
      <defs>
        <linearGradient id="careerRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path
        className="career-ring__track"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <path
        className="career-ring__fill"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        strokeDasharray={`${score}, 100`}
      />
    </svg>
    <div className="career-ring__center">
      <span className="career-ring__score">{score}%</span>
      <span className="career-ring__label">Readiness</span>
    </div>
  </div>
);

export const CareerCoach: React.FC = () => {
  const { currentEmployee, loading: employeeLoading } = useEmployee();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [goalForm, setGoalForm] = useState(GOAL_DEFAULTS);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatting, setChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [mentorLoadingId, setMentorLoadingId] = useState<string | null>(null);
  const [evidenceModal, setEvidenceModal] = useState<{ skillGap?: CareerSkillGap; step?: CareerRoadmapStep } | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);
  const [stepUpdatingId, setStepUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const goal = analysis?.goal;

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4500);
  };

  const loadAnalysis = async (refresh = false) => {
    if (!currentEmployee) return;
    setLoading(true);
    setError(null);
    try {
      const analysisData = await careerAPI.getAnalysis(currentEmployee.id, refresh);
      setAnalysis(analysisData);
      const nextGoal = analysisData.goal
        ? {
            target_role: analysisData.goal.target_role,
            timeline: analysisData.goal.timeline || GOAL_DEFAULTS.timeline,
            focus_area: analysisData.goal.focus_area || GOAL_DEFAULTS.focus_area,
            target_industry: analysisData.goal.target_industry || GOAL_DEFAULTS.target_industry,
            visible_to_manager: analysisData.goal.visible_to_manager,
          }
        : GOAL_DEFAULTS;
      setGoalForm(nextGoal);
      setChatHistory([
        {
          role: 'assistant',
          content: `You're **${analysisData.readiness_score}%** ready for **${nextGoal.target_role}**. This week, focus on **${analysisData.next_action?.title || 'your highest-priority roadmap step'}**.`,
          grounding: [
            `Readiness ${analysisData.readiness_score}%`,
            ...(analysisData.blockers || []).slice(0, 2),
          ],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load career analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeLoading) return;
    if (!currentEmployee) {
      setLoading(false);
      setError('No employee selected yet.');
      return;
    }
    loadAnalysis();
  }, [currentEmployee, employeeLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const radarData = useMemo(
    () =>
      (analysis?.skill_gaps || []).slice(0, 6).map((gap) => ({
        skill: gap.skill,
        Current: gap.current_level,
        Target: gap.target_level,
        fullMark: 10,
      })),
    [analysis?.skill_gaps]
  );

  const highestGap = useMemo(
    () => [...(analysis?.skill_gaps || [])].sort((a, b) => b.gap - a.gap)[0],
    [analysis?.skill_gaps]
  );

  const handleGoalSave = async () => {
    if (!currentEmployee) return;
    setSavingGoal(true);
    try {
      await careerAPI.setGoal(currentEmployee.id, goalForm);
      setGoalModalOpen(false);
      await loadAnalysis(true);
      showToast('success', 'Career goal updated — AI analysis regenerated.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleVisibilityToggle = async () => {
    if (!currentEmployee || !goal) return;
    try {
      const updated = await careerAPI.updateVisibility(currentEmployee.id, !goal.visible_to_manager);
      setAnalysis((prev) => (prev ? { ...prev, goal: { ...prev.goal!, ...updated } } : prev));
      setGoalForm((prev) => ({ ...prev, visible_to_manager: updated.visible_to_manager }));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update visibility');
    }
  };

  const handleMentorRequest = async (mentorId: string) => {
    if (!currentEmployee) return;
    setMentorLoadingId(mentorId);
    try {
      const response = await careerAPI.requestMentorIntro(currentEmployee.id, mentorId);
      setAnalysis((prev) =>
        prev
          ? {
              ...prev,
              mentors: prev.mentors.map((mentor) =>
                mentor.mentor_employee_id === mentorId ? response.mentor_match : mentor
              ),
            }
          : prev
      );
      showToast('success', 'Intro request sent.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to request intro');
    } finally {
      setMentorLoadingId(null);
    }
  };

  const handleEvidenceSubmit = async () => {
    if (!currentEmployee || !evidenceModal) return;
    const skillGap = evidenceModal.skillGap;
    const step = evidenceModal.step;
    if (!evidenceDescription.trim() && !evidenceFile) {
      showToast('error', 'Add a description or a file before submitting evidence.');
      return;
    }
    setEvidenceSubmitting(true);
    try {
      const evidence = await careerAPI.submitEvidence(currentEmployee.id, {
        skill_gap_id: skillGap?.id,
        roadmap_step_id: step?.id,
        evidence_type: step ? evidenceTypeForStep(step) : 'certificate',
        description: evidenceDescription,
        file: evidenceFile,
      });
      if (step) {
        setStepUpdatingId(step.id);
        const updated = await careerAPI.updateRoadmapStep(step.id, 'achieved', evidence.id);
        setAnalysis(updated.analysis);
        setStepUpdatingId(null);
      } else {
        await loadAnalysis();
      }
      setEvidenceModal(null);
      setEvidenceDescription('');
      setEvidenceFile(null);
      showToast(
        'success',
        evidence.status === 'pending_approval'
          ? 'Evidence submitted and waiting for manager sign-off.'
          : `Evidence accepted. ${evidence.xp_awarded} XP credited.`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to submit evidence');
    } finally {
      setEvidenceSubmitting(false);
      setStepUpdatingId(null);
    }
  };

  const handleQuickStepComplete = async (step: CareerRoadmapStep) => {
    if (step.requires_evidence) {
      setEvidenceModal({ step });
      return;
    }
    setStepUpdatingId(step.id);
    try {
      const updated = await careerAPI.updateRoadmapStep(step.id, 'achieved');
      setAnalysis(updated.analysis);
      showToast('success', `${step.title} marked complete.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update step');
    } finally {
      setStepUpdatingId(null);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentEmployee || !chatInput.trim()) return;
    const userMessage = chatInput.trim();
    const nextHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userMessage }];
    setChatHistory(nextHistory);
    setChatInput('');
    setChatting(true);
    try {
      const response = await careerAPI.chat(currentEmployee.id, userMessage, nextHistory.slice(0, -1));
      setChatHistory([
        ...nextHistory,
        { role: 'assistant', content: response.response, grounding: response.grounding_points || [] },
      ]);
    } catch (err) {
      setChatHistory([
        ...nextHistory,
        { role: 'assistant', content: 'I hit a problem retrieving your grounded career context. Please try again.' },
      ]);
    } finally {
      setChatting(false);
    }
  };

  if (loading) {
    return (
      <div className="career-loading">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-sm font-semibold text-secondary">Running AI career analysis for this employee…</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="career-error">
        <div className="career-error-box">
          <AlertCircle className="mx-auto mb-3 text-danger" size={32} />
          <p className="text-sm font-semibold text-secondary">{error || 'Unable to load Career Coach.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="career-coach">
      {toast && createPortal(
        <div className={`career-toast career-toast--${toast.type}`}>{toast.message}</div>,
        document.body
      )}

      <div className="career-header">
        <div>
          <div className="career-kicker">
            <Sparkles size={12} className="text-primary" />
            Career Coach
          </div>
          <h1 className="career-title">{goal?.target_role || goalForm.target_role}</h1>
        </div>
        <div className="career-header__actions">
          <Button variant="ghost" onClick={handleVisibilityToggle} className="border border-[var(--border-subtle)] bg-white/80">
            {goal?.visible_to_manager ? <Eye size={16} className="mr-2" /> : <EyeOff size={16} className="mr-2" />}
            {goal?.visible_to_manager ? 'Visible to manager' : 'Private to you'}
          </Button>
          <Button onClick={() => setGoalModalOpen(true)}>
            <Target size={16} className="mr-2" />
            Edit goal
          </Button>
        </div>
      </div>

      {analysis.stall_flag && (
        <div className="career-stall">
          <AlertCircle className="shrink-0 text-amber-600" size={20} />
          <div>
            <p className="career-stall__title">Momentum check</p>
            <p className="career-stall__text">{analysis.stall_flag.message}</p>
          </div>
        </div>
      )}

      <div className="career-hero">
        <div className="career-hero__glow career-hero__glow--tr" />
        <div className="career-hero__glow career-hero__glow--bl" />
        <div className="career-hero__inner">
          <div className="career-hero__main">
            <p className="career-summary">{analysis.summary}</p>
            <div className="career-pills">
              <span className="career-pill">
                <Briefcase size={13} />
                {goal?.focus_area || goalForm.focus_area}
              </span>
              <span className="career-pill">
                <Flag size={13} />
                {goal?.timeline || goalForm.timeline}
              </span>
              <span className="career-pill career-pill--band">
                <TrendingUp size={13} />
                {analysis.readiness_band}
              </span>
            </div>
            <div className="career-next-action">
              <p className="career-next-action__label">Next action this week</p>
              <h2 className="career-next-action__title">{analysis.next_action?.title || 'No action queued'}</h2>
              <p className="career-next-action__desc">{analysis.next_action?.description}</p>
              <div className="career-next-action__meta">
                <span className="career-meta-chip">
                  <Zap size={12} />
                  {analysis.next_action?.xp_reward || 0} XP
                </span>
                <span className="career-meta-chip">
                  {analysis.next_action?.estimated_hours || 0} hrs estimated
                </span>
                <Button
                  variant="ghost"
                  className="border border-[var(--border-subtle)] bg-white/80"
                  onClick={() => navigate('/learning-hub')}
                >
                  <Brain size={14} className="mr-2" />
                  Close gaps in Learning
                </Button>
              </div>
            </div>
          </div>
          <div className="career-hero__aside">
            <ReadinessRing score={analysis.readiness_score} />
            <button type="button" onClick={() => setShowBreakdown((prev) => !prev)} className="career-breakdown-toggle">
              {showBreakdown ? 'Hide score breakdown' : 'See score breakdown'}
            </button>
            <p className="career-readiness-note">{analysis.readiness_explanation}</p>
          </div>
        </div>
      </div>

      {showBreakdown && (
        <Card glass={false} className="glass-panel career-section">
          <SectionHead
            icon={<Target size={18} />}
            title="Readiness breakdown"
            subtitle="Weighted score from real components — not a vanity percentage."
          />
          <div className="career-breakdown-grid">
            {analysis.readiness_components.map((component) => (
              <div key={component.id} className="career-breakdown-card">
                <div className="career-breakdown-card__top">
                  <p className="career-breakdown-card__name">{component.name.replace('_', ' ')}</p>
                  <span className="career-breakdown-card__score">{component.score}%</span>
                </div>
                <p className="career-breakdown-card__weight">Weight {Math.round(component.weight * 100)}%</p>
                <div className="career-breakdown-card__bar">
                  <div className="career-breakdown-card__bar-fill" style={{ width: `${component.score}%` }} />
                </div>
                <p className="career-breakdown-card__text">{component.explanation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="career-grid-main">
        <div className="career-col">
          <Card glass={false} className="glass-panel career-section">
            <SectionHead
              icon={<Milestone size={18} />}
              title="Roadmap with proof points"
              subtitle="Every step is tied to evidence and XP so progress is actually usable."
            />
            <div className="career-roadmap">
              {analysis.roadmap_steps.map((step) => (
                <div
                  key={step.id}
                  className={`career-roadmap-step ${step.status === 'achieved' ? 'career-roadmap-step--achieved' : ''}`}
                >
                  <div className="career-roadmap-step__marker">
                    {step.status === 'achieved' ? (
                      <CheckCircle2 size={18} className="text-emerald-600" />
                    ) : (
                      <Milestone size={18} className="text-secondary" />
                    )}
                  </div>
                  <div className="career-roadmap-step__body">
                    <div className="career-roadmap-step__header">
                      <h3 className="career-roadmap-step__title">{step.title}</h3>
                      <span className="career-tag career-tag--status">{step.status.replace('_', ' ')}</span>
                      <span className="career-tag career-tag--type">{step.step_type}</span>
                      {step.requires_evidence && (
                        <span className="career-tag career-tag--evidence">
                          Needs {step.evidence_type?.replace('_', ' ') || 'evidence'}
                        </span>
                      )}
                    </div>
                    <p className="career-roadmap-step__desc">{step.description}</p>
                    <div className="career-roadmap-step__footer">
                      <div className="career-roadmap-step__chips">
                        <span className="career-chip">{step.estimated_hours} hrs</span>
                        <span className="career-chip">{step.xp_reward} XP</span>
                      </div>
                      {step.status !== 'achieved' && (
                        <div className="career-roadmap-step__actions">
                          {step.requires_evidence && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="border border-[var(--border-subtle)] bg-white/80"
                              onClick={() => setEvidenceModal({ step })}
                            >
                              <Upload size={14} className="mr-1.5" />
                              Add evidence
                            </Button>
                          )}
                          <Button size="sm" onClick={() => handleQuickStepComplete(step)} disabled={stepUpdatingId === step.id}>
                            {stepUpdatingId === step.id ? (
                              <Loader2 size={14} className="mr-1.5 animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} className="mr-1.5" />
                            )}
                            Mark achieved
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card glass={false} className="glass-panel career-section">
            <SectionHead
              icon={<TrendingUp size={18} />}
              title="Skill gaps with a closing path"
              subtitle="Each gap includes the work to do, how long it should take, and how to prove it."
              action={
                highestGap ? (
                  <div className="career-gap-highlight">
                    <p className="career-gap-highlight__label">Biggest gap</p>
                    <p className="career-gap-highlight__skill">{highestGap.skill}</p>
                  </div>
                ) : undefined
              }
            />
            <div className="space-y-4">
              {analysis.skill_gaps.map((gap) => (
                <div key={gap.id} className="career-gap-card">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-primary">{gap.skill}</h3>
                        <span className={`career-tag ${priorityClass(gap.priority)}`}>{gap.priority}</span>
                        <span className="career-tag career-tag--status">{gap.path_type}</span>
                      </div>
                      <div className="career-gap-card__levels">
                        <div className="career-level-bar">
                          <span className="career-level-bar__label">Current</span>
                          <div className="career-level-bar__track">
                            <div
                              className="career-level-bar__fill career-level-bar__fill--current"
                              style={{ width: `${(gap.current_level / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-secondary">{gap.current_level}/10</span>
                        </div>
                        <div className="career-level-bar">
                          <span className="career-level-bar__label">Target</span>
                          <div className="career-level-bar__track">
                            <div
                              className="career-level-bar__fill career-level-bar__fill--target"
                              style={{ width: `${(gap.target_level / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-secondary">{gap.target_level}/10</span>
                        </div>
                      </div>
                      <p className="career-gap-card__path">{gap.recommended_path}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="career-chip">{gap.estimated_hours} hrs</span>
                        <span className="career-chip">{gap.evidence_count} evidence item(s)</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="border border-[var(--border-subtle)] bg-white/80"
                        onClick={() => setEvidenceModal({ skillGap: gap })}
                      >
                        <Upload size={14} className="mr-1.5" />
                        Upload evidence
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="border border-[var(--border-subtle)] bg-white/80"
                        onClick={() => navigate('/learning-hub')}
                      >
                        <Brain size={14} className="mr-1.5" />
                        Learn this skill
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card glass={false} className="glass-panel career-section">
            <SectionHead
              icon={<Briefcase size={18} />}
              title="Internal opportunities"
              subtitle="Live roles with the exact gaps currently blocking eligibility."
            />
            <div className="career-roles-grid">
              {analysis.internal_roles.map((role) => (
                <div key={role.role_id} className="career-role-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-primary">{role.title}</h3>
                      <p className="text-sm text-secondary">{role.department}</p>
                    </div>
                    <div className="career-role-card__fit">
                      <p className="career-role-card__fit-label">Fit</p>
                      <p className="career-role-card__fit-value">{role.overall_fit_pct}%</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-secondary">{role.eligibility_summary}</p>
                  <div className="mt-4 space-y-2">
                    {role.missing_requirements.length ? (
                      role.missing_requirements.map((item, index) => (
                        <div key={index} className="career-role-req career-role-req--missing">{item}</div>
                      ))
                    ) : (
                      <div className="career-role-req career-role-req--ok">
                        You are eligible based on the currently tracked requirements.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="career-col">
          <Card glass={false} className="glass-panel career-section career-section--compact">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-tertiary">What is holding you back</p>
            <div className="career-insight-list mt-4">
              {analysis.blockers.length ? (
                analysis.blockers.map((blocker, index) => (
                  <div key={index} className="career-insight-item">{blocker}</div>
                ))
              ) : (
                <p className="text-sm text-secondary">No major blockers detected right now.</p>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-tertiary">Strongest signals</p>
              <div className="career-insight-list mt-3">
                {analysis.strengths.map((strength, index) => (
                  <div key={index} className="career-insight-item career-insight-item--strength">{strength}</div>
                ))}
              </div>
              <div className="career-xp-block">
                <p className="career-xp-block__label">Career XP earned</p>
                <p className="career-xp-block__value">{analysis.xp_total.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card glass={false} className="glass-panel career-section">
            <SectionHead icon={<TrendingUp size={18} />} title="Gap map" subtitle="Current vs target skill levels" />
            <div className="career-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="rgba(148,163,184,0.35)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Target" dataKey="Target" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} />
                  <Radar name="Current" dataKey="Current" stroke="#3b82f6" fill="#6366f1" fillOpacity={0.25} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card glass={false} className="glass-panel career-section">
            <SectionHead icon={<UserPlus size={18} />} title="Suggested mentors" subtitle="Matched to your gaps and target role" />
            {analysis.mentors.map((mentor) => (
              <div key={mentor.id} className="career-mentor-card">
                <div className="career-mentor-card__top">
                  <div className="career-mentor-card__identity">
                    <div className="career-mentor-card__avatar">
                      {mentor.mentor_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-primary">{mentor.mentor_name}</h3>
                      <p className="text-xs text-tertiary">
                        {mentor.mentor_role} · {mentor.mentor_department}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleMentorRequest(mentor.mentor_employee_id)}
                    disabled={mentor.intro_requested || mentorLoadingId === mentor.mentor_employee_id}
                  >
                    {mentorLoadingId === mentor.mentor_employee_id ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <UserPlus size={14} className="mr-1" />
                    )}
                    {mentor.intro_requested ? 'Requested' : 'Request intro'}
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-6 text-secondary">{mentor.match_reason}</p>
              </div>
            ))}
          </Card>

          <Card glass={false} className="glass-panel career-section career-chat">
            <div className="career-chat__head">
              <div className="flex items-center gap-3">
                <div className="career-section__icon">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h2 className="career-section__title">Grounded AI chat</h2>
                  <p className="career-section__sub">Answers reference your real readiness, gaps, and role matches.</p>
                </div>
              </div>
            </div>
            <div className="career-chat__messages">
              {chatHistory.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`career-chat__bubble career-chat__bubble--${message.role}`}>
                    {message.role === 'assistant' ? (
                      <>
                        <div className="prose prose-sm max-w-none prose-p:my-2">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        {message.grounding?.length ? (
                          <div className="career-chat__grounding">
                            {message.grounding.map((item, i) => (
                              <span key={i} className="career-chat__ground-chip">{item}</span>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {chatting && (
                <div className="flex justify-start">
                  <div className="career-chat__bubble career-chat__bubble--assistant">
                    <Loader2 size={16} className="animate-spin text-tertiary" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="career-chat__input-row">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask how to close the gap to your target role…"
                className="input-field h-11 flex-1"
                disabled={chatting}
              />
              <Button type="submit" disabled={!chatInput.trim() || chatting}>
                <Send size={15} />
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <Card glass={false} className="glass-panel career-section">
        <SectionHead icon={<Sparkles size={18} />} title="Market context" subtitle="Trends affecting your target path" />
        <div className="career-trends-row">
          {analysis.market_trends.map((trend, index) => (
            <div key={index} className="career-trend-card">
              <div className="career-trend-card__top">
                <div>
                  <p className="career-trend-card__skill">{trend.skill}</p>
                  <p className="career-trend-card__category">{trend.category}</p>
                </div>
                <span className="career-trend-card__trend">{trend.trend}</span>
              </div>
              <p className="career-trend-card__implication">{trend.implication}</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} title="Update career goal">
        <div className="space-y-4 p-1">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Target role</label>
            <input
              className="input-field"
              value={goalForm.target_role}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, target_role: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Timeline</label>
              <input
                className="input-field"
                value={goalForm.timeline}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, timeline: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Focus area</label>
              <input
                className="input-field"
                value={goalForm.focus_area}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, focus_area: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Industry or domain</label>
            <input
              className="input-field"
              value={goalForm.target_industry}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, target_industry: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={goalForm.visible_to_manager}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, visible_to_manager: e.target.checked }))}
            />
            Allow manager visibility for this goal
          </label>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button variant="ghost" className="border border-slate-200 bg-white text-slate-700" onClick={() => setGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGoalSave} disabled={savingGoal}>
              {savingGoal ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Save and recompute
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!evidenceModal}
        onClose={() => {
          setEvidenceModal(null);
          setEvidenceDescription('');
          setEvidenceFile(null);
        }}
        title={evidenceModal?.step ? `Submit evidence for ${evidenceModal.step.title}` : `Submit evidence for ${evidenceModal?.skillGap?.skill}`}
      >
        <div className="space-y-4 p-1">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            {(evidenceModal?.step?.description || evidenceModal?.skillGap?.recommended_path) ?? ''}
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Evidence notes</label>
            <textarea
              rows={5}
              className="input-field resize-y"
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              placeholder="Describe what you completed, what changed, and why this proves progress."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Optional file</label>
            <input
              type="file"
              className="input-field"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
            />
            <p className="mt-2 text-xs text-slate-500">
              Use manager sign-off evidence when the step requires approval. Otherwise files are auto-approved and award XP immediately.
            </p>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button
              variant="ghost"
              className="border border-slate-200 bg-white text-slate-700"
              onClick={() => {
                setEvidenceModal(null);
                setEvidenceDescription('');
                setEvidenceFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEvidenceSubmit} disabled={evidenceSubmitting}>
              {evidenceSubmitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
              Submit evidence
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
