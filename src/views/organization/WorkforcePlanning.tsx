import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import {
  Users, TrendingUp, Layers, Target, Activity,
  ArrowUpRight, CheckCircle2, X, BrainCircuit,
  Search, ShieldAlert, UserMinus, UserPlus, Award, AlertTriangle, Clock, ShieldCheck, Building2, ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import {
  DEPT_COLORS,
  EXP_COLORS
} from '../../dummy/organization/workforcePlanningData';
import api from '../../lib/api';
import {
  DEFAULT_SKILL_SHORTAGES,
  DEFAULT_GAP_HEATMAP,
  DEFAULT_CRITICAL_ROLES_AT_RISK,
  DEFAULT_NET_GAP_DATA
} from '../../dummy/organization/workforceIntelligenceDefaults';
import { TwinChatModal } from '../../components/TwinChatModal';
import { WorkforceProfileModal } from '../../components/WorkforceProfileModal';

interface WorkforcePlanningProps {
  initialTab?: 'analytics' | 'radar';
}

export const WorkforcePlanning: React.FC<WorkforcePlanningProps> = ({ initialTab = 'analytics' }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'radar' | 'certifications'>(initialTab);
  const [radarView, setRadarView] = useState<'critical-roles' | 'retention-watch' | 'actions'>('critical-roles');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [scope, setScope] = useState('All Departments');
  const [horizon, setHorizon] = useState('Next 2 Quarters');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hiringAttrition, setHiringAttrition] = useState<any[]>([
    { month: "Nov '25", hired: 3, attrition: 1 },
    { month: "Dec '25", hired: 4, attrition: 2 },
    { month: "Jan '26", hired: 6, attrition: 2 },
    { month: "Feb '26", hired: 5, attrition: 1 },
    { month: "Mar '26", hired: 4, attrition: 3 },
    { month: "Apr '26", hired: 7, attrition: 2 },
    { month: "May '26", hired: 5, attrition: 2 },
    { month: "Jun '26", hired: 6, attrition: 4 },
    { month: "Jul '26", hired: 4, attrition: 2 },
    { month: "Aug '26", hired: 5, attrition: 1 },
    { month: "Sep '26", hired: 4, attrition: 2 },
    { month: "Oct '26", hired: 3, attrition: 1 },
  ]);
  const [deptDistribution, setDeptDistribution] = useState<any[]>([
    { name: 'Customer Experience & Contact Centre', employees: 34 },
    { name: 'Data Science & Retail Analytics', employees: 19 },
    { name: 'Network Operations', employees: 19 },
    { name: 'Digital Platforms & IT', employees: 17 },
    { name: 'Mobile Core & 5G', employees: 16 },
    { name: 'Cloud & Data Centre', employees: 13 },
    { name: 'Enterprise & SD-WAN Solutions', employees: 10 },
    { name: 'Cybersecurity', employees: 10 },
    { name: 'Human Resources & Talent', employees: 7 },
    { name: 'Group Executive Office', employees: 1 },
  ]);
  const [experienceDistribution, setExperienceDistribution] = useState<any[]>([
    { name: 'Senior Specialist / Engineer', value: 54, count: 79 },
    { name: 'Associate Level', value: 16, count: 24 },
    { name: 'Lead / Principal Specialist', value: 16, count: 23 },
    { name: 'Head of Department / Unit', value: 5, count: 7 },
    { name: 'Operations Officer', value: 4, count: 6 },
    { name: 'Principal Technical Staff', value: 3, count: 5 },
    { name: 'Group Executive', value: 2, count: 2 },
  ]);
  const [skillShortages, setSkillShortages] = useState<any[]>(DEFAULT_SKILL_SHORTAGES);

  // Net Gap Pipeline State (Dynamic Calculation from 146 Employees)
  const [netGapData, setNetGapData] = useState(DEFAULT_NET_GAP_DATA);

  // Gap Heatmap State (Recommended Addition 2.8 from 146 Employees)
  const [heatmapData, setHeatmapData] = useState<any | null>(DEFAULT_GAP_HEATMAP);

  // Critical Roles At Risk (Compound Rule from 146 Employees)
  const [criticalRolesAtRisk, setCriticalRolesAtRisk] = useState<any[]>(DEFAULT_CRITICAL_ROLES_AT_RISK);
  const [selectedCriticalRole, setSelectedCriticalRole] = useState<any | null>(null);

  // At-Risk Radar & Interventions State
  const [atRiskEmployees, setAtRiskEmployees] = useState<any[]>([]);
  const [interventionEffectiveness, setInterventionEffectiveness] = useState<any[]>([]);
  const [chattingEmployee, setChattingEmployee] = useState<{ name: string; role: string } | null>(null);
  const [selectedWorkforceEmployee, setSelectedWorkforceEmployee] = useState<{ id: string; name: string; role: string } | null>(null);
  const [riskSearchQuery, setRiskSearchQuery] = useState('');
  
  // Certifications State
  const [certificationsData, setCertificationsData] = useState<any[]>([]);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = () => {
    // 1. Dynamic Net Gap Pipeline
    if (api.workforce && api.workforce.getNetGapPipeline) {
      api.workforce.getNetGapPipeline(scope).then(res => {
        if (res) setNetGapData(res);
      }).catch(console.error);
    }

    // 2. Capability Gaps & Skill Shortages from Module 2 API
    if (api.workforce && api.workforce.getCapabilityGaps) {
      api.workforce.getCapabilityGaps().then(res => {
        if (res && res.data && res.data.length > 0) {
          const ranked = res.data.map((r: any, idx: number) => {
            const primarySkill = r.skill_gaps && r.skill_gaps[0] ? r.skill_gaps[0] : null;
            return {
              rank: idx + 1,
              role_id: r.role_id,
              role: r.role_title,
              skill: primarySkill ? primarySkill.skill_name : 'Core Capability',
              target_prof: primarySkill ? primarySkill.target_proficiency : 4,
              mean_prof: primarySkill ? primarySkill.mean_effective_proficiency : 2.2,
              dept: r.dept,
              urgency: r.criticality_tier === 'Tier 1' || r.capability_gap_score > 0.4 ? 'HIGH' : 'MEDIUM',
              gap: `-${r.headcount_gap || 3}`,
              headcount_gap: r.headcount_gap,
              current_headcount: r.current_headcount,
              demand_headcount_net: r.demand_headcount_net,
              capability_gap_score: r.capability_gap_score,
              internal_supply_ratio: r.internal_supply_ratio,
              skill_scarcity_index: r.skill_scarcity_index,
              workforce_readiness_score: r.workforce_readiness_score,
              readiness_band: r.readiness_band,
              time_to_close_build_months: r.time_to_close_build_months,
              time_to_close_buy_days: r.time_to_close_buy_days,
              closure_feasibility: r.closure_feasibility,
              knowledge_concentration_index: r.knowledge_concentration_index,
              retirement_exposure: r.retirement_exposure,
              critical_risk_flag: r.critical_risk_flag,
              skill_gaps: r.skill_gaps || []
            };
          });
          setSkillShortages(ranked);
        } else {
          setSkillShortages(DEFAULT_SKILL_SHORTAGES);
        }
      }).catch(() => {
        setSkillShortages(DEFAULT_SKILL_SHORTAGES);
      });
    }

    // 3. Compound Critical Roles at Risk (User Story 2: 3-leg compound rule)
    if (api.workforce && api.workforce.getCriticalRolesAtRisk) {
      api.workforce.getCriticalRolesAtRisk().then(res => {
        if (res && res.at_risk_roles && res.at_risk_roles.length > 0) {
          setCriticalRolesAtRisk(res.at_risk_roles);
        } else {
          setCriticalRolesAtRisk(DEFAULT_CRITICAL_ROLES_AT_RISK);
        }
      }).catch(() => {
        setCriticalRolesAtRisk(DEFAULT_CRITICAL_ROLES_AT_RISK);
      });
    }

    // 4. Gap Heatmap (Section 2.8 Recommended Addition)
    if (api.workforce && api.workforce.getGapHeatmap) {
      api.workforce.getGapHeatmap().then(res => {
        if (res && res.matrix && res.matrix.length > 0) {
          setHeatmapData(res);
        } else {
          setHeatmapData(DEFAULT_GAP_HEATMAP);
        }
      }).catch(() => {
        setHeatmapData(DEFAULT_GAP_HEATMAP);
      });
    }

    // 5. Real 12-Month Trailing Trends & Distributions (from official Excel 146 Employees)
    if (api.workforce && api.workforce.getWorkforceDistributions) {
      api.workforce.getWorkforceDistributions().then(res => {
        if (res) {
          if (res.departments && res.departments.length > 0) {
            setDeptDistribution(res.departments);
          }
          if (res.experience && res.experience.length > 0) {
            setExperienceDistribution(res.experience);
          }
          if (res.hiring_attrition && res.hiring_attrition.length > 0) {
            setHiringAttrition(res.hiring_attrition);
          }
        }
      }).catch(console.error);
    }

    api.organization.getHistory({ limit: 12 }).then((data: any[]) => {
      if (data && data.length > 0) {
        setHiringAttrition(data.slice(-12).map((d: any) => ({
          month: d.month,
          hired: d.new_hires,
          attrition: Math.round(d.total_headcount * d.voluntary_attrition_rate / 100),
        })));
      }
    }).catch(() => {
      // Retain authentic 12-month trailing defaults from Excel
    });

    // 7. At-Risk Risk Signals & Interventions
    if (api.workforce && api.workforce.getRiskSignals) {
      api.workforce.getRiskSignals().then(signals => {
        if (signals && signals.length > 0) {
          setAtRiskEmployees(signals.map((s: any) => ({
            name: s.display_name || s.employee_id,
            employee_id: s.employee_id,
            role: s.role_title,
            dept: s.dept || 'Engineering',
            urgency: s.attrition_risk_band === 'High' ? 'High' : s.attrition_risk_band === 'Medium' ? 'Moderate' : 'Low',
            burnoutScore: `${Math.round(s.knowledge_loss_likelihood * 100)}%`,
            attritionRisk: Math.round(s.attrition_risk_score * 100),
            perfCurrent: `${Math.round(s.confidence_level * 100)}% Conf.`,
            aiSuggestion: s.top_contributing_factors && s.top_contributing_factors[0] ? s.top_contributing_factors[0] : 'High risk retention review.',
            contributingFactors: s.top_contributing_factors || [],
            trendDirection: s.trend_direction || 'Stable',
            last1on1: s.calibration_review_due || '2026-10-15'
          })));
        } else {
          fallbackRiskProfiles();
        }
      }).catch(fallbackRiskProfiles);
    } else {
      fallbackRiskProfiles();
    }

    // 8. Intervention Effectiveness (Enriched Domain Fallback)
    const defaultInterventions = [
      {
        role_group: 'Network & SD-WAN Engineering',
        intervention_name: 'Workload Balancing & Shift Rotation',
        risk_reduction_percentage: 24,
        description: 'Cuts acute on-call cognitive fatigue & 24/7 incident burnout',
        theme_color: 'rose'
      },
      {
        role_group: 'Data Science & MLOps',
        intervention_name: 'Model Shadowing & Knowledge Transfer',
        risk_reduction_percentage: 21,
        description: 'Eliminates single-point-of-failure silos in predictive pipelines',
        theme_color: 'indigo'
      },
      {
        role_group: 'Cloud & Cybersecurity',
        intervention_name: 'Comp Calibration & Project Ownership',
        risk_reduction_percentage: 19,
        description: 'Prevents external market poaching of certified architects',
        theme_color: 'emerald'
      },
      {
        role_group: 'Core Telecom & 5G Systems',
        intervention_name: 'Cross-Skilling Acceleration Path',
        risk_reduction_percentage: 16,
        description: 'Facilitates 4G legacy to 5G Standalone core skills transition',
        theme_color: 'amber'
      }
    ];

    api.organization.getInterventionEffectiveness().then(data => {
      if (data && data.length > 0) {
        setInterventionEffectiveness(data);
      } else {
        setInterventionEffectiveness(defaultInterventions);
      }
    }).catch(() => {
      setInterventionEffectiveness(defaultInterventions);
    });

    // 9. Certifications Data Fetching
    if (api.workforce) {
      api.workforce.getCertificationExpiry().then(data => {
        if (data && data.length > 0) {
          setCertificationsData(data);
        } else {
          setCertificationsData([
            { certification_id: 'CRT-0233', employee_id: 'EMP-1112', name: 'AWS Certified Machine Learning - Specialty', issuer: 'Amazon Web Services', expiry_date: '2026-11-20', days_to_expiry: 25, renewal_flag: true, verification_status: 'Verified', is_mandatory_for_role: true },
            { certification_id: 'CRT-0102', employee_id: 'EMP-2115', name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF', expiry_date: '2026-11-05', days_to_expiry: 10, renewal_flag: true, verification_status: 'Verified', is_mandatory_for_role: true },
            { certification_id: 'CRT-0103', employee_id: 'EMP-4011', name: 'Offensive Security Certified Professional', issuer: 'OffSec', expiry_date: '2026-10-15', days_to_expiry: -11, renewal_flag: true, verification_status: 'Verified', is_mandatory_for_role: true },
            { certification_id: 'CRT-0104', employee_id: 'EMP-1042', name: 'Google Cloud Professional Data Engineer', issuer: 'Google Cloud', expiry_date: '2027-05-20', days_to_expiry: 206, renewal_flag: false, verification_status: 'Verified', is_mandatory_for_role: false }
          ]);
        }
      }).catch(console.error);
    }
  };

  const fallbackRiskProfiles = () => {
    api.organization.getRiskProfiles().then(data => {
      if (data && data.length > 0) {
        setAtRiskEmployees(data.map((d: any) => ({
          name: d.employee_id,
          employee_id: d.employee_id,
          role: d.primary_factor,
          dept: 'At-Risk Employee',
          urgency: d.risk_level === 'Critical' ? 'High' : d.risk_level === 'High' ? 'Moderate' : 'Low',
          burnoutScore: `${Math.round(d.burnout_probability * 100)}%`,
          attritionRisk: Math.round(d.risk_score),
          perfCurrent: `${Math.round(d.career_stagnation_score * 100)}%`,
          aiSuggestion: d.ai_retention_suggestion,
          contributingFactors: [d.primary_factor || 'High workload impact', 'Market demand outreach'],
          trendDirection: 'Stable',
          last1on1: d.last_1_on_1,
        })));
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, [scope]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      loadData();
      setIsGenerating(false);
      triggerToast('Workforce Intelligence recalculated: Capability gaps, compound risk signals, and net pipeline refreshed.');
    }, 1200);
  };

  const filteredRiskEmployees = atRiskEmployees.filter(emp => {
    const q = riskSearchQuery.toLowerCase();
    return (emp.name || '').toLowerCase().includes(q) ||
      (emp.role || '').toLowerCase().includes(q) ||
      (emp.dept || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6 relative pb-8 w-full">

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-fade-in">
          <div className="glass px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30">
            <div className="rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md w-8 h-8">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Action Confirmed</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer ml-4">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Page Header Bar - Clean Single Horizontal Row like Strategy Role Architect */}
      <div className="flex flex-col gap-1 w-full pt-1">
        
        {/* Main Line: Title on Left, Standardized Action Toolbar on Right */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full py-1">
          
          {/* Left: Title */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Workforce Intelligence
            </h1>
          </div>

          {/* Right: Action Toolbar with Standard Heights & Paddings */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            
            {/* Department Scope Selector */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-6 appearance-none text-slate-800 font-semibold text-xs max-w-[210px] truncate"
                >
                  <option value="All Departments">All Departments (Enterprise)</option>
                  <option value="Data Science & Retail Analytics">Data Science & Retail Analytics (OU-004)</option>
                  <option value="Enterprise & SD-WAN Solutions">Enterprise & SD-WAN Solutions (OU-002)</option>
                  <option value="Network Operations">Network Operations (OU-001)</option>
                  <option value="Cloud & Data Centre">Cloud & Data Centre (OU-003)</option>
                  <option value="Mobile Core & 5G">Mobile Core & 5G (OU-008)</option>
                  <option value="Cybersecurity">Cybersecurity (OU-007)</option>
                  <option value="Customer Experience & Contact Centre">Customer Experience & Contact Centre (OU-005)</option>
                  <option value="Digital Platforms & IT">Digital Platforms & IT (OU-006)</option>
                  <option value="Human Resources & Talent">Human Resources & Talent (OU-009)</option>
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>

            {/* Horizon Selector */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <select
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-6 appearance-none text-slate-800 font-semibold text-xs"
                >
                  <option>Next 2 Quarters (FY26)</option>
                  <option>Next Year (FY27)</option>
                  <option>Next 3 Years (FY28)</option>
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block mx-0.5" />

            {/* Run Refresh Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <Activity size={13} className={isGenerating ? 'animate-spin text-white' : 'text-white'} />
              <span className="text-white">{isGenerating ? 'Recalculating...' : 'Run Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Subtitle Description */}
        <p className="text-xs text-slate-500 max-w-2xl mb-1">
          Monitor workforce capability gaps, at-risk roles, and succession health across teams.
        </p>
      </div>

      {/* Integrated Navigation Tabs Segment - Spacious & Elegant Executive Bar */}
      <div className="relative z-30 mb-4 flex items-center overflow-x-auto pb-1 pointer-events-auto">
        <div className="inline-flex items-center p-2 rounded-2xl bg-slate-100/95 border border-slate-200/90 shadow-sm gap-2 min-w-max h-14">
          
          {/* Tab 1: Capability & Skill Shortages */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('analytics');
            }}
            className={`h-10 sm:h-11 px-6 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-3 select-none relative z-10 ${
              activeTab === 'analytics'
                ? 'bg-white text-blue-700 shadow-md border border-slate-200/90 ring-1 ring-blue-500/20 transform -translate-y-0.5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 hover:shadow-2xs'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
              <Target size={17} />
            </div>
            <span>Capability & Skill Shortages</span>
          </button>

          {/* Tab 2: At-Risk & Burnout Radar */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('radar');
            }}
            className={`h-10 sm:h-11 px-6 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-3 relative z-10 select-none ${
              activeTab === 'radar'
                ? 'bg-white text-indigo-700 shadow-md border border-slate-200/90 ring-1 ring-indigo-500/20 transform -translate-y-0.5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 hover:shadow-2xs'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'radar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
              <BrainCircuit size={17} />
            </div>
            <span>At-Risk & Critical Roles Radar</span>
            {criticalRolesAtRisk.length > 0 && (
              <span className="flex h-2.5 w-2.5 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
            )}
          </button>

          {/* Tab 3: Compliance & Certifications */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('certifications');
            }}
            className={`h-10 sm:h-11 px-6 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-3 relative z-10 select-none ${
              activeTab === 'certifications'
                ? 'bg-white text-emerald-700 shadow-md border border-slate-200/90 ring-1 ring-emerald-500/20 transform -translate-y-0.5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 hover:shadow-2xs'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'certifications' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}>
              <Award size={17} />
            </div>
            <span>Compliance & Certifications (90-Day Window)</span>
            {certificationsData.some(c => c.renewal_flag) && (
              <span className="flex h-2.5 w-2.5 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Container Content */}
      <div className="transition-all duration-300 w-full" style={{ opacity: isGenerating ? 0.5 : 1, pointerEvents: isGenerating ? 'none' : 'auto', filter: isGenerating ? 'blur(2px)' : 'none' }}>

        {/* TAB 1: CAPABILITY & SKILL SHORTAGES */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">

            {/* Dynamic Headcount Trajectory & Net Gap Equation Strip */}
            <div
              className="p-5 sm:p-6 rounded-3xl border transition-all shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                borderColor: '#cbd5e1',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Headcount Trajectory & Net Gap Pipeline</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Automated Gap Calculation: Baseline Staff - Attrition - Retirements + Strategy Growth = Net Gap</p>
                  </div>
                </div>
              </div>

              {/* Connected Math Equation Flow Strip */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 bg-slate-100/80 p-3 sm:p-4 rounded-2xl border border-slate-200/80 overflow-x-auto">

                {/* 1. Baseline Current Headcount */}
                <div className="flex items-center gap-3.5 bg-white px-4 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900 leading-tight">{netGapData.baseline_staff}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baseline Staff</span>
                  </div>
                </div>

                {/* Operator 1: - */}
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs border border-slate-300">
                  -
                </div>

                {/* 2. Expected Attrition */}
                <div className="flex items-center gap-3.5 bg-white px-4 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                    <UserMinus size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-amber-600 leading-tight">{netGapData.attrition}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attrition</span>
                  </div>
                </div>

                {/* Operator 2: - */}
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs border border-slate-300">
                  -
                </div>

                {/* 3. Retirements (3-Year Exposure) */}
                <div className="flex items-center gap-3.5 bg-white px-4 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                    <Award size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-purple-700 leading-tight">{netGapData.retirements}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retirements (3y)</span>
                  </div>
                </div>

                {/* Operator 3: + */}
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs border border-emerald-300">
                  +
                </div>

                {/* 4. Planned Growth */}
                <div className="flex items-center gap-3.5 bg-white px-4 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                    <UserPlus size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-emerald-600 leading-tight">{netGapData.growth_demand}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Growth Demand</span>
                  </div>
                </div>

                {/* Equal Operator: = */}
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md border border-slate-800">
                  =
                </div>

                {/* 5. Net Shortage Output Highlight */}
                <div
                  className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all flex-1 min-w-[160px] min-h-[64px]"
                  style={{
                    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                    border: '1.5px solid #f43f5e',
                    boxShadow: '0 6px 16px rgba(225, 29, 72, 0.2)'
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                    <ShieldAlert size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-rose-600 leading-tight">{netGapData.net_shortage}</span>
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">NET SHORTAGE</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Main Grid: Shortages & Trends */}
            <div className="grid grid-cols-3 gap-6">

              {/* Left Column: Ranked Capability Gaps with Module 2 Metrics */}
              <div className="col-span-2 flex flex-col gap-6">
                <Card className="glass-panel p-6 flex flex-col gap-5 border border-slate-200/80 transition-all duration-300 hover:shadow-md">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-2xs"><Target size={20} /></div>
                        Ranked Capability Gaps & Strategic Fulfilment
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Derived against Module 1 Role-Skill Map with Time-to-Close (Build/Buy) and Closure Feasibility.
                      </p>
                    </div>
                    <button onClick={() => triggerToast("Exporting Module 2 Capability Gap Report with 5B Fulfilment routes to PDF...")} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                      Export Report
                    </button>
                  </div>

                  <div className="flex flex-col gap-3.5 max-h-[760px] overflow-y-auto pr-1.5">
                    {skillShortages.map((item) => (
                      <div
                        key={item.rank}
                        className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col gap-3 group shadow-2xs"
                      >
                        {/* Row 1: Role, Department, Critical Risk & Action Header */}
                        <div className="flex items-center justify-between gap-3">
                          
                          {/* Left: Rank, Role Title & Department Badge */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 transition-colors border border-slate-200/80">
                              #{item.rank}
                            </span>
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                                {item.role}
                              </h4>
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-2.5 py-0.5 rounded-md border border-slate-200/80 truncate">
                                {item.dept}
                              </span>
                              {item.critical_risk_flag && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                  <AlertTriangle size={11} className="text-rose-500" /> Critical Risk
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Gap Badge, Urgency & Open Reqs Button */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Gap pill */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200">
                              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Gap</span>
                              <span className="text-xs font-black text-rose-700">{item.gap} FTE</span>
                            </div>

                            {/* Urgency */}
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${
                              item.urgency === 'HIGH' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {item.urgency}
                            </span>

                            {/* Action Button: Consistent blue button matching design standard */}
                            <button
                              type="button"
                              onClick={() => triggerToast(`Requisition opened for ${item.role}. Forwarded to Talent Marketplace & Learning Recommendations.`)}
                              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                            >
                              <span>Open Reqs</span>
                              <ArrowUpRight size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Skill Focus & Readiness Bar */}
                        <div className="flex items-center justify-between gap-3 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200/70 text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider shrink-0">Key Skill:</span>
                            <span className="font-extrabold text-slate-800 truncate">{item.skill}</span>
                            <span className="text-slate-500 text-[11px] shrink-0 font-medium">
                              (Current <strong className="text-slate-800 font-bold">Lv {item.mean_prof}</strong> → Target <strong className="text-blue-700 font-black">Lv {item.target_prof}</strong>)
                            </span>
                          </div>

                          {/* Readiness Badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Readiness:</span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border ${
                                item.readiness_band === 'Green'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.readiness_band === 'Amber'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.readiness_band === 'Green'
                                    ? 'bg-emerald-500'
                                    : item.readiness_band === 'Amber'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              {Math.round((item.workforce_readiness_score || 0.45) * 100)}% ({item.readiness_band || 'Amber'})
                            </span>
                          </div>
                        </div>

                        {/* Row 3: 5-Column Symmetrical Metrics Grid */}
                        <div className="grid grid-cols-5 gap-2 text-center text-xs pt-0.5">
                          <div className="bg-slate-50/90 rounded-xl p-2 border border-slate-200/60">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Build Time</div>
                            <div className="font-extrabold text-slate-800 mt-0.5">{item.time_to_close_build_months || 6} mo</div>
                          </div>
                          <div className="bg-slate-50/90 rounded-xl p-2 border border-slate-200/60">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Buy Time</div>
                            <div className="font-extrabold text-slate-800 mt-0.5">{item.time_to_close_buy_days || 155} d</div>
                          </div>
                          <div className="bg-slate-50/90 rounded-xl p-2 border border-slate-200/60">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bus Factor</div>
                            <div className="font-extrabold text-slate-800 mt-0.5">{item.knowledge_concentration_index || 0.5}</div>
                          </div>
                          <div className="bg-slate-50/90 rounded-xl p-2 border border-slate-200/60">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Internal Supply</div>
                            <div className="font-extrabold text-slate-800 mt-0.5">{Math.round((item.internal_supply_ratio || 0.22) * 100)}%</div>
                          </div>
                          <div className="bg-slate-50/90 rounded-xl p-2 border border-slate-200/60 flex flex-col justify-center items-center">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Feasibility</div>
                            <div className={`text-[11px] font-black mt-0.5 ${item.closure_feasibility === 'Feasible' ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {item.closure_feasibility || 'At Risk'}
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </Card>

                </div>

              {/* Right Column: Workforce Distributions */}
              <div className="col-span-1 flex flex-col gap-6">

                {/* Department Distribution */}
                <Card className="glass-panel flex flex-col p-6 relative transition-all duration-300 hover:shadow-md border border-slate-200/80" style={{ minHeight: '390px' }}>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-1"><Users size={20} className="text-blue-600" /> Department Distribution</h3>
                  <p className="text-xs text-slate-500 mb-3 font-medium">Headcount spread across major operational divisions.</p>
                  <div className="w-full relative flex justify-center items-center" style={{ height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="employees" stroke="#ffffff" strokeWidth={2}>
                          {deptDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 max-h-[110px] overflow-y-auto pr-1">
                    {deptDistribution.map((d, i) => (
                      <div key={d.name} title={`${d.name}: ${d.employees} employees`} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }}></div>
                          <span className="text-[11px] font-bold text-slate-700 truncate">{d.name}</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 shrink-0 ml-1.5">{d.employees}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Experience Levels */}
                <Card className="glass-panel flex flex-col p-6 relative transition-all duration-300 hover:shadow-md border border-slate-200/80" style={{ minHeight: '390px' }}>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-1"><Layers size={20} className="text-blue-600" /> Seniority & Experience Levels</h3>
                  <p className="text-xs text-slate-500 mb-3 font-medium">Tenure and seniority makeup across active roles.</p>
                  <div className="w-full relative flex justify-center items-center" style={{ height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie data={experienceDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={68} dataKey="value" stroke="#ffffff" strokeWidth={2.5}>
                          {experienceDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={EXP_COLORS[index % EXP_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 mt-3 max-h-[160px] overflow-y-auto pr-1">
                    {experienceDistribution.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-400 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shadow-2xs group-hover:scale-110 transition-transform shrink-0" style={{ backgroundColor: EXP_COLORS[i % EXP_COLORS.length] }}></div>
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate">{d.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200 shrink-0 ml-1.5">{d.value}% ({d.count || 0})</span>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>
            </div>

            {/* Full-Width 12-Month Trajectory: Hiring vs Attrition Trends (Aligned with Page) */}
            <Card className="glass-panel w-full flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md min-h-[360px] border border-slate-200/80 rounded-3xl shadow-xs">
              <div className="flex justify-between items-center mb-4 z-10 flex-wrap gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" /> Hiring vs Attrition Trends
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Historical net headcount movements over trailing 12 months (Nov &apos;25 &ndash; Oct &apos;26).
                  </p>
                </div>
                <div className="flex gap-4 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></div> Hired ({hiringAttrition.reduce((acc, curr) => acc + (curr.hired || 0), 0)} Total)
                  </span>
                  <span className="flex items-center gap-2 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs"></div> Attrition ({hiringAttrition.reduce((acc, curr) => acc + (curr.attrition || 0), 0)} Total)
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full z-10 min-h-[260px]">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={hiringAttrition} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAttr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.07)", backgroundColor: "#ffffff", fontWeight: "bold" }} />
                    <Area type="monotone" dataKey="hired" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHired)" />
                    <Area type="monotone" dataKey="attrition" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorAttr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Section 2.8 Recommended Addition: Gap Heat Map by Org Unit against Skill Family */}
            {heatmapData && (
              <Card className="glass-panel p-6 border border-slate-200/80 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                      <Layers size={16} className="text-blue-600" />
                      Capability Gap Heat Map
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Cross-departmental view of structural capability gaps against strategic skill families.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Low (&lt;20%)
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Medium (20–35%)
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Critical (&gt;35%)
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  <table className="w-full text-left border-collapse min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 h-16 min-h-[64px]">
                        <th className="py-5 px-6 text-xs font-black text-slate-600 uppercase tracking-wider min-w-[280px] border-r border-slate-200/70 align-middle leading-normal">
                          Department / Org Unit
                        </th>
                        {heatmapData.skill_families.map((fam: string) => (
                          <th key={fam} className="py-5 px-5 text-xs font-black text-slate-600 uppercase tracking-wider text-center min-w-[165px] align-middle leading-normal">
                            {fam}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.matrix.map((row: any, rIdx: number) => (
                        <tr
                          key={row.dept}
                          className={`border-b border-slate-100 transition-colors hover:bg-slate-50/90 h-16 min-h-[60px] ${
                            rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                          }`}
                        >
                          <td className="py-5 px-6 min-w-[280px] border-r border-slate-100/80 align-middle">
                            <div className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">{row.dept}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{row.org_unit_id}</div>
                          </td>
                          {row.skills.map((s: any) => {
                            const isCrit = s.gap_score >= 0.35;
                            const isMed = s.gap_score >= 0.20 && !isCrit;
                            const cellBg = isCrit
                              ? 'bg-rose-50/90 text-rose-700 border-rose-200/90 hover:bg-rose-100/80'
                              : isMed
                              ? 'bg-amber-50/90 text-amber-700 border-amber-200/90 hover:bg-amber-100/80'
                              : 'bg-emerald-50/90 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/80';
                            const dotColor = isCrit ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500';

                            return (
                              <td key={s.family} className="py-5 px-5 text-center min-w-[165px] align-middle">
                                <div
                                  title={`${row.dept} • ${s.family}: ${(s.gap_score * 100).toFixed(0)}% gap (${s.status})`}
                                  className={`mx-auto inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs min-w-[76px] ${cellBg}`}
                                >
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                  <span className="tracking-tight">{(s.gap_score * 100).toFixed(0)}%</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

          </div>
        )}

        {/* TAB 2: AT-RISK & CRITICAL ROLES RADAR - ULTRA SIMPLE & CLEAN */}
        {activeTab === 'radar' && (
          <div className="flex flex-col gap-4">

            {/* Top Sub-Switcher Pills */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold gap-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRadarView('critical-roles')}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    radarView === 'critical-roles'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Critical Roles ({criticalRolesAtRisk.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRadarView('retention-watch')}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    radarView === 'retention-watch'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Retention Watch ({atRiskEmployees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRadarView('actions')}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    radarView === 'actions'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Action Recommendations ({interventionEffectiveness.length})
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                {radarView === 'critical-roles' && '5 roles requiring recruitment or succession planning'}
                {radarView === 'retention-watch' && 'Team members monitored for workload and retention'}
                {radarView === 'actions' && 'HR retention strategies to mitigate attrition'}
              </div>
            </div>

            {/* SUB-VIEW 1: CRITICAL ROLES (Clean, Beautiful Table) */}
            {radarView === 'critical-roles' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3.5 px-5">Role & Department</th>
                        <th className="py-3.5 px-4">Shortage</th>
                        <th className="py-3.5 px-4">Succession Pipeline</th>
                        <th className="py-3.5 px-4">Key Skill Needed</th>
                        <th className="py-3.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {criticalRolesAtRisk.map((r) => {
                        const topSkill = r.skill_gaps && r.skill_gaps[0] ? r.skill_gaps[0].skill_name : 'Architecture';
                        const shortage = r.headcount_gap ? `-${r.headcount_gap} FTE Shortage` : 'Succession Gap';

                        return (
                          <tr key={r.role_id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-5">
                              <div className="font-extrabold text-slate-900 text-sm">{r.role_title}</div>
                              <div className="text-xs text-slate-500 font-medium">{r.dept}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {shortage}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-semibold">
                              {r.ready_successors > 0 ? (
                                <span className="text-emerald-700 font-bold">{r.ready_successors} Ready</span>
                              ) : (
                                <span className="text-slate-400 font-medium">0 Ready</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                                {topSkill}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button
                                onClick={() => setSelectedCriticalRole(r)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: RETENTION WATCH (Clean Table) */}
            {radarView === 'retention-watch' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 w-72">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={riskSearchQuery}
                      onChange={(e) => setRiskSearchQuery(e.target.value)}
                      placeholder="Filter employees..."
                      className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none w-full"
                    />
                  </div>
                  <span className="text-xs text-slate-400">Showing {filteredRiskEmployees.length} employees</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">Employee</th>
                        <th className="py-3 px-4">Role & Department</th>
                        <th className="py-3 px-4">Retention Risk</th>
                        <th className="py-3 px-4">Primary Factor</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRiskEmployees.map((emp) => {
                        const isHigh = emp.urgency === 'High' || emp.attritionRisk >= 70;
                        return (
                          <tr key={emp.employee_id || emp.name} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="font-extrabold text-slate-900">{emp.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{emp.employee_id}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{emp.role}</div>
                              <div className="text-[11px] text-slate-500">{emp.dept}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isHigh ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {emp.attritionRisk}% {isHigh ? 'High Risk' : 'Moderate'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {emp.contributingFactors && emp.contributingFactors[0] ? emp.contributingFactors[0] : 'Workload factor'}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => triggerToast(`Scheduled 1-on-1 retention review with ${emp.name}.`)}
                                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer mr-1.5"
                              >
                                Schedule 1:1
                              </button>
                              <button
                                onClick={() => setChattingEmployee({ name: emp.name, role: emp.role })}
                                className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                              >
                                AI Advice
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: RECOMMENDED ACTIONS */}
            {radarView === 'actions' && (
              <div className="grid grid-cols-2 gap-4">
                {interventionEffectiveness.map((item, index) => (
                  <div key={index} className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          {item.role_group}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          -{item.risk_reduction_percentage}% Turnover Risk
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{item.intervention_name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-700">Recommended HR Strategy</span>
                      <button
                        onClick={() => triggerToast(`Applied ${item.intervention_name} strategy.`)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Apply Strategy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: COMPLIANCE & CERTIFICATIONS (With 90-Day Window & Mandatory Skill Flags) */}
        {activeTab === 'certifications' && (
          <div className="flex flex-col gap-6">
            <Card className="p-6 glass-panel rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Award size={20} className="text-blue-600" /> Certification Expiry & Mandatory Skill Exposure
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Monitors certifications gating mandatory skills inside the 90-day notification window to avoid audit non-compliance.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-200 uppercase tracking-widest shadow-2xs">
                    {certificationsData.filter(c => c.renewal_flag).length} Action Required (Within 90 Days)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 h-16 min-h-[64px]">
                      <th className="py-5 px-6 text-xs font-black text-slate-600 uppercase tracking-wider align-middle leading-normal min-w-[240px]">Employee</th>
                      <th className="py-5 px-5 text-xs font-black text-slate-600 uppercase tracking-wider align-middle leading-normal min-w-[280px]">Certification & Authority</th>
                      <th className="py-5 px-5 text-xs font-black text-slate-600 uppercase tracking-wider align-middle leading-normal min-w-[140px]">Verification</th>
                      <th className="py-5 px-5 text-xs font-black text-slate-600 uppercase tracking-wider align-middle leading-normal min-w-[130px]">Expiry Date</th>
                      <th className="py-5 px-5 text-xs font-black text-slate-600 uppercase tracking-wider align-middle leading-normal min-w-[140px]">Days Remaining</th>
                      <th className="py-5 px-6 text-xs font-black text-slate-600 uppercase tracking-wider align-middle leading-normal min-w-[180px]">Renewal Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificationsData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-sm font-semibold">No certification records found.</td>
                      </tr>
                    ) : (
                      [...certificationsData].sort((a, b) => (a.days_to_expiry ?? 0) - (b.days_to_expiry ?? 0)).map((cert, idx) => (
                        <tr
                          key={cert.certification_id || cert.id || idx}
                          className="border-b border-slate-100 hover:bg-slate-50/90 transition-colors cursor-pointer group h-16 min-h-[60px]"
                          onClick={() => setSelectedWorkforceEmployee({ id: cert.employee_id, name: cert.display_name || cert.employee_id, role: "Certified Practitioner" })}
                        >
                          <td className="py-4.5 px-6 align-middle min-w-[240px]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 flex items-center justify-center font-black text-xs border border-indigo-100 shadow-2xs group-hover:scale-105 transition-transform">
                                {(cert.employee_id || 'CR').substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                                  {cert.display_name || cert.employee_id}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 group-hover:text-blue-400 mt-0.5">{cert.employee_id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4.5 px-5 align-middle min-w-[280px]">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                                  {cert.certification_name || cert.name}
                                </span>
                                {cert.is_mandatory_for_role && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                    Mandatory Role Gated
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-semibold mt-0.5">
                                {cert.issuing_authority || cert.issuer}
                              </span>
                            </div>
                          </td>
                          <td className="py-4.5 px-5 align-middle min-w-[140px]">
                            {cert.verification_status === 'Verified' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                <ShieldCheck size={14} className="text-emerald-600" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="py-4.5 px-5 align-middle min-w-[130px] text-xs font-black text-slate-700">{cert.expiry_date}</td>
                          <td className="py-4.5 px-5 align-middle min-w-[140px]">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-lg font-black ${cert.days_to_expiry < 0 ? 'text-rose-600' : cert.days_to_expiry <= 30 ? 'text-rose-600' : cert.days_to_expiry <= 90 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {cert.days_to_expiry}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase">Days</span>
                            </div>
                          </td>
                          <td className="py-4.5 px-6 align-middle min-w-[180px]">
                            {cert.renewal_flag ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-[10px] font-black border border-amber-200 shadow-2xs animate-pulse">
                                <ShieldAlert size={14} className="text-amber-600" /> RENEWAL DUE (&lt;90D)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 shadow-2xs">
                                <CheckCircle2 size={14} className="text-emerald-600" /> COMPLIANT
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

      </div>

      {/* Critical Role Drilldown Modal */}
      {selectedCriticalRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedCriticalRole.role_title}</h3>
                  <p className="text-xs font-semibold text-rose-600">Critical Role Details</p>
                </div>
              </div>
              <button onClick={() => setSelectedCriticalRole(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                <strong>Current Status:</strong>
                <p className="mt-1">
                  This role is experiencing talent scarcity in the external market with 0 ready internal successors. Immediate succession pairing is recommended.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Headcount Shortage</span>
                  <div className="text-lg font-black text-slate-900 mt-1">{selectedCriticalRole.headcount_gap} FTE</div>
                  <div className="text-[11px] text-slate-500">Target: {selectedCriticalRole.demand_headcount_net} | Current: {selectedCriticalRole.current_headcount}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Succession Pipeline</span>
                  <div className="text-lg font-black text-rose-600 mt-1">{selectedCriticalRole.ready_successors || 0} Ready</div>
                  <div className="text-[11px] text-slate-500">Requires cross-training</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900">
                <span className="text-blue-700 uppercase font-bold text-[10px]">Recommended Action</span>
                <p className="mt-1 text-xs">
                  Pair with mid-level engineers for rapid mentorship, and open internal sourcing through the Digital Talent Marketplace.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedCriticalRole(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedCriticalRole(null);
                  triggerToast(`Initiated Succession Pairing for ${selectedCriticalRole.role_title}.`);
                }}
                className="px-4 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Initiate Succession Pairing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Twin Chat Modal for AI Retention Insights */}
      {chattingEmployee && (
        <TwinChatModal
          isOpen={true}
          onClose={() => setChattingEmployee(null)}
          employeeName={chattingEmployee.name}
          employeeRole={chattingEmployee.role}
        />
      )}

      {/* Workforce Employee Profile Modal */}
      {selectedWorkforceEmployee && (
        <WorkforceProfileModal
          isOpen={true}
          onClose={() => setSelectedWorkforceEmployee(null)}
          employeeId={selectedWorkforceEmployee.id}
          employeeName={selectedWorkforceEmployee.name}
          role={selectedWorkforceEmployee.role}
        />
      )}

    </div>
  );
};
