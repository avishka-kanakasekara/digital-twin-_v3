import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Clock, CheckCircle, PlayCircle, BarChart3, Calendar, Search, Flame, Brain, GraduationCap, Sparkles, ChevronRight, Lock, Loader2 } from 'lucide-react';
import { learningAPI } from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../components/Card';

const PRIORITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Critical: { color: 'var(--color-danger)', bg: 'var(--color-danger-light)',   border: 'rgba(239,68,68,0.3)'   },
  High:     { color: 'var(--color-warning)', bg: 'var(--color-warning-light)', border: 'rgba(245,158,11,0.3)'   },
  Medium:   { color: 'var(--color-info)', bg: 'rgba(14, 165, 233, 0.1)',  border: 'rgba(14, 165, 233, 0.3)'    },
};

const TYPE_ICONS: Record<string, string> = {
  article: '📰', video: '🎬', course: '🎓', paper: '📄', podcast: '🎙️',
};

// ─── Learner Stats Hero ───────────────────────────────────────
const LearnerHero: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [learnerProfile, setLearnerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEmployee) return;
    learningAPI.getProfile(currentEmployee.id).then(profileData => {
      setLearnerProfile({ ...profileData, name: currentEmployee.full_name });
      setLoading(false);
    });
  }, [currentEmployee]);

  if (loading || !learnerProfile) return <Card className="glass-panel p-6 flex justify-center"><Loader2 className="animate-spin text-primary" /></Card>;

  const pct = Math.round((learnerProfile.courses_completed / (learnerProfile.courses_completed + learnerProfile.courses_in_progress + 3)) * 100);
  const heroStats = [
    { label: 'Hours This Month', value: `${learnerProfile.hours_this_month}h`, icon: <Clock size={14} />, color: '#0ea5e9' },
    { label: 'Hours This Year',  value: `${learnerProfile.hours_this_year}h`, icon: <BarChart3 size={14} />, color: '#64748b' },
    { label: 'Courses Done',     value: learnerProfile.courses_completed,      icon: <CheckCircle size={14} />, color: '#10b981' },
    { label: 'Streak',           value: `${learnerProfile.current_streak}d`, icon: <Flame size={14} />, color: '#ef4444' },
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

        {/* Score Indicator */}
        <div className="relative shrink-0">
          <div style={{ position: 'absolute', inset: '-4px', borderRadius: '28px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #10b981 100%)', padding: '3px', filter: 'blur(0px)', boxShadow: '0 0 25px rgba(59,130,246,0.2)' }} />
          <div style={{
            position: 'relative', width: '100px', height: '100px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            color: 'white', boxShadow: '0 8px 30px rgba(59,130,246,0.2)',
          }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '21px', background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 100%)' }} />
            <span style={{ position: 'relative', zIndex: 1, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score</span>
            <span style={{ position: 'relative', zIndex: 1, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{learnerProfile.learning_score}</span>
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
              ✦ {learnerProfile.target_role || 'Cloud Architect'}
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, background: 'linear-gradient(90deg, #0f172a 0%, #334155 60%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {learnerProfile.name}
            </h2>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500">{learnerProfile.courses_completed} of {learnerProfile.courses_completed + learnerProfile.courses_in_progress + 3} goals</span>
            </div>
          </div>
          
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 relative shadow-inner mt-4">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
          </div>
        </div>

        {/* Quick Stats Column */}
        <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            {heroStats.map((s, i) => (
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

// ─── Learning Paths ───────────────────────────────────────────
const LearningPaths: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [learningPaths, setLearningPaths] = useState<any[]>([]);

  useEffect(() => {
    if (!currentEmployee) return;
    learningAPI.getPaths(currentEmployee.id).then(paths => setLearningPaths(paths || []));
  }, [currentEmployee]);

  return (
    <div className="flex flex-col gap-4">
      {learningPaths.map((path) => (
        <div 
          key={path.id} 
          className="p-5 bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary group"
        >
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h4 className="text-[14px] font-bold text-primary group-hover:text-primary transition-colors">{path.title}</h4>
                {path.is_ai_recommended && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold text-secondary bg-secondary/10 border border-secondary/20">
                    ✦ AI Recommended
                  </span>
                )}
              </div>
              <p className="text-[12px] text-secondary leading-relaxed mb-4">{path.description}</p>
              
              <div className="flex items-center gap-2 flex-wrap">
                {path.tags?.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-2 py-1 rounded-md text-[9px] font-bold bg-[var(--bg-main)] text-tertiary border border-[var(--border-subtle)]">
                    {tag}
                  </span>
                ))}
                <span className="text-[10px] text-secondary font-bold ml-2">📅 Due {path.due_date || 'TBD'}</span>
                <span className="text-[10px] text-secondary font-bold">⏱ ~{path.estimated_hours}h</span>
                <span className="text-[10px] text-secondary font-bold">📦 {path.platform}</span>
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <p className="text-2xl font-extrabold text-primary mb-1">{path.progress}%</p>
              <p className="text-[9px] text-tertiary font-bold uppercase tracking-wider">{path.completed_courses}/{path.total_courses} courses</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-subtle)] shadow-inner">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-primary" 
                style={{ width: `${path.progress}%` }} 
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── AI Learning Feed ─────────────────────────────────────────
const LearningFeed: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [learningFeed, setLearningFeed] = useState<any[]>([]);

  useEffect(() => {
    if (!currentEmployee) return;
    learningAPI.getFeed(currentEmployee.id).then(feed => setLearningFeed(feed || []));
  }, [currentEmployee]);

  return (
    <div className="flex flex-col gap-3">
      {learningFeed.map((item) => (
        <div 
          key={item.id} 
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
            {TYPE_ICONS[item.type] || '📄'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-primary truncate leading-tight group-hover:text-primary transition-colors">{item.title}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] text-secondary font-bold">{item.source}</span>
              <span className="text-[10px] text-tertiary">•</span>
              <span className="text-[10px] text-secondary font-bold">⏱ {item.read_time}</span>
              <span className="text-[10px] text-tertiary">•</span>
              <span className="text-[10px] text-secondary font-bold">{item.published}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {(item.tags || []).slice(0, 3).map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[var(--bg-main)] text-tertiary border border-[var(--border-subtle)]">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="px-2 py-1 rounded-md text-[9px] font-bold bg-success/10 text-success border border-success/20">
              {item.relevance}% Match
            </span>
            <ChevronRight size={14} className="text-tertiary group-hover:text-primary transition-colors mt-auto" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Course Library ───────────────────────────────────────────
const CourseLibrary: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [search, setSearch] = useState('');
  const [courseLibrary, setCourseLibrary] = useState<any[]>([]);

  useEffect(() => {
    if (!currentEmployee) return;
    learningAPI.getCourses({ employee_id: currentEmployee.id }).then(courses => setCourseLibrary(courses || []));
  }, [currentEmployee]);

  const filtered = courseLibrary.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.tags && c.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())))
  );

  const aiRecommended = courseLibrary.slice(0, 2);

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[var(--border-subtle)]">
        <div>
          <h3 className="text-lg font-extrabold text-primary flex items-center gap-3">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><BookOpen size={20} /></div>
            Course Library
          </h3>
          <p className="text-xs text-secondary mt-1">Searchable catalog of approved courses.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses or skills..."
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm font-bold bg-white border border-[var(--border-subtle)] text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>
      </Card>

      {search === '' && aiRecommended.length > 0 && (
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-extrabold text-primary flex items-center gap-2">
            <Sparkles size={16} className="text-secondary" /> AI Recommended For You
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
            {aiRecommended.map((course) => (
              <div 
                key={`rec-${course.id}`} 
                className="p-5 bg-white rounded-xl border border-secondary/30 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md hover:border-secondary group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-secondary/10 text-secondary text-[9px] font-extrabold px-3 py-1 rounded-bl-xl border-b border-l border-secondary/20">
                  98% MATCH
                </div>
                <div className="flex items-start gap-4 mt-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-secondary/20 bg-secondary/5 shrink-0 group-hover:scale-110 transition-transform">
                    {course.emoji || '📚'}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-primary leading-tight mb-1">{course.title}</p>
                    <p className="text-[11px] text-secondary font-medium">{course.provider}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-[var(--bg-main)] text-tertiary border border-[var(--border-subtle)]">{course.level}</span>
                  <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-[var(--bg-main)] text-tertiary border border-[var(--border-subtle)]">⏱ {course.hours}h</span>
                </div>
                <button className="w-full py-2 mt-auto rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-[var(--bg-main)] text-primary border border-[var(--border-subtle)] hover:bg-primary hover:text-white hover:border-primary">
                  <PlayCircle size={14} /> Start Course
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-extrabold text-primary flex items-center gap-2">
          <BookOpen size={16} className="text-tertiary" /> All Courses
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((course) => (
          <div 
            key={course.id} 
            className="p-5 bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm flex flex-col gap-4 transition-all hover:shadow-md hover:border-primary group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-[var(--border-subtle)] bg-[var(--bg-main)] shrink-0 group-hover:scale-110 transition-transform">
                {course.emoji || '📚'}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-primary leading-tight mb-1">{course.title}</p>
                <p className="text-[11px] text-secondary font-medium">{course.provider}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-[var(--bg-main)] text-tertiary border border-[var(--border-subtle)]">{course.level}</span>
              <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-[var(--bg-main)] text-tertiary border border-[var(--border-subtle)]">⏱ {course.hours}h</span>
              <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-[var(--bg-main)] text-tertiary border border-[var(--border-subtle)]">⭐ {course.rating}</span>
            </div>

            {course.status === 'in_progress' && course.progress !== undefined && (
              <div className="h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-subtle)] shadow-inner">
                <div 
                  className="h-full rounded-full bg-warning transition-all" 
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            )}

            <button 
              className={`w-full py-2 mt-auto rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                course.status === 'completed' ? 'bg-success/10 text-success border border-success/20' : 
                course.status === 'in_progress' ? 'bg-warning/10 text-warning border border-warning/20 hover:bg-warning hover:text-white' : 
                'bg-primary text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              {course.status !== 'completed' && <PlayCircle size={14} />} 
              {course.status === 'completed' ? '✓ Done' : course.status === 'in_progress' ? 'Continue' : 'Enroll'}
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
  const [skillGaps, setSkillGaps] = useState<any[]>([]);
  const [targetRole, setTargetRole] = useState('');

  useEffect(() => {
    if (!currentEmployee) return;
    learningAPI.getSkillGaps(currentEmployee.id).then(data => {
      setSkillGaps(data?.gaps || []);
      setTargetRole(data?.target_role || 'Cloud Architect');
    });
  }, [currentEmployee]);

  return (
    <div className="flex flex-col gap-5">
      {skillGaps.map((gap, i) => {
        const ps = PRIORITY_STYLES[gap.priority] || PRIORITY_STYLES.Medium;
        return (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-primary">{gap.skill}</span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border" style={{ background: ps.bg, color: ps.color, borderColor: ps.border }}>{gap.priority}</span>
              </div>
              <span className="text-[10px] font-bold text-secondary">{gap.current_level}% → <span className="text-primary font-extrabold">{gap.target_level}%</span></span>
            </div>
            
            <div className="relative h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-subtle)] shadow-inner">
              {/* Target Indicator */}
              <div className="absolute inset-y-0 bg-tertiary/20" style={{ left: 0, width: `${gap.target_level}%` }} />
              {/* Current Progress */}
              <div 
                className="h-full rounded-full relative z-10 transition-all duration-1000 bg-primary" 
                style={{ width: `${gap.current_level}%` }} 
              />
            </div>
            <p className="text-[9px] text-tertiary font-bold text-right">Gap: {gap.gap} points · {gap.category}</p>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
type TabId = 'overview' | 'paths' | 'gaps' | 'courses';

export const LearningHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview',       icon: <Sparkles size={14} />      },
    { id: 'paths',    label: 'Learning Paths', icon: <TrendingUp size={14} />    },
    { id: 'gaps',     label: 'Skill Gaps',     icon: <Brain size={14} />         },
    { id: 'courses',  label: 'Course Library', icon: <BookOpen size={14} />      },
  ];

  return (
    <div className="flex flex-col gap-6 relative pb-8 w-full">
      
      {/* Header */}
      <div className="z-10 mb-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">Learning Hub</h1>
          <p className="text-base text-slate-500 font-medium mt-0.5">AI-powered development paths to upskill and certify.</p>
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

      {/* Hero Stats */}
      <LearnerHero />

      {/* Main Content Areas */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-6">
            <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><TrendingUp size={20} /></div>
                My Learning Paths
              </h3>
              <LearningPaths />
            </Card>
            
            <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Sparkles size={20} /></div>
                AI Learning Feed
              </h3>
              <LearningFeed />
            </Card>
          </div>
          
          <div className="col-span-1 flex flex-col gap-6">
            <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Brain size={20} /></div>
                Skill Gap Analysis
              </h3>
              <SkillGapAnalysis />
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'paths' && (
        <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><TrendingUp size={20} /></div>
            All Learning Paths
          </h3>
          <LearningPaths />
        </Card>
      )}

      {activeTab === 'gaps' && (
        <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-extrabold text-primary flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Brain size={20} /></div>
            Detailed Skill Gaps
          </h3>
          <SkillGapAnalysis />
        </Card>
      )}

      {activeTab === 'courses' && (
        <CourseLibrary />
      )}

    </div>
  );
};
