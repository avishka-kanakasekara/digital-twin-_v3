import React, { useState, useEffect } from 'react';
import {
  Users, Plus, CheckCircle2, X, Sparkles,
  TrendingUp, Download, Clock,
  Workflow, BookOpen, Filter, Search, RefreshCw,
  ChevronRight, ChevronDown, Building2
} from 'lucide-react';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area
} from 'recharts';
import api from '../../lib/api';

import { RoleArchitectStudio } from './RoleArchitectStudio';
type TabMode = 'role-studio' | 'roles' | 'drivers' | 'demand' | 'skills';

export const StrategyRoleArchitect: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('role-studio');
  const [cycle, setCycle] = useState('FY26 – FY28 (Active Plan)');
  const [department, setDepartment] = useState('All Departments');
  const [evolutionFilter, setEvolutionFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [, setLoading] = useState(false);

  // Selected detail states
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  
  // Modals for creation
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateDriverOpen, setIsCreateDriverOpen] = useState(false);

  // Data from backend
  const [futureRoles, setFutureRoles] = useState<any[]>([]);
  const [strategyDrivers, setStrategyDrivers] = useState<any[]>([]);
  const [skillsTaxonomy, setSkillsTaxonomy] = useState<any[]>([]);
  const [forecastTimeline, setForecastTimeline] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({
    current_headcount: 63,
    planned_growth: 22,
    target_headcount: 85,
    future_roles_count: 14,
    key_skills_count: 60,
    strategy_drivers_count: 6,
    primary_goal: 'FY26–FY28 Enterprise Strategic Workforce Transformation',
    five_b_aggregate: { build: 54, buy: 23, borrow: 7, bot: 11, bridge: 5 }
  });

  // New role form state
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleDept, setNewRoleDept] = useState('Engineering');
  const [newRoleLevel, setNewRoleLevel] = useState('L4 Senior');
  const [newRoleDriver, setNewRoleDriver] = useState('STR-001');
  const [newRoleEvolution, setNewRoleEvolution] = useState('Evolving');
  const [newRoleHeadcount, setNewRoleHeadcount] = useState(4);
  const [newRoleTargetHeadcount, setNewRoleTargetHeadcount] = useState(8);
  const [newRolePurpose, setNewRolePurpose] = useState('');

  // New driver form state
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverType, setNewDriverType] = useState('Growth');
  const [newDriverDesc, setNewDriverDesc] = useState('');
  const [newDriverDept, setNewDriverDept] = useState('Engineering');
  const [newDriverGrowth, setNewDriverGrowth] = useState(0.35);
  const [newDriverGain, setNewDriverGain] = useState(0.20);
  const [newDriverOpex, setNewDriverOpex] = useState(45000000);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    setLoading(true);
    api.organization.getStrategyOverview(department)
      .then((res: any) => {
        if (res) {
          if (res.summary) setSummaryData(res.summary);
          if (res.future_roles) setFutureRoles(res.future_roles);
          if (res.strategy_drivers) setStrategyDrivers(res.strategy_drivers);
          if (res.skills_taxonomy) setSkillsTaxonomy(res.skills_taxonomy);
          if (res.forecast_timeline) setForecastTimeline(res.forecast_timeline);
        }
      })
      .catch((err) => {
        console.error('Failed to load Strategy Role Architect data:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [department]);

  const handleRunTranslation = () => {
    setIsSynthesizing(true);
    api.organization.translateStrategy(department)
      .then((res: any) => {
        triggerToast(res?.message || 'Strategic workforce targets synchronized successfully.');
        loadData();
      })
      .catch((err) => {
        console.error(err);
        triggerToast('Failed to refresh strategic targets.');
      })
      .finally(() => setIsSynthesizing(false));
  };



  const handleCreateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) {
      triggerToast('Role title is required.');
      return;
    }
    const matchedDriver = strategyDrivers.find(d => d.strategy_driver_id === newRoleDriver);
    const payload = {
      role_title: newRoleTitle,
      dept: newRoleDept,
      career_level_id: newRoleLevel,
      strategy_driver_id: newRoleDriver,
      strategy_driver_name: matchedDriver?.driver_name || 'Corporate Transformation',
      role_evolution_class: newRoleEvolution,
      current_headcount: Number(newRoleHeadcount),
      target_headcount: Number(newRoleTargetHeadcount),
      role_purpose: newRolePurpose || `Advances ${matchedDriver?.driver_name || 'strategic initiatives'}.`,
      strategic_impact: 0.85,
      revenue_dependency: 0.75,
      downstream_blocking: 0.80,
      spof: 0.70,
      regulatory_exposure: 0.60
    };

    api.organization.createFutureRole(payload)
      .then((created: any) => {
        triggerToast(`Future Role ${created.job_code} created (Draft v1).`);
        setIsCreateRoleOpen(false);
        setNewRoleTitle('');
        setNewRolePurpose('');
        loadData();
      })
      .catch(console.error);
  };

  const handleCreateDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim()) {
      triggerToast('Driver name is required.');
      return;
    }
    const payload = {
      driver_name: newDriverName,
      driver_type: newDriverType,
      description: newDriverDesc || 'Corporate strategic intent driver.',
      affected_dept: newDriverDept,
      workforce_growth_assumption_pct: Number(newDriverGrowth),
      expected_productivity_gain_pct: Number(newDriverGain),
      opex_ceiling_lkr: Number(newDriverOpex),
      priority_rank: strategyDrivers.length + 1
    };

    api.organization.addStrategyDriver(payload)
      .then((created: any) => {
        triggerToast(`Strategic Driver ${created.strategy_driver_id} added.`);
        setIsCreateDriverOpen(false);
        setNewDriverName('');
        setNewDriverDesc('');
        loadData();
      })
      .catch(console.error);
  };

  const handleExportCSV = () => {
    const headers = [
      "Role ID", "Job Code", "Role Title", "Department", "Level", "Strategy Driver ID",
      "Strategy Driver Name", "Evolution Class", "Criticality Tier", "Criticality Index",
      "Current Headcount", "FY26 Net Demand", "5B Fulfilment Strategy", "Build Cost (LKR)",
      "Buy Cost (LKR)", "Feeder Roles", "Status"
    ];

    const rows = futureRoles.map(r => [
      r.future_role_id,
      r.job_code,
      `"${r.role_title.replace(/"/g, '""')}"`,
      r.dept,
      r.career_level_id,
      r.strategy_driver_id,
      `"${(r.strategy_driver_name || '').replace(/"/g, '""')}"`,
      r.role_evolution_class,
      r.criticality_tier,
      r.business_criticality_index,
      r.current_headcount,
      r.demand_lines?.[0]?.demand_headcount_net || '',
      `"${(r.five_b_strategy?.summary || '').replace(/"/g, '""')}"`,
      r.build_cost_lkr,
      r.buy_cost_lkr,
      `"${(r.feeder_roles?.map((f: any) => f.title).join('; ') || '').replace(/"/g, '""')}"`,
      r.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Workforce_Role_Architecture_${department.replace(/\s+/g, '_')}_FY26-FY28.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast(`Exported ${futureRoles.length} role specifications.`);
  };

  const filteredRoles = futureRoles.filter(r => {
    if (evolutionFilter !== 'ALL' && r.role_evolution_class !== evolutionFilter) return false;
    if (tierFilter !== 'ALL' && r.criticality_tier !== tierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.role_title?.toLowerCase().includes(q);
      const matchCode = r.job_code?.toLowerCase().includes(q);
      const matchDriver = r.strategy_driver_name?.toLowerCase().includes(q) || r.strategy_driver_id?.toLowerCase().includes(q);
      const matchSkill = r.role_skill_requirements?.some((req: any) => req.skill_name?.toLowerCase().includes(q));
      if (!matchTitle && !matchCode && !matchDriver && !matchSkill) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 text-left w-full pb-16">

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Page Header Bar - Clean Single Horizontal Row */}
      <div className="flex flex-col gap-1 w-full pt-1">
        
        {/* Main Line: Title on Left, Standardized Action Toolbar on Right */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full py-1">
          
          {/* Left: Title */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Role Architect
            </h1>
          </div>

          {/* Right: Action Toolbar with Standard Heights & Paddings */}
          {activeTab !== 'role-studio' && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            
            {/* Horizon Selector */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-6 appearance-none text-slate-800 font-semibold text-xs"
                >
                  <option>FY26 – FY28</option>
                  <option>FY27 – FY29</option>
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>

            {/* Department Scope */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-6 appearance-none text-slate-800 font-semibold text-xs"
                >
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Operations</option>
                  <option>Corporate</option>
                  <option>Product</option>
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block mx-0.5" />

            {/* Re-synthesize Button */}
            <button
              onClick={handleRunTranslation}
              disabled={isSynthesizing}
              className="flex items-center gap-2 h-9 px-3 bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap active:scale-[0.98]"
              title="Refresh strategic targets from corporate drivers"
            >
              <RefreshCw size={13} className={isSynthesizing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              <span>{isSynthesizing ? 'Updating...' : 'Synthesize Plan'}</span>
            </button>

            {/* Export Matrix */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 h-9 px-3 bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
              title="Export full specification matrix to CSV"
            >
              <Download size={13} className="text-slate-500" />
              <span>Export Matrix</span>
            </button>

            {/* Map Future Role Primary Action */}
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <Plus size={14} className="text-white shrink-0" />
              <span className="text-white">Map Future Role</span>
            </button>
          </div>
          )}
        </div>
        {/* Subtitle Description */}
        <p className="text-xs text-slate-500 max-w-2xl">
          Enterprise blueprint for versioned role specifications, skill requirements, and FY26–FY28 capacity planning.
        </p>

      </div>

      {/* Unified Executive Scorecard Ribbon - Clean 6 KPI Stats */}
      {activeTab !== 'role-studio' && (() => {
        const activeHeadcount = summaryData.current_headcount || 63;
        const plannedGrowth = summaryData.planned_growth || 22;
        const targetHeadcount = activeHeadcount + plannedGrowth;
        const growthPct = Math.round((plannedGrowth / (activeHeadcount || 1)) * 100);

        return (
          <div 
            className="w-full min-w-0 overflow-x-auto no-scrollbar"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
              gap: '8px'
            }}
          >
            
            {/* 1: Baseline - Blue Theme */}
            <div className="bg-gradient-to-b from-blue-50/80 via-blue-50/20 to-white border border-blue-200/80 border-t-2 border-t-blue-600 rounded-xl px-3 py-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-blue-700/90 uppercase tracking-wider truncate">
                Active Baseline
              </div>
              <div className="text-lg font-extrabold text-slate-900 leading-none truncate">
                {activeHeadcount.toLocaleString()}
              </div>
              <div className="text-[9.5px] font-medium text-blue-600/70 truncate">
                Active FTEs
              </div>
            </div>

            {/* 2: Strategic Growth - Emerald Theme */}
            <div className="bg-gradient-to-b from-emerald-50/80 via-emerald-50/20 to-white border border-emerald-200/80 border-t-2 border-t-emerald-600 rounded-xl px-3 py-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-emerald-800/90 uppercase tracking-wider truncate">
                Strategic Growth
              </div>
              <div className="text-lg font-extrabold text-emerald-600 leading-none flex items-baseline gap-1 truncate">
                <span>+{plannedGrowth.toLocaleString()}</span>
                <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-100/80 px-1 py-1 rounded border border-emerald-200">+{growthPct}%</span>
              </div>
              <div className="text-[9.5px] font-medium text-emerald-600/70 truncate">
                Gross demand
              </div>
            </div>

            {/* 3: Target Capacity - Indigo Theme */}
            <div className="bg-gradient-to-b from-indigo-50/80 via-indigo-50/20 to-white border border-indigo-200/80 border-t-2 border-t-indigo-600 rounded-xl px-3 py-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-indigo-800/90 uppercase tracking-wider truncate">
                Target Capacity
              </div>
              <div className="text-lg font-extrabold text-indigo-950 leading-none truncate">
                {targetHeadcount.toLocaleString()}
              </div>
              <div className="text-[9.5px] font-medium text-indigo-600/70 truncate">
                FY28 planned
              </div>
            </div>

            {/* 4: Drivers - Violet Theme */}
            <div className="bg-gradient-to-b from-violet-50/80 via-violet-50/20 to-white border border-violet-200/80 border-t-2 border-t-violet-600 rounded-xl px-3 py-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-violet-800/90 uppercase tracking-wider truncate">
                Strategy Drivers
              </div>
              <div className="text-lg font-extrabold text-violet-950 leading-none truncate">
                {strategyDrivers.length || 6} <span className="text-xs font-semibold text-violet-500">Drivers</span>
              </div>
              <div className="text-[9.5px] font-medium text-violet-600/70 truncate">
                STR-001 to STR-006
              </div>
            </div>

            {/* 5: Future Roles - Amber Theme */}
            <div className="bg-gradient-to-b from-amber-50/80 via-amber-50/20 to-white border border-amber-200/80 border-t-2 border-t-amber-500 rounded-xl px-3 py-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-amber-800/90 uppercase tracking-wider truncate">
                Future Roles
              </div>
              <div className="text-lg font-extrabold text-amber-950 leading-none truncate">
                {futureRoles.length || 14} <span className="text-xs font-semibold text-amber-500">Specs</span>
              </div>
              <div className="text-[9.5px] font-medium text-amber-700/70 truncate">
                Versioned blueprints
              </div>
            </div>

            {/* 6: Controlled Skills - Teal Theme */}
            <div className="bg-gradient-to-b from-teal-50/80 via-teal-50/20 to-white border border-teal-200/80 border-t-2 border-t-teal-600 rounded-xl px-3 py-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-teal-800/90 uppercase tracking-wider truncate">
                Skill Taxonomy
              </div>
              <div className="text-lg font-extrabold text-teal-950 leading-none truncate">
                {skillsTaxonomy.length || 60} <span className="text-xs font-semibold text-teal-600">Skills</span>
              </div>
              <div className="text-[9.5px] font-medium text-teal-700/70 truncate">
                Standard L1–L5
              </div>
            </div>

          </div>
        );
      })()}

{/* Enterprise Tab Navigation & Search Bar Row - High Contrast Segmented Pills */}
      <div className="flex items-center justify-between gap-3 w-full py-1">

        {/* Navigation Tabs - Modern High-Contrast Container */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/90 border border-slate-200/90 rounded-xl shadow-2xs overflow-x-auto no-scrollbar">
          
          {/* Tab 0: AI Role Architect Studio */}
          <button
            onClick={() => setActiveTab('role-studio')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === 'role-studio'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'role-studio' ? 'text-white' : 'text-blue-500'} />
            <span>AI Role Architect Studio</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'role-studio' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
              6-Step Engine
            </span>
          </button>
          
          {/* Tab 1: Roles & Architecture */}
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === 'roles'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-200/90'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Users size={14} className={activeTab === 'roles' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Roles & Architecture</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full leading-none ${
              activeTab === 'roles' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-200/80 text-slate-500'
            }`}>
              {futureRoles.length || 14}
            </span>
          </button>

          {/* Tab 2: Strategy Drivers */}
          <button
            onClick={() => setActiveTab('drivers')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === 'drivers'
                ? 'bg-white text-violet-700 shadow-xs border border-violet-200/90'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Workflow size={14} className={activeTab === 'drivers' ? 'text-violet-600' : 'text-slate-400'} />
            <span>Strategic Drivers</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full leading-none ${
              activeTab === 'drivers' ? 'bg-violet-50 text-violet-700 border border-violet-200' : 'bg-slate-200/80 text-slate-500'
            }`}>
              {strategyDrivers.length || 6}
            </span>
          </button>

          {/* Tab 3: Demand Lines */}
          <button
            onClick={() => setActiveTab('demand')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === 'demand'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/90'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <TrendingUp size={14} className={activeTab === 'demand' ? 'text-emerald-600' : 'text-slate-400'} />
            <span>Demand Lines</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full leading-none ${
              activeTab === 'demand' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200/80 text-slate-500'
            }`}>
              42
            </span>
          </button>

          {/* Tab 4: Skill Taxonomy */}
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === 'skills'
                ? 'bg-white text-teal-700 shadow-xs border border-teal-200/90'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BookOpen size={14} className={activeTab === 'skills' ? 'text-teal-600' : 'text-slate-400'} />
            <span>Skill Taxonomy</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full leading-none ${
              activeTab === 'skills' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-200/80 text-slate-500'
            }`}>
              {skillsTaxonomy.length || 60}
            </span>
          </button>

        </div>

        {/* Search Box on Right of Tabs - Generously Sized, Luxuriously Padded Capsule */}
        {activeTab !== 'role-studio' && (
        <div className="flex items-center shrink-0 relative z-10">
          <div className="group flex items-center gap-3 h-10 pl-5 pr-4 bg-white border border-slate-200/90 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 rounded-full transition-all duration-200 w-80 sm:w-96 shadow-2xs">
            <Search size={15} className="text-slate-400 group-focus-within:text-blue-500 shrink-0 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, skills..."
              className="bg-transparent focus:outline-none flex-1 text-slate-800 font-medium text-xs placeholder:text-slate-400 placeholder:font-normal"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                title="Clear"
              >
                <X size={11} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-md font-mono select-none leading-none shadow-2xs">
                /
              </kbd>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Filter Row: Vibrant, High-Contrast Filter Rail */}
      {activeTab === 'role-studio' && (
        <RoleArchitectStudio />
      )}

      {activeTab === 'roles' && (
        <div className="flex items-center justify-between text-xs p-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex-wrap gap-2">
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs shrink-0">
              <Filter size={13} className="text-blue-600" />
              <span>Filter:</span>
            </div>

            {/* Class Filter - Colorful Badges */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 select-none">Class</span>
              {['ALL', 'Emerging', 'Evolving', 'Stable', 'Declining-Sunsetting'].map(cls => {
                const isActive = evolutionFilter === cls;
                
                // Color style map for high clarity
                let activeStyle = 'bg-slate-900 text-white font-bold shadow-xs';
                let inactiveStyle = 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60';
                
                if (cls === 'Emerging') {
                  activeStyle = 'bg-violet-600 text-white font-bold shadow-xs border border-violet-600';
                  inactiveStyle = 'text-violet-700 bg-violet-50/80 hover:bg-violet-100 border border-violet-200/80';
                } else if (cls === 'Evolving') {
                  activeStyle = 'bg-sky-600 text-white font-bold shadow-xs border border-sky-600';
                  inactiveStyle = 'text-sky-700 bg-sky-50/80 hover:bg-sky-100 border border-sky-200/80';
                } else if (cls === 'Stable') {
                  activeStyle = 'bg-emerald-600 text-white font-bold shadow-xs border border-emerald-600';
                  inactiveStyle = 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80';
                } else if (cls === 'Declining-Sunsetting') {
                  activeStyle = 'bg-rose-600 text-white font-bold shadow-xs border border-rose-600';
                  inactiveStyle = 'text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80';
                }

                return (
                  <button
                    key={cls}
                    onClick={() => setEvolutionFilter(cls)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isActive ? activeStyle : inactiveStyle
                    }`}
                  >
                    {cls === 'ALL' ? 'All Classes' : cls.replace('-Sunsetting', '')}
                  </button>
                );
              })}
            </div>

            {/* Tier Filter - High Impact Criticality Badges */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 select-none">Criticality</span>
              {['ALL', 'Tier 1', 'Tier 2', 'Tier 3'].map(tier => {
                const isActive = tierFilter === tier;
                
                let activeStyle = 'bg-slate-900 text-white font-bold shadow-xs';
                let inactiveStyle = 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60';
                
                if (tier === 'Tier 1') {
                  activeStyle = 'bg-rose-600 text-white font-black shadow-xs border border-rose-600';
                  inactiveStyle = 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold';
                } else if (tier === 'Tier 2') {
                  activeStyle = 'bg-amber-500 text-white font-black shadow-xs border border-amber-500';
                  inactiveStyle = 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold';
                } else if (tier === 'Tier 3') {
                  activeStyle = 'bg-slate-700 text-white font-black shadow-xs border border-slate-700';
                  inactiveStyle = 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold';
                }

                return (
                  <button
                    key={tier}
                    onClick={() => setTierFilter(tier)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isActive ? activeStyle : inactiveStyle
                    }`}
                  >
                    {tier === 'ALL' ? 'All Tiers' : tier}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Results count / reset */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing <strong className="text-slate-900 font-extrabold">{filteredRoles.length}</strong> of {futureRoles.length} roles</span>
            {(evolutionFilter !== 'ALL' || tierFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setEvolutionFilter('ALL');
                  setTierFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-md cursor-pointer ml-1 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: FUTURE ROLES (ENTERPRISE LIST & SPECIFICATION) */}
      {/* ============================================================== */}
      {activeTab === 'roles' && (
        <div className="flex flex-col gap-4">

          {/* Clean Enterprise Role Cards Grid - Responsive Auto-Fill Guaranteeing 2-3 Columns */}
          <div
            className="w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '16px'
            }}
          >
            {filteredRoles.map(role => {
              const bci = role.business_criticality_index || 0.85;
              const isSunsetting = role.role_evolution_class === 'Declining-Sunsetting';
              const targetHeadcount = role.current_headcount + (parseInt(role.gap) || 4);

              return (
                <div
                  key={role.future_role_id}
                  className="bg-white border border-slate-200/80 hover:border-blue-400/80 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group"
                >
                  <div className="flex flex-col gap-2">
                    
                    {/* Top Row: Code + Level + Dept + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono text-[10.5px] font-bold text-slate-500 tracking-wide shrink-0">
                          {role.job_code}
                        </span>
                        <span className="text-slate-200 shrink-0">|</span>
                        <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                          {role.career_level_id}
                        </span>
                        <span className="text-slate-300 shrink-0">·</span>
                        <span className="text-[11px] font-medium text-slate-400 truncate">
                          {role.dept}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0 ${
                        isSunsetting
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : role.role_evolution_class === 'Emerging'
                          ? 'bg-violet-50 text-violet-600 border-violet-200'
                          : 'bg-sky-50 text-sky-600 border-sky-200'
                      }`}>
                        {role.role_evolution_class}
                      </span>
                    </div>

                    {/* Role Title */}
                    <h3 className="text-[14px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {role.role_title}
                    </h3>

                    {/* Strategy Driver — capsule row */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50/90 border border-slate-200/70">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Workflow size={11} className="text-blue-500 shrink-0" />
                        <span className="text-[11px] font-medium text-slate-700 truncate">{role.strategy_driver_name}</span>
                      </div>
                      <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-1 rounded shrink-0">
                        {role.strategy_driver_id}
                      </span>
                    </div>

                    {/* Key Numbers: Headcount & Criticality - Institutional Executive Tiles */}
                    <div className="grid grid-cols-2 gap-2 my-1">

                      {/* Left: Headcount tile with guaranteed generous padding */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex flex-col justify-between h-[92px]">
                        {/* Line 1: Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Headcount</span>
                          <span className="font-mono text-[9px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded shadow-2xs">FY28</span>
                        </div>
                        {/* Line 2: Metric */}
                        <div className="flex items-center justify-between my-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-900 tracking-tight leading-none">{targetHeadcount}</span>
                            <span className="text-[11px] text-slate-400 font-semibold">FTE</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border leading-none ${
                            Number(role.gap) >= 0 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {Number(role.gap) >= 0 ? '+' : ''}{Number(role.gap)} net
                          </span>
                        </div>
                        {/* Line 3: Footer */}
                        <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-2 border-t border-slate-200/70">
                          <span>Baseline FTEs</span>
                          <span className="font-bold text-slate-700">{role.current_headcount}</span>
                        </div>
                      </div>

                      {/* Right: Criticality tile with guaranteed generous padding */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex flex-col justify-between h-[92px]">
                        {/* Line 1: Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Criticality</span>
                          <span className="font-mono text-[9px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded shadow-2xs">BCI {bci.toFixed(2)}</span>
                        </div>
                        {/* Line 2: Metric */}
                        <div className="flex items-center justify-between my-1">
                          <span className={`text-[13px] font-extrabold tracking-tight leading-none ${
                            role.criticality_tier === 'Tier 1' ? 'text-rose-600' : role.criticality_tier === 'Tier 2' ? 'text-amber-600' : 'text-slate-700'
                          }`}>
                            {role.criticality_tier || 'Tier 1'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border leading-none ${
                            role.criticality_tier === 'Tier 1'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : role.criticality_tier === 'Tier 2'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {role.criticality_tier === 'Tier 1' ? 'Critical' : role.criticality_tier === 'Tier 2' ? 'Strategic' : 'Standard'}
                          </span>
                        </div>
                        {/* Line 3: Footer */}
                        <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-2 border-t border-slate-200/70">
                          <span>Risk Tier</span>
                          <span className="font-bold text-slate-700">{role.sourcing_risk || 'Normal'}</span>
                        </div>
                      </div>

                    </div>

                    {/* Capabilities chips — Clean Modern Badges */}
                    {role.role_skill_requirements?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {role.role_skill_requirements?.slice(0, 2).map((req: any) => (
                          <span
                            key={req.role_skill_req_id}
                            className="inline-flex items-center gap-2 text-[10.5px] font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 px-2 py-1 rounded-md transition-colors"
                          >
                            <span className="truncate max-w-[120px]">{req.skill_name}</span>
                            <span className="font-mono font-bold text-[9px] text-blue-700 bg-blue-100/80 px-1 py-1 rounded">
                              L{req.target_proficiency}
                            </span>
                          </span>
                        ))}
                        {role.role_skill_requirements?.length > 2 && (
                          <span className="text-[9.5px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200/60">
                            +{role.role_skill_requirements.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Card Bottom Actions — Full Width Specification Sheet Button */}
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="w-full h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs"
                      style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                    >
                      <span>View Specification Sheet</span>
                      <ChevronRight size={13} className="text-slate-300" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: STRATEGY DRIVERS (SECTION 1.1) */}
      {/* ============================================================== */}
      {activeTab === 'drivers' && (
        <div className="flex flex-col gap-4">

          {/* Section Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Strategic Driver Registry</h3>
              <p className="text-xs text-slate-500 mt-1">
                Corporate strategic initiatives driving FY26–FY28 workforce demand.
              </p>
            </div>
            <button
              onClick={() => setIsCreateDriverOpen(true)}
              className="flex items-center gap-2 px-3 h-8 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors shadow-2xs"
              style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
            >
              <Plus size={13} />
              <span>Add Driver</span>
            </button>
          </div>

          {/* Clean 2-Column Card Grid (2 Cards Per Row) */}
          <div
            className="w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '16px'
            }}
          >
            {strategyDrivers.map((driver) => {
              const typeColors: Record<string, string> = {
                'Growth':        'bg-emerald-50 text-emerald-700 border-emerald-200',
                'Modernization': 'bg-blue-50 text-blue-700 border-blue-200',
                'Automation':    'bg-violet-50 text-violet-700 border-violet-200',
                'Cost reduction':'bg-amber-50 text-amber-700 border-amber-200',
                'Compliance':    'bg-rose-50 text-rose-700 border-rose-200',
                'Market entry':  'bg-teal-50 text-teal-700 border-teal-200',
              };
              const typeClass = typeColors[driver.driver_type] || 'bg-slate-100 text-slate-600 border-slate-200';

              return (
                <div
                  key={driver.strategy_driver_id}
                  className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex flex-col gap-2">
                    {/* Header: Rank + ID + Type + Horizon */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10.5px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded shrink-0">
                          {driver.strategy_driver_id}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border truncate ${typeClass}`}>
                          {driver.driver_type}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded shrink-0">
                        {driver.horizon_start_fy}–{driver.horizon_end_fy}
                      </span>
                    </div>

                    {/* Driver Title */}
                    <h4 className="text-[13.5px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {driver.driver_name}
                    </h4>

                    {/* Description */}
                    <p className="text-[11.5px] text-slate-500 leading-relaxed line-clamp-2">
                      {driver.description}
                    </p>

                    {/* Key Metrics: Growth / Automation / OpEx */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Growth</div>
                        <div className="text-[13px] font-black text-emerald-600 mt-1">
                          +{Math.round(driver.workforce_growth_assumption_pct * 100)}%
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Offset</div>
                        <div className="text-[13px] font-black text-indigo-600 mt-1">
                          +{Math.round(driver.expected_productivity_gain_pct * 100)}%
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ceiling</div>
                        <div className="text-[13px] font-black text-slate-700 mt-1">
                          {(driver.opex_ceiling_lkr / 1000000).toFixed(0)}M
                        </div>
                      </div>
                    </div>

                    {/* Tech Chips */}
                    {driver.technology_roadmap_items?.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {driver.technology_roadmap_items.slice(0, 3).map((item: string) => (
                          <span key={item} className="text-[10px] font-medium px-2 py-1 rounded bg-slate-50 border border-slate-200/80 text-slate-600 truncate max-w-[130px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400">
                    <span className="font-mono truncate">{driver.source_document_ref}</span>
                    <span className="font-medium text-slate-500 shrink-0">Approver: {driver.approver_role}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DEMAND LINES (SECTION 1.5) */}
      {/* ============================================================== */}
      {activeTab === 'demand' && (
        <div className="flex flex-col gap-4">

          {/* Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] font-bold text-slate-900">Headcount Trajectory</div>
                <div className="text-[11px] text-slate-400">Active baseline vs. planned target capacity</div>
              </div>
              <div className="flex items-center gap-3 text-[10.5px]">
                <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-indigo-500 inline-block rounded" />Target</span>
                <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-sky-500 inline-block rounded" />Active HC</span>
              </div>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastTimeline}>
                  <defs>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={['dataMin - 150', 'dataMax + 150']} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="target" stroke="#4f46e5" strokeWidth={2} fill="url(#colorTarget)" name="Target" />
                  <Area type="monotone" dataKey="headcount" stroke="#0284c7" strokeWidth={2} fill="url(#colorCurrent)" name="Active HC" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Demand table — simplified 6 columns */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-900">Demand Lines by Role & Fiscal Year</span>
              <span className="text-[10.5px] text-slate-400">{futureRoles.flatMap(r => r.demand_lines || []).length} lines</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 bg-slate-50/60">
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2 text-center">FY</th>
                    <th className="px-4 py-2 text-center">Current HC</th>
                    <th className="px-4 py-2 text-center">Net Target</th>
                    <th className="px-4 py-2 text-center text-emerald-600">Net New</th>
                    <th className="px-4 py-2 text-center">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {futureRoles.flatMap(r =>
                    (r.demand_lines || []).map((line: any) => (
                      <tr key={line.demand_line_id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-2">
                          <div className="font-semibold text-slate-800 truncate max-w-[220px]">{r.role_title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{r.job_code}</div>
                        </td>
                        <td className="px-4 py-2 text-center font-bold text-slate-700">{line.fiscal_year}</td>
                        <td className="px-4 py-2 text-center text-slate-500">{r.current_headcount}</td>
                        <td className="px-4 py-2 text-center font-bold text-slate-900">{line.demand_headcount_net}</td>
                        <td className="px-4 py-2 text-center font-bold text-emerald-600">+{line.net_new_demand}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`font-bold text-[11px] ${
                            line.confidence_level >= 0.85 ? 'text-emerald-600'
                            : line.confidence_level >= 0.70 ? 'text-amber-600'
                            : 'text-rose-500'
                          }`}>{Math.round(line.confidence_level * 100)}%</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SKILL TAXONOMY (SECTION 1.2) */}
      {/* ============================================================== */}
      {activeTab === 'skills' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Skill Taxonomy & Market Signals</h3>
              <p className="text-xs text-slate-500 mt-1">
                Controlled skill catalog records referencing standardized taxonomy codes and external demand indices.
              </p>
            </div>
          </div>

          {/* Clean 2-Column Card Grid (2 Cards Per Row) */}
          <div
            className="w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '16px'
            }}
          >
            {skillsTaxonomy.map(skill => (
              <div key={skill.skill_id} className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {skill.skill_id}
                    </span>
                    <div>
                      {skill.is_emerging && (
                        <span className="text-[9.5px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          EMERGING
                        </span>
                      )}
                      {skill.is_sunsetting && (
                        <span className="text-[9.5px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          SUNSETTING
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900 leading-snug">{skill.skill_name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {skill.skill_family} · {skill.skill_category}
                    </p>
                  </div>

                  {/* 4 Metric Tiles in 1 Row */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-center">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Demand</div>
                      <div className="text-[13px] font-black text-slate-800 mt-1">{Math.round(skill.market_demand_index * 100)}%</div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-center">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Supply</div>
                      <div className="text-[13px] font-black text-slate-800 mt-1">{Math.round(skill.market_supply_index * 100)}%</div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-center">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Half-Life</div>
                      <div className="text-[13px] font-black text-slate-800 mt-1">{skill.skill_half_life_months} mo</div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-center">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hours/Lvl</div>
                      <div className="text-[13px] font-black text-slate-800 mt-1">{skill.typical_learning_hours_per_level}h</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400">
                  <span>Standard Taxonomy</span>
                  <span className="font-mono font-medium text-slate-600">{skill.external_taxonomy_code || 'ESCO:2511'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* ============================================================== */}
      {/* MODAL 1: FULL SPECIFICATION SHEET DRAWER */}
      {/* ============================================================== */}
      {selectedRole && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 text-left">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                    {selectedRole.job_code}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{selectedRole.career_level_id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    v{selectedRole.version} {selectedRole.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedRole.role_title}</h3>
              </div>
              <button onClick={() => setSelectedRole(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Spec Body */}
            <div className="flex flex-col gap-3 text-xs">
              
              {/* Role Purpose Card */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/90 flex flex-col gap-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Purpose & Strategic Mandate</div>
                  <p className="text-slate-800 text-xs leading-relaxed font-medium">{selectedRole.role_purpose}</p>
                </div>
                {selectedRole.failure_impact_description && (
                  <div className="p-3 rounded-lg bg-rose-50/80 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                    <span className="font-bold text-rose-700 shrink-0">Failure Impact:</span>
                    <span className="font-medium text-rose-900/90 leading-snug">{selectedRole.failure_impact_description}</span>
                  </div>
                )}
              </div>

              {/* Strategic Intent Driver Capsule */}
              <div className="px-4 py-2 bg-slate-50/80 rounded-xl border border-slate-200/90 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strategic Intent Driver</div>
                  <div className="font-bold text-slate-900 text-xs mt-1 truncate">{selectedRole.strategy_driver_name}</div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/90 px-3 py-1 rounded-md shrink-0">
                  {selectedRole.strategy_driver_id}
                </span>
              </div>

              {/* Perfectly Aligned 4-Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                
                {/* 1: Criticality Tier */}
                <div className="p-3 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Criticality Tier</div>
                  <div className="mt-2 flex items-center">
                    <span className={`text-xs font-black px-2 py-1 rounded-md border inline-flex items-center gap-2 ${
                      selectedRole.criticality_tier === 'Tier 1'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : selectedRole.criticality_tier === 'Tier 2'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        selectedRole.criticality_tier === 'Tier 1' ? 'bg-rose-500' : selectedRole.criticality_tier === 'Tier 2' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                      {selectedRole.criticality_tier || 'Tier 1'}
                    </span>
                  </div>
                </div>

                {/* 2: Criticality Index */}
                <div className="p-3 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Criticality Index</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-base font-black text-slate-900 font-mono">
                      {Number(selectedRole.business_criticality_index || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">/ 1.00 BCI</span>
                  </div>
                </div>

                {/* 3: Active Headcount */}
                <div className="p-3 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Baseline</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-base font-black text-slate-900 font-mono">
                      {selectedRole.current_headcount}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">Active FTEs</span>
                  </div>
                </div>

                {/* 4: Sourcing Risk */}
                <div className="p-3 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sourcing Risk</div>
                  <div className="mt-2 flex items-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md border inline-flex items-center gap-2 ${
                      selectedRole.sourcing_risk === 'High'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : selectedRole.sourcing_risk === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        selectedRole.sourcing_risk === 'High' ? 'bg-rose-500' : selectedRole.sourcing_risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      {selectedRole.sourcing_risk || 'Medium'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Role Skill Requirements Table */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">Role Skill Requirements (The Role-Skill Map)</div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {selectedRole.role_skill_requirements?.length || 0} mapped capabilities
                  </span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/50 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2">Skill Name</th>
                      <th className="px-4 py-2 text-center">Target Level</th>
                      <th className="px-4 py-2 text-center">Importance</th>
                      <th className="px-4 py-2 text-center">Route</th>
                      <th className="px-4 py-2 text-right">Time to Acquire</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRole.role_skill_requirements?.map((req: any) => (
                      <tr key={req.role_skill_req_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2 font-semibold text-slate-800">{req.skill_name}</td>
                        <td className="px-4 py-2 text-center">
                          <span className="font-mono font-bold text-[10px] text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-1 rounded">
                            Level {req.target_proficiency}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                            req.skill_importance === 'Critical' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {req.skill_importance}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center text-slate-600 font-medium">{req.acquisition_route}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold text-slate-800">{req.expected_time_to_acquire_months} mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 5B Fulfilment Strategy */}
              {selectedRole.five_b_strategy && (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">5B Fulfilment Strategy Allocation</span>
                    <span className="text-[10px] font-mono text-slate-400">ML Predicted Strategy</span>
                  </div>
                  
                  {/* Visual 5B Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200/80 flex overflow-hidden shadow-inner">
                    <div style={{ width: `${selectedRole.five_b_strategy.build_pct}%` }} className="bg-indigo-600 h-full" title={`Build: ${selectedRole.five_b_strategy.build_pct}%`} />
                    <div style={{ width: `${selectedRole.five_b_strategy.buy_pct}%` }} className="bg-amber-500 h-full" title={`Buy: ${selectedRole.five_b_strategy.buy_pct}%`} />
                    <div style={{ width: `${selectedRole.five_b_strategy.bot_pct}%` }} className="bg-teal-600 h-full" title={`Bot: ${selectedRole.five_b_strategy.bot_pct}%`} />
                    <div style={{ width: `${selectedRole.five_b_strategy.borrow_pct}%` }} className="bg-violet-600 h-full" title={`Borrow: ${selectedRole.five_b_strategy.borrow_pct}%`} />
                    <div style={{ width: `${selectedRole.five_b_strategy.bridge_pct}%` }} className="bg-rose-500 h-full" title={`Bridge: ${selectedRole.five_b_strategy.bridge_pct}%`} />
                  </div>

                  {/* 5B Legend */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] pt-1">
                    <div className="flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      <span className="text-slate-500">Build:</span>
                      <span className="font-bold text-slate-800">{selectedRole.five_b_strategy.build_pct}%</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-slate-500">Buy:</span>
                      <span className="font-bold text-slate-800">{selectedRole.five_b_strategy.buy_pct}%</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-teal-600" />
                      <span className="text-slate-500">Bot:</span>
                      <span className="font-bold text-slate-800">{selectedRole.five_b_strategy.bot_pct}%</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-violet-600" />
                      <span className="text-slate-500">Borrow:</span>
                      <span className="font-bold text-slate-800">{selectedRole.five_b_strategy.borrow_pct}%</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-slate-500">Bridge:</span>
                      <span className="font-bold text-slate-800">{selectedRole.five_b_strategy.bridge_pct}%</span>
                    </div>
                  </div>

                  {selectedRole.five_b_strategy.summary && (
                    <p className="text-slate-600 text-[11.5px] leading-relaxed pt-1 border-t border-slate-200/60 mt-1">
                      {selectedRole.five_b_strategy.summary}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
              <button
                onClick={() => setSelectedRole(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: MAP FUTURE ROLE FORM */}
      {/* ============================================================== */}
      {isCreateRoleOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Map Future Role Blueprint</h3>
                <p className="text-xs text-slate-500">Define role specification, strategic driver linkage & capacity targets</p>
              </div>
              <button onClick={() => setIsCreateRoleOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Future Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Generative AI Architect"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newRoleDept}
                    onChange={(e) => setNewRoleDept(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option>Engineering</option>
                    <option>Operations</option>
                    <option>Corporate</option>
                    <option>Product</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Career Level</label>
                  <select
                    value={newRoleLevel}
                    onChange={(e) => setNewRoleLevel(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option>L3 Mid</option>
                    <option>L4 Senior</option>
                    <option>L5 Staff / Lead</option>
                    <option>L6 Principal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Strategic Driver Link *</label>
                <select
                  value={newRoleDriver}
                  onChange={(e) => setNewRoleDriver(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                >
                  {strategyDrivers.map(d => (
                    <option key={d.strategy_driver_id} value={d.strategy_driver_id}>
                      {d.strategy_driver_id}: {d.driver_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Evolution Class</label>
                  <select
                    value={newRoleEvolution}
                    onChange={(e) => setNewRoleEvolution(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option>Emerging</option>
                    <option>Evolving</option>
                    <option>Stable</option>
                    <option>Declining-Sunsetting</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Active HC</label>
                  <input
                    type="number"
                    min={0}
                    value={newRoleHeadcount}
                    onChange={(e) => setNewRoleHeadcount(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Demand</label>
                  <input
                    type="number"
                    min={1}
                    value={newRoleTargetHeadcount}
                    onChange={(e) => setNewRoleTargetHeadcount(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Role Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Core purpose and failure impact description..."
                  value={newRolePurpose}
                  onChange={(e) => setNewRolePurpose(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer shadow-sm"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  Save Specification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: ADD STRATEGY DRIVER FORM */}
      {/* ============================================================== */}
      {isCreateDriverOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Strategy Driver (Section 1.1)</h3>
                <p className="text-xs text-slate-500">Model strategic intent as a traceable entity</p>
              </div>
              <button onClick={() => setIsCreateDriverOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDriverSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Driver Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Microservices & Cloud Platform"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Driver Type</label>
                  <select
                    value={newDriverType}
                    onChange={(e) => setNewDriverType(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option>Growth</option>
                    <option>Modernization</option>
                    <option>Automation</option>
                    <option>Cost reduction</option>
                    <option>Compliance</option>
                    <option>Market entry</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Primary Unit</label>
                  <select
                    value={newDriverDept}
                    onChange={(e) => setNewDriverDept(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option>Engineering</option>
                    <option>Operations</option>
                    <option>Corporate</option>
                    <option>Product</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Growth %</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newDriverGrowth}
                    onChange={(e) => setNewDriverGrowth(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Productivity Gain</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newDriverGain}
                    onChange={(e) => setNewDriverGain(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">OpEx Ceiling (LKR)</label>
                  <input
                    type="number"
                    step="5000000"
                    value={newDriverOpex}
                    onChange={(e) => setNewDriverOpex(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Strategic Objective Description</label>
                <textarea
                  rows={2}
                  placeholder="Two to four sentences defining business impact and boundaries..."
                  value={newDriverDesc}
                  onChange={(e) => setNewDriverDesc(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateDriverOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer shadow-sm"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  Save Strategic Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
