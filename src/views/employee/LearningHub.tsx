import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { useEmployee } from '../../contexts/EmployeeContext';
import {
  learningRecommendationAPI,
  type ComplianceMetric,
  type LearningAssessment,
  type LearningClosure,
  type LearningCourse,
  type LearningNextStep,
  type LearningPlan,
  type LearningPlanItem,
  type LearningSkillGap,
  type OrgOverview,
  type TeamGapRow,
} from '../../lib/api';
import './LearningHub.css';

type Tab = 'Overview' | 'Gaps' | 'Plans' | 'Catalogue' | 'Assessments' | 'Record' | 'Team' | 'Organization';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'Overview', label: 'Overview', icon: <Sparkles size={14} /> },
  { id: 'Gaps', label: 'Skill gaps', icon: <Target size={14} /> },
  { id: 'Plans', label: 'Learning plans', icon: <BookOpen size={14} /> },
  { id: 'Catalogue', label: 'Catalogue', icon: <ClipboardCheck size={14} /> },
  { id: 'Assessments', label: 'Assessments', icon: <Award size={14} /> },
  { id: 'Record', label: 'Verified gains', icon: <CheckCircle2 size={14} /> },
  { id: 'Team', label: 'Team', icon: <Users size={14} /> },
  { id: 'Organization', label: 'Organization', icon: <Building2 size={14} /> },
];

const ratioLabel = (metric?: ComplianceMetric | null) => {
  if (!metric) return '—';
  if (metric.ratio === null) return metric.state;
  return `${Math.round(metric.ratio * 100)}%`;
};

const money = (value: number) => `LKR ${Math.round(value).toLocaleString()}`;

const shownLevels = (gap: { current_level: number; required_level: number; display_current?: number; display_required?: number; display_scale?: number }) => ({
  current: gap.display_current ?? gap.current_level,
  required: gap.display_required ?? gap.required_level,
  scale: gap.display_scale ?? 5,
});

const Meter: React.FC<{ label: string; level: number; tone: 'now' | 'need' | 'gain'; max?: number }> = ({ label, level, tone, max = 5 }) => (
  <div className="lr-meter">
    <div className="lr-meter__top"><span>{label}</span><strong>{level}/{max}</strong></div>
    <div className="lr-meter__track" aria-hidden>
      <span className={`lr-meter__fill lr-meter__fill--${tone}`} style={{ width: `${Math.max(0, Math.min(100, (level / Math.max(max, 1)) * 100))}%` }} />
    </div>
  </div>
);

const priorityClass = (label: string) => {
  if (label === 'High') return 'lr-pill lr-pill--high';
  if (label === 'Medium') return 'lr-pill lr-pill--medium';
  return 'lr-pill lr-pill--low';
};

const stepClass = (status: string) => {
  if (status === 'Completed') return 'lr-step__index lr-step__index--done';
  if (status === 'In Progress' || status === 'Enrolled') return 'lr-step__index lr-step__index--now';
  return 'lr-step__index';
};

const deliveredLevel = (course: LearningCourse, gap: LearningSkillGap) => {
  const named = course.skills.filter((skill) => skill.skill_name.toLowerCase() === gap.skill.toLowerCase());
  const pool = named.length ? named : course.skills;
  return Math.max(...pool.map((skill) => skill.level_delivered), 0);
};

const coursesForGap = (courses: LearningCourse[], gap: LearningSkillGap) => {
  const ids = gap.matched_course_ids;
  if (ids && ids.length) {
    const order = new Map(ids.map((id, index) => [id, index]));
    return courses.filter((course) => order.has(course.id)).sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
  }
  return courses
    .filter((course) => deliveredLevel(course, gap) > gap.current_level)
    .sort((left, right) => deliveredLevel(left, gap) - deliveredLevel(right, gap) || left.duration_hours - right.duration_hours);
};

