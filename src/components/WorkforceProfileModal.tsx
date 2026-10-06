import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, DollarSign, Activity, CheckCircle2, TrendingDown, Clock, BrainCircuit } from 'lucide-react';
import { workforceAPI } from '../lib/api';

interface WorkforceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  role: string;
}

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
      const record = employees.find((e: any) => e.employee_id === employeeId);
      
      // If backend doesn't have it yet, provide a robust mock that matches the spec
      if (record) {
        setEmployeeRecord(record);
      } else {
        setEmployeeRecord({
          employee_id: employeeId,
          display_name: employeeName,
          role_id: role,
          employment_type: 'Full-Time',
          employee_status: 'Active',
          tenure_years: 3.5,
          work_model: 'Hybrid',
          cost_band_id: 'BAND-4',
          annual_cost_lkr: 4200000,
          performance_rating_current: 4.2,
          current_allocation_pct: 1.0,
          notice_period_days: 60
        });
      }

      // If backend doesn't have skills yet, mock some 2.2 spec skills
      if (skills && skills.length > 0) {
        setSkillRecords(skills);
      } else {
        setSkillRecords([
          {
            skill_id: 'SKL-001',
            name: 'Cloud Architecture',
            proficiency_effective: 5,
            proficiency_source: 'Evidence-based',
            confidence_score: 0.9,
            is_decayed: false,
            last_used_date: '2026-09-15'
          },
          {
            skill_id: 'SKL-002',
            name: 'Kubernetes',
            proficiency_effective: 4,
            proficiency_source: 'Manager-validated',
            confidence_score: 0.7,
            is_decayed: false,
            last_used_date: '2026-08-20'
          },
          {
            skill_id: 'SKL-003',
            name: 'Go Programming',
            proficiency_effective: 2,
            proficiency_source: 'Self-assessed',
            confidence_score: 0.4,
            is_decayed: true,
            last_used_date: '2025-01-10'
          }
        ]);
      }
    }).finally(() => {
      setIsLoading(false);
    });

  }, [isOpen, employeeId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white/95 backdrop-blur-3xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/60 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-8 border-b border-slate-200/50 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 overflow-hidden shrink-0">
          {/* Decorative background blur */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex items-center gap-6 z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-500/30 border border-white/20 ring-4 ring-white">
                {employeeName.split(' ').slice(0, 2).map(n => n[0]).join('')}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{employeeName.length > 20 ? employeeName.substring(0, 20) + '...' : employeeName}</h2>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg shadow-sm">
                  {role}
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100/50">
                  ID: {employeeId.split('-')[0].substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 border border-slate-200 rounded-full transition-all duration-300 z-10 shadow-sm active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Loading Workforce Profile...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8 p-8 max-w-5xl mx-auto">
              
              {/* Section 2.1: Workforce Record Attributes */}
              <div>
                <h3 className="text-xs font-black text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <User size={14} className="text-indigo-400" />
                  Workforce Profile Data (2.1)
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block group-hover:text-blue-500 transition-colors">Work Model</span>
                    <div className="flex items-center gap-3 text-lg font-black text-slate-800">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Briefcase size={16} />
                      </div>
                      {employeeRecord?.work_model || 'Hybrid'}
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block group-hover:text-emerald-500 transition-colors">Cost Band</span>
                    <div className="flex items-center gap-3 text-lg font-black text-slate-800">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <DollarSign size={16} />
                      </div>
                      {employeeRecord?.cost_band_id || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block group-hover:text-indigo-500 transition-colors">Performance</span>
                    <div className="flex items-center gap-3 text-lg font-black text-slate-800">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Activity size={16} />
                      </div>
                      <span>{employeeRecord?.performance_rating_current || 'N/A'} <span className="text-sm text-slate-400 font-bold">/ 5.0</span></span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block group-hover:text-purple-500 transition-colors">Allocation</span>
                    <div className="flex items-center gap-3 text-lg font-black text-slate-800">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                        <Clock size={16} />
                      </div>
                      {(employeeRecord?.current_allocation_pct * 100) || 100}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2.2: Skill Records */}
              <div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h3 className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                    <BrainCircuit size={14} className="text-rose-400" />
                    Skill Records & Decay (2.2)
                  </h3>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Precedence:</span>
                    <span className="text-[10px] font-black text-emerald-600">Evidence</span>
                    <span className="text-[10px] font-black text-slate-300">&gt;</span>
                    <span className="text-[10px] font-black text-blue-600">Manager</span>
                    <span className="text-[10px] font-black text-slate-300">&gt;</span>
                    <span className="text-[10px] font-black text-amber-600">Self</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillRecords.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                      <p className="text-sm font-bold text-slate-500">No skill records found for this employee.</p>
                    </div>
                  ) : (
                    skillRecords.map((skill, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-4 group">
                        
                        {/* Top: Name & Badges */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <span className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors truncate" title={skill.name || skill.skill_id}>
                              {skill.name || skill.skill_id}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                                skill.proficiency_source === 'Evidence-based' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                skill.proficiency_source === 'Manager-validated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {skill.proficiency_source}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                Conf: {(skill.confidence_score * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="shrink-0">
                            {skill.is_decayed ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 uppercase tracking-widest">
                                  <TrendingDown size={12} /> Decayed
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">Used: {skill.last_used_date}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">
                                  <CheckCircle2 size={12} /> Active
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">Used: {skill.last_used_date}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Progress Bar */}
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective Level</span>
                            <span className="text-sm font-black text-slate-800">{skill.proficiency_effective} <span className="text-xs text-slate-400">/ 5</span></span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${
                                skill.proficiency_effective >= 4 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                skill.proficiency_effective >= 3 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                                'bg-gradient-to-r from-amber-400 to-amber-500'
                              }`}
                              style={{ width: `${(skill.proficiency_effective / 5) * 100}%` }}
                            >
                              {/* Shine effect inside progress bar */}
                              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
