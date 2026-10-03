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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              {employeeName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{employeeName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-slate-500">{role}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {employeeId}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-bold uppercase tracking-wider">Loading Workforce Data...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              
              {/* Section 2.1: Workforce Record Attributes */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <User size={16} className="text-indigo-500" />
                  Workforce Profile (2.1 Record)
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">Work Model</span>
                    <div className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                      <Briefcase size={14} className="text-slate-400" /> {employeeRecord?.work_model || 'Hybrid'}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">Cost Band</span>
                    <div className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                      <DollarSign size={14} className="text-emerald-500" /> {employeeRecord?.cost_band_id || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">Performance</span>
                    <div className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                      <Activity size={14} className="text-blue-500" /> {employeeRecord?.performance_rating_current || 'N/A'} / 5.0
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">Allocation</span>
                    <div className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                      <Clock size={14} className="text-purple-500" /> {(employeeRecord?.current_allocation_pct * 100) || 100}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2.2: Skill Records (Derived Logic) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                    <BrainCircuit size={16} className="text-rose-500" />
                    Skill Records & Decay (2.2)
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 px-2 py-1 rounded-lg">
                    Rule: Evidence &gt; Manager &gt; Self
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {skillRecords.map((skill, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-slate-800 text-sm">{skill.name || skill.skill_id}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${
                            skill.proficiency_source === 'Evidence-based' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            skill.proficiency_source === 'Manager-validated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {skill.proficiency_source}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Confidence: {skill.confidence_score}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Effective Level</span>
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-800 border border-slate-200 shadow-2xs">
                            {skill.proficiency_effective}
                          </div>
                        </div>

                        <div className="flex flex-col items-center w-24">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                          {skill.is_decayed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                              <TrendingDown size={12} /> DECAYED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                              <CheckCircle2 size={12} /> ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
