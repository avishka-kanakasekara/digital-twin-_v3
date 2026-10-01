import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, TrendingUp, Clock, CheckCircle, PlayCircle, BarChart3, Search,
  Flame, Brain, Sparkles, ChevronRight, Loader2, MessageSquare, RefreshCw, Send, Crosshair,
} from 'lucide-react';
import './LearningHub.css';
import {
  learningAPI,
  type LearnerProfile,
  type LearningPath,
  type LearningFeedItem,
  type Course,
  type SkillGap,
  type LearningChatMessage,
} from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';
import { Card } from '../../components/Card';

const SectionHead: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="lh-section__head">
    <div className="lh-section__title-row">
      <div className="lh-section__icon">{icon}</div>
      <div>
        <h2 className="lh-section__title">{title}</h2>
        {subtitle ? <p className="lh-section__sub">{subtitle}</p> : null}
      </div>
    </div>
    {action}
  </div>
);

const PRIORITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Critical: { color: 'var(--color-danger)', bg: 'var(--color-danger-light)', border: 'rgba(239,68,68,0.3)' },
  High: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)', border: 'rgba(245,158,11,0.3)' },
  Medium: { color: 'var(--color-info)', bg: 'rgba(14, 165, 233, 0.1)', border: 'rgba(14, 165, 233, 0.3)' },
};

const TYPE_ICONS: Record<string, string> = {
  article: '📰', video: '🎬', course: '🎓', paper: '📄', podcast: '🎙️',
};

function errMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// ─── Learner Stats Hero ───────────────────────────────────────
const LearnerHero: React.FC = () => {
  const { currentEmployee, loading: employeeLoading } = useEmployee();
  const navigate = useNavigate();
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeLoading) return;
    if (!currentEmployee) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    learningAPI.getProfile(currentEmployee.id)
      .then((profileData) => {
        setLearnerProfile({ ...profileData, name: profileData.name || currentEmployee.full_name });
      })
      .catch((err) => {
        setError(errMessage(err, 'Could not load learner profile.'));
        setLearnerProfile({
          name: currentEmployee.full_name,
          hours_this_month: 0,
          hours_this_year: 0,
          courses_completed: 0,
          courses_in_progress: 0,
          current_streak: 0,
          learning_score: 0,
          target_role: null,
        });
      })
      .finally(() => setLoading(false));
  }, [currentEmployee, employeeLoading]);

  if (employeeLoading || loading) return <div className="lh-loading"><Loader2 className="animate-spin" size={28} /></div>;
  if (!learnerProfile) return <div className="lh-empty">No learner profile yet. Select an employee after the list loads.</div>;

  const pct = Math.round((learnerProfile.courses_completed / Math.max(1, learnerProfile.courses_completed + learnerProfile.courses_in_progress)) * 100);
  const heroStats = [
    { label: 'Hours This Month', value: `${learnerProfile.hours_this_month}h`, icon: <Clock size={14} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)' },
    { label: 'Hours This Year', value: `${learnerProfile.hours_this_year}h`, icon: <BarChart3 size={14} />, color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
    { label: 'Courses Done', value: learnerProfile.courses_completed, icon: <CheckCircle size={14} />, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Streak', value: `${learnerProfile.current_streak}d`, icon: <Flame size={14} />, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  return (
    <div className="lh-hero">
      <div className="lh-hero__glow lh-hero__glow--tr" />
      <div className="lh-hero__glow lh-hero__glow--bl" />
      <div className="lh-hero__inner">
        <div className="lh-score-badge">
          <div className="lh-score-badge__ring" />
          <div className="lh-score-badge__core">
            <span className="lh-score-badge__label">Score</span>
            <span className="lh-score-badge__num">{learnerProfile.learning_score}</span>
          </div>
          <div className="lh-score-badge__live" />
        </div>

        <div className="lh-hero__main">
          <span className="lh-hero__kicker"><Sparkles size={12} /> {learnerProfile.target_role || 'Learning track'}</span>
          <div className="lh-hero__row">
            <h2 className="lh-hero__name">{learnerProfile.name}</h2>
            <span className="lh-hero__courses">
              {learnerProfile.courses_completed} of {learnerProfile.courses_completed + learnerProfile.courses_in_progress} courses
            </span>
          </div>
          <div className="lh-progress-bar">
            <div className="lh-progress-bar__fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="lh-progress-bar__meta">
            <span>{pct}% completion rate</span>
            <span>{learnerProfile.courses_in_progress} in progress</span>
          </div>
          {learnerProfile.target_role ? (
            <button type="button" className="lh-career-link" onClick={() => navigate('/career-coach')}>
              <Crosshair size={13} />
              Career goal: {learnerProfile.target_role}
              <ChevronRight size={13} />
            </button>
          ) : (
            <button type="button" className="lh-career-link" onClick={() => navigate('/career-coach')}>
              <Crosshair size={13} />
              Set a career goal to unlock better paths
              <ChevronRight size={13} />
            </button>
          )}
          {error && <p className="lh-inline-error mt-2">{error}</p>}
        </div>

        <div className="lh-stat-grid">
          {heroStats.map((s) => (
            <div key={s.label} className="lh-stat">
              <div className="lh-stat__icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <p className="lh-stat__label">{s.label}</p>
                <p className="lh-stat__value">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Learning Paths ───────────────────────────────────────────
const LearningPaths: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!currentEmployee) return;
    try {
      const paths = await learningAPI.getPaths(currentEmployee.id);
      setLearningPaths(paths || []);
      setError(null);
    } catch (err) {
      setLearningPaths([]);
      setError(errMessage(err, 'Could not load learning paths.'));
    }
  };

  useEffect(() => { load(); }, [currentEmployee]);

  const advancePath = async (path: LearningPath) => {
    if (!currentEmployee || path.progress >= 100) return;
    setBusyId(path.id);
    setError(null);
    try {
      const next = Math.min(100, (path.progress || 0) + 25);
      await learningAPI.updatePathProgress(currentEmployee.id, path.id, next);
      await load();
    } catch (err) {
      setError(errMessage(err, 'Failed to update path progress.'));
    } finally {
      setBusyId(null);
    }
  };

  const generate = async () => {
    if (!currentEmployee) return;
    setGenerating(true);
    setError(null);
    try {
      const paths = await learningAPI.generatePaths(currentEmployee.id);
      setLearningPaths(paths || []);
    } catch (err) {
      setError(errMessage(err, 'AI path generation failed. Please retry.'));
    } finally {
      setGenerating(false);
    }
  };

  if (!learningPaths.length) {
    return (
      <div className="lh-empty">
        No learning paths yet. Set a career goal, then generate a path from your skill gaps.
        {error && <p className="lh-inline-error">{error}</p>}
        {currentEmployee && (
          <button type="button" className="lh-primary-btn" onClick={generate} disabled={generating}>
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Generating…' : 'Generate AI path'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="lh-path-list">
      <div className="flex justify-end mb-3">
        <button type="button" className="lh-secondary-btn" onClick={generate} disabled={generating}>
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Generating…' : 'Regenerate AI path'}
        </button>
      </div>
      {error && <p className="lh-inline-error mb-3">{error}</p>}
      {learningPaths.map((path) => (
        <div key={path.id} className="lh-path-card">
          <div className="lh-path-card__head">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="lh-path-card__title">{path.title}</h4>
                {path.is_ai_recommended && (
                  <span className="lh-ai-badge"><Sparkles size={10} /> AI recommended</span>
                )}
              </div>
              <p className="lh-path-card__desc">{path.description}</p>
              {path.ai_rationale && <p className="lh-section__sub mt-1">{path.ai_rationale}</p>}
              <div className="lh-tag-row">
                {(path.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag} className="lh-tag">{tag}</span>
                ))}
                <span className="lh-meta-text">Due {path.due_date || 'TBD'}</span>
                <span className="lh-meta-text">~{path.estimated_hours}h</span>
                <span className="lh-meta-text">{path.platform}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="lh-path-card__progress-num">{path.progress}%</p>
              <p className="lh-path-card__progress-sub">{path.completed_courses}/{path.total_courses} courses</p>
            </div>
          </div>
          <div className="lh-path-card__foot">
            <div className="lh-progress-track">
              <div className="lh-progress-fill" style={{ width: `${path.progress}%` }} />
            </div>
            <button
              type="button"
              onClick={() => advancePath(path)}
              disabled={busyId === path.id || path.progress >= 100}
              className="lh-secondary-btn"
            >
              {path.progress >= 100 ? 'Completed' : busyId === path.id ? 'Updating…' : 'Log progress (+25%)'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── AI Learning Feed ─────────────────────────────────────────
const LearningFeed: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [learningFeed, setLearningFeed] = useState<LearningFeedItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!currentEmployee) return;
    try {
      const feed = await learningAPI.getFeed(currentEmployee.id);
      setLearningFeed(feed || []);
      setError(null);
    } catch (err) {
      setLearningFeed([]);
      setError(errMessage(err, 'Could not load learning feed.'));
    }
  };

  useEffect(() => { load(); }, [currentEmployee]);

  const refresh = async () => {
    if (!currentEmployee) return;
    setRefreshing(true);
    setError(null);
    setNotice(null);
    try {
      const feed = await learningAPI.refreshFeed(currentEmployee.id);
      setLearningFeed(feed || []);
      setNotice('Feed refreshed with latest AI recommendations.');
    } catch (err) {
      setError(errMessage(err, 'Feed refresh failed.'));
    } finally {
      setRefreshing(false);
    }
  };

  const openItem = async (item: LearningFeedItem) => {
    if (!currentEmployee || item.type !== 'course' || busyId) return;
    setBusyId(item.id);
    setNotice(null);
    setError(null);
    try {
      await learningAPI.enrollCourse(currentEmployee.id, item.id);
      setNotice(`Enrolled in “${item.title}”.`);
    } catch (err) {
      setError(errMessage(err, 'Could not enroll in this course.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button type="button" className="lh-secondary-btn" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {refreshing ? 'Refreshing…' : 'Refresh AI feed'}
        </button>
      </div>
      {notice && <p className="lh-inline-ok mb-2">{notice}</p>}
      {error && <p className="lh-inline-error mb-2">{error}</p>}
      {!learningFeed.length ? (
        <p className="lh-empty">No feed items yet. Complete your profile or refresh AI recommendations.</p>
      ) : (
        <div className="lh-feed-list">
          {learningFeed.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              role="button"
              tabIndex={0}
              onClick={() => openItem(item)}
              onKeyDown={(e) => e.key === 'Enter' && openItem(item)}
              className="lh-feed-item group"
            >
              <div className="lh-feed-item__icon">{TYPE_ICONS[item.type] || '📄'}</div>
              <div className="flex-1 min-w-0">
                <p className="lh-feed-item__title">{item.title}</p>
                <div className="lh-feed-item__meta">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{item.read_time}</span>
                  <span>·</span>
                  <span>{item.published}</span>
                </div>
                <div className="lh-tag-row mt-1">
                  {(item.tags || []).slice(0, 3).map((tag) => (
                    <span key={tag} className="lh-tag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="lh-match-badge">{item.relevance}% match</span>
                {busyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} className="text-tertiary group-hover:text-[var(--lh-accent)]" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Course Library ───────────────────────────────────────────
const CourseLibrary: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [search, setSearch] = useState('');
  const [courseLibrary, setCourseLibrary] = useState<Course[]>([]);
  const [aiRecommended, setAiRecommended] = useState<Course[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCourses = async (q?: string) => {
    if (!currentEmployee) return;
    try {
      const [courses, recommended] = await Promise.all([
        learningAPI.getCourses({
          employee_id: currentEmployee.id,
          search: q || undefined,
        }),
        learningAPI.getCourses({
          employee_id: currentEmployee.id,
          ai_recommended: true,
        }),
      ]);
      setCourseLibrary(courses || []);
      setAiRecommended(recommended || []);
      setError(null);
    } catch (err) {
      setCourseLibrary([]);
      setAiRecommended([]);
      setError(errMessage(err, 'Could not load courses.'));
    }
  };

  useEffect(() => {
    loadCourses();
  }, [currentEmployee]);

  useEffect(() => {
    const t = window.setTimeout(() => loadCourses(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search, currentEmployee]);

  const handleCourseAction = async (course: Course) => {
    if (!currentEmployee || course.status === 'completed') return;
    setBusyId(course.id);
    setError(null);
    setNotice(null);
    try {
      if (course.status === 'available' || !course.status) {
        await learningAPI.enrollCourse(currentEmployee.id, course.id);
        setNotice(`Enrolled in “${course.title}”.`);
      } else if (course.status === 'in_progress') {
        const next = Math.min(100, (course.progress || 0) + 25);
        await learningAPI.updateCourseProgress(currentEmployee.id, course.id, next);
        setNotice(`Progress updated to ${next}%.`);
      }
      await loadCourses(search.trim());
    } catch (err) {
      setError(errMessage(err, 'Course action failed.'));
    } finally {
      setBusyId(null);
    }
  };

  const courseBtnClass = (course: Course) => {
    if (course.status === 'completed') return 'lh-course-btn lh-course-btn--done';
    if (course.status === 'in_progress') return 'lh-course-btn lh-course-btn--progress';
    return 'lh-course-btn lh-course-btn--enroll';
  };

  return (
    <div className="lh-stack">
      <div className="lh-search-bar">
        <div>
          <h3 className="lh-section__title flex items-center gap-2"><BookOpen size={20} className="text-[var(--lh-accent)]" /> Course library</h3>
          <p className="lh-section__sub mt-1">Searchable catalog of approved courses</p>
        </div>
        <div className="lh-search-input-wrap">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses or skills…"
            className="lh-search-input"
          />
        </div>
      </div>

      {notice && <p className="lh-inline-ok">{notice}</p>}
      {error && <p className="lh-inline-error">{error}</p>}

      {search === '' && aiRecommended.length > 0 && (
        <div className="lh-stack">
          <h4 className="lh-subsection-title"><Sparkles size={16} className="text-[var(--lh-violet)]" /> AI recommended for you</h4>
          <div className="lh-course-grid">
            {aiRecommended.map((course) => (
              <div key={`rec-${course.id}`} className="lh-course-card lh-course-card--featured">
                <span className="lh-course-card__match">{course.relevance ?? 90}% match</span>
                <div className="lh-course-card__top mt-2">
                  <div className="lh-course-card__emoji">{course.emoji || '📚'}</div>
                  <div>
                    <p className="lh-course-card__title">{course.title}</p>
                    <p className="lh-course-card__provider">{course.provider}</p>
                  </div>
                </div>
                <div className="lh-tag-row">
                  <span className="lh-tag">{course.level}</span>
                  <span className="lh-tag">{course.hours}h</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCourseAction(course)}
                  disabled={busyId === course.id}
                  className="lh-course-btn lh-course-btn--ghost"
                >
                  <PlayCircle size={14} /> {busyId === course.id ? 'Starting…' : 'Start course'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="lh-stack">
        <h4 className="lh-subsection-title"><BookOpen size={16} /> All courses</h4>
        {!courseLibrary.length && <p className="lh-empty">No courses match your search.</p>}
        <div className="lh-course-grid lh-course-grid--3">
          {courseLibrary.map((course) => (
            <div key={course.id} className="lh-course-card">
              <div className="lh-course-card__top">
                <div className="lh-course-card__emoji">{course.emoji || '📚'}</div>
                <div>
                  <p className="lh-course-card__title">{course.title}</p>
                  <p className="lh-course-card__provider">{course.provider}</p>
                </div>
              </div>
              <div className="lh-tag-row">
                <span className="lh-tag">{course.level}</span>
                <span className="lh-tag">{course.hours}h</span>
                <span className="lh-tag">★ {course.rating}</span>
              </div>
              {course.status === 'in_progress' && course.progress !== undefined && (
                <div className="lh-progress-track">
                  <div className="lh-progress-fill" style={{ width: `${course.progress}%`, background: 'var(--color-warning)' }} />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleCourseAction(course)}
                disabled={busyId === course.id || course.status === 'completed'}
                className={courseBtnClass(course)}
              >
                {course.status !== 'completed' && <PlayCircle size={14} />}
                {busyId === course.id ? 'Saving…' : course.status === 'completed' ? '✓ Done' : course.status === 'in_progress' ? 'Continue (+25%)' : 'Enroll'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Skill Gap Analysis ───────────────────────────────────────
const SkillGapAnalysis: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentEmployee) return;
    setLoading(true);
    learningAPI.getSkillGaps(currentEmployee.id)
      .then((data) => {
        setSkillGaps(data?.gaps || []);
        setTargetRole(data?.target_role || '');
        setError(null);
      })
      .catch((err) => {
        setSkillGaps([]);
        setError(errMessage(err, 'Could not load skill gaps.'));
      })
      .finally(() => setLoading(false));
  }, [currentEmployee]);

  if (loading) return <div className="lh-loading"><Loader2 className="animate-spin" size={22} /></div>;

  return (
    <div className="lh-gap-list">
      {targetRole && (
        <div className="lh-gap-target">
          <span className="lh-gap-target__label">Target role</span>
          <span className="lh-gap-target__role">{targetRole}</span>
        </div>
      )}
      {error && <p className="lh-inline-error">{error}</p>}
      {!skillGaps.length && !error && <p className="lh-empty">No skill gaps found. Set a career goal to see personalized gaps.</p>}
      {skillGaps.map((gap, i) => {
        const ps = PRIORITY_STYLES[gap.priority] || PRIORITY_STYLES.Medium;
        return (
          <div key={`${gap.skill}-${i}`}>
            <div className="lh-gap-row__head">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="lh-gap-row__skill">{gap.skill}</span>
                <span className="lh-priority" style={{ background: ps.bg, color: ps.color, borderColor: ps.border }}>{gap.priority}</span>
              </div>
              <span className="lh-gap-row__levels">
                {gap.current_level}% → <strong>{gap.target_level}%</strong>
              </span>
            </div>
            <div className="lh-gap-track">
              <div className="lh-gap-track__target" style={{ width: `${gap.target_level}%` }} />
              <div className="lh-gap-track__current" style={{ width: `${gap.current_level}%` }} />
            </div>
            <p className="lh-gap-row__foot">
              Gap: {gap.gap} points · {gap.category}
              {gap.rationale ? ` · ${gap.rationale}` : ''}
            </p>
            {(gap.recommended_courses?.length || gap.recommended_paths?.length) ? (
              <div className="lh-tag-row mt-1">
                {(gap.recommended_courses || []).map((c) => (
                  <span key={`c-${c.title}`} className="lh-tag">Course: {c.title}</span>
                ))}
                {(gap.recommended_paths || []).map((p) => (
                  <span key={`p-${p.title}`} className="lh-tag">Path: {p.title}</span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// ─── AI Coach ─────────────────────────────────────────────────
const AICoach: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [messages, setMessages] = useState<LearningChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentEmployee) return;
    learningAPI.getChatHistory(currentEmployee.id)
      .then((rows) => setMessages(rows || []))
      .catch(() => setMessages([]));
  }, [currentEmployee]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text: string) => {
    if (!currentEmployee || !text.trim() || sending) return;
    const content = text.trim();
    setSending(true);
    setError(null);
    setNotice(null);
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInput('');
    try {
      const reply = await learningAPI.sendChatMessage(currentEmployee.id, content);
      setMessages((prev) => [...prev, { role: reply.role || 'assistant', content: reply.content }]);
    } catch (err) {
      setError(errMessage(err, 'AI Coach could not respond.'));
      setMessages((prev) => prev.slice(0, -1));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const suggestNextCourse = async () => {
    if (!currentEmployee) return;
    setBusyAction('course');
    setError(null);
    try {
      const recs = await learningAPI.getCourses({ employee_id: currentEmployee.id, ai_recommended: true });
      if (!recs?.length) {
        setNotice('No AI course recommendations yet. Refresh the feed or add skill gaps.');
        return;
      }
      const top = recs[0];
      setNotice(`Suggested next course: ${top.title} (${top.relevance ?? '—'}% match).`);
      await send(`Suggest how I should approach the course "${top.title}" given my skill gaps.`);
    } catch (err) {
      setError(errMessage(err, 'Could not suggest a course.'));
    } finally {
      setBusyAction(null);
    }
  };

  const generateCustomPath = async () => {
    if (!currentEmployee || !goal.trim()) {
      setError('Enter a goal first (e.g. Become a Cloud Architect).');
      return;
    }
    setBusyAction('path');
    setError(null);
    setNotice(null);
    try {
      const paths = await learningAPI.generatePaths(currentEmployee.id, goal.trim());
      const title = paths?.[0]?.title;
      setNotice(title ? `Generated path: ${title}` : 'Custom path generated. Open Learning Paths to view it.');
      await send(`I just generated a learning path for the goal: "${goal.trim()}". Summarize what I should do first.`);
    } catch (err) {
      setError(errMessage(err, 'Custom path generation failed.'));
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="lh-coach">
      <div className="lh-coach__actions">
        <button type="button" className="lh-secondary-btn" onClick={suggestNextCourse} disabled={!!busyAction || sending}>
          {busyAction === 'course' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Suggest my next course
        </button>
        <div className="lh-coach__goal-row">
          <input
            className="lh-search-input"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Custom goal — e.g. Become a Cloud Architect"
          />
          <button type="button" className="lh-primary-btn" onClick={generateCustomPath} disabled={!!busyAction || sending}>
            {busyAction === 'path' ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            Generate path
          </button>
        </div>
      </div>

      {notice && <p className="lh-inline-ok">{notice}</p>}
      {error && <p className="lh-inline-error">{error}</p>}

      <div className="lh-coach__thread">
        {!messages.length && (
          <p className="lh-empty">Ask anything about your growth plan. Answers are grounded in your real twin profile and skill gaps.</p>
        )}
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}-${m.created_at || ''}`} className={`lh-coach__bubble lh-coach__bubble--${m.role === 'user' ? 'user' : 'assistant'}`}>
            <span className="lh-coach__role">{m.role === 'user' ? 'You' : 'AI Coach'}</span>
            <p>{m.content}</p>
          </div>
        ))}
        {sending && (
          <div className="lh-coach__bubble lh-coach__bubble--assistant">
            <span className="lh-coach__role">AI Coach</span>
            <p className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Thinking…</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="lh-coach__composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="lh-search-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What should I learn to reach my target role?"
          disabled={sending}
        />
        <button type="submit" className="lh-primary-btn" disabled={sending || !input.trim()}>
          <Send size={14} /> Send
        </button>
      </form>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
type TabId = 'overview' | 'paths' | 'gaps' | 'courses' | 'coach';

export const LearningHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Sparkles size={14} /> },
    { id: 'paths', label: 'Learning Paths', icon: <TrendingUp size={14} /> },
    { id: 'gaps', label: 'Skill Gaps', icon: <Brain size={14} /> },
    { id: 'courses', label: 'Course Library', icon: <BookOpen size={14} /> },
    { id: 'coach', label: 'AI Coach', icon: <MessageSquare size={14} /> },
  ];

  return (
    <div className="learning-hub">
      <header className="lh-page-head">
        <div>
          <h1 className="lh-page-head__title">Learning Hub</h1>
          <p className="lh-page-head__sub">AI-powered development paths to upskill, certify, and close skill gaps for your target role.</p>
        </div>
        <div className="lh-tabs-wrap">
          <div className="lh-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`lh-tab ${activeTab === tab.id ? 'lh-tab--active' : ''}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <LearnerHero />

      {activeTab === 'overview' && (
        <div className="lh-overview-grid">
          <div className="lh-stack">
            <Card glass={false} className="glass-panel lh-section">
              <SectionHead icon={<TrendingUp size={20} />} title="My learning paths" subtitle="Structured tracks toward your career goal" />
              <LearningPaths />
            </Card>

            <Card glass={false} className="glass-panel lh-section">
              <SectionHead
                icon={<Sparkles size={20} />}
                title="AI learning feed"
                subtitle="Curated articles, videos, and courses"
              />
              <LearningFeed />
            </Card>
          </div>

          <div className="lh-stack">
            <Card glass={false} className="glass-panel lh-section">
              <SectionHead
                icon={<Brain size={20} />}
                title="Skill gap analysis"
                subtitle="Where to focus next"
                action={<button type="button" className="lh-link-btn" onClick={() => setActiveTab('gaps')}>Details</button>}
              />
              <SkillGapAnalysis />
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'paths' && (
        <Card glass={false} className="glass-panel lh-section">
          <SectionHead icon={<TrendingUp size={20} />} title="All learning paths" subtitle="AI-generated and assigned development tracks" />
          <LearningPaths />
        </Card>
      )}

      {activeTab === 'gaps' && (
        <Card glass={false} className="glass-panel lh-section">
          <SectionHead icon={<Brain size={20} />} title="Detailed skill gaps" subtitle="Current vs target proficiency by skill" />
          <SkillGapAnalysis />
        </Card>
      )}

      {activeTab === 'courses' && (
        <Card glass={false} className="glass-panel lh-section">
          <CourseLibrary />
        </Card>
      )}

      {activeTab === 'coach' && (
        <Card glass={false} className="glass-panel lh-section">
          <SectionHead
            icon={<MessageSquare size={20} />}
            title="AI Coach"
            subtitle="Ask questions grounded in your twin profile, gaps, and learning history"
          />
          <AICoach />
        </Card>
      )}
    </div>
  );
};
