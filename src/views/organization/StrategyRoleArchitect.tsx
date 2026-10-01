import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import {
  FileText, Target, Activity, Plus,
  ArrowUpRight, CheckCircle2, X, Sparkles, Database,
  TrendingUp, Cpu, Search, Download, Layers,
  Compass, PieChart, Briefcase,
  ListChecks, Send,
  Info, GitCommit, AlertTriangle,
  User, UserCheck, Building, Sliders, Trash2, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

import api from '../../lib/api';

export const StrategyRoleArchitect: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'hr-inputs' | 'analytics'>('portfolio');
  const [cycle, setCycle] = useState('2025 – 2030 (Active)');
  const [department, setDepartment] = useState('All Departments');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  // Modals & Selected Drawers
  const [selectedRoleSpec, setSelectedRoleSpec] = useState<any | null>(null);
  const [selectedPrimaryInput, setSelectedPrimaryInput] = useState<any | null>(null);
  const [selectedHrInput, setSelectedHrInput] = useState<any | null>(null);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  // HR Inputs Checklist filter states
  const [hrPriorityFilter, setHrPriorityFilter] = useState<'All' | 'Essential' | 'Useful' | 'Optional'>('All');

  // Knowledge Graph search state
  const [kgQuery, setKgQuery] = useState('');
  const [kgResults, setKgResults] = useState<any[]>([]);
  const [isKgSearching, setIsKgSearching] = useState(false);

  // Dynamic state loaded from Backend API
  const [futureRoleSpecs, setFutureRoleSpecs] = useState<any[]>([]);
  const [forecastTimeline, setForecastTimeline] = useState<any[]>([]);
  const [primaryInputs, setPrimaryInputs] = useState<any[]>([]);
  const [knowledgeAssets, setKnowledgeAssets] = useState<any[]>([]);
  const [competencyRadar, setCompetencyRadar] = useState<any[]>([]);
  const [hrInputsChecklist, setHrInputsChecklist] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({
    current_headcount: 6055,
    planned_growth: 727,
    target_headcount: 6782,
    future_roles_count: 62,
    key_skills_count: 48,
    primary_goal: '2025–2030 Cloud & AI Transformation'
  });

  // User Stories 1, 2, 3 & Persona state
  const [strategyDrivers, setStrategyDrivers] = useState<any[]>([]);
  const [orphanedRoles, setOrphanedRoles] = useState<any[]>([]);
  
  // Modals state
  const [selectedRoleForSkills, setSelectedRoleForSkills] = useState<any | null>(null);
  const [selectedRoleForDemand, setSelectedRoleForDemand] = useState<any | null>(null);
  const [isPersonaDrawerOpen, setIsPersonaDrawerOpen] = useState(false);
  
  // Form states
  const [editingSkills, setEditingSkills] = useState<any[]>([]);
  const [editingDriverId, setEditingDriverId] = useState<string>('');
  const [editingStatus, setEditingStatus] = useState<string>('Live');
  const [skillFormError, setSkillFormError] = useState<string | null>(null);
  const [activeSkillModalTab, setActiveSkillModalTab] = useState<'map' | 'history'>('map');

  const [demandForm, setDemandForm] = useState<{ fiscal_year: number; demand_headcount_growth: number; demand_headcount_attrition: number }>({
    fiscal_year: 2026,
    demand_headcount_growth: 2,
    demand_headcount_attrition: 1
  });
  const [demandFormError, setDemandFormError] = useState<string | null>(null);

  // Persona Q&A State
  const [currentPersona, setCurrentPersona] = useState<'Employee' | 'Manager' | 'Employer'>('Employee');
  const [personaQuestion, setPersonaQuestion] = useState<string>('How is my current role expected to evolve over the next few years, and what skills should I start building for it now?');
  const [personaAnswer, setPersonaAnswer] = useState<any | null>(null);
  const [isAskingPersona, setIsAskingPersona] = useState<boolean>(false);

  const samplePersonaQuestions = {
    Employee: "How is my current role expected to evolve over the next few years, and what skills should I start building for it now?",
    Manager: "Given my team's roadmap, which of my roles should I build, buy, borrow, bot or bridge over the next two years?",
    Employer: "Given our three-year digital transformation strategy, what new roles will we need across the organisation, and should we build, buy, borrow, bot or bridge each one?"
  };

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchStrategyData = () => {
    api.organization.getStrategyOverview(department)
      .then((res: any) => {
        if (res) {
          if (res.summary) setSummaryData(res.summary);
          if (res.role_specs && res.role_specs.length > 0) setFutureRoleSpecs(res.role_specs);
          if (res.forecast_timeline) setForecastTimeline(res.forecast_timeline);
          if (res.primary_inputs) setPrimaryInputs(res.primary_inputs);
          if (res.knowledge_assets) setKnowledgeAssets(res.knowledge_assets);
          if (res.competency_radar) setCompetencyRadar(res.competency_radar);
          if (res.hr_inputs_checklist) setHrInputsChecklist(res.hr_inputs_checklist);
        }
      })
      .catch((err) => console.error('Error fetching Strategy Role Architect backend data:', err));

    api.organization.getHrInputsChecklist()
      .then((res: any) => {
        if (res && res.items) {
          setHrInputsChecklist(res.items);
        }
      })
      .catch((err) => console.error('Error fetching HR inputs checklist:', err));

    api.organization.getStrategyDrivers()
      .then((res: any) => {
        if (res) setStrategyDrivers(res);
      })
      .catch((err) => console.error('Error fetching strategy drivers:', err));

    api.organization.getOrphanedRoles()
      .then((res: any) => {
        if (res) setOrphanedRoles(res);
      })
      .catch((err) => console.error('Error fetching orphaned roles:', err));
  };

  useEffect(() => {
    fetchStrategyData();
  }, [department]);

  useEffect(() => {
    if (!kgQuery.trim()) {
      setKgResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsKgSearching(true);
      api.organization.searchKnowledgeGraph(kgQuery)
        .then((res: any) => {
          if (res && res.results) {
            setKgResults(res.results);
          }
        })
        .catch((err) => console.error('Error searching Knowledge Graph:', err))
        .finally(() => setIsKgSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [kgQuery]);

  const handleRunTranslation = () => {
    setIsSynthesizing(true);
    api.organization.translateStrategy(department)
      .then((res: any) => {
        if (res && res.updated_summary) {
          setSummaryData(res.updated_summary);
        }
        fetchStrategyData();
        triggerToast(res?.message || 'Strategy Role Architect pipeline executed successfully.');
      })
      .catch((err) => {
        console.error('Translation pipeline error:', err);
        triggerToast('Failed to execute Strategy Translation pipeline.');
      })
      .finally(() => {
        setIsSynthesizing(false);
      });
  };

  const openSkillMappingModal = (role: any) => {
    setSelectedRoleForSkills(role);
    setEditingDriverId(role.strategy_driver_id || '');
    setEditingStatus(role.status || 'Live');
    setEditingSkills(role.skill_proficiency_map ? JSON.parse(JSON.stringify(role.skill_proficiency_map)) : [
      { skill: "Python", current: 3, target: 4, importance: "Critical" },
      { skill: "Machine Learning", current: 2, target: 4, importance: "Important" }
    ]);
    setSkillFormError(null);
    setActiveSkillModalTab('map');
  };

  const openDemandLineModal = (role: any) => {
    setSelectedRoleForDemand(role);
    setDemandForm({
      fiscal_year: 2026,
      demand_headcount_growth: 2,
      demand_headcount_attrition: 1
    });
    setDemandFormError(null);
  };

  const handleAddSkill = () => {
    setEditingSkills([...editingSkills, { skill: 'New Capability', current: 1, target: 3, importance: 'Important' }]);
  };

  const handleRemoveSkill = (index: number) => {
    setEditingSkills(editingSkills.filter((_, idx) => idx !== index));
  };

  const handleUpdateSkillField = (index: number, field: string, value: any) => {
    const updated = [...editingSkills];
    updated[index] = { ...updated[index], [field]: value };
    setEditingSkills(updated);
  };

  const handleSaveSkillsAndDriver = () => {
    if (!selectedRoleForSkills) return;
    setSkillFormError(null);

    // User Story 3 - AC 1 Mandatory Driver Link check
    if (editingStatus === 'Live' && (!editingDriverId || editingDriverId.trim() === '')) {
      setSkillFormError("Mandatory Validation Error: A Future Role cannot be saved as Live without a valid strategy_driver_id reference.");
      return;
    }

    const updatedRolePayload = {
      role_id: selectedRoleForSkills.role_id,
      role: selectedRoleForSkills.role,
      job_code: selectedRoleForSkills.job_code,
      dept: selectedRoleForSkills.dept,
      business_unit: selectedRoleForSkills.business_unit || selectedRoleForSkills.dept,
      level: selectedRoleForSkills.level,
      strategy_driver_id: editingDriverId,
      status: editingStatus,
      role_evolution: selectedRoleForSkills.role_evolution,
      skill_proficiency_map: editingSkills,
      fulfillment_5b: selectedRoleForSkills.fulfillment_5b
    };

    api.organization.saveStrategyRole(updatedRolePayload)
      .then((res: any) => {
        triggerToast(`Role ${res.role_id} version ${res.version} saved cleanly.`);
        setSelectedRoleForSkills(null);
        fetchStrategyData();
      })
      .catch((err: any) => {
        setSkillFormError(err?.message || "Failed to save Role Skill Map.");
      });
  };

  const handleAddDemandLine = () => {
    if (!selectedRoleForDemand) return;
    setDemandFormError(null);
    
    const gross = Number(demandForm.demand_headcount_growth) + Number(demandForm.demand_headcount_attrition);
    
    // User Story 2 - AC 2 Validation 1: demand_headcount_gross must be > 0
    if (gross <= 0) {
      setDemandFormError("Invalid Demand Line: Gross headcount demand (growth + attrition) must be a positive integer greater than 0.");
      return;
    }

    // User Story 2 - AC 2 Validation 2: Check driver horizon
    const driver = strategyDrivers.find(d => d.id === selectedRoleForDemand.strategy_driver_id);
    if (driver) {
      if (demandForm.fiscal_year < driver.horizon_start_fy || demandForm.fiscal_year > driver.horizon_end_fy) {
        setDemandFormError(`Invalid Demand Line: Fiscal year FY${demandForm.fiscal_year} is outside Strategy Driver horizon (FY${driver.horizon_start_fy} – FY${driver.horizon_end_fy}).`);
        return;
      }
    }

    api.organization.addDemandLine(selectedRoleForDemand.role_id, {
      fiscal_year: Number(demandForm.fiscal_year),
      demand_headcount_growth: Number(demandForm.demand_headcount_growth),
      demand_headcount_attrition: Number(demandForm.demand_headcount_attrition)
    })
      .then((res: any) => {
        triggerToast(res?.message || `Demand Line generated for FY${demandForm.fiscal_year}.`);
        setSelectedRoleForDemand(null);
        fetchStrategyData();
      })
      .catch((err: any) => {
        setDemandFormError(err?.message || "Failed to generate Demand Line.");
      });
  };

  const handleSelectPersona = (p: 'Employee' | 'Manager' | 'Employer') => {
    setCurrentPersona(p);
    setPersonaQuestion(samplePersonaQuestions[p]);
    setPersonaAnswer(null);
  };

  const handleAskPersonaQA = () => {
    setIsAskingPersona(true);
    api.organization.askPersonaQA({ persona: currentPersona, question: personaQuestion, role_id: selectedRoleSpec?.role_id })
      .then((res: any) => {
        setPersonaAnswer(res);
      })
      .catch((err) => {
        console.error('Persona QA Error:', err);
        triggerToast('Failed to retrieve Persona AI guidance.');
      })
      .finally(() => setIsAskingPersona(false));
  };

  const filteredSpecs = futureRoleSpecs.filter(spec => {
    if (!roleSearchQuery.trim()) return true;
    const q = roleSearchQuery.toLowerCase();
    return (
      spec.role?.toLowerCase().includes(q) ||
      spec.role_id?.toLowerCase().includes(q) ||
      spec.dept?.toLowerCase().includes(q) ||
      spec.business_unit?.toLowerCase().includes(q) ||
      spec.skill?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 relative pb-10 w-full font-sans">

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-fade-in">
          <div className="glass px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30">
            <div className="rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md w-8 h-8">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Strategy Translation Pipeline</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer ml-4 border-none bg-transparent">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Executive Header Banner */}
      <div className="z-10 flex flex-row items-center justify-between gap-4 flex-wrap bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 tracking-wider uppercase border border-blue-400/30">
              ORGANIZATION TWIN (OT)
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 tracking-wider uppercase border border-purple-400/30 flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-400" /> Strategic Workforce Architect
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">
            Strategy Role Architect
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
            Turns corporate strategy & business growth roadmaps into future role specifications, target headcount demand, 5B fulfillment routes, and capability skill maps.
          </p>
        </div>

        {/* Executive Controls */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-inner shrink-0 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cycle</span>
            <select
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="text-xs font-bold bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option className="bg-slate-900 text-white">2025 – 2030 (Active)</option>
              <option className="bg-slate-900 text-white">2026 – 2031 (Draft)</option>
            </select>
          </div>

          <div className="w-px h-6 bg-white/20"></div>

          <div className="flex items-center gap-2 px-3 py-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Scope</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="text-xs font-bold bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option className="bg-slate-900 text-white">All Departments</option>
              <option className="bg-slate-900 text-white">Enterprise Analytics</option>
              <option className="bg-slate-900 text-white">Core Network Operations</option>
              <option className="bg-slate-900 text-white">People & Culture</option>
              <option className="bg-slate-900 text-white">Engineering</option>
              <option className="bg-slate-900 text-white">Operations</option>
            </select>
          </div>

          <button
            onClick={() => setIsPersonaDrawerOpen(true)}
            className="px-3.5 py-2 bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-purple-400/30"
          >
            <Sparkles size={14} className="text-amber-300" /> Ask Persona AI Twin
          </button>

          <button
            onClick={handleRunTranslation}
            disabled={isSynthesizing}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 border border-blue-400/30"
          >
            {isSynthesizing ? (
              <span className="flex items-center gap-2 animate-pulse"><Cpu size={14} className="animate-spin text-white" /> Translating...</span>
            ) : (
              <span className="flex items-center gap-2"><Cpu size={14} /> Run Translation</span>
            )}
          </button>
        </div>
      </div>

      {/* User Story 3 - AC 2: Flag Orphaned Roles Alert Banner */}
      {orphanedRoles.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-200 text-amber-900">
                  User Story 3 Flag (AC 3.2)
                </span>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  Flagged Orphaned Roles ({orphanedRoles.length} Role Specs Need Review)
                </h4>
              </div>
              <p className="text-xs text-amber-900 font-medium mt-0.5">
                {orphanedRoles[0].role} ({orphanedRoles[0].role_id}): <span className="font-bold text-amber-950">{orphanedRoles[0].orphan_reason}</span>.
              </p>
            </div>
          </div>

          <button
            onClick={() => openSkillMappingModal(orphanedRoles[0])}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shrink-0 cursor-pointer border-none shadow-sm flex items-center gap-1.5"
          >
            <GitCommit size={14} /> Review & Re-link Driver
          </button>
        </div>
      )}

      {/* 4 Executive Metric KPI Cards */}
      <div className="flex flex-row items-stretch gap-4 w-full overflow-x-auto pb-1">
        
        {/* KPI 1: Target Headcount */}
        <Card className="glass-panel p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between flex-1 min-w-[220px]">
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Target Workforce Capacity</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{summaryData?.target_headcount?.toLocaleString() || '6,782'}</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +{summaryData?.planned_growth || '727'} Growth
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Current Base: {summaryData?.current_headcount?.toLocaleString() || '6,055'} FTE</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Target size={22} />
          </div>
        </Card>

        {/* KPI 2: Future Role Specs */}
        <Card className="glass-panel p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between flex-1 min-w-[220px]">
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Future Role Specifications</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{summaryData?.future_roles_count || '62'}</span>
              <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Active Specs
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Key Skill Competencies: {summaryData?.key_skills_count || '48'}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
            <FileText size={22} />
          </div>
        </Card>

        {/* KPI 3: 5B Build Ratio */}
        <Card className="glass-panel p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between flex-1 min-w-[220px]">
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">5B Fulfillment Mix</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 tracking-tight">58%</span>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Internal Build
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">External Sourcing (Buy/Borrow): 42%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
            <PieChart size={22} />
          </div>
        </Card>

        {/* KPI 4: Primary Strategy Goal */}
        <Card className="glass-panel p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between flex-1 min-w-[220px]">
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Primary Strategy Goal</span>
            <span className="text-sm font-black text-slate-900 block truncate max-w-[170px]" title={summaryData?.primary_goal}>
              {summaryData?.primary_goal || 'Cloud & AI Transformation'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mt-1.5">
              <Sparkles size={11} /> Active Transformation Plan
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Compass size={22} />
          </div>
        </Card>

      </div>

      {/* Main Content Workspace */}
      <div className="flex flex-col gap-6">

        {/* Navigation & Search Bar */}
        <div 
          className="flex items-center justify-between py-5 px-6 rounded-2xl border transition-all duration-300 flex-wrap gap-5 min-h-[88px]"
          style={{ 
            backgroundColor: '#ffffff', 
            borderColor: '#e2e8f0',
            boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.1), 0 8px 12px -6px rgba(15, 23, 42, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 1)'
          }}
        >
          {/* 3D Inset Groove Tab Group */}
          <div 
            className="flex items-center gap-2.5 p-2 rounded-2xl border" 
            style={{ 
              backgroundColor: '#f1f5f9', 
              borderColor: '#cbd5e1',
              boxShadow: 'inset 0 2px 5px 0 rgba(15, 23, 42, 0.08)'
            }}
          >
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-2 border-none ${
                activeTab === 'portfolio'
                  ? 'text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
              style={
                activeTab === 'portfolio'
                  ? {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                      transform: 'translateY(-1px)'
                    }
                  : {}
              }
            >
              <Briefcase size={16} /> Strategic Role Portfolio
            </button>

            <button
              onClick={() => setActiveTab('hr-inputs')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-2 border-none ${
                activeTab === 'hr-inputs'
                  ? 'text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
              style={
                activeTab === 'hr-inputs'
                  ? {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      boxShadow: '0 6px 16px rgba(5, 150, 105, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                      transform: 'translateY(-1px)'
                    }
                  : {}
              }
            >
              <ListChecks size={16} /> Inputs to Request from HR (SF-A)
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${
                activeTab === 'hr-inputs' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                19 Categories
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-2 border-none ${
                activeTab === 'analytics'
                  ? 'text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
              style={
                activeTab === 'analytics'
                  ? {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      color: '#ffffff',
                      boxShadow: '0 6px 16px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                      transform: 'translateY(-1px)'
                    }
                  : {}
              }
            >
              <Activity size={16} /> Strategic Analytics & Radar
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* 3D Inset Search Input */}
            <div 
              className="flex items-center gap-3 px-4.5 py-3 rounded-2xl border transition-all w-72 md:w-96 group focus-within:ring-2 focus-within:ring-blue-500/20"
              style={{ 
                backgroundColor: '#ffffff', 
                borderColor: '#cbd5e1',
                boxShadow: 'inset 0 2px 5px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.02)'
              }}
            >
              <Search size={18} style={{ color: '#475569' }} className="shrink-0 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
                placeholder="Filter roles by title, skill, or ID..."
                className="text-xs sm:text-sm font-semibold focus:outline-none w-full border-none outline-none ring-0 p-0 placeholder:text-slate-400"
                style={{ color: '#0f172a', backgroundColor: 'transparent' }}
              />
              {roleSearchQuery && (
                <button 
                  onClick={() => setRoleSearchQuery('')} 
                  className="cursor-pointer transition-colors p-0.5 border-none bg-transparent hover:text-slate-900"
                  style={{ color: '#64748b' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={() => triggerToast(`Exporting Strategic Role Portfolio to CSV...`)}
              className="px-6 py-3 text-xs sm:text-sm font-extrabold rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer shrink-0 border hover:-translate-y-0.5 active:translate-y-0.5 duration-200"
              style={{ 
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', 
                color: '#ffffff', 
                borderColor: '#0f172a',
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
              }}
            >
              <Download size={17} style={{ color: '#ffffff', stroke: '#ffffff' }} className="shrink-0" />
              <span style={{ color: '#ffffff', fontWeight: 800 }} className="text-xs sm:text-sm tracking-tight">
                Export CSV
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: STRATEGIC ROLE PORTFOLIO & 5B ROUTE */}
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left 2 Columns: Clean Role Blueprint Cards */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" /> Future Role Specifications Portfolio
                </h3>
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Showing {filteredSpecs.length} Priorities
                </span>
              </div>

              {/* Role Cards List */}
              <div className="flex flex-col gap-4">
                {filteredSpecs.map((item, index) => {
                  const breakdown = item.fulfillment_5b_breakdown || { build: 60, buy: 40, borrow: 0, bot: 0, bridge: 0 };
                  const linkedDriver = strategyDrivers.find(d => d.id === item.strategy_driver_id);
                  const isOrphaned = item.is_orphaned || (linkedDriver && linkedDriver.status === 'Expired');

                  return (
                    <Card
                      key={item.role_id || index}
                      className={`glass-panel p-5 border shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col gap-4 bg-white rounded-2xl group ${
                        isOrphaned ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200/90 hover:border-blue-400'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-black text-xs tracking-wider shadow-2xs">
                            {item.role_id || `ROLE-200${index + 1}`}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                                {item.role}
                              </h4>

                              {/* Version Tag (User Story 1 - AC 3) */}
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                {item.version || 'v1.0'}
                              </span>

                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                                item.role_evolution === 'Evolving' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                item.role_evolution === 'Emerging' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                item.role_evolution === 'Sunsetting' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {item.role_evolution || 'Evolving'}
                              </span>

                              {isOrphaned && (
                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                  <AlertTriangle size={11} /> Orphaned Driver
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">{item.business_unit || item.dept} • Level: {item.level}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-xl">
                            Target: {item.target_headcount || item.gap}
                          </span>
                          
                          <button
                            onClick={() => setSelectedRoleSpec(item)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
                          >
                            <span>Inspect 360°</span>
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Strategy Driver Traceability Bar (User Story 3 - AC1, AC2) */}
                      <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/60 text-xs text-slate-700 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <GitCommit size={14} className="text-indigo-600" /> Linked Strategy Driver:
                            <span className="text-slate-900 font-bold underline">
                              {linkedDriver ? `${linkedDriver.id}: ${linkedDriver.title}` : (item.hr_inputs?.strategy_driver || 'Corporate Strategic Plan')}
                            </span>
                          </span>
                          {linkedDriver && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              linkedDriver.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                              Horizon: FY{linkedDriver.horizon_start_fy}–FY{linkedDriver.horizon_end_fy} ({linkedDriver.status})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* User Story 1: Role-Skill Map & Target Proficiency (AC 1, AC 2) */}
                      <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-extrabold text-indigo-950">
                          <span className="flex items-center gap-1.5">
                            <Sliders size={14} className="text-indigo-600" /> Living Role-Skill Map & Proficiency Standards ({item.version || 'v1.0'})
                          </span>
                          <button
                            onClick={() => openSkillMappingModal(item)}
                            className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer border-none bg-transparent"
                          >
                            <Plus size={12} /> Map Skills / Version
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(item.skill_proficiency_map || []).map((sk: any, sIdx: number) => (
                            <div key={sIdx} className="px-2.5 py-1 bg-white rounded-lg border border-indigo-100 text-[11px] font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs">
                              <span>{sk.skill}</span>
                              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-black text-[10px]">
                                Target L{sk.target}
                              </span>
                              {sk.importance && (
                                <span className={`text-[9px] font-black uppercase px-1 rounded ${
                                  sk.importance === 'Critical' ? 'bg-rose-100 text-rose-800' :
                                  sk.importance === 'Important' ? 'bg-amber-100 text-amber-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {sk.importance}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* User Story 2: Workforce Demand Line (AC 1, AC 2) */}
                      <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-emerald-600" /> FY26 Demand Line:
                          </span>
                          <span className="font-bold text-slate-700">
                            Growth (+{item.demand_lines?.[0]?.demand_headcount_growth || 2}) + Attrition (+{item.demand_lines?.[0]?.demand_headcount_attrition || 1}) = 
                          </span>
                          <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-black rounded-lg text-xs">
                            {item.demand_lines?.[0]?.demand_headcount_gross || 3} Gross HC
                          </span>
                        </div>

                        <button
                          onClick={() => openDemandLineModal(item)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg cursor-pointer border-none shadow-2xs flex items-center gap-1"
                        >
                          <Plus size={12} /> Set Demand Line
                        </button>
                      </div>

                      {/* 5B Fulfillment Visual Bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-extrabold">
                          <span className="text-slate-700 flex items-center gap-1">
                            <PieChart size={13} className="text-indigo-600" /> 5B Fulfillment Strategy Allocation:
                          </span>
                          <span className="text-indigo-700 font-bold">{item.fulfillment_5b || 'Build 60% + Buy 40%'}</span>
                        </div>

                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/60">
                          {breakdown.build > 0 && <div style={{ width: `${breakdown.build}%` }} className="bg-blue-500 h-full" title={`Build: ${breakdown.build}%`}></div>}
                          {breakdown.buy > 0 && <div style={{ width: `${breakdown.buy}%` }} className="bg-emerald-500 h-full" title={`Buy: ${breakdown.buy}%`}></div>}
                          {breakdown.borrow > 0 && <div style={{ width: `${breakdown.borrow}%` }} className="bg-amber-500 h-full" title={`Borrow: ${breakdown.borrow}%`}></div>}
                          {breakdown.bot > 0 && <div style={{ width: `${breakdown.bot}%` }} className="bg-purple-500 h-full" title={`Bot: ${breakdown.bot}%`}></div>}
                          {breakdown.bridge > 0 && <div style={{ width: `${breakdown.bridge}%` }} className="bg-rose-500 h-full" title={`Bridge: ${breakdown.bridge}%`}></div>}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 flex-wrap">
                          {breakdown.build > 0 && <span className="flex items-center gap-1 text-blue-700"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Build: {breakdown.build}%</span>}
                          {breakdown.buy > 0 && <span className="flex items-center gap-1 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Buy: {breakdown.buy}%</span>}
                          {breakdown.borrow > 0 && <span className="flex items-center gap-1 text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Borrow: {breakdown.borrow}%</span>}
                          {breakdown.bot > 0 && <span className="flex items-center gap-1 text-purple-700"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Bot: {breakdown.bot}%</span>}
                          {breakdown.bridge > 0 && <span className="flex items-center gap-1 text-rose-700"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Bridge: {breakdown.bridge}%</span>}
                        </div>
                      </div>

                    </Card>
                  );
                })}
              </div>

            </div>

            {/* Right 1 Column: Strategy Documents & Knowledge Assets */}
            <div className="lg:col-span-1 flex flex-col gap-6">

              {/* Primary Strategy Inputs */}
              <Card className="glass-panel flex flex-col p-5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-100"><FileText size={15} /></div>
                    Parsed Strategy Artifacts
                  </h3>
                  <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">{primaryInputs.length} Sources</span>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">Corporate plans & business scenarios parsed by AI pipeline.</p>

                <div className="flex flex-col gap-3">
                  {primaryInputs.map((input, idx) => (
                    <div 
                      key={input.id || idx} 
                      onClick={() => setSelectedPrimaryInput(input)}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileText size={15} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800 leading-tight group-hover:text-purple-600 transition-colors truncate">{input.title}</h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{input.type} • {input.date}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9.5px] font-black rounded-full border border-emerald-200/80 shrink-0 ml-2 shadow-2xs">
                        {input.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Knowledge Graph Assets */}
              <Card className="glass-panel flex flex-col p-5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100"><Database size={15} /></div>
                    Knowledge Graph Nodes
                  </h3>
                  <button 
                    onClick={() => setIsKnowledgeModalOpen(true)}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer border-none bg-transparent"
                  >
                    <span>Query Graph</span>
                    <ArrowUpRight size={11} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">Institutional wiki & taxonomy blueprints indexed for AI.</p>

                <div className="flex flex-col gap-3">
                  {knowledgeAssets.map((asset, idx) => (
                    <div key={asset.id || idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">{asset.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full font-black text-[10.5px]" style={{ color: asset.color || '#3b82f6', backgroundColor: `${asset.color}15` }}>
                        {asset.count}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

          </div>
        )}

        {/* TAB 2: HR INPUTS CHECKLIST (SF-A) */}
        {activeTab === 'hr-inputs' && (
          <div className="flex flex-col gap-6">

            {/* Checklist Overview & Search Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ListChecks className="text-emerald-600" size={22} /> Standard Data to Request from HR / SF-A
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete list of 19 standard HRIS data inputs required to generate future role specifications and target headcount demand lines.
                </p>
              </div>

              {/* Priority Filter Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">Filter Priority:</span>
                {(['All', 'Essential', 'Useful', 'Optional'] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setHrPriorityFilter(priority)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border-none ${
                      hrPriorityFilter === priority
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of 19 HR Input Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hrInputsChecklist
                .filter(item => hrPriorityFilter === 'All' || item.priority.includes(hrPriorityFilter))
                .map((item, idx) => (
                  <Card
                    key={item.id || idx}
                    onClick={() => setSelectedHrInput(item)}
                    className="glass-panel p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between gap-3 bg-white rounded-2xl cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-900 text-white shadow-2xs">
                          Category {idx + 1}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          item.priority.includes('Essential') ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          item.priority === 'Useful' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.priority}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors mb-1">
                        {item.category}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">
                        {item.data_to_request}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] font-bold text-slate-500">
                      <span>Source: <strong className="text-slate-800">{item.system_source || 'SF-A / HRIS'}</strong></span>
                      <span className="text-emerald-700 font-extrabold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>Inspect</span> <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </Card>
                ))}
            </div>

          </div>
        )}

        {/* TAB 3: STRATEGIC ANALYTICS & RADAR */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recharts Area Chart: Strategic Headcount Trajectory */}
            <Card className="glass-panel p-5 border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" /> 2025–2030 Strategic Headcount Trajectory
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Multi-year target capacity vs. current base across departments.</p>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastTimeline}>
                    <defs>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 700 }} domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="target" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTarget)" name="Target Headcount" />
                    <Area type="monotone" dataKey="headcount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBase)" name="Current Base" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recharts Radar Chart: Competency Shift Radar */}
            <Card className="glass-panel p-5 border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity size={18} className="text-purple-600" /> Enterprise Competency Shift Radar
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Target capability intensity across key strategic tech domains.</p>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencyRadar}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 800 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} />
                    <Radar name="Competency Intensity" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>
        )}

      </div>

      {/* MODAL 1: INSPECT 360° ROLE SPECIFICATIONS */}
      {selectedRoleSpec && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  {selectedRoleSpec.role_id?.slice(-4) || 'SPEC'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedRoleSpec.role}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {selectedRoleSpec.dept} • Level: {selectedRoleSpec.level} • {selectedRoleSpec.job_code}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedRoleSpec(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4 text-xs">
              
              {/* Section 1: Executive Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2">
                <span className="font-extrabold text-slate-400 text-[10px] uppercase block">Role Specification Purpose:</span>
                <p className="text-slate-800 font-semibold leading-relaxed">
                  {selectedRoleSpec.role_spec}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-extrabold text-slate-400 text-[10px] uppercase">Career Hierarchy:</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {selectedRoleSpec.career_hierarchy || selectedRoleSpec.level}
                  </span>
                </div>
              </div>

              {/* Section 2: Headcount Demand & Gap */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-col">
                  <span className="font-extrabold text-blue-900 text-[10px] uppercase">Current Headcount</span>
                  <span className="text-xl font-black text-blue-700 mt-1">{selectedRoleSpec.current_headcount} FTE</span>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex flex-col">
                  <span className="font-extrabold text-purple-900 text-[10px] uppercase">Budgeted FY26 Target</span>
                  <span className="text-xl font-black text-purple-700 mt-1">{selectedRoleSpec.budgeted_headcount || selectedRoleSpec.target_headcount}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col">
                  <span className="font-extrabold text-emerald-900 text-[10px] uppercase">Net Growth Gap</span>
                  <span className="text-xl font-black text-emerald-700 mt-1">{selectedRoleSpec.gap} FTE</span>
                </div>
              </div>

              {/* Section 3: HR Inputs & Strategy Traceability */}
              {selectedRoleSpec.hr_inputs && (
                <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100 flex flex-col gap-2.5">
                  <span className="font-black text-purple-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-600" /> HRIS & Strategy Inputs (SF-A)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase">Strategy Driver</span>
                      <span className="font-black text-slate-800 leading-snug">{selectedRoleSpec.hr_inputs.strategy_driver}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase">Operating Model</span>
                      <span className="font-black text-slate-800 leading-snug">{selectedRoleSpec.hr_inputs.future_operating_model}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase">Historical Attrition</span>
                      <span className="font-black text-rose-700">{selectedRoleSpec.hr_inputs.historical_attrition}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase">OpEx Budget Ceiling</span>
                      <span className="font-black text-emerald-700">{selectedRoleSpec.hr_inputs.opex_budget_ceiling}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Feeder Pathways & Market Risk */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="font-extrabold text-slate-400 text-[10px] uppercase block">Internal Feeder Roles:</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {(selectedRoleSpec.internal_mobility || ['Feeder Roles']).map((f: string, i: number) => (
                      <span key={i} className="px-2.5 py-0.5 bg-slate-200 text-slate-800 text-[11px] font-bold rounded-md">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-400 text-[10px] uppercase block">Market Sourcing Risk:</span>
                  <span className="font-black text-amber-700 text-xs">{selectedRoleSpec.market_risk || 'Medium'}</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setSelectedRoleSpec(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
              >
                Close Specs
              </button>
              <button
                onClick={() => {
                  triggerToast(`Committed ${selectedRoleSpec.role} (${selectedRoleSpec.role_id}) to Strategic Recruiting Plan!`);
                  setSelectedRoleSpec(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Plus size={14} /> Commit to Strategic Plan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* USER STORY 1 MODAL: MAP SKILLS & VERSION ROLE-SKILL MAP (AC 1, AC 2, AC 3) */}
      {selectedRoleForSkills && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Map Skills & Proficiency — {selectedRoleForSkills.role}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Role ID: {selectedRoleForSkills.role_id} • Current Version: <span className="font-black text-indigo-600">{selectedRoleForSkills.version || 'v1.0'}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedRoleForSkills(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            {/* Error Message if Validation Fails */}
            {skillFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span>{skillFormError}</span>
              </div>
            )}

            {/* Tabs inside modal: Map Skills vs Version History */}
            <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveSkillModalTab('map')}
                className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer border-none ${
                  activeSkillModalTab === 'map' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Map Skills & Proficiency (AC 1 & AC 2)
              </button>
              <button
                onClick={() => setActiveSkillModalTab('history')}
                className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer border-none ${
                  activeSkillModalTab === 'history' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Version History Snapshot (AC 3)
              </button>
            </div>

            {/* TAB: MAP SKILLS & PROFICIENCY */}
            {activeSkillModalTab === 'map' && (
              <div className="flex flex-col gap-4 text-xs">
                
                {/* User Story 3 - AC 1: Strategy Driver Link Selector */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-1.5">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center justify-between">
                    <span className="flex items-center gap-1"><GitCommit size={13} className="text-indigo-600" /> Mandatory Strategy Driver Reference (User Story 3 - AC 1)</span>
                    <span className="text-rose-600 font-black">* Mandatory for Live Status</span>
                  </label>
                  <select
                    value={editingDriverId}
                    onChange={(e) => setEditingDriverId(e.target.value)}
                    className="p-2.5 bg-white rounded-xl border border-slate-300 font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Select Mandatory Strategy Driver --</option>
                    {strategyDrivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.id}: {drv.title} (Horizon: FY{drv.horizon_start_fy}–FY{drv.horizon_end_fy}, {drv.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Status Picker */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-extrabold text-slate-700">Role Status</span>
                  <div className="flex items-center gap-2">
                    {(['Live', 'Draft', 'Archived'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setEditingStatus(st)}
                        className={`px-3 py-1 rounded-lg font-black text-xs cursor-pointer border-none ${
                          editingStatus === st ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skill Catalog Mapping List */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                      Required Skills & Proficiency Levels (1 Basic to 5 Expert)
                    </span>
                    <button
                      onClick={handleAddSkill}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-lg cursor-pointer border-none shadow-2xs flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Skill Requirement
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {editingSkills.map((sk, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                        {/* Skill Name Input */}
                        <div className="flex-1 min-w-[140px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Skill Name</span>
                          <input
                            type="text"
                            value={sk.skill}
                            onChange={(e) => handleUpdateSkillField(idx, 'skill', e.target.value)}
                            className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 w-full"
                          />
                        </div>

                        {/* Target Proficiency Selector (L1 to L5) */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Target Level (1-5)</span>
                          <select
                            value={sk.target}
                            onChange={(e) => handleUpdateSkillField(idx, 'target', Number(e.target.value))}
                            className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                          >
                            <option value={1}>L1 - Basic</option>
                            <option value={2}>L2 - Working</option>
                            <option value={3}>L3 - Intermediate</option>
                            <option value={4}>L4 - Senior</option>
                            <option value={5}>L5 - Expert</option>
                          </select>
                        </div>

                        {/* Importance Rating (Critical, Important, Desirable) */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Importance</span>
                          <select
                            value={sk.importance || 'Important'}
                            onChange={(e) => handleUpdateSkillField(idx, 'importance', e.target.value)}
                            className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                          >
                            <option value="Critical">Critical</option>
                            <option value="Important">Important</option>
                            <option value="Desirable">Desirable</option>
                          </select>
                        </div>

                        {/* Remove Skill */}
                        <button
                          onClick={() => handleRemoveSkill(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer border-none bg-transparent self-end mb-0.5"
                          title="Remove Skill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: VERSION HISTORY LOG (AC 3) */}
            {activeSkillModalTab === 'history' && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-950 font-medium">
                  Prior versions remain intact to ensure historical headcount demand calculations are completely unaffected.
                </div>

                {selectedRoleForSkills.version_history && selectedRoleForSkills.version_history.length > 0 ? (
                  selectedRoleForSkills.version_history.map((vh: any, vIdx: number) => (
                    <div key={vIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Clock size={14} className="text-indigo-600" /> Version Snapshot {vh.version}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{vh.updated_at}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(vh.skills || []).map((sk: any, skIdx: number) => (
                          <span key={skIdx} className="px-2 py-0.5 bg-white text-slate-700 text-[10.5px] font-semibold rounded border border-slate-200">
                            {sk.skill} (Target L{sk.target} - {sk.importance})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    This role is currently on initial version <span className="font-bold text-slate-700">{selectedRoleForSkills.version || 'v1.0'}</span>. Editing skills on a Live role will log the prior version here automatically.
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setSelectedRoleForSkills(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
              >
                Cancel
              </button>
              {activeSkillModalTab === 'map' && (
                <button
                  onClick={handleSaveSkillsAndDriver}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <CheckCircle2 size={14} /> Save & Publish New Version
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* USER STORY 2 MODAL: GENERATE DEMAND LINE (AC 1 & AC 2) */}
      {selectedRoleForDemand && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Generate Workforce Demand Line</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Role: {selectedRoleForDemand.role} ({selectedRoleForDemand.role_id})
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedRoleForDemand(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            {/* Error Message if Validation Fails */}
            {demandFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span>{demandFormError}</span>
              </div>
            )}

            {/* Linked Strategy Driver Info */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs mb-4">
              <span className="font-extrabold text-emerald-950 block">Linked Strategy Driver:</span>
              <p className="text-emerald-900 font-bold mt-0.5">
                {selectedRoleForDemand.strategy_driver_id || 'DRV-101'}: Scale AI-enabled analytics across retail lines
              </p>
              <span className="text-[10px] font-bold text-emerald-700 block mt-1">
                📅 Driver Horizon: FY2025 – FY2028 (Input FY must fall within this horizon)
              </span>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-3.5 text-xs mb-4">
              
              {/* Fiscal Year Input */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Fiscal Year (FY)</label>
                <input
                  type="number"
                  value={demandForm.fiscal_year}
                  onChange={(e) => setDemandForm({ ...demandForm, fiscal_year: Number(e.target.value) })}
                  className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 w-full"
                  placeholder="e.g. 2026"
                />
              </div>

              {/* Strategy Growth Headcount */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Strategy-Driven Growth Headcount (Net-New)</label>
                <input
                  type="number"
                  value={demandForm.demand_headcount_growth}
                  onChange={(e) => setDemandForm({ ...demandForm, demand_headcount_growth: Number(e.target.value) })}
                  className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 w-full"
                  placeholder="e.g. 2"
                />
              </div>

              {/* Attrition Replacement Headcount */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Attrition Replacement Headcount</label>
                <input
                  type="number"
                  value={demandForm.demand_headcount_attrition}
                  onChange={(e) => setDemandForm({ ...demandForm, demand_headcount_attrition: Number(e.target.value) })}
                  className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 w-full"
                  placeholder="e.g. 1"
                />
              </div>

              {/* Live Preview Gross Demand Calculation */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <span className="font-bold text-slate-300">Calculated Gross Headcount Demand:</span>
                <span className="text-xl font-black text-emerald-400">
                  {Number(demandForm.demand_headcount_growth) + Number(demandForm.demand_headcount_attrition)} Gross HC
                </span>
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedRoleForDemand(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDemandLine}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none"
              >
                <CheckCircle2 size={14} /> Generate & Validate Demand Line
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PERSONA AI Q&A DRAWER (Employee, Manager, Employer Questions) */}
      {isPersonaDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  <Sparkles size={20} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Strategy Role Architect — Persona AI Twin Q&A</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Simulate persona-specific questions for Employee, Manager, and Employer / Executive
                  </p>
                </div>
              </div>
              <button onClick={() => setIsPersonaDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            {/* Persona Switcher Buttons */}
            <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => handleSelectPersona('Employee')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                  currentPersona === 'Employee' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User size={14} /> Employee Persona
              </button>
              <button
                onClick={() => handleSelectPersona('Manager')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                  currentPersona === 'Manager' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck size={14} /> Manager Persona
              </button>
              <button
                onClick={() => handleSelectPersona('Employer')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                  currentPersona === 'Employer' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building size={14} /> Employer / Executive
              </button>
            </div>

            {/* Question Input */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-xs font-black text-slate-800">Persona Sample Question:</label>
              <textarea
                rows={3}
                value={personaQuestion}
                onChange={(e) => setPersonaQuestion(e.target.value)}
                className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 w-full focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAskPersonaQA}
                disabled={isAskingPersona}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center justify-center gap-2 self-end"
              >
                {isAskingPersona ? (
                  <span className="flex items-center gap-2"><Cpu size={14} className="animate-spin" /> Synthesizing Strategy Guidance...</span>
                ) : (
                  <span className="flex items-center gap-2"><Sparkles size={14} /> Ask Persona Twin AI</span>
                )}
              </button>
            </div>

            {/* Persona Answer Display Card */}
            {personaAnswer && (
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-col gap-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="font-black text-purple-900 text-xs">AI Twin Persona Response ({personaAnswer.persona})</span>
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full font-black text-[10px]">Strategy Role Architect</span>
                </div>

                <p className="text-slate-800 font-bold leading-relaxed">{personaAnswer.answer_summary}</p>

                {personaAnswer.key_skills_to_build && (
                  <div>
                    <span className="font-extrabold text-purple-900 uppercase text-[10px] block mb-1">Target Skills to Build:</span>
                    <div className="flex flex-col gap-1">
                      {personaAnswer.key_skills_to_build.map((s: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white rounded-lg border border-purple-100 flex items-center justify-between">
                          <span className="font-extrabold text-slate-800">{s.skill}</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-black rounded text-[10px]">
                            {s.target_proficiency} ({s.urgency})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {personaAnswer.recommended_5b_breakdown && (
                  <div>
                    <span className="font-extrabold text-purple-900 uppercase text-[10px] block mb-1">Recommended 5B Sourcing Route:</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                      <div className="p-2 bg-white rounded-lg border border-purple-100">Build: {personaAnswer.recommended_5b_breakdown.build}</div>
                      <div className="p-2 bg-white rounded-lg border border-purple-100">Buy: {personaAnswer.recommended_5b_breakdown.buy}</div>
                      <div className="p-2 bg-white rounded-lg border border-purple-100">Borrow: {personaAnswer.recommended_5b_breakdown.borrow}</div>
                      <div className="p-2 bg-white rounded-lg border border-purple-100">Bot: {personaAnswer.recommended_5b_breakdown.bot}</div>
                    </div>
                  </div>
                )}

                {personaAnswer.strategic_role_specs_required && (
                  <div>
                    <span className="font-extrabold text-purple-900 uppercase text-[10px] block mb-1">Strategic Role Families Required:</span>
                    <div className="flex flex-col gap-1">
                      {personaAnswer.strategic_role_specs_required.map((rf: any, rIdx: number) => (
                        <div key={rIdx} className="p-2 bg-white rounded-lg border border-purple-100 flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-slate-800">{rf.role_family} (+{rf.new_roles} roles)</span>
                          <span className="text-purple-700 font-bold">{rf['5b_route']}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setIsPersonaDrawerOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
              >
                Close Q&A Drawer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: KNOWLEDGE GRAPH QUERY MODAL */}
      {isKnowledgeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Synthesized Knowledge Graph Query</h3>
                  <p className="text-xs font-medium text-slate-400">Query corporate artifacts, wikis, and project histories</p>
                </div>
              </div>
              <button onClick={() => setIsKnowledgeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl mb-4 text-xs font-medium text-purple-950 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600 shrink-0" />
              1,420 Knowledge Graph nodes indexed from institutional wikis & project repositories.
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200 mb-4">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={kgQuery}
                onChange={(e) => setKgQuery(e.target.value)}
                placeholder="Search knowledge graph (e.g. Data, Network, Analytics)..."
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none w-full border-none outline-none ring-0 p-0"
              />
              {kgQuery && (
                <button onClick={() => setKgQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent p-0">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results Container */}
            <div className="max-h-64 overflow-y-auto flex flex-col gap-2 mb-4 pr-1">
              {isKgSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 font-medium animate-pulse flex items-center justify-center gap-2">
                  <Cpu size={14} className="animate-spin text-purple-600" /> Searching Knowledge Graph...
                </div>
              ) : kgResults.length > 0 ? (
                kgResults.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-slate-50 hover:bg-purple-50/50 rounded-xl border border-slate-200/80 hover:border-purple-200 transition-all text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{item.subtitle}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{item.details}</p>
                  </div>
                ))
              ) : kgQuery ? (
                <div className="p-4 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No knowledge graph nodes found matching "{kgQuery}".
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-slate-100">
                  Type a keyword above (e.g. "Data", "Network", "Analytics") to query indexed nodes.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setIsKnowledgeModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer border-none">
                Close Query Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRIMARY STRATEGY INPUT DOCUMENT INSPECTION */}
      {selectedPrimaryInput && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedPrimaryInput.title}</h3>
                  <p className="text-xs font-medium text-slate-400">{selectedPrimaryInput.type} • Last Synced: {selectedPrimaryInput.date}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPrimaryInput(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs mb-5">
              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between">
                <span className="font-bold text-purple-900">AI Parsing Status</span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200/80">
                  {selectedPrimaryInput.status}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[9.5px]">Extracted Strategy Insights</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Contains target transformation goals for 2025–2030, cloud infrastructure requirements, and skill capability frameworks used to calculate target headcounts and future role specifications.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-600">AI Confidence Score</span>
                <span className="font-black text-blue-600">98.4% Match</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedPrimaryInput(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  triggerToast(`Re-indexing ${selectedPrimaryInput.title} with AI Translation Pipeline...`);
                  setSelectedPrimaryInput(null);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Sparkles size={14} /> Re-parse with AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: HR INPUT CATEGORY SCHEME & MAPPING INSPECTION */}
      {selectedHrInput && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  <ListChecks size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedHrInput.category}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Source: {selectedHrInput.system_source || 'SF-A / HRIS'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedHrInput(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-3.5 text-xs mb-5">
              
              {/* Priority & Status Banner */}
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-500 uppercase text-[10px]">Priority:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase border ${
                    (selectedHrInput.priority || '').includes('Essential') ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    selectedHrInput.priority === 'Useful' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {selectedHrInput.priority}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-500 uppercase text-[10px]">Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {selectedHrInput.integration_status || 'Synced'}
                  </span>
                </div>
              </div>

              {/* Data to Request Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-1.5">
                <span className="font-black text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Info size={13} className="text-emerald-600" /> Standard Data to Request from HR (SF-A)
                </span>
                <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                  {selectedHrInput.data_to_request}
                </p>
              </div>

              {/* Module Output Impact */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col gap-1">
                <span className="font-black text-blue-900 uppercase tracking-wider text-[10px]">Downstream Strategy Architect Impact</span>
                <p className="text-blue-800 text-xs font-bold">
                  ⚡ {selectedHrInput.output_impact || 'Feeds into Strategy Role Specifications & Target Headcount'}
                </p>
              </div>

              {/* Field Schema JSON Preview */}
              <div className="p-3 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[10.5px] flex flex-col gap-1">
                <div className="flex justify-between items-center text-[9.5px] text-slate-400 border-b border-slate-800 pb-1 mb-1">
                  <span>SF-A DATA PAYLOAD SCHEMA</span>
                  <span>JSON STRUCT</span>
                </div>
                <code>{`{`}</code>
                <code>&nbsp;&nbsp;"category": "{selectedHrInput.category}",</code>
                <code>&nbsp;&nbsp;"system_source": "{selectedHrInput.system_source || 'SF-A / HRIS'}",</code>
                <code>&nbsp;&nbsp;"priority": "{selectedHrInput.priority}",</code>
                <code>&nbsp;&nbsp;"output_impact": "{selectedHrInput.output_impact || 'Role Specs'}"</code>
                <code>{`}`}</code>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedHrInput(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
              >
                Close Window
              </button>
              <button
                onClick={() => {
                  triggerToast(`Data Request for "${selectedHrInput.category}" sent to HRIS (SF-A) team!`);
                  setSelectedHrInput(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Send size={14} /> Send Data Request to HR
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