const GapBoard: React.FC<{
  gaps: LearningSkillGap[];
  courses: LearningCourse[];
  plans: LearningPlan[];
  picked: Record<string, string[]>;
  busy: string | null;
  onToggle: (gapId: string, courseId: string) => void;
  onGenerate: (gap: LearningSkillGap) => void;
  onOpen: (planId: string) => void;
  onCreateCourse: (gap: LearningSkillGap) => void;
  focusId?: string | null;
}> = ({ gaps, courses, plans, picked, busy, onToggle, onGenerate, onOpen, onCreateCourse, focusId }) => (
  <div className="lh-stack">
    {gaps.length === 0 ? (
      <Card glass={false} className="lh-section"><p className="lh-empty">No unresolved skill gaps. This matches the career goal: every required skill is already at the bar.</p></Card>
    ) : gaps.map((gap) => {
      const matches = coursesForGap(courses, gap);
      const plan = plans.find((item) => item.id === gap.learning_plan_id);
      const onPlan = new Set(plan?.items.map((item) => item.course_id) ?? []);
      const selected = picked[gap.source_gap_reference] ?? [];
      const fresh = selected.filter((id) => !onPlan.has(id));
      return (
        <article className={gap.source_gap_reference === focusId ? 'lr-gap lr-gap--focus' : 'lr-gap'} id={`lr-gap-${gap.source_gap_reference}`} key={gap.source_gap_reference}>
          <div className="lr-gap__head">
            <div>
              <div className="lr-pills">
                <span className={priorityClass(gap.priority_label)}>{gap.priority_label}</span>
                {gap.strategic && <span className="lr-pill lr-pill--violet">Strategic</span>}
                {gap.mandatory && <span className="lr-pill lr-pill--high">Mandatory</span>}
                <span className="lr-pill">{gap.learning_plan_id ? 'Plan open' : 'No plan'}</span>
              </div>
              <h2 className="lh-section__title" style={{ marginTop: '0.45rem' }}>{gap.skill}</h2>
              <p className="lh-section__sub">{shownLevels(gap).current}/{shownLevels(gap).scale} now, {shownLevels(gap).required}/{shownLevels(gap).scale} required. {gap.why}</p>
            </div>
            <div className="lr-gap__actions">
              {matches.length === 0 ? (
                <Button disabled={busy === 'course-create'} onClick={() => onCreateCourse(gap)}>Create a course</Button>
              ) : gap.learning_plan_id && fresh.length === 0 ? (
                <Button variant="secondary" onClick={() => onOpen(gap.learning_plan_id!)}>Open plan</Button>
              ) : (
                <Button disabled={busy === gap.source_gap_reference || fresh.length === 0} onClick={() => onGenerate(gap)}>
                  {gap.learning_plan_id ? `Add ${fresh.length} to plan` : 'Generate learning plan'}
                </Button>
              )}
              {matches.length > 0 && <Button variant="ghost" size="sm" onClick={() => onCreateCourse(gap)}>New course</Button>}
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <Meter label="Current" level={shownLevels(gap).current} max={shownLevels(gap).scale} tone="now" />
            <Meter label="Required" level={shownLevels(gap).required} max={shownLevels(gap).scale} tone="need" />
          </div>
          {matches.length === 0 ? (
            <p className="lr-note">No active course raises this skill above {gap.current_level}/5. Create one, then generate the plan.</p>
          ) : (
            <div className="lr-gap__courses">
              {matches.map((course) => {
                const level = deliveredLevel(course, gap);
                const already = onPlan.has(course.id);
                return (
                  <label className="lr-gap__course" key={course.id}>
                    <input
                      type="checkbox"
                      checked={already || selected.includes(course.id)}
                      disabled={already}
                      onChange={() => onToggle(gap.source_gap_reference, course.id)}
                    />
                    <span>
                      <strong>{course.course_title}</strong>
                      <em>{already ? 'Already on the plan' : `Course level ${level}/5`} · {course.difficulty_level} · {course.modality} · {course.duration_hours}h{course.has_assessment ? '' : ' · no assessment'}</em>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </article>
      );
    })}
  </div>
);

export const LearningHub: React.FC = () => {
  const { currentEmployee, loading: employeeLoading } = useEmployee();
  const [searchParams] = useSearchParams();
  const requestedGap = searchParams.get('gap');
  const requestedSkill = (searchParams.get('skill') || '').trim().toLowerCase();
  const [tab, setTab] = useState<Tab>(requestedGap || requestedSkill ? 'Gaps' : 'Overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [gaps, setGaps] = useState<LearningSkillGap[]>([]);
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [assessments, setAssessments] = useState<LearningAssessment[]>([]);
  const [closures, setClosures] = useState<LearningClosure[]>([]);
  const [nextStep, setNextStep] = useState<LearningNextStep | null>(null);
  const [mandatory, setMandatory] = useState<ComplianceMetric | null>(null);
  const [strategic, setStrategic] = useState<ComplianceMetric | null>(null);
  const [org, setOrg] = useState<OrgOverview | null>(null);
  const [team, setTeam] = useState<Awaited<ReturnType<typeof learningRecommendationAPI.manager>> | null>(null);
  const [skillFilter, setSkillFilter] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [modality, setModality] = useState('');
  const [mandatoryOnly, setMandatoryOnly] = useState(false);
  const [strategicOnly, setStrategicOnly] = useState(false);
  const [assessmentOnly, setAssessmentOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'Relevance' | 'Hours' | 'Cost'>('Relevance');
  const [selectedCourse, setSelectedCourse] = useState<LearningCourse | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [abandonPlanId, setAbandonPlanId] = useState<string | null>(null);
  const [abandonReason, setAbandonReason] = useState('');
  const [teamSkill, setTeamSkill] = useState('');
  const [teamEmployee, setTeamEmployee] = useState('');
  const [teamMissingOnly, setTeamMissingOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<{ itemId: string; title: string; questions: Array<{ id: string; prompt: string; options: string[] }> } | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [courseForm, setCourseForm] = useState({
    open: false,
    skill: '',
    level: 2,
    title: '',
    provider: 'Internal Academy',
    modality: 'Self-paced',
    difficulty: 'Beginner',
    hours: '8',
    cost: '0',
    mandatory: false,
    roles: '',
    strategic: false,
    assessment: true,
    generatePlan: false,
    addToPlan: false,
    sourceGap: '',
    planId: '',
  });
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [teamLoading, setTeamLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [teamAttempted, setTeamAttempted] = useState(false);
  const [orgAttempted, setOrgAttempted] = useState(false);
  const loadToken = useRef(0);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4200);
  };

  const loadPersonal = async (initial = false) => {
    if (!currentEmployee) return;
    const token = ++loadToken.current;
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError(null);
    const settled = await Promise.allSettled([
      learningRecommendationAPI.gaps(currentEmployee.id),
      learningRecommendationAPI.plans(currentEmployee.id),
      learningRecommendationAPI.courses({ status: 'Active' }),
      learningRecommendationAPI.assessments(currentEmployee.id),
      learningRecommendationAPI.closures(currentEmployee.id),
      learningRecommendationAPI.next(currentEmployee.id),
      learningRecommendationAPI.mandatory(currentEmployee.id),
      learningRecommendationAPI.strategic(currentEmployee.id),
    ]);
    if (token !== loadToken.current) return;
    const fulfilled = <T,>(index: number) => (settled[index].status === 'fulfilled' ? (settled[index] as PromiseFulfilledResult<T>).value : null);
    const gapData = fulfilled<{ gaps: LearningSkillGap[] }>(0);
    if (!gapData) {
      const reason = settled[0].status === 'rejected' ? settled[0].reason : null;
      setError(reason instanceof Error ? reason.message : 'Could not load learning recommendations.');
    } else {
      setGaps(gapData.gaps);
      const planData = fulfilled<{ plans: LearningPlan[] }>(1);
      const courseData = fulfilled<{ courses: LearningCourse[] }>(2);
      const assessmentData = fulfilled<{ assessments: LearningAssessment[] }>(3);
      const closureData = fulfilled<{ closures: LearningClosure[] }>(4);
      if (planData) setPlans(planData.plans);
      if (courseData) setCourses(courseData.courses);
      if (assessmentData) setAssessments(assessmentData.assessments);
      if (closureData) setClosures(closureData.closures);
      const nextData = fulfilled<LearningNextStep>(5);
      if (nextData) setNextStep(nextData);
      const mandatoryData = fulfilled<ComplianceMetric>(6);
      if (mandatoryData) setMandatory(mandatoryData);
      const strategicData = fulfilled<ComplianceMetric>(7);
      if (strategicData) setStrategic(strategicData);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const loadTeam = async () => {
    if (!currentEmployee) return;
    setTeamLoading(true);
    try {
      setTeam(await learningRecommendationAPI.manager(currentEmployee.id));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Team learning could not be loaded.');
    } finally {
      setTeamLoading(false);
    }
  };

  const loadOrg = async () => {
    setOrgLoading(true);
    try {
      setOrg(await learningRecommendationAPI.employer());
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Organization learning could not be loaded.');
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    if (employeeLoading) return;
    if (!currentEmployee) {
      setLoading(false);
      setError('Select an employee to see a personal learning recommendation.');
      return;
    }
    setTeam(null);
    setOrg(null);
    setTeamAttempted(false);
    setOrgAttempted(false);
    loadPersonal(true);
  }, [currentEmployee, employeeLoading]);

  useEffect(() => {
    if (tab === 'Team' && currentEmployee && !team && !teamLoading && !teamAttempted) {
      setTeamAttempted(true);
      loadTeam();
    }
    if (tab === 'Organization' && !org && !orgLoading && !orgAttempted) {
      setOrgAttempted(true);
      loadOrg();
    }
  }, [tab, currentEmployee, team, org, teamLoading, orgLoading, teamAttempted, orgAttempted]);

  const act = async (key: string, work: () => Promise<unknown>, success: string, openPlan = false) => {
    setBusy(key);
    try {
      const result = await work();
      if (result && typeof result === 'object') {
        const record = result as LearningPlan & LearningAssessment;
        if (Array.isArray(record.items) && record.id) {
          setPlans((current) => [record, ...current.filter((plan) => plan.id !== record.id)]);
          if (record.source_gap_reference) {
            setGaps((current) => current.map((gap) => (
              gap.source_gap_reference === record.source_gap_reference
                ? { ...gap, learning_plan_id: record.plan_status === 'Abandoned' ? null : record.id }
                : gap
            )));
          }
          if (openPlan && record.plan_status !== 'Abandoned') {
            setSelectedPlanId(record.id);
            setTab('Plans');
          }
        }
        if (typeof record.assessment_score_pct === 'number' && record.skill_name) {
          setAssessments((current) => [record, ...current.filter((row) => row.id !== record.id)]);
        }
      }
      showToast('success', success);
      void loadPersonal(false);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'That action could not be completed.');
    } finally {
      setBusy(null);
    }
  };

  const openCourseForm = (gap?: LearningSkillGap) => {
    const nextLevel = gap ? Math.min(5, Math.max(1, gap.current_level + 1)) : 2;
    setCourseForm({
      open: true,
      skill: gap?.skill ?? '',
      level: nextLevel,
      title: gap ? `${gap.skill} practice` : '',
      provider: 'Internal Academy',
      modality: 'Self-paced',
      difficulty: nextLevel >= 4 ? 'Advanced' : nextLevel >= 3 ? 'Intermediate' : 'Beginner',
      hours: '8',
      cost: '0',
      mandatory: false,
      roles: '',
      strategic: Boolean(gap?.strategic),
      assessment: true,
      generatePlan: Boolean(gap && !gap.learning_plan_id),
      addToPlan: Boolean(gap?.learning_plan_id),
      sourceGap: gap?.source_gap_reference ?? '',
      planId: gap?.learning_plan_id ?? '',
    });
    learningRecommendationAPI.skillNames()
      .then((data) => setSkillOptions(gap && !data.skills.some((name) => name.toLowerCase() === gap.skill.toLowerCase()) ? [gap.skill, ...data.skills] : data.skills))
      .catch(() => setSkillOptions(gap ? [gap.skill] : []));
  };

  const saveCourse = async () => {
    const hours = Number(courseForm.hours);
    const cost = Number(courseForm.cost);
    if (courseForm.title.trim().length < 3) {
      showToast('error', 'Give the course a title of at least 3 characters.');
      return;
    }
    if (!courseForm.skill.trim()) {
      showToast('error', 'Choose a skill that is already on record.');
      return;
    }
    if (!Number.isFinite(hours) || hours < 1 || hours > 300) {
      showToast('error', 'Duration must be between 1 and 300 hours.');
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      showToast('error', 'Cost cannot be negative.');
      return;
    }
    if (courseForm.mandatory && !courseForm.roles.trim()) {
      showToast('error', 'A mandatory course needs at least one role.');
      return;
    }
    setBusy('course-create');
    try {
      const course = await learningRecommendationAPI.createCourse({
        course_title: courseForm.title.trim(),
        provider: courseForm.provider.trim() || 'Internal Academy',
        modality: courseForm.modality,
        duration_hours: hours,
        cost_lkr: cost,
        difficulty_level: courseForm.difficulty,
        is_mandatory: courseForm.mandatory,
        mandatory_for_role_ids: courseForm.mandatory ? courseForm.roles.split(',').map((role) => role.trim()).filter(Boolean) : [],
        strategic_priority_flag: courseForm.strategic,
        has_assessment: courseForm.assessment,
        skill_maps: [{ skill_name: courseForm.skill.trim(), level_delivered: courseForm.level }],
      });
      setCourses((current) => [course, ...current.filter((row) => row.id !== course.id)]);
      setGaps((current) => current.map((gap) => {
        const teaches = course.skills.some((skill) => skill.skill_name.toLowerCase() === gap.skill.toLowerCase() && skill.level_delivered > gap.current_level);
        return teaches ? { ...gap, matching_courses: gap.matching_courses + 1 } : gap;
      }));
      setCourseForm((current) => ({ ...current, open: false }));
      if (courseForm.generatePlan && courseForm.sourceGap && currentEmployee) {
        await act(courseForm.sourceGap, () => learningRecommendationAPI.createPlan(currentEmployee.id, courseForm.sourceGap, [course.id]), `${course.course_title} is in the catalogue, and the learning plan is open.`, true);
        return;
      }
      if (courseForm.addToPlan && courseForm.planId) {
        await act(courseForm.planId, () => learningRecommendationAPI.addCourseToPlan(courseForm.planId, course.id), `${course.course_title} was added to the open plan.`);
        return;
      }
      showToast('success', `${course.course_title} is in the catalogue. Generate a plan from the skill gap when you want it assigned.`);
      void loadPersonal(false);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'The course could not be created.');
    } finally {
      setBusy(null);
    }
  };

  const openExam = async (item: LearningPlanItem) => {
    if (!item.course_id) return;
    setBusy(item.id);
    try {
      const data = await learningRecommendationAPI.questions(item.course_id);
      if (!data.questions.length) {
        showToast('error', 'This course does not currently provide an assessment, so completion alone cannot verify a proficiency change.');
        return;
      }
      setChoices(data.questions.map(() => -1));
      setExam({ itemId: item.id, title: item.course_title || 'Assessment', questions: data.questions });
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'The assessment could not be opened.');
    } finally {
      setBusy(null);
    }
  };

  const linkedGap = gaps.find((gap) => requestedGap && gap.source_gap_reference === requestedGap)
    ?? gaps.find((gap) => requestedSkill && gap.skill.toLowerCase() === requestedSkill);
  const focusGap = linkedGap
    ?? gaps.find((gap) => gap.matching_courses > 0 && !gap.learning_plan_id)
    ?? nextStep?.gap
    ?? gaps.find((gap) => gap.matching_courses > 0)
    ?? gaps[0];
  const focusMatches = focusGap ? coursesForGap(courses, focusGap) : [];
  const activePlans = plans.filter((plan) => plan.plan_status === 'Active' || plan.plan_status === 'Draft');
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const knownSkills = useMemo(() => {
    const names = new Map<string, string>();
    gaps.forEach((gap) => names.set(gap.skill.toLowerCase(), gap.skill));
    courses.forEach((course) => course.skills.forEach((skill) => names.set(skill.skill_name.toLowerCase(), skill.skill_name)));
    skillOptions.forEach((name) => names.set(name.toLowerCase(), name));
    return [...names.values()].sort((left, right) => left.localeCompare(right));
  }, [gaps, courses, skillOptions]);

  useEffect(() => {
    if (requestedGap || requestedSkill) setTab('Gaps');
  }, [requestedGap, requestedSkill]);

  useEffect(() => {
    if (tab !== 'Gaps' || !linkedGap) return;
    document.getElementById(`lr-gap-${linkedGap.source_gap_reference}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [tab, linkedGap]);

  useEffect(() => {
    setPicked((current) => {
      const next = { ...current };
      let changed = false;
      gaps.forEach((gap) => {
        if (next[gap.source_gap_reference]) return;
        next[gap.source_gap_reference] = coursesForGap(courses, gap).slice(0, 3).map((course) => course.id);
        changed = true;
      });
      return changed ? next : current;
    });
  }, [gaps, courses]);

  const toggleCourse = (gapId: string, courseId: string) => {
    setPicked((current) => {
      const selected = current[gapId] ?? [];
      return {
        ...current,
        [gapId]: selected.includes(courseId) ? selected.filter((id) => id !== courseId) : [...selected, courseId],
      };
    });
  };

  const generateFor = (gap: LearningSkillGap) => {
    const plan = plans.find((item) => item.id === gap.learning_plan_id);
    const onPlan = new Set(plan?.items.map((item) => item.course_id) ?? []);
    const courseIds = (picked[gap.source_gap_reference] ?? []).filter((id) => !onPlan.has(id));
    act(
      gap.source_gap_reference,
      () => learningRecommendationAPI.createPlan(currentEmployee!.id, gap.source_gap_reference, courseIds),
      gap.learning_plan_id ? `${courseIds.length} course${courseIds.length === 1 ? '' : 's'} added to the ${gap.skill} plan.` : `${gap.skill} learning plan is open.`,
      true,
    );
  };

  const openPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setTab('Plans');
  };

  const visibleCourses = useMemo(() => {
    const gapNames = new Set(gaps.map((gap) => gap.skill.toLowerCase()));
    const relevance = (course: LearningCourse) => course.skills.filter((skill) => gapNames.has(skill.skill_name.toLowerCase())).length;
    return courses
      .filter((course) => {
        if (difficulty && course.difficulty_level !== difficulty) return false;
        if (modality && course.modality !== modality) return false;
        if (mandatoryOnly && !course.is_mandatory) return false;
        if (strategicOnly && !course.strategic_priority_flag) return false;
        if (assessmentOnly && !course.has_assessment) return false;
        if (skillFilter && !`${course.course_title} ${course.skills.map((skill) => skill.skill_name).join(' ')}`.toLowerCase().includes(skillFilter.toLowerCase())) return false;
        return true;
      })
      .sort((left, right) => {
        if (sortBy === 'Hours') return left.duration_hours - right.duration_hours;
        if (sortBy === 'Cost') return left.cost_lkr - right.cost_lkr;
        return relevance(right) - relevance(left) || Number(right.strategic_priority_flag) - Number(left.strategic_priority_flag) || left.course_title.localeCompare(right.course_title);
      });
  }, [courses, gaps, difficulty, modality, mandatoryOnly, strategicOnly, assessmentOnly, skillFilter, sortBy]);

  const teamRows = (teamMissingOnly ? team?.strategic_gaps_without_plan : team?.strategic_gaps) ?? [];
  const filteredTeam = teamRows.filter((row) => {
    if (teamSkill && !row.skill.toLowerCase().includes(teamSkill.toLowerCase())) return false;
    if (teamEmployee && !String(row.employee).toLowerCase().includes(teamEmployee.toLowerCase())) return false;
    return true;
  });

  const gapForPlan = (plan: LearningPlan) => gaps.find((gap) => gap.source_gap_reference === plan.source_gap_reference)
    ?? gaps.find((gap) => plan.target_skill_ids.includes(gap.skill));
  const closureForPlan = (plan: LearningPlan) => closures.find((row) => row.source_gap_reference === plan.source_gap_reference);
  const assessmentForItem = (item: LearningPlanItem) => assessments
    .filter((row) => row.learning_plan_item_id === item.id)
    .sort((left, right) => (left.assessment_date || '').localeCompare(right.assessment_date || ''))
    .at(-1);

  return (
    <div className="learning-hub">
      {toast && createPortal(<div className={`lr-toast lr-toast--${toast.type}`}>{toast.message}</div>, document.body)}

      <div className="lh-page-head">
        <div>
          <h1 className="lh-page-head__title">Learning Recommendation</h1>
          <p className="lh-page-head__sub">
            {currentEmployee ? `${currentEmployee.full_name} · ${currentEmployee.role}` : 'Select an employee.'} Choose the courses for a skill gap, then generate that plan. Official proficiency changes only after a passed assessment is synchronized.
          </p>
        </div>
      </div>

      {error && (
        <div className="lr-note lr-note--bad"><AlertCircle size={14} className="inline mr-1" />{error}</div>
      )}

      {loading ? (
        <div className="lh-hero"><div className="lh-hero__inner"><Loader2 className="animate-spin" size={18} /> Reading skill gaps, plans, and the course catalogue…</div></div>
      ) : (
        <>
          <section className="lh-hero">
            <div className="lh-hero__glow lh-hero__glow--tr" />
            <div className="lh-hero__glow lh-hero__glow--bl" />
            <div className="lh-hero__inner">
              <div className="lh-score-badge" aria-hidden>
                <div className="lh-score-badge__ring" />
                <div className="lh-score-badge__core">
                  <span className="lh-score-badge__label">Gap</span>
                  <span className="lh-score-badge__num">{focusGap ? focusGap.gap_levels : 0}</span>
                </div>
              </div>
              <div className="lh-hero__main">
                <div className="lh-hero__kicker"><Sparkles size={12} /> What to learn next</div>
                {focusGap ? (
                  <>
                    <h2 className="lh-hero__name">{focusGap.skill}</h2>
                    <p className="lh-hero__courses">{focusGap.why}</p>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <Meter label="Current" level={shownLevels(focusGap).current} max={shownLevels(focusGap).scale} tone="now" />
                      <Meter label="Required" level={shownLevels(focusGap).required} max={shownLevels(focusGap).scale} tone="need" />
                    </div>
                    <div className="lr-pills" style={{ marginTop: '0.75rem' }}>
                      <span className={priorityClass(focusGap.priority_label)}>{focusGap.priority_label} priority {focusGap.priority_score}</span>
                      {focusGap.strategic && <span className="lr-pill lr-pill--violet">Strategic</span>}
                      {focusGap.mandatory && <span className="lr-pill lr-pill--high">Mandatory path</span>}
                    </div>
                    <p className="lh-hero__courses" style={{ marginTop: '0.7rem' }}>
                      {focusMatches.length ? focusMatches.slice(0, 3).map((course) => course.course_title).join(' · ') : 'No course currently raises this skill.'}
                    </p>
                    <div style={{ marginTop: '0.9rem' }}>
                      {focusGap.learning_plan_id ? (
                        <Button variant="secondary" onClick={() => openPlan(focusGap.learning_plan_id!)}>Open plan</Button>
                      ) : focusMatches.length === 0 ? (
                        <Button onClick={() => openCourseForm(focusGap)}>Create a course</Button>
                      ) : (
                        <Button disabled={busy === focusGap.source_gap_reference} onClick={() => generateFor(focusGap)}>Generate learning plan</Button>
                      )}
                    </div>
                  </>
                ) : (
                  <h2 className="lh-hero__name">No unresolved skill gaps</h2>
                )}
              </div>
              <div className="lh-stat-grid">
                <div className="lh-stat"><div><div className="lh-stat__label">Open gaps</div><div className="lh-stat__value">{gaps.length}</div></div></div>
                <div className="lh-stat"><div><div className="lh-stat__label">Active plans</div><div className="lh-stat__value">{activePlans.length}</div></div></div>
                <div className="lh-stat"><div><div className="lh-stat__label">Mandatory verified</div><div className="lh-stat__value">{ratioLabel(mandatory)}</div></div></div>
                <div className="lh-stat"><div><div className="lh-stat__label">Strategic verified</div><div className="lh-stat__value">{ratioLabel(strategic)}</div></div></div>
              </div>
            </div>
          </section>

          <div className="lh-tabs-wrap">
            <div className="lh-tabs" role="tablist">
              {TABS.map((item) => (
                <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'lh-tab lh-tab--active' : 'lh-tab'} onClick={() => setTab(item.id)}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          </div>
          {refreshing && <p className="text-xs font-semibold text-secondary">Refreshing records…</p>}

          {tab === 'Overview' && (
            <div className="lh-overview-grid">
              <GapBoard
                gaps={gaps}
                courses={courses}
                plans={plans}
                picked={picked}
                busy={busy}
                onToggle={toggleCourse}
                onGenerate={generateFor}
                onOpen={openPlan}
                onCreateCourse={openCourseForm}
                focusId={linkedGap?.source_gap_reference}
              />
              <div className="lh-stack">
                <Card glass={false} className="lh-section">
                  <h2 className="lh-section__title">Verified versus assigned</h2>
                  <p className="lh-section__sub">Completed courses stay out of both numbers until the assessment is passed and synced.</p>
                  <div className="lr-metric-grid" style={{ marginTop: '1rem' }}>
                    <div className="lr-metric"><span>Mandatory</span><strong>{ratioLabel(mandatory)}</strong><em>{mandatory ? `${mandatory.verified_completed}/${mandatory.assigned}` : '—'}</em></div>
                    <div className="lr-metric"><span>Strategic</span><strong>{ratioLabel(strategic)}</strong><em>{strategic ? `${strategic.verified_completed}/${strategic.assigned}` : '—'}</em></div>
                  </div>
                </Card>
                <Card glass={false} className="lh-section lr-side-scroll">
                  <h2 className="lh-section__title">Active plans</h2>
                  {activePlans.length === 0 ? <p className="lh-empty">No open plan. Choose courses on a skill gap and generate the plan.</p> : activePlans.map((plan) => (
                    <button key={plan.id} type="button" className="lr-plan-card" style={{ marginTop: '0.7rem' }} onClick={() => openPlan(plan.id)}>
                      <h3>{plan.title}</h3>
                      <div className="lh-progress-bar"><div className="lh-progress-bar__fill" style={{ width: `${plan.progress_pct}%` }} /></div>
                      <div className="lh-progress-bar__meta"><span>{plan.progress_pct}% complete</span><span>{plan.items.length} courses · {plan.total_estimated_hours}h</span></div>
                    </button>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {tab === 'Gaps' && (
            <>
              {linkedGap && (
                <p className="lr-note">Opened from the career roadmap. {linkedGap.skill} uses the same {shownLevels(linkedGap).current}/{shownLevels(linkedGap).scale} to {shownLevels(linkedGap).required}/{shownLevels(linkedGap).scale} bar. Choose courses below, then generate the plan.</p>
              )}
              <GapBoard
                gaps={linkedGap ? [linkedGap, ...gaps.filter((gap) => gap.source_gap_reference !== linkedGap.source_gap_reference)] : gaps}
                courses={courses}
                plans={plans}
                picked={picked}
                busy={busy}
                onToggle={toggleCourse}
                onGenerate={generateFor}
                onOpen={openPlan}
                onCreateCourse={openCourseForm}
                focusId={linkedGap?.source_gap_reference}
              />
            </>
          )}

          {tab === 'Plans' && (
            selectedPlan ? (
              <PlanDetail
                plan={selectedPlan}
                gap={gapForPlan(selectedPlan)}
                closure={closureForPlan(selectedPlan)}
                busy={busy}
                onBack={() => setSelectedPlanId(null)}
                onAct={act}
                onExam={openExam}
                assessmentForItem={assessmentForItem}
                onAbandon={() => { setAbandonReason(''); setAbandonPlanId(selectedPlan.id); }}
              />
            ) : (
              <div className="lr-plan-list">
                {plans.length === 0 ? <Card glass={false} className="lh-section"><p className="lh-empty">No learning plans yet. Generate one from a skill gap. Browsing the catalogue does not create a plan.</p></Card> : plans.map((plan) => (
                  <button key={plan.id} type="button" className="lr-plan-card" onClick={() => setSelectedPlanId(plan.id)}>
                    <div className="lr-pills">
                      <span className="lr-pill lr-pill--sky">{plan.plan_status}</span>
                      <span className="lr-pill">Priority {plan.priority_score}</span>
                    </div>
                    <h3 style={{ marginTop: '0.45rem' }}>{plan.title}</h3>
                    <p className="lr-step__meta">{plan.target_skill_ids.join(', ')} · {plan.total_estimated_hours}h · {plan.estimated_weeks} weeks · target {plan.target_completion_date}</p>
                    <div className="lh-progress-bar"><div className="lh-progress-bar__fill" style={{ width: `${plan.progress_pct}%` }} /></div>
                    <div className="lh-progress-bar__meta"><span>{plan.progress_pct}%</span><span>{plan.items.length} courses</span></div>
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'Catalogue' && (
            <div className="lh-stack">
              <div className="lh-section__head">
                <div>
                  <h2 className="lh-section__title">Course catalogue</h2>
                  <p className="lh-section__sub">A new course has to map to a skill already on record. Browsing here does not create a personal plan.</p>
                </div>
                <Button onClick={() => openCourseForm()}>New course</Button>
              </div>
              <div className="lr-filters">
                <input aria-label="Search courses" placeholder="Search title or skill" value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} />
                <select aria-label="Difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                  <option value="">All difficulties</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <select aria-label="Modality" value={modality} onChange={(event) => setModality(event.target.value)}>
                  <option value="">All modalities</option>
                  <option>Self-paced</option>
                  <option>Instructor-led</option>
                  <option>Cohort</option>
                  <option>On-the-job</option>
                </select>
                <select aria-label="Sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as 'Relevance' | 'Hours' | 'Cost')}>
                  <option>Relevance</option>
                  <option>Hours</option>
                  <option>Cost</option>
                </select>
                <label className="lr-check"><input type="checkbox" checked={mandatoryOnly} onChange={(event) => setMandatoryOnly(event.target.checked)} /> Mandatory</label>
                <label className="lr-check"><input type="checkbox" checked={strategicOnly} onChange={(event) => setStrategicOnly(event.target.checked)} /> Strategic</label>
                <label className="lr-check"><input type="checkbox" checked={assessmentOnly} onChange={(event) => setAssessmentOnly(event.target.checked)} /> Has assessment</label>
              </div>
              {visibleCourses.length === 0 ? (
                <Card glass={false} className="lh-section"><p className="lh-empty">No active courses currently cover this filter.</p></Card>
              ) : (
                <div className="lr-course-grid">
                  {visibleCourses.map((course) => (
                    <button key={course.id} type="button" className="lr-course" onClick={() => setSelectedCourse(course)}>
                      <div className="lr-pills">
                        <span className="lr-pill">{course.difficulty_level}</span>
                        {course.strategic_priority_flag && <span className="lr-pill lr-pill--violet">Strategic</span>}
                        {course.is_mandatory && <span className="lr-pill lr-pill--high">Mandatory</span>}
                        {!course.has_assessment && <span className="lr-pill">No assessment</span>}
                      </div>
                      <h3 style={{ marginTop: '0.55rem' }}>{course.course_title}</h3>
                      <p>{course.provider} · {course.modality} · {course.duration_hours}h · {money(course.cost_lkr)}</p>
                      <p>{course.skills.map((skill) => `${skill.skill_name} → level ${skill.level_delivered}`).join(' · ')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'Assessments' && (
            <div className="lh-stack">
              {assessments.length === 0 ? (
                <Card glass={false} className="lh-section"><p className="lh-empty">No assessments yet. Complete a course on a learning plan, then take the assessment from that plan.</p></Card>
              ) : assessments.map((item) => {
                const plan = plans.find((row) => row.items.some((entry) => entry.id === item.learning_plan_item_id));
                return <AssessmentCard key={item.id} item={item} busy={busy} onAct={act} planTitle={plan?.title} onOpenPlan={plan ? () => openPlan(plan.id) : undefined} />;
              })}
            </div>
          )}

          {tab === 'Record' && (
            <div className="lh-stack">
              {closures.length === 0 ? (
                <Card glass={false} className="lh-section"><p className="lh-empty">No verified skill gains yet. A passed assessment still has to synchronize before it appears here.</p></Card>
              ) : closures.map((item) => (
                <Card glass={false} className="lh-section" key={`${item.source_gap_reference}-${item.after_level}`}>
                  <div className="lr-pills"><span className="lr-pill lr-pill--low">{item.closure_status}</span><span className="lr-pill">Verified</span></div>
                  <h2 className="lh-section__title" style={{ marginTop: '0.55rem' }}>{item.skill_name}</h2>
                  <p className="lh-section__sub">Returned to source gap {item.source_gap_reference}</p>
                  <div className="mt-4 flex flex-wrap gap-6">
                    <Meter label="Before" level={item.before_level} tone="now" />
                    <Meter label="After" level={item.after_level} tone="gain" />
                    <Meter label="Required" level={item.required_level} tone="need" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === 'Team' && (
            <Card glass={false} className="lh-section">
              <div className="lh-section__head">
                <div>
                  <h2 className="lh-section__title">Team learning</h2>
                  <p className="lh-section__sub">{teamLoading ? 'Loading the people in scope…' : team?.scope || (team ? `${team.team_size} people in scope.` : 'Team metrics were not returned.')}</p>
                </div>
              </div>
              <div className="lr-metric-grid">
                <div className="lr-metric"><span>Mandatory</span><strong>{ratioLabel(team?.mandatory_compliance)}</strong></div>
                <div className="lr-metric"><span>Strategic coverage</span><strong>{ratioLabel(team?.strategic_coverage)}</strong></div>
                <div className="lr-metric"><span>Unverified passes</span><strong>{team?.unverified_completions?.length ?? 0}</strong></div>
              </div>
              <div className="lr-filters" style={{ marginTop: '1rem' }}>
                <input aria-label="Filter team by employee" placeholder="Employee" value={teamEmployee} onChange={(event) => setTeamEmployee(event.target.value)} />
                <input aria-label="Filter team by skill" placeholder="Skill" value={teamSkill} onChange={(event) => setTeamSkill(event.target.value)} />
                <label className="lr-check"><input type="checkbox" checked={teamMissingOnly} onChange={(event) => setTeamMissingOnly(event.target.checked)} /> Strategic gaps without a plan</label>
              </div>
              {filteredTeam.length === 0 ? (
                <p className="lh-empty">{team?.team_size ? 'No strategic gaps match this filter.' : 'No direct reports are on file for the selected employee, so there is no team learning to show.'}</p>
              ) : (
                <div className="lr-table-wrap" style={{ marginTop: '0.8rem' }}>
                  <table className="lr-table">
                    <thead><tr><th>Employee</th><th>Skill</th><th>Current</th><th>Required</th><th>Gap</th><th>Plan</th></tr></thead>
                    <tbody>
                      {filteredTeam.map((row: TeamGapRow) => (
                        <tr key={`${row.employee_id}-${row.skill}`}>
                          <td>{row.employee}</td>
                          <td>{row.skill}</td>
                          <td>{row.current_level}/5</td>
                          <td>{row.required_level}/5</td>
                          <td>{row.gap_levels}</td>
                          <td>{row.learning_plan_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {(team?.active_plans?.length ?? 0) > 0 && (
                <>
                  <h3 className="lh-section__title" style={{ marginTop: '1.25rem' }}>Active team plans</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {team!.active_plans.map((plan) => <li key={plan.id}>{plan.employee}: {plan.title} · {plan.total_estimated_hours}h · priority {plan.priority_score}</li>)}
                  </ul>
                </>
              )}
              {(team?.unverified_completions?.length ?? 0) > 0 && (
                <>
                  <h3 className="lh-section__title" style={{ marginTop: '1.25rem' }}>Passed, not yet verified</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {team!.unverified_completions.map((row) => <li key={`${row.employee}-${row.skill}`}>{row.employee}: {row.skill} scored {row.score}% · sync {row.sfa_sync_status}</li>)}
                  </ul>
                </>
              )}
            </Card>
          )}

          {tab === 'Organization' && (
            orgLoading || !org ? (
              <Card glass={false} className="lh-section">
                {orgLoading ? <p className="lh-empty">Loading organization learning…</p> : (
                  <>
                    <p className="lh-empty">Organization learning could not be loaded.</p>
                    <Button onClick={() => { setOrg(null); setOrgAttempted(false); }}>Try again</Button>
                  </>
                )}
              </Card>
            ) : (
            <div className="lh-stack">
              <div className="lr-metric-grid">
                <div className="lr-metric"><span>Mandatory compliance</span><strong>{ratioLabel(org.mandatory_compliance)}</strong><em>{org.mandatory_compliance.verified_completed}/{org.mandatory_compliance.assigned} verified</em></div>
                <div className="lr-metric"><span>Strategic coverage</span><strong>{ratioLabel(org.strategic_coverage)}</strong><em>{org.strategic_coverage.verified_completed}/{org.strategic_coverage.assigned} verified</em></div>
                <div className="lr-metric"><span>Verified skill gains</span><strong>{org.verified_skill_gains}</strong><em>{org.unverified_passes} passed and still unverified</em></div>
                <div className="lr-metric"><span>Learning hours</span><strong>{org.learning_hours}</strong><em>Open plans only</em></div>
                <div className="lr-metric"><span>Catalogue cost</span><strong>{money(org.catalogue_cost_lkr)}</strong><em>On open plans</em></div>
                <div className="lr-metric"><span>Abandoned plans</span><strong>{org.abandoned_plans}</strong></div>
              </div>
              {org.assessment_outcomes && (
                <Card glass={false} className="lh-section">
                  <h2 className="lh-section__title">Assessment outcomes</h2>
                  <div className="lr-pills" style={{ marginTop: '0.8rem' }}>
                    <span className="lr-pill lr-pill--low">Passed {org.assessment_outcomes.passed}</span>
                    <span className="lr-pill lr-pill--high">Failed {org.assessment_outcomes.failed}</span>
                    <span className="lr-pill">Pending sync {org.assessment_outcomes.pending_sync}</span>
                    <span className="lr-pill lr-pill--sky">Synced {org.assessment_outcomes.synced}</span>
                    <span className="lr-pill lr-pill--medium">Sync failed {org.assessment_outcomes.failed_sync}</span>
                  </div>
                </Card>
              )}
              <Card glass={false} className="lh-section">
                <h2 className="lh-section__title">Plans by organizational unit</h2>
                {(org.plans_by_department ?? []).length === 0 ? <p className="lh-empty">No learning plans are on file yet.</p> : (
                  <div className="lr-table-wrap" style={{ marginTop: '0.8rem' }}>
                    <table className="lr-table">
                      <thead><tr><th>Unit</th><th>Plans</th><th>Active</th><th>Abandoned</th><th>Hours</th></tr></thead>
                      <tbody>
                        {org.plans_by_department!.map((row) => (
                          <tr key={row.department}><td>{row.department}</td><td>{row.plans}</td><td>{row.active}</td><td>{row.abandoned}</td><td>{row.hours}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
              <Card glass={false} className="lh-section">
                <h2 className="lh-section__title">Courses with no plan usage</h2>
                <div className="lr-pills" style={{ marginTop: '0.8rem' }}>
                  {org.unused_active_courses.length === 0 ? <span className="lr-pill">Every active course is on a plan.</span> : org.unused_active_courses.map((title) => <span key={title} className="lr-pill">{title}</span>)}
                </div>
              </Card>
            </div>
            )
          )}
        </>
      )}

      <Modal isOpen={Boolean(selectedCourse)} onClose={() => setSelectedCourse(null)} title={selectedCourse?.course_title || 'Course'} maxWidthClass="max-w-xl">
        {selectedCourse && (
          <div className="space-y-3 text-sm">
            <div className="lr-pills">
              <span className="lr-pill">{selectedCourse.id}</span>
              <span className="lr-pill">{selectedCourse.difficulty_level}</span>
              <span className="lr-pill">{selectedCourse.modality}</span>
            </div>
            <p>{selectedCourse.provider} · {selectedCourse.duration_hours} hours · {money(selectedCourse.cost_lkr)}</p>
            <p><strong>Skills delivered</strong></p>
            <ul>{selectedCourse.skills.map((skill) => <li key={skill.skill_name}>{skill.skill_name} at level {skill.level_delivered}</li>)}</ul>
            <p>{selectedCourse.is_mandatory ? 'Mandatory for the mapped roles.' : 'Not a mandatory course.'} {selectedCourse.strategic_priority_flag ? 'Marked as a strategic priority.' : 'Not on the strategic list.'}</p>
            {selectedCourse.has_assessment ? (
              <p className="lr-note lr-note--ok">An assessment is available. Official proficiency still changes only after a pass is synchronized.</p>
            ) : (
              <p className="lr-note">This course does not currently provide an assessment, so completion alone cannot verify a proficiency change.</p>
            )}
            <p className="text-secondary">Browsing the catalogue does not assign this course. Use the action below when it should sit on a skill-gap plan.</p>
            {(() => {
              const gap = gaps.find((item) => selectedCourse.skills.some((skill) => skill.skill_name.toLowerCase() === item.skill.toLowerCase() && skill.level_delivered > item.current_level));
              if (!gap) return <p className="lr-note">This course does not raise an open skill gap for the selected employee.</p>;
              if (gap.learning_plan_id) {
                return <Button disabled={busy === gap.learning_plan_id} onClick={() => act(gap.learning_plan_id!, () => learningRecommendationAPI.addCourseToPlan(gap.learning_plan_id!, selectedCourse.id), `${selectedCourse.course_title} was added to the ${gap.skill} plan.`, true).then(() => setSelectedCourse(null))}>Add to the {gap.skill} plan</Button>;
              }
              return <Button disabled={busy === gap.source_gap_reference} onClick={() => act(gap.source_gap_reference, () => learningRecommendationAPI.createPlan(currentEmployee!.id, gap.source_gap_reference, [selectedCourse.id]), `${gap.skill} learning plan is open.`, true).then(() => setSelectedCourse(null))}>Generate a {gap.skill} plan with this course</Button>;
            })()}
          </div>
        )}
      </Modal>

      <Modal isOpen={courseForm.open} onClose={() => setCourseForm((current) => ({ ...current, open: false }))} title="Create a course" maxWidthClass="max-w-xl">
        <div className="space-y-3 text-sm">
          <p className="text-secondary">The course stays in the catalogue. Official proficiency does not change when a course is created or completed.</p>
          <label className="block space-y-1">
            <span className="font-semibold">Title</span>
            <input className="lr-field w-full" value={courseForm.title} onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="font-semibold">Skill</span>
              <select className="lr-field w-full" value={courseForm.skill} onChange={(event) => setCourseForm((current) => ({ ...current, skill: event.target.value }))}>
                <option value="">Choose a skill</option>
                {(courseForm.skill && !knownSkills.some((name) => name.toLowerCase() === courseForm.skill.toLowerCase()) ? [courseForm.skill, ...knownSkills] : knownSkills).map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Level delivered</span>
              <select className="lr-field w-full" value={courseForm.level} onChange={(event) => setCourseForm((current) => ({ ...current, level: Number(event.target.value) }))}>
                {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Provider</span>
              <input className="lr-field w-full" value={courseForm.provider} onChange={(event) => setCourseForm((current) => ({ ...current, provider: event.target.value }))} />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Modality</span>
              <select className="lr-field w-full" value={courseForm.modality} onChange={(event) => setCourseForm((current) => ({ ...current, modality: event.target.value }))}>
                <option>Self-paced</option>
                <option>Instructor-led</option>
                <option>Cohort</option>
                <option>On-the-job</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Difficulty</span>
              <select className="lr-field w-full" value={courseForm.difficulty} onChange={(event) => setCourseForm((current) => ({ ...current, difficulty: event.target.value }))}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Hours</span>
              <input className="lr-field w-full" type="number" min={1} max={300} value={courseForm.hours} onChange={(event) => setCourseForm((current) => ({ ...current, hours: event.target.value }))} />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Cost (LKR)</span>
              <input className="lr-field w-full" type="number" min={0} value={courseForm.cost} onChange={(event) => setCourseForm((current) => ({ ...current, cost: event.target.value }))} />
            </label>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={courseForm.assessment} onChange={(event) => setCourseForm((current) => ({ ...current, assessment: event.target.checked }))} /> Include an assessment</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={courseForm.strategic} onChange={(event) => setCourseForm((current) => ({ ...current, strategic: event.target.checked }))} /> Strategic priority</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={courseForm.mandatory} onChange={(event) => setCourseForm((current) => ({ ...current, mandatory: event.target.checked }))} /> Mandatory</label>
          {courseForm.mandatory && (
            <label className="block space-y-1">
              <span className="font-semibold">Roles (comma separated)</span>
              <input className="lr-field w-full" value={courseForm.roles} onChange={(event) => setCourseForm((current) => ({ ...current, roles: event.target.value }))} />
            </label>
          )}
          {courseForm.sourceGap && !courseForm.planId && (
            <label className="flex items-center gap-2"><input type="checkbox" checked={courseForm.generatePlan} onChange={(event) => setCourseForm((current) => ({ ...current, generatePlan: event.target.checked }))} /> Generate a learning plan for this gap</label>
          )}
          {courseForm.planId && (
            <label className="flex items-center gap-2"><input type="checkbox" checked={courseForm.addToPlan} onChange={(event) => setCourseForm((current) => ({ ...current, addToPlan: event.target.checked }))} /> Add this course to the open plan</label>
          )}
          <Button disabled={busy === 'course-create'} onClick={saveCourse}>Save course</Button>
        </div>
      </Modal>

      <Modal isOpen={Boolean(exam)} onClose={() => setExam(null)} title={exam ? `Assessment · ${exam.title}` : 'Assessment'} maxWidthClass="max-w-xl">
        {exam && (
          <div className="space-y-4 text-sm">
            <p className="text-secondary">Pass mark is 70%. Official proficiency stays unchanged until a pass is synchronized.</p>
            {exam.questions.map((question, index) => (
              <fieldset key={question.id} className="space-y-2">
                <legend className="font-semibold">{index + 1}. {question.prompt}</legend>
                {question.options.map((option, optionIndex) => (
                  <label key={option} className="flex items-start gap-2">
                    <input
                      type="radio"
                      name={question.id}
                      checked={choices[index] === optionIndex}
                      onChange={() => setChoices((current) => current.map((value, choiceIndex) => choiceIndex === index ? optionIndex : value))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>
            ))}
            <Button
              disabled={choices.some((choice) => choice < 0) || busy === exam.itemId}
              onClick={() => {
                const itemId = exam.itemId;
                act(itemId, () => learningRecommendationAPI.submitAssessment(itemId, choices), 'Assessment recorded from your answers. Official proficiency is still unchanged.').then(() => setExam(null));
              }}
            >
              Submit assessment
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(abandonPlanId)} onClose={() => setAbandonPlanId(null)} title="Abandon this learning plan" maxWidthClass="max-w-md">
        <div className="space-y-3">
          <p className="text-sm text-secondary">The plan stays on record. A reason is required, and the plan cannot be reopened.</p>
          <textarea className="lr-field w-full" rows={3} placeholder="Why is this plan being abandoned?" value={abandonReason} onChange={(event) => setAbandonReason(event.target.value)} />
          <Button
            variant="danger"
            disabled={!abandonReason.trim() || busy === abandonPlanId}
            onClick={() => {
              const planId = abandonPlanId!;
              act(planId, () => learningRecommendationAPI.abandonPlan(planId, abandonReason.trim()), 'Plan abandoned.').then(() => {
                setAbandonPlanId(null);
                setSelectedPlanId(null);
              });
            }}
          >
            Abandon plan
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const PlanDetail: React.FC<{
  plan: LearningPlan;
  gap?: LearningSkillGap;
  closure?: LearningClosure;
  busy: string | null;
  onBack: () => void;
  onAct: (key: string, work: () => Promise<unknown>, success: string) => Promise<void>;
  onExam: (item: LearningPlanItem) => void;
  assessmentForItem: (item: LearningPlanItem) => LearningAssessment | undefined;
  onAbandon: () => void;
}> = ({ plan, gap, closure, busy, onBack, onAct, onExam, assessmentForItem, onAbandon }) => {
  const expected = plan.items.reduce((sum, item) => sum + item.expected_proficiency_gain, 0);
  return (
    <Card glass={false} className="lh-section">
      <button type="button" className="lh-link-btn lr-back" onClick={onBack}>All plans</button>
      <div className="lr-pills">
        <span className="lr-pill lr-pill--sky">{plan.plan_status}</span>
        <span className="lr-pill">Priority {plan.priority_score}</span>
        {plan.abandonment_reason && <span className="lr-pill lr-pill--medium">Reason recorded</span>}
      </div>
      <h2 className="lh-section__title" style={{ marginTop: '0.6rem' }}>{plan.title}</h2>
      <p className="lh-section__sub">{plan.target_skill_ids.join(', ') || 'Skill plan'} · finish by {plan.target_completion_date} · about {plan.estimated_weeks} {plan.estimated_weeks === 1 ? 'week' : 'weeks'}</p>
      <div className="lr-metric-grid" style={{ marginTop: '1rem' }}>
        <div className="lr-metric"><span>Hours</span><strong>{plan.total_estimated_hours}</strong><em>About {plan.estimated_weeks} {plan.estimated_weeks === 1 ? 'week' : 'weeks'}</em></div>
        <div className="lr-metric"><span>Progress</span><strong>{plan.progress_pct}%</strong></div>
        <div className="lr-metric"><span>Expected gain</span><strong>+{expected}</strong><em>Across the sequenced courses</em></div>
      </div>
      <div className="lh-progress-bar"><div className="lh-progress-bar__fill" style={{ width: `${plan.progress_pct}%` }} /></div>
      {gap && (
        <div className="mt-4 flex flex-wrap gap-6">
          <Meter label="Current proficiency" level={shownLevels(gap).current} max={shownLevels(gap).scale} tone="now" />
          <Meter label="Target proficiency" level={shownLevels(gap).required} max={shownLevels(gap).scale} tone="need" />
        </div>
      )}
      {closure && <p className="lr-note lr-note--ok">{closure.closure_status}: {closure.before_level}/5 → {closure.after_level}/5 against required {closure.required_level}/5.</p>}
      {plan.abandonment_reason && <p className="lr-note">{plan.abandonment_reason}</p>}
      <ol className="lr-sequence" style={{ marginTop: '1.1rem' }}>
        {plan.items.map((item) => {
          const assessment = assessmentForItem(item);
          return (
            <li key={item.id} className="lr-step">
              <span className={stepClass(item.status)}>{item.sequence_order}</span>
              <div className="lr-step__card">
                <div className="lr-step__title">{item.course_title}</div>
                <div className="lr-step__meta">{item.status} · {item.difficulty_level} · {item.duration_hours}h · gap score {item.skill_gap_score} · expected gain +{item.expected_proficiency_gain}</div>
                {!item.has_assessment && <p className="lr-note">This course does not currently provide an assessment, so completion alone cannot verify a proficiency change.</p>}
                {assessment && <p className="lr-step__meta">Assessment {assessment.assessment_score_pct}% · {assessment.passed ? 'Passed' : 'Not passed'} · sync {assessment.sfa_sync_status}</p>}
                <div className="lr-step__actions">
                  {item.status === 'Recommended' && <Button size="sm" disabled={busy === item.id} onClick={() => onAct(item.id, () => learningRecommendationAPI.enroll(item.id), 'Enrolled.')}>Enroll</Button>}
                  {item.status === 'Enrolled' && <Button size="sm" disabled={busy === item.id} onClick={() => onAct(item.id, () => learningRecommendationAPI.setItemStatus(item.id, 'In Progress'), 'Marked in progress.')}>Start</Button>}
                  {item.status === 'In Progress' && <Button size="sm" disabled={busy === item.id} onClick={() => onAct(item.id, () => learningRecommendationAPI.setItemStatus(item.id, 'Completed'), 'Course completed. Proficiency stays unchanged until assessment and sync.')}>Mark complete</Button>}
                  {['Recommended', 'Enrolled', 'In Progress'].includes(item.status) && (
                    <Button size="sm" variant="ghost" disabled={busy === item.id} onClick={() => onAct(item.id, () => learningRecommendationAPI.setItemStatus(item.id, 'Skipped'), 'Course skipped.')}>Skip</Button>
                  )}
                  {item.status === 'Completed' && item.has_assessment && (!assessment || !assessment.passed) && (
                    <Button size="sm" disabled={busy === item.id} onClick={() => onExam(item)}>
                      {assessment ? 'Retry assessment' : 'Take assessment'}
                    </Button>
                  )}
                  {assessment?.passed && assessment.sfa_sync_status === 'Pending' && (
                    <Button size="sm" disabled={busy === assessment.id} onClick={() => onAct(assessment.id, () => learningRecommendationAPI.syncAssessment(assessment.id), 'Synchronization succeeded and the skill record was updated.')}>Sync proficiency</Button>
                  )}
                  {assessment?.sfa_sync_status === 'Failed' && (
                    <Button size="sm" disabled={busy === assessment.id} onClick={() => onAct(assessment.id, () => learningRecommendationAPI.retrySync(assessment.id), 'Retry succeeded and the skill record was updated.')}>Retry sync</Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {plan.plan_status === 'Active' && <div style={{ marginTop: '1rem' }}><Button variant="ghost" onClick={onAbandon}>Abandon plan</Button></div>}
    </Card>
  );
};

const AssessmentCard: React.FC<{
  item: LearningAssessment;
  busy: string | null;
  planTitle?: string;
  onOpenPlan?: () => void;
  onAct: (key: string, work: () => Promise<unknown>, success: string) => Promise<void>;
}> = ({ item, busy, onAct, planTitle, onOpenPlan }) => (
  <Card glass={false} className="lh-section">
    <div className="lr-pills">
      <span className={item.passed ? 'lr-pill lr-pill--low' : 'lr-pill lr-pill--high'}>{item.passed ? 'Passed' : 'Not passed'}</span>
      <span className="lr-pill">SF-A {item.sfa_sync_status}</span>
      <span className={item.proficiency_verified_flag ? 'lr-pill lr-pill--low' : 'lr-pill'}>{item.proficiency_verified_flag ? 'Proficiency verified' : 'Not verified'}</span>
    </div>
    <h2 className="lh-section__title" style={{ marginTop: '0.55rem' }}>{item.skill_name}</h2>
    <div className="lr-metric-grid" style={{ marginTop: '0.9rem' }}>
      <div className="lr-metric"><span>Before</span><strong>{item.proficiency_before}/5</strong></div>
      <div className="lr-metric"><span>Score</span><strong>{item.assessment_score_pct}%</strong></div>
      <div className="lr-metric"><span>After</span><strong>{item.proficiency_verified_flag ? `${item.proficiency_after}/5` : 'Unchanged'}</strong></div>
    </div>
    {item.passed && item.sfa_sync_status === 'Pending' && <p className="lr-note">Assessment passed. Proficiency update is awaiting synchronization.</p>}
    {item.sfa_sync_status === 'Failed' && <p className="lr-note lr-note--bad">Assessment passed, but the proficiency update could not be synchronized. Retry synchronization.</p>}
    {!item.passed && <p className="lr-note">Official proficiency unchanged. Continue learning and retry the assessment.</p>}
    <div className="lr-step__actions">
      {onOpenPlan && <Button size="sm" variant="secondary" onClick={onOpenPlan}>Open {planTitle || 'plan'}</Button>}
      {item.passed && item.sfa_sync_status === 'Pending' && <Button size="sm" disabled={busy === item.id} onClick={() => onAct(item.id, () => learningRecommendationAPI.syncAssessment(item.id), 'Synchronization succeeded and the skill record was updated.')}>Sync now</Button>}
      {item.sfa_sync_status === 'Failed' && <Button size="sm" disabled={busy === item.id} onClick={() => onAct(item.id, () => learningRecommendationAPI.retrySync(item.id), 'Retry succeeded and the skill record was updated.')}>Retry sync</Button>}
    </div>
  </Card>
);
