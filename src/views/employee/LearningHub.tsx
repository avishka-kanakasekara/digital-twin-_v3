import React, { useState } from 'react';
import {
  BookOpen, Brain, GraduationCap, Sparkles, Clock, Flame, CheckCircle2,
  TrendingUp, Play, Lock, ChevronRight, Search, BarChart3, Calendar
} from 'lucide-react';
import * as data from '../../dummy/employee/learningHubData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Design tokens ───────────────────────────────────────────
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  borderRadius: '20px',
  backdropFilter: 'blur(20px)',
};

const PRIORITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
  High:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)'   },
  Medium:   { color: '#22d3ee', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.3)'    },
};

const CERT_STATUS_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  completed:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)', label: 'Completed' },
  in_progress: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)', label: 'In Progress' },
  planned:     { color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', label: 'Planned' },
};

const TYPE_ICONS: Record<string, string> = {
  article: '📰', video: '🎬', course: '🎓', paper: '📄', podcast: '🎙️',
};

// ─── Shared ───────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="mb-5">
    <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon} {title}
    </h2>
    {subtitle && <p style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>{subtitle}</p>}
  </div>
);

const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ ...GLASS, ...style }}>{children}</div>
);

// ─── Learner Stats Hero ───────────────────────────────────────
const LearnerHero: React.FC = () => {
  const pct = Math.round((data.learnerProfile.coursesCompleted / (data.learnerProfile.coursesCompleted + data.learnerProfile.coursesInProgress + 3)) * 100);
  const heroStats = [
    { label: 'Hours This Month', value: `${data.learnerProfile.hoursThisMonth}h`, icon: <Clock size={13} />, color: '#22d3ee' },
    { label: 'Hours This Year',  value: `${data.learnerProfile.hoursThisYear}h`, icon: <BarChart3 size={13} />, color: '#a78bfa' },
    { label: 'Courses Done',     value: data.learnerProfile.coursesCompleted,      icon: <CheckCircle2 size={13} />, color: '#10b981' },
    { label: 'Streak',           value: `${data.learnerProfile.currentStreak}d 🔥`, icon: <Flame size={13} />, color: '#f97316' },
  ];

  return (
    <GlassCard style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="flex items-center gap-5 relative z-10 flex-wrap">
        {/* Score ring */}
        <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(226, 232, 240, 0.8)" strokeWidth="8" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="url(#scoreGrad)" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 34 * data.learnerProfile.learningScore / 100} ${2 * Math.PI * 34}`}
              strokeLinecap="round" transform="rotate(-90 40 40)" />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{data.learnerProfile.learningScore}</span>
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: '4px' }}>{data.learnerProfile.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Target Role:</span>
            <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.35)' }}>
              {data.learnerProfile.targetRole}
            </span>
          </div>
          <div style={{ height: '6px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed 0%, #22d3ee 100%)', borderRadius: '99px', boxShadow: '0 0 10px rgba(124,58,237,0.5)', transition: 'width 1s' }} />
          </div>
          <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginTop: '5px' }}>
            {data.learnerProfile.coursesCompleted} of {data.learnerProfile.coursesCompleted + data.learnerProfile.coursesInProgress + 3} learning goals completed
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
        {heroStats.map((s, i) => (
          <div key={i} style={{ padding: '10px', borderRadius: '12px', background: `${s.color}12`, border: `1px solid ${s.color}25`, textAlign: 'center' }}>
            <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>{s.icon}</div>
            <p style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{s.value}</p>
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ─── Learning Paths ───────────────────────────────────────────
const LearningPaths: React.FC = () => (
  <GlassCard style={{ padding: '1.5rem' }}>
    <SectionHeader icon={<TrendingUp size={14} style={{ color: '#a78bfa' }} />} title="My Learning Paths" subtitle="AI-curated paths based on your target role and skill gaps" />
    <div className="space-y-4">
      {data.learningPaths.map((path) => (
        <div key={path.id} style={{ padding: '18px', borderRadius: '16px', background: `${path.color}10`, border: `1px solid ${path.color}25`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${path.color}, ${path.color}88)` }} />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2 mb-1">
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{path.title}</h4>
                {path.recommended && (
                  <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.35)' }}>
                    ✦ AI Recommended
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '10px' }}>{path.description}</p>
              <div className="flex items-center gap-3 flex-wrap">
                {path.tags.map(tag => (
                  <span key={tag} style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: `${path.color}15`, color: path.color, border: `1px solid ${path.color}28` }}>{tag}</span>
                ))}
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>📅 Due {path.dueDate}</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>⏱ ~{path.estimatedHours}h total</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>📦 {path.platform}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{path.progress}%</p>
              <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{path.completedCourses}/{path.totalCourses} courses</p>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ height: '8px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${path.progress}%`, background: `linear-gradient(90deg, ${path.color}, ${path.color}cc)`, borderRadius: '99px', boxShadow: `0 0 10px ${path.color}60`, transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </GlassCard>
);

// ─── Skill Gap Analysis ───────────────────────────────────────
const SkillGapAnalysis: React.FC = () => (
  <GlassCard style={{ padding: '1.5rem' }}>
    <SectionHeader icon={<Brain size={14} style={{ color: '#22d3ee' }} />} title="Skill Gap Analysis" subtitle={`vs. ${data.learnerProfile.targetRole}`} />
    <div className="space-y-4">
      {data.skillGaps.map((gap, i) => {
        const ps = PRIORITY_STYLES[gap.priority] || PRIORITY_STYLES.Medium;
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{gap.skill}</span>
                <span style={{ padding: '2px 7px', borderRadius: '99px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>{gap.priority}</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{gap.currentLevel}% → {gap.targetLevel}%</span>
            </div>
            {/* Dual bar */}
            <div style={{ position: 'relative', height: '8px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '99px', overflow: 'hidden' }}>
              {/* Target bar (light) */}
              <div style={{ position: 'absolute', inset: 0, width: `${gap.targetLevel}%`, background: 'rgba(226, 232, 240, 0.8)', borderRadius: '99px' }} />
              {/* Current bar */}
              <div style={{ height: '100%', width: `${gap.currentLevel}%`, background: `linear-gradient(90deg, ${gap.color}, ${gap.color}cc)`, borderRadius: '99px', boxShadow: `0 0 8px ${gap.color}50`, transition: 'width 1s' }} />
            </div>
            <p style={{ fontSize: '9px', color: '#475569', fontWeight: 600, marginTop: '4px', textAlign: 'right' }}>Gap: {gap.gap} points · {gap.category}</p>
          </div>
        );
      })}
    </div>
  </GlassCard>
);

// ─── Certifications ───────────────────────────────────────────
const Certifications: React.FC = () => (
  <GlassCard style={{ padding: '1.5rem' }}>
    <SectionHeader icon={<GraduationCap size={14} style={{ color: '#fbbf24' }} />} title="Certification Tracker" subtitle="Professional credentials and exam schedule" />
    <div className="space-y-3">
      {data.certifications.map((cert) => {
        const cs = CERT_STATUS_STYLES[cert.status];
        return (
          <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '14px', background: `${cs.color}08`, border: `1px solid ${cs.border}`, transition: 'all 0.2s' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: `${cs.color}15`, border: `1px solid ${cs.border}` }}>
              {cert.emoji}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cert.name}</p>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{cert.issuer}</p>
              {cert.status === 'in_progress' && cert.progress !== undefined && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ height: '4px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cert.progress}%`, background: `linear-gradient(90deg, ${cs.color}, ${cs.color}cc)`, borderRadius: '99px' }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 800, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, display: 'block', marginBottom: '4px' }}>{cs.label}</span>
              <p style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>
                {cert.status === 'completed' ? `Score: ${cert.score}%` : cert.examDate ? `Exam: ${cert.examDate}` : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </GlassCard>
);

// ─── AI Learning Feed ─────────────────────────────────────────
const LearningFeed: React.FC = () => (
  <GlassCard style={{ padding: '1.5rem' }}>
    <SectionHeader icon={<Sparkles size={14} style={{ color: '#a78bfa' }} />} title="AI Learning Feed" subtitle="Curated content matched to your skill gaps" />
    <div className="space-y-3">
      {data.learningFeed.map((item) => (
        <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-white/[0.95] group/feed">
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', background: `${item.color}15`, border: `1px solid ${item.color}28` }}>
            {TYPE_ICONS[item.type]}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{item.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{item.source}</span>
              <span style={{ fontSize: '10px', color: '#475569' }}>·</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>⏱ {item.readTime}</span>
              <span style={{ fontSize: '10px', color: '#475569' }}>·</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{item.published}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {item.tags.slice(0, 2).map(tag => (
                <span key={tag} style={{ padding: '1px 6px', borderRadius: '5px', fontSize: '9px', fontWeight: 700, background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}28` }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 800, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>{item.relevance}% Match</span>
            <ChevronRight size={14} style={{ color: '#475569' }} />
          </div>
        </div>
      ))}
    </div>
  </GlassCard>
);

// ─── Course Library ───────────────────────────────────────────
const CourseLibrary: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = data.courseLibrary.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const STATUS_STYLE: Record<string, { color: string; label: string }> = {
    available:   { color: '#64748b', label: 'Enroll'     },
    in_progress: { color: '#f59e0b', label: 'Continue'   },
    completed:   { color: '#10b981', label: '✓ Done'      },
  };

  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={14} style={{ color: '#22d3ee' }} /> Course Library
          </h2>
          <p style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>Searchable catalog of approved courses</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            style={{ height: '34px', paddingLeft: '30px', paddingRight: '12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, background: 'rgba(248, 250, 252, 0.8)', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#0f172a', outline: 'none', width: '200px' }}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {filtered.map((course) => {
          const ss = STATUS_STYLE[course.status];
          return (
            <div key={course.id} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s' }} className="hover:bg-white/[0.95]">
              <div className="flex items-start gap-3">
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: `${course.color}15`, border: `1px solid ${course.color}28` }}>
                  {course.emoji}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{course.title}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{course.provider}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, background: 'rgba(248, 250, 252, 0.8)', color: '#64748b' }}>{course.level}</span>
                <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, background: 'rgba(248, 250, 252, 0.8)', color: '#64748b' }}>⏱ {course.hours}h</span>
                <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, background: 'rgba(248, 250, 252, 0.8)', color: '#64748b' }}>⭐ {course.rating}</span>
              </div>
              {course.status === 'in_progress' && course.progress !== undefined && (
                <div style={{ height: '4px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${course.progress}%`, background: '#f59e0b', borderRadius: '99px' }} />
                </div>
              )}
              <button style={{ padding: '7px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: course.status === 'completed' ? 'rgba(16,185,129,0.15)' : course.status === 'in_progress' ? 'rgba(245,158,11,0.15)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: course.status === 'completed' ? '#34d399' : course.status === 'in_progress' ? '#fbbf24' : 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {course.status !== 'completed' && <Play size={12} />} {ss.label}
              </button>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// ─── Weekly Schedule ──────────────────────────────────────────
const WeeklySchedule: React.FC = () => (
  <GlassCard style={{ padding: '1.5rem' }}>
    <SectionHeader icon={<Calendar size={14} style={{ color: '#10b981' }} />} title="This Week's Schedule" subtitle="Your personalized learning plan" />
    <div className="space-y-2">
      {data.weeklySchedule.map((session, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', borderRadius: '12px', background: session.status === 'completed' ? 'rgba(16,185,129,0.06)' : session.status === 'in_progress' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.9)', border: `1px solid ${session.status === 'completed' ? 'rgba(16,185,129,0.2)' : session.status === 'in_progress' ? 'rgba(245,158,11,0.2)' : 'rgba(226, 232, 240, 0.8)'}` }}>
          <div style={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>
            <p style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{session.day}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: session.status === 'upcoming' ? '#64748b' : '#0f172a' }}>{session.topic}</p>
            <p style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>⏱ {session.duration}</p>
          </div>
          <div>
            {session.status === 'completed'   && <CheckCircle2 size={16} style={{ color: '#10b981' }} />}
            {session.status === 'in_progress' && <Play size={16} style={{ color: '#f59e0b' }} />}
            {session.status === 'upcoming'    && <Lock size={14} style={{ color: '#475569' }} />}
          </div>
        </div>
      ))}
    </div>
  </GlassCard>
);

// ─── Hours Chart ──────────────────────────────────────────────
const HoursChart: React.FC = () => (
  <GlassCard style={{ padding: '1.5rem' }}>
    <SectionHeader icon={<BarChart3 size={14} style={{ color: '#a78bfa' }} />} title="Learning Hours" subtitle="Monthly learning time logged" />
    <div style={{ height: '180px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.monthlyHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.8)" />
          <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }} itemStyle={{ color: '#a78bfa' }} labelStyle={{ color: '#0f172a' }} cursor={{ fill: 'rgba(226, 232, 240, 0.8)' }} />
          <Bar dataKey="hours" name="Hours" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </GlassCard>
);

// ─── Main Page ────────────────────────────────────────────────
type TabId = 'overview' | 'paths' | 'gaps' | 'certs' | 'courses';

export const LearningHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview',       icon: <Sparkles size={13} />      },
    { id: 'paths',    label: 'Learning Paths', icon: <TrendingUp size={13} />    },
    { id: 'gaps',     label: 'Skill Gaps',     icon: <Brain size={13} />         },
    { id: 'certs',    label: 'Certifications', icon: <GraduationCap size={13} /> },
    { id: 'courses',  label: 'Course Library', icon: <BookOpen size={13} />      },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 30%, #f1f5f9 60%, #f8fafc 100%)', color: '#0f172a' }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(124,58,237,0.45)' }}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #7c3aed 0%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>
              Learning Hub
            </h1>
            <p style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>AI-powered personal learning & development · Upskill · Certify · Grow</p>
          </div>
        </div>

        {/* Hero Stats */}
        <LearnerHero />

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '6px', padding: '6px', borderRadius: '16px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226, 232, 240, 0.8)', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, background: activeTab === tab.id ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'transparent', color: activeTab === tab.id ? 'white' : '#64748b', border: 'none', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', boxShadow: activeTab === tab.id ? '0 0 15px rgba(124,58,237,0.35)' : 'none' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <LearningPaths />
              <LearningFeed />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <WeeklySchedule />
              <HoursChart />
              <SkillGapAnalysis />
            </div>
          </div>
        )}
        {activeTab === 'paths'   && <LearningPaths />}
        {activeTab === 'gaps'    && <SkillGapAnalysis />}
        {activeTab === 'certs'   && <Certifications />}
        {activeTab === 'courses' && <CourseLibrary />}
      </div>
    </div>
  );
};
