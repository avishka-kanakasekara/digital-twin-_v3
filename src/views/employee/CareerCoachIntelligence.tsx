import React, { useState, useEffect } from 'react';
import {
  Target, BookOpen, Briefcase,
  CheckCircle2, ArrowRight, Trophy,
  Bot, ChevronRight, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredNotifications, markNotificationApplied, type RoleNotification } from '../../lib/roleNotificationsStore';

export const CareerCoachIntelligence: React.FC = () => {
  const [notifications, setNotifications] = useState<RoleNotification[]>([]);
  const [aspiration, setAspiration] = useState('Senior AI Platform Architect');
  const [isEditingAspiration, setIsEditingAspiration] = useState(false);
  const targetTimeline = '6 Months';
  const weeklyCommitment = '5h / week';
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Gamification rewards earned
  const [gamificationPoints, setGamificationPoints] = useState(650);
  const gamificationLevel = 'Level 4: Talent Explorer';

  const reloadNotifications = () => {
    setNotifications(getStoredNotifications());
  };

  useEffect(() => {
    reloadNotifications();
    window.addEventListener('role_notifications_updated', reloadNotifications);
    return () => {
      window.removeEventListener('role_notifications_updated', reloadNotifications);
    };
  }, []);

  const handleApply = (id: string, title: string) => {
    markNotificationApplied(id);
    setGamificationPoints(prev => prev + 150);
    setAppliedToast(`Application submitted for "${title}"! +150 XP rewarded to your Gamification Hub.`);
    setTimeout(() => setAppliedToast(null), 4000);
  };

  const employeeSkills = [
    { name: 'Cloud Architecture (AWS/GCP)', level: 'Advanced (9/10)' },
    { name: 'Kubernetes & Containers', level: 'Advanced (8/10)' },
    { name: 'Distributed Systems & Python', level: 'Advanced (8/10)' },
    { name: 'CI/CD & DevOps Automation', level: 'Proficient (7/10)' },
  ];

  const employeeQualifications = [
    'B.Sc. in Computer Science & Engineering',
    'Certified Kubernetes Administrator (CKA)',
    'AWS Solutions Architect Professional',
  ];

  return (
    <div className="flex flex-col gap-6 w-full text-left mb-6">
      {/* Toast Alert */}
      {appliedToast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-semibold">
            <Trophy size={16} className="text-amber-400 shrink-0" />
            <span>{appliedToast}</span>
          </div>
        </div>
      )}

      {/* 1. Skills, Qualifications & Career Aspiration Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Target size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  1. Skills, Qualifications & Career Aspiration
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Verified Talent Profile
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Foundational employee qualifications synchronized with your digital twin
              </p>
            </div>
          </div>

          {/* Gamification Hub Reward Badge */}
          <Link
            to="/gamification-hub"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 transition-all text-xs"
          >
            <Trophy size={16} className="text-amber-600" />
            <div>
              <div className="font-bold text-amber-900 leading-tight flex items-center gap-1">
                <span>{gamificationPoints} XP</span>
                <span className="text-[10px] font-normal text-amber-700">• {gamificationLevel}</span>
              </div>
              <div className="text-[10px] text-amber-700/80 font-medium">5. Gamification Hub Linked</div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column A: Qualifications */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
              Verified Qualifications
            </span>
            <ul className="space-y-2 text-xs">
              {employeeQualifications.map((q, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-800">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column B: Current Core Skills */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
              Core Technical Competencies
            </span>
            <ul className="space-y-1.5 text-xs">
              {employeeSkills.map((s, idx) => (
                <li key={idx} className="flex items-center justify-between text-slate-800">
                  <span className="font-medium text-[11px] truncate">{s.name}</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                    {s.level}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column C: Career Aspiration */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1.5">
                Target Career Aspiration
              </span>
              {isEditingAspiration ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={aspiration}
                    onChange={(e) => setAspiration(e.target.value)}
                    className="w-full text-xs font-bold p-1.5 rounded border border-blue-300 bg-white"
                  />
                  <button
                    onClick={() => setIsEditingAspiration(false)}
                    className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold cursor-pointer"
                  >
                    Save Aspiration
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
                    <span>{aspiration}</span>
                    <button
                      onClick={() => setIsEditingAspiration(true)}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Target timeline: <strong className="text-slate-900">{targetTimeline}</strong> • Commitment: <strong className="text-slate-900">{weeklyCommitment}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-blue-200/60 mt-3 flex items-center justify-between text-[11px]">
              <span className="text-blue-900 font-semibold flex items-center gap-1">
                <Bot size={13} className="text-blue-600" />
                2. AI Generating Next Steps
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                88% Readiness
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Internal Openings & Matched Opportunities (From Role Architect & Team Assembly) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  3. Internal Openings & Targeted Invitations
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  {notifications.length} Active Matches
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Positions matched directly to you by the HR Role Architect & Team Assembly Engine
              </p>
            </div>
          </div>

          <Link
            to="/talent-marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <span>View All in Digital Talent Marketplace</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No active role invites at the moment. When HR publishes roles in Role Architect or builds a team, your invites will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-violet-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                          {item.source}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.roleTitle}</h4>
                      <p className="text-xs text-slate-500">{item.department}</p>
                    </div>

                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                      {item.fitScore}% Fit
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {item.description || 'Matched based on high skill complementarity with your digital twin profile.'}
                  </p>

                  {/* Matched skills */}
                  <div className="mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Matched Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.matchedSkills.map((s, idx) => (
                        <span key={idx} className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Skill gaps */}
                  {item.skillGaps.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Upskilling Gap:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.skillGaps.map((s, idx) => (
                          <span key={idx} className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            △ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <Link
                    to={`/learning-hub?skill=${encodeURIComponent(item.skillGaps[0] || 'Cloud')}`}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <BookOpen size={12} />
                    <span>Bridge Gap in Learning Hub</span>
                  </Link>

                  {item.status === 'applied' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Application Submitted (+150 XP)</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(item.id, item.roleTitle)}
                      className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Apply Now (+150 XP)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4 & 5. Learning Hub Integration & Gamification Rewards Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 4. Learning Hub */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={18} className="text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">4. Targeted Upskilling in Learning Hub</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Automated course recommendations aligned with the gaps of architected roles. Complete modules to reach 100% readiness for promotions.
            </p>
            <div className="space-y-1.5 mb-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-blue-100 font-semibold text-slate-800">
                <span>Vector Databases & Retrieval Systems</span>
                <span className="text-[10px] text-blue-600 font-bold">Recommended for AI Architect</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-blue-100 font-semibold text-slate-800">
                <span>GPU Cluster Scheduling on Kubernetes</span>
                <span className="text-[10px] text-blue-600 font-bold">Recommended for Project Phoenix</span>
              </div>
            </div>
          </div>

          <Link
            to="/learning-hub"
            className="inline-flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <span>Open Learning Hub Recommendations</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* 5. Gamification Hub Rewards */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={18} className="text-amber-600" />
              <h4 className="font-bold text-slate-900 text-sm">5. Career Growth Gamification Rewards</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Earn XP, badges, and recognition for achieving career milestones, completing learning modules, and applying to internal roles.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="p-2 rounded-lg bg-white border border-amber-100">
                <span className="text-[10px] text-slate-500 block">Weekly Streak</span>
                <span className="text-sm font-extrabold text-amber-600">3 Weeks 🔥</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-amber-100">
                <span className="text-[10px] text-slate-500 block">Active Badges</span>
                <span className="text-sm font-extrabold text-amber-600">7 Badges 🎖</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-amber-100">
                <span className="text-[10px] text-slate-500 block">Next Level</span>
                <span className="text-sm font-extrabold text-amber-600">50 XP to L5</span>
              </div>
            </div>
          </div>

          <Link
            to="/gamification-hub"
            className="inline-flex items-center justify-center gap-2 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <span>View Gamification Hub & Badges</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
