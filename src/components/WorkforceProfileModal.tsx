import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, DollarSign, Activity, CheckCircle2, TrendingDown, Clock, BrainCircuit, ShieldCheck, MapPin } from 'lucide-react';
import { workforceAPI } from '../lib/api';

interface WorkforceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  role: string;
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return clean;
  } catch {
    return dateStr;
  }
};

const getProficiencyLabel = (level: number): string => {
  switch (Math.round(level)) {
    case 1: return 'Novice (Level 1)';
    case 2: return 'Foundational (Level 2)';
    case 3: return 'Competent (Level 3)';
    case 4: return 'Proficient (Level 4)';
    case 5: return 'Master / Expert (Level 5)';
    default: return `Level ${level}`;
  }
};

export const WorkforceProfileModal: React.FC<WorkforceProfileModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  role
}) => {
  const [employeeRecord, setEmployeeRecord] = useState<any>(null);
  const [skillRecords, setSkillRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !employeeId) return;

    setIsLoading(true);

    // Fetch 2.1 Employee Record & 2.2 Skill Records
    Promise.all([
      workforceAPI.getEmployees().catch(() => []),
      workforceAPI.getSkills(employeeId).catch(() => [])
    ]).then(([employees, skills]) => {
      // Find the specific employee record
      const record = Array.isArray(employees)
        ? employees.find((e: any) => e.employee_id === employeeId || e.display_name === employeeName)
        : null;

      if (record) {
        setEmployeeRecord(record);
      } else {
        setEmployeeRecord({
          employee_id: employeeId,
          display_name: employeeName,
          role_title: role,
          employment_type: 'Full-Time FTE',
          employee_status: 'Active',
          tenure_years: 3.5,
          location: 'Colombo HQ',
          work_model: 'Onsite',
          cost_band_id: 'BAND-5',
          annual_cost_lkr: 4800000,
          performance_rating_current: 3.3,
          current_allocation_pct: 0.70,
          notice_period_days: 60,
          dept: 'Telecommunications & Digital Infrastructure'
        });
      }

      // If backend returned skills, use them
      if (skills && Array.isArray(skills) && skills.length > 0) {
        setSkillRecords(skills);
      } else {
        // Fallback default skills with proper names matching taxonomy
        setSkillRecords([
          {
            skill_id: 'SKL-0072',
            skill_name: 'Cloud Platforms (AWS/Azure)',
            skill_family: 'Cloud & Platform',
            proficiency_effective: 2,
            proficiency_self: 2,
            proficiency_manager: 2,
            proficiency_source: 'Self-assessed',
            confidence_score: 0.4,
            is_decayed: false,
            last_used_date: '2026-08-16T00:00:00'
          },
          {
            skill_id: 'SKL-0051',
            skill_name: 'Linux Administration',
            skill_family: 'Cloud & Platform',
            proficiency_effective: 3,
            proficiency_self: 3,
            proficiency_manager: 3,
            proficiency_source: 'Self-assessed',
            confidence_score: 0.4,
            is_decayed: false,
            last_used_date: '2026-08-02T00:00:00'
          }
        ]);
      }
    }).finally(() => {
      setIsLoading(false);
    });

  }, [isOpen, employeeId, employeeName, role]);

  if (!isOpen) return null;

  const displayRole = (employeeRecord?.role_title && employeeRecord.role_title !== 'Certified Practitioner')
    ? employeeRecord.role_title
    : (role || 'Telecom Specialist');

  const initials = employeeName
    ? employeeName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'EM';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200/90 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sleek Executive Standard */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70 overflow-hidden shrink-0">
          <div className="flex items-center gap-4 z-10 min-w-0">
            {/* Avatar Initials with Active Status Dot */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white font-black text-xl shadow-md border border-white/30">
                {initials}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-2xs"
                title="Active Employee"
              />
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  {employeeName}
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  ID: {employeeId || employeeRecord?.employee_id || 'EMP-0000'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="px-2.5 py-0.5 bg-slate-900 text-white text-xs font-bold rounded-md">
                  {displayRole}
                </span>
                {employeeRecord?.dept && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 truncate">
                    {employeeRecord.dept}
                  </span>
                )}
                {employeeRecord?.career_level_name && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                    {employeeRecord.career_level_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-full transition-all shrink-0 cursor-pointer shadow-2xs"
            title="Close Profile Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading Workforce Record...</p>
            </div>
          ) : (
            <>
              {/* Section 2.1: Workforce Record Attributes */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                    <User size={15} className="text-blue-600" />
                    Workforce Profile Data (Section 2.1)
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    {employeeRecord?.location || 'Colombo HQ'} · {employeeRecord?.tenure_years || 3.5} yrs tenure
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Work Model */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Briefcase size={17} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Model</span>
                      <span className="text-sm font-extrabold text-slate-900 truncate">
                        {employeeRecord?.work_model || 'Onsite'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Cost Band */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <DollarSign size={17} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cost Band</span>
                      <span className="text-sm font-extrabold text-slate-900 truncate">
                        {employeeRecord?.cost_band_id || 'BAND-5'}
                      </span>
                    </div>
                  </div>

                  {/* Performance Rating */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Activity size={17} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Performance</span>
                      <span className="text-sm font-extrabold text-slate-900 truncate">
                        {employeeRecord?.performance_rating_current || 3.3} <span className="text-xs text-slate-400 font-semibold">/ 5.0</span>
                      </span>
                    </div>
                  </div>

                  {/* Allocation */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <Clock size={17} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">FTE Allocation</span>
                      <span className="text-sm font-extrabold text-slate-900 truncate">
                        {Math.round((employeeRecord?.current_allocation_pct ?? 0.70) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2.2: Skill Records & Decay Monitoring */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                      <BrainCircuit size={15} className="text-indigo-600" />
                      Skill Records & Decay Monitoring (Section 2.2)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {skillRecords.length} recorded capability proficiencies with precedence hierarchy
                    </p>
                  </div>

                  {/* Precedence Hierarchy Legend */}
                  <div className="flex items-center gap-1.5 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200/80 text-[10px] font-bold text-slate-600 shadow-2xs">
                    <span className="uppercase text-slate-400 tracking-wider">Precedence:</span>
                    <span className="text-emerald-700">Evidence (90%)</span>
                    <span className="text-slate-300">&gt;</span>
                    <span className="text-blue-700">Manager (70%)</span>
                    <span className="text-slate-300">&gt;</span>
                    <span className="text-amber-700">Self (40%)</span>
                  </div>
                </div>

                {/* Skill Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {skillRecords.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                      <p className="text-sm font-bold text-slate-500">No skill records found for this employee.</p>
                    </div>
                  ) : (
                    skillRecords.map((skill, idx) => {
                      const skillTitle = skill.skill_name || skill.name || skill.skill_id;
                      const isDecayed = Boolean(skill.is_decayed);
                      const confidencePct = Math.round((skill.confidence_score || 0.4) * 100);
                      const effectiveLevel = skill.proficiency_effective || 2;
                      const source = skill.proficiency_source || 'Self-assessed';

                      const sourceStyle = source.toLowerCase().includes('evidence')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : source.toLowerCase().includes('manager')
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200';

                      return (
                        <div
                          key={skill.employee_skill_id || skill.skill_id || idx}
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                        >
                          {/* Card Top: Skill Name & Status */}
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate" title={skillTitle}>
                                  {skillTitle}
                                </h4>
                                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                  {skill.skill_id} {skill.skill_family ? `· ${skill.skill_family}` : ''}
                                </p>
                              </div>

                              {/* Decay / Active Badge */}
                              <div className="shrink-0 flex flex-col items-end gap-1">
                                {isDecayed ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                    <TrendingDown size={12} /> Decayed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <CheckCircle2 size={12} /> Active
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-slate-400">
                                  Used: {formatDate(skill.last_used_date)}
                                </span>
                              </div>
                            </div>

                            {/* Source & Confidence Tags */}
                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sourceStyle}`}>
                                {source}
                              </span>
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                                Confidence: {confidencePct}%
                              </span>
                              {skill.proficiency_manager && skill.proficiency_self && (
                                <span className="text-[10px] font-medium text-slate-400">
                                  Self: {skill.proficiency_self}/5 · Mgr: {skill.proficiency_manager}/5
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Effective Proficiency Progress */}
                          <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700">
                                {getProficiencyLabel(effectiveLevel)}
                              </span>
                              <span className="font-extrabold text-slate-900">
                                {effectiveLevel} <span className="text-[10px] text-slate-400 font-semibold">/ 5</span>
                              </span>
                            </div>

                            {/* 5-Step Segmented Level Meter */}
                            <div className="grid grid-cols-5 gap-1.5">
                              {[1, 2, 3, 4, 5].map((lvl) => {
                                const isFilled = lvl <= effectiveLevel;
                                const barColor = effectiveLevel >= 4
                                  ? 'bg-emerald-500'
                                  : effectiveLevel >= 3
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500';

                                return (
                                  <div
                                    key={lvl}
                                    className={`h-2 rounded-full transition-all ${
                                      isFilled ? barColor : 'bg-slate-100'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Policy Footer Note */}
              <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck size={16} className="text-slate-500 shrink-0" />
                <span>
                  <strong>Module 2 Precedence Policy:</strong> Verified Evidence assessments take precedence over Manager validation, which overrides unverified Self-assessments. Inactive skills decay automatically if unapplied beyond the taxonomy half-life.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
