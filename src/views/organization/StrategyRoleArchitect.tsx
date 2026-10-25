import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import {
  FileText, Users, Target, Plus, CheckCircle2, X,
  TrendingUp, Download, Clock, Coins, GitBranch,
  Workflow, BookOpen, Shuffle, Filter, Search, RefreshCw,
  SlidersHorizontal, ChevronRight, ChevronDown, Building2, ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area
} from 'recharts';
import api from '../../lib/api';

type TabMode = 'roles' | 'drivers' | 'demand' | 'skills' | 'cost_mobility';

export const StrategyRoleArchitect: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('roles');
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
  const [versionDiffRole, setVersionDiffRole] = useState<any | null>(null);
  const [diffData, setDiffData] = useState<any | null>(null);
  
  // Modals for creation
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateDriverOpen, setIsCreateDriverOpen] = useState(false);

  // Data from backend
  const [futureRoles, setFutureRoles] = useState<any[]>([]);
  const [strategyDrivers, setStrategyDrivers] = useState<any[]>([]);
  const [skillsTaxonomy, setSkillsTaxonomy] = useState<any[]>([]);
  const [forecastTimeline, setForecastTimeline] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({
    current_headcount: 6055,
    planned_growth: 727,
    target_headcount: 6782,
    future_roles_count: 6,
    key_skills_count: 6,
    strategy_drivers_count: 5,
    primary_goal: '2026–2028 Cloud, AI & Data Modernization',
    five_b_aggregate: { build: 52, buy: 28, borrow: 5, bot: 12, bridge: 3 }
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

  const handleOpenDiff = (role: any) => {
    setVersionDiffRole(role);
    api.organization.getRoleVersionDiff(role.future_role_id)
      .then((data: any) => setDiffData(data))
      .catch(console.error);
  };

  const handleApproveRole = (roleId: string) => {
    api.organization.updateFutureRoleStatus(roleId, 'Live', 'CHRO')
      .then(() => {
        triggerToast(`Role ${roleId} approved into Active Target Plan.`);
        loadData();
        if (selectedRole && selectedRole.future_role_id === roleId) {
          setSelectedRole({ ...selectedRole, status: 'Live', approved_by: 'CHRO' });
        }
      })
      .catch(console.error);
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
        <div className="flex flex-row items-center justify-between gap-3 w-full flex-nowrap overflow-x-auto no-scrollbar py-0.5">
          
          {/* Left: Title */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Strategy & Role Architecture
            </h1>
          </div>

          {/* Right: Action Toolbar with Standard Heights & Paddings */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            {/* Horizon Selector */}
            <div className="relative">
              <div className="flex items-center gap-1.5 h-8 pl-2.5 pr-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors shadow-2xs">
                <Clock size={12} className="text-slate-400 shrink-0" />
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-3.5 appearance-none text-slate-800 font-semibold text-xs"
                >
                  <option>FY26 – FY28</option>
                  <option>FY27 – FY29</option>
                </select>
                <ChevronDown size={11} className="text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            </div>

            {/* Department Scope */}
            <div className="relative">
              <div className="flex items-center gap-1.5 h-8 pl-2.5 pr-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors shadow-2xs">
                <Building2 size={12} className="text-slate-400 shrink-0" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-3.5 appearance-none text-slate-800 font-semibold text-xs"
                >
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Operations</option>
                  <option>Corporate</option>
                  <option>Product</option>
                </select>
                <ChevronDown size={11} className="text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

            {/* Re-synthesize Button */}
            <button
              onClick={handleRunTranslation}
              disabled={isSynthesizing}
              className="flex items-center gap-1.5 h-8 px-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
              title="Refresh strategic targets from corporate drivers"
            >
              <RefreshCw size={12} className={isSynthesizing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              <span>{isSynthesizing ? 'Updating...' : 'Synthesize Plan'}</span>
            </button>

            {/* Export Matrix */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 h-8 px-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              title="Export full specification matrix to CSV"
            >
              <Download size={12} className="text-slate-500" />
              <span>Export Matrix</span>
            </button>

            {/* Map Future Role Primary Action */}
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <Plus size={13} className="text-white" />
              <span className="text-white">Map Future Role</span>
            </button>
          </div>
        </div>

        {/* Subtitle Description */}
        <p className="text-xs text-slate-500 max-w-2xl">
          Enterprise blueprint for versioned role specifications, skill requirements, and FY26–FY28 capacity planning.
        </p>

      </div>

      {/* Unified Executive Scorecard Ribbon - Clean 6 KPI Stats */}
      {(() => {
        const activeHeadcount = (summaryData.current_headcount && summaryData.current_headcount > 50) ? summaryData.current_headcount : 6055;
        const plannedGrowth = summaryData.planned_growth || 727;
        const targetHeadcount = activeHeadcount + plannedGrowth;

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
            <div className="bg-gradient-to-b from-blue-50/80 via-blue-50/20 to-white border border-blue-200/80 border-t-2 border-t-blue-600 rounded-xl px-3 py-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
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
            <div className="bg-gradient-to-b from-emerald-50/80 via-emerald-50/20 to-white border border-emerald-200/80 border-t-2 border-t-emerald-600 rounded-xl px-3 py-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-emerald-800/90 uppercase tracking-wider truncate">
                Strategic Growth
              </div>
              <div className="text-lg font-extrabold text-emerald-600 leading-none flex items-baseline gap-1 truncate">
                <span>+{plannedGrowth.toLocaleString()}</span>
                <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-100/80 px-1 py-0.2 rounded border border-emerald-200">+12%</span>
              </div>
              <div className="text-[9.5px] font-medium text-emerald-600/70 truncate">
                Gross demand
              </div>
            </div>

            {/* 3: Target Capacity - Indigo Theme */}
            <div className="bg-gradient-to-b from-indigo-50/80 via-indigo-50/20 to-white border border-indigo-200/80 border-t-2 border-t-indigo-600 rounded-xl px-3 py-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
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
            <div className="bg-gradient-to-b from-violet-50/80 via-violet-50/20 to-white border border-violet-200/80 border-t-2 border-t-violet-600 rounded-xl px-3 py-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-violet-800/90 uppercase tracking-wider truncate">
                Strategy Drivers
              </div>
              <div className="text-lg font-extrabold text-violet-950 leading-none truncate">
                {strategyDrivers.length || 5} <span className="text-xs font-semibold text-violet-500">Drivers</span>
              </div>
              <div className="text-[9.5px] font-medium text-violet-600/70 truncate">
                STR-001 to 005
              </div>
            </div>

            {/* 5: Future Roles - Amber Theme */}
            <div className="bg-gradient-to-b from-amber-50/80 via-amber-50/20 to-white border border-amber-200/80 border-t-2 border-t-amber-500 rounded-xl px-3 py-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-amber-800/90 uppercase tracking-wider truncate">
                Future Roles
              </div>
              <div className="text-lg font-extrabold text-amber-950 leading-none truncate">
                {futureRoles.length} <span className="text-xs font-semibold text-amber-500">Specs</span>
              </div>
              <div className="text-[9.5px] font-medium text-amber-700/70 truncate">
                Versioned blueprints
              </div>
            </div>

            {/* 6: Controlled Skills - Teal Theme */}
            <div className="bg-gradient-to-b from-teal-50/80 via-teal-50/20 to-white border border-teal-200/80 border-t-2 border-t-teal-600 rounded-xl px-3 py-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">
              <div className="text-[10px] font-bold text-teal-800/90 uppercase tracking-wider truncate">
                Skill Taxonomy
              </div>
              <div className="text-lg font-extrabold text-teal-950 leading-none truncate">
                {skillsTaxonomy.length || 6} <span className="text-xs font-semibold text-teal-600">Skills</span>
              </div>
              <div className="text-[9.5px] font-medium text-teal-700/70 truncate">
                Standard L1–L5
              </div>
            </div>

          </div>
        );
      })()}

      {/* Enterprise Tab Bar & Fast Filter Rail - 100% Guaranteed Single Horizontal Line */}
      <div className="flex flex-row items-center justify-between gap-2 border-b border-slate-200/90 pb-2 w-full flex-nowrap overflow-x-auto no-scrollbar">
        
        {/* Navigation Tabs with Icons & Count Chips */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
          
          {/* Tab 1: Future Roles */}
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'roles'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
            style={activeTab === 'roles' ? { backgroundColor: '#0f172a', color: '#ffffff' } : {}}
          >
            <Users size={13} className={activeTab === 'roles' ? 'text-white' : 'text-slate-400'} />
            <span>Roles & Maps</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeTab === 'roles' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {filteredRoles.length}
            </span>
          </button>

          {/* Tab 2: Strategy Drivers */}
          <button
            onClick={() => setActiveTab('drivers')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'drivers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
            style={activeTab === 'drivers' ? { backgroundColor: '#0f172a', color: '#ffffff' } : {}}
          >
            <Workflow size={13} className={activeTab === 'drivers' ? 'text-white' : 'text-slate-400'} />
            <span>Strategy Drivers</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeTab === 'drivers' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {strategyDrivers.length}
            </span>
          </button>

          {/* Tab 3: Demand Lines */}
          <button
            onClick={() => setActiveTab('demand')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'demand'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
            style={activeTab === 'demand' ? { backgroundColor: '#0f172a', color: '#ffffff' } : {}}
          >
            <TrendingUp size={13} className={activeTab === 'demand' ? 'text-white' : 'text-slate-400'} />
            <span>Demand Lines</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeTab === 'demand' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-600'
            }`}>
              FY26–28
            </span>
          </button>

          {/* Tab 4: Skills Taxonomy */}
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'skills'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
            style={activeTab === 'skills' ? { backgroundColor: '#0f172a', color: '#ffffff' } : {}}
          >
            <BookOpen size={13} className={activeTab === 'skills' ? 'text-white' : 'text-slate-400'} />
            <span>Skill Taxonomy</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeTab === 'skills' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {skillsTaxonomy.length}
            </span>
          </button>

          {/* Tab 5: Economics & Mobility */}
          <button
            onClick={() => setActiveTab('cost_mobility')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cost_mobility'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
            style={activeTab === 'cost_mobility' ? { backgroundColor: '#0f172a', color: '#ffffff' } : {}}
          >
            <Coins size={13} className={activeTab === 'cost_mobility' ? 'text-white' : 'text-slate-400'} />
            <span>Economics & Mobility</span>
          </button>

        </div>

        {/* Global Instant Search Bar - High-End Enterprise */}
        <div className="flex items-center gap-1 shrink-0 pl-2">
          <div className="group flex items-center gap-2 h-8 pl-2.5 pr-2 bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/10 focus-within:bg-white rounded-lg shadow-2xs transition-all">
            <Search size={13} className="text-slate-400 group-focus-within:text-blue-600 transition-colors shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, skills..."
              className="bg-transparent focus:outline-none w-32 sm:w-44 text-slate-800 font-medium text-xs placeholder:text-slate-400"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X size={10} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-400 bg-slate-100 border border-slate-200/80 rounded font-mono select-none">
                /
              </kbd>
            )}
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* TAB 1: FUTURE ROLES (ENTERPRISE LIST & SPECIFICATION) */}
      {/* ============================================================== */}
      {activeTab === 'roles' && (
        <div className="flex flex-col gap-4">
          {/* Secondary Segmented Filter Toolbar */}
          <div className="flex items-center gap-3 text-xs py-1 flex-wrap">
            <div className="flex items-center gap-0.5 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 px-2 select-none">Class:</span>
              {['ALL', 'Emerging', 'Evolving', 'Stable', 'Declining-Sunsetting'].map(cls => (
                <button
                  key={cls}
                  onClick={() => setEvolutionFilter(cls)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    evolutionFilter === cls ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cls === 'ALL' ? 'All' : cls.replace('-Sunsetting', '')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 px-2 select-none">Criticality:</span>
              {['ALL', 'Tier 1', 'Tier 2', 'Tier 3'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    tierFilter === tier ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tier === 'ALL' ? 'All Tiers' : tier}
                </button>
              ))}
            </div>
          </div>

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
              const fiveB = role.five_b_strategy || { build_pct: 55, buy_pct: 25, bot_pct: 15, borrow_pct: 5, bridge_pct: 0 };

              return (
                <div
                  key={role.future_role_id}
                  className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div className="flex flex-col gap-2.5">
                    
                    {/* Top Row: Job Code & Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded">
                          {role.job_code}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded">
                          {role.career_level_id}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]">
                          {role.dept}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isSunsetting
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : role.role_evolution_class === 'Emerging'
                            ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {role.role_evolution_class}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                          v{role.version} {role.status}
                        </span>
                      </div>
                    </div>

                    {/* Role Title & Purpose */}
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {role.role_title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {role.role_purpose}
                      </p>
                    </div>

                    {/* Traceable Strategy Driver Tag */}
                    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <Workflow size={12} className="text-indigo-600 shrink-0" />
                        <span className="text-slate-700 font-medium truncate">{role.strategy_driver_name}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 shrink-0">
                        {role.strategy_driver_id}
                      </span>
                    </div>

                    {/* Key Metrics Duo: Headcount & Criticality */}
                    <div className="grid grid-cols-2 gap-2">
                      
                      {/* Headcount Path Tile */}
                      <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-200/70 flex flex-col justify-between">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Headcount Demand</div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-base font-black text-slate-900">{role.current_headcount}</span>
                          <span className="text-xs text-slate-400">→</span>
                          <span className="text-base font-black text-emerald-600">{targetHeadcount}</span>
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded ml-auto">
                            {role.gap} Net
                          </span>
                        </div>
                        <div className="text-[9.5px] text-slate-400 mt-0.5 truncate">FY28 planned capacity</div>
                      </div>

                      {/* Criticality Tile */}
                      <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-200/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Criticality</span>
                          <span className="text-[9.5px] font-medium text-slate-400">BCI {bci.toFixed(2)}</span>
                        </div>
                        <div className="mt-1 flex items-baseline">
                          <span className={`text-base font-black ${role.criticality_tier === 'Tier 1' ? 'text-rose-600' : 'text-amber-600'}`}>
                            {role.criticality_tier}
                          </span>
                        </div>
                        <div className="text-[9.5px] text-slate-400 mt-0.5 truncate">Executive priority score</div>
                      </div>

                    </div>

                    {/* Target Capabilities - Crisp Chips */}
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Capabilities</div>
                      <div className="flex flex-wrap gap-1.5">
                        {role.role_skill_requirements?.slice(0, 2).map((req: any) => (
                          <span
                            key={req.role_skill_req_id}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-md"
                          >
                            <span className="font-medium truncate max-w-[130px]">{req.skill_name}</span>
                            <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1 py-0.2 rounded">
                              L{req.target_proficiency}
                            </span>
                            {req.skill_importance === 'Critical' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Critical Capability" />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Subtle 5B Strategy Allocation */}
                    {role.five_b_strategy && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                        <span className="text-slate-400 font-medium">Fulfilment Path:</span>
                        <span className="font-semibold text-slate-700">
                          {fiveB.build_pct}% Build • {fiveB.buy_pct}% Buy {fiveB.bot_pct > 0 ? `• ${fiveB.bot_pct}% Bot` : ''}
                        </span>
                      </div>
                    )}

                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="flex-1 h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs"
                      style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                    >
                      <span>View Specification Sheet</span>
                      <ChevronRight size={13} className="text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleOpenDiff(role)}
                      title="Inspect Version History & Diff"
                      className="h-8 w-8 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      <GitBranch size={13} />
                    </button>
                    {role.status === 'Draft' && (
                      <button
                        onClick={() => handleApproveRole(role.future_role_id)}
                        className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                        style={{ backgroundColor: '#059669', color: '#ffffff' }}
                      >
                        Approve
                      </button>
                    )}
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">1.1 Strategy Driver Registry</h3>
              <p className="text-xs text-slate-500">
                Models corporate strategic intent as a controlled entity. Every future workforce demand number traces back to one of these drivers.
              </p>
            </div>
            <button
              onClick={() => setIsCreateDriverOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
            >
              <Plus size={13} className="text-white" />
              <span>Add Strategic Driver</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategyDrivers.map(driver => (
              <div
                key={driver.strategy_driver_id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      {driver.strategy_driver_id}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Rank #{driver.priority_rank} • {driver.driver_type}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">{driver.driver_name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{driver.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">Planning Horizon</div>
                      <div className="font-semibold text-slate-800">{driver.horizon_start_fy} – {driver.horizon_end_fy}</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">Growth Assumption</div>
                      <div className="font-semibold text-emerald-600">+{Math.round(driver.workforce_growth_assumption_pct * 100)}% Headcount</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">Productivity Gain</div>
                      <div className="font-semibold text-indigo-700">+{Math.round(driver.expected_productivity_gain_pct * 100)}% (Bot)</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">OpEx Ceiling</div>
                      <div className="font-semibold text-slate-800">LKR {(driver.opex_ceiling_lkr / 1000000).toFixed(1)}M</div>
                    </div>
                  </div>

                  {driver.technology_roadmap_items?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Adopted Technologies</div>
                      <div className="flex flex-wrap gap-1">
                        {driver.technology_roadmap_items.map((item: string) => (
                          <span key={item} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {driver.sunsetting_items?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-rose-600 uppercase mb-1">Sunsetting Systems ({driver.sunset_target_fy})</div>
                      <div className="flex flex-wrap gap-1">
                        {driver.sunsetting_items.map((item: string) => (
                          <span key={item} className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Ref: <strong className="text-slate-600">{driver.source_document_ref}</strong></span>
                  <span>Approver: <strong className="text-slate-600">{driver.approver_role}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DEMAND LINES (SECTION 1.5) */}
      {/* ============================================================== */}
      {activeTab === 'demand' && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">1.5 Workforce Demand Lines & Forecasting</h3>
            <p className="text-xs text-slate-500">
              Combines strategy-driven growth with attrition replacement and adjusts for technology productivity gains.
            </p>
          </div>

          {/* Area Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="text-xs font-bold text-slate-900 mb-3">
              Headcount Trajectory Projection (Active Baseline vs. Plan Target)
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastTimeline}>
                  <defs>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={['dataMin - 150', 'dataMax + 150']} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="target" stroke="#4f46e5" strokeWidth={2} fill="url(#colorTarget)" name="Target Capacity" />
                  <Area type="monotone" dataKey="headcount" stroke="#0284c7" strokeWidth={2} fill="url(#colorCurrent)" name="Active Headcount" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Demand Lines Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs overflow-x-auto">
            <div className="text-xs font-bold text-slate-900 mb-3">
              Demand Lines by Fiscal Year (AC 1 & 2 of User Story 2)
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase text-slate-500">
                  <th className="p-2.5">Future Role</th>
                  <th className="p-2.5">FY</th>
                  <th className="p-2.5 text-center">Gross Demand</th>
                  <th className="p-2.5 text-center text-indigo-700">Bot Offset</th>
                  <th className="p-2.5 text-center font-bold text-slate-900">Net Demand</th>
                  <th className="p-2.5 text-center">Active HC</th>
                  <th className="p-2.5 text-center text-emerald-600">Net New</th>
                  <th className="p-2.5">Demand Basis</th>
                  <th className="p-2.5 text-center">Lead Time</th>
                  <th className="p-2.5 text-center">Confidence</th>
                  <th className="p-2.5">Assumption Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {futureRoles.flatMap(r =>
                  (r.demand_lines || []).map((line: any) => (
                    <tr key={line.demand_line_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-800">
                        {r.role_title} <span className="text-[10px] text-slate-400 font-normal">({r.job_code})</span>
                      </td>
                      <td className="p-2.5 font-bold text-indigo-900">{line.fiscal_year}</td>
                      <td className="p-2.5 text-center">{line.demand_headcount_gross}</td>
                      <td className="p-2.5 text-center font-semibold text-indigo-700">{line.productivity_adjustment}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900 bg-slate-50">{line.demand_headcount_net}</td>
                      <td className="p-2.5 text-center text-slate-500">{r.current_headcount}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">+{line.net_new_demand}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {line.demand_basis}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">{line.mobilization_lead_time_days}d</td>
                      <td className="p-2.5 text-center font-semibold text-slate-700">{Math.round(line.confidence_level * 100)}%</td>
                      <td className="p-2.5 text-[11px] text-slate-500 max-w-xs truncate" title={line.assumption_notes}>
                        {line.assumption_notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SKILL TAXONOMY (SECTION 1.2) */}
      {/* ============================================================== */}
      {activeTab === 'skills' && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">1.2 Skill Taxonomy Catalog</h3>
            <p className="text-xs text-slate-500">
              Standardized taxonomy records referencing SKL-#### identifiers and market demand/supply indices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillsTaxonomy.map(skill => (
              <div key={skill.skill_id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {skill.skill_id}
                  </span>
                  <div>
                    {skill.is_emerging && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        EMERGING
                      </span>
                    )}
                    {skill.is_sunsetting && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                        SUNSETTING
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-0.5">{skill.skill_name}</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Family: <strong>{skill.skill_family}</strong> • Category: <strong>{skill.skill_category}</strong>
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="text-[10px] text-slate-400 font-medium">Market Demand</div>
                    <div className="font-bold text-slate-800">{Math.round(skill.market_demand_index * 100)}%</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="text-[10px] text-slate-400 font-medium">Market Supply</div>
                    <div className="font-bold text-slate-800">{Math.round(skill.market_supply_index * 100)}%</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="text-[10px] text-slate-400 font-medium">Skill Half-Life</div>
                    <div className="font-bold text-slate-800">{skill.skill_half_life_months} mo</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="text-[10px] text-slate-400 font-medium">Hours / Level</div>
                    <div className="font-bold text-slate-800">{skill.typical_learning_hours_per_level}h</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Standard: <strong className="text-slate-600">{skill.external_taxonomy_code || 'ESCO:2511'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: ECONOMICS & MOBILITY (SECTION 1.6 & 1.7) */}
      {/* ============================================================== */}
      {activeTab === 'cost_mobility' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Build vs Buy Cost Comparator */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
              <Coins size={14} className="text-slate-500" />
              <span>1.6 Build vs. Buy Cost Analysis (LKR)</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Compares the total cost of internal upskilling against external talent recruitment.
            </p>

            <div className="flex flex-col gap-3">
              {futureRoles.map(role => (
                <div key={role.future_role_id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
                    <span>{role.role_title}</span>
                    <span className="text-slate-500 font-medium">{role.gap} Positions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-medium">Build Route (Internal)</div>
                      <div className="font-bold text-indigo-900 text-sm mt-0.5">
                        LKR {(role.build_cost_lkr / 1000000).toFixed(2)}M
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-medium">Buy Route (External)</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">
                        LKR {(role.buy_cost_lkr / 1000000).toFixed(2)}M
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                    {role.cost_comparator}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Mobility & Sunset Pathways */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
              <Workflow size={14} className="text-slate-500" />
              <span>1.6 & 1.7 Internal Mobility & Sunset Pathways</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Feeder roles sorted by mathematical skill distance, with structured redeployment for declining roles.
            </p>

            <div className="flex flex-col gap-3">
              {futureRoles.map(role => {
                const hasFeeders = role.feeder_roles && role.feeder_roles.length > 0;
                const isSunset = role.role_evolution_class === 'Declining-Sunsetting';

                return (
                  <div key={role.future_role_id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-1.5">
                      <span>{role.role_title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isSunset ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {role.role_evolution_class}
                      </span>
                    </div>

                    {hasFeeders && (
                      <div className="mt-2">
                        <div className="text-[10px] font-medium text-slate-500 mb-1">Nearest Feeder Roles:</div>
                        <div className="flex flex-col gap-1">
                          {role.feeder_roles.map((feeder: any) => (
                            <div key={feeder.role_id} className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200 text-xs">
                              <span className="font-medium text-slate-800">{feeder.title}</span>
                              <span className="font-mono text-slate-600 font-semibold">Distance: {feeder.skill_distance}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isSunset && role.transition_target_roles && (
                      <div className="mt-2 p-2 bg-rose-50/80 border border-rose-100 rounded text-xs">
                        <div className="text-[10px] font-semibold text-rose-700 mb-1 uppercase">
                          Mandatory Sunset Redeployment Target
                        </div>
                        {role.transition_target_roles.map((targetRole: any) => (
                          <div key={targetRole.role_id} className="flex items-center justify-between text-xs text-slate-800">
                            <span>Redeploy into: <strong>{targetRole.title}</strong></span>
                            <span className="font-semibold text-rose-700">{targetRole.retraining_months} mo retraining</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedRole.job_code}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{selectedRole.career_level_id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    v{selectedRole.version} {selectedRole.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedRole.role_title}</h3>
              </div>
              <button onClick={() => setSelectedRole(null)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Spec Body */}
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Role Purpose</div>
                <p className="text-slate-700 leading-relaxed font-medium">{selectedRole.role_purpose}</p>
                <p className="text-rose-700 font-semibold mt-1.5">Failure Impact: {selectedRole.failure_impact_description}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Strategic Intent Driver</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedRole.strategy_driver_name}</div>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                  {selectedRole.strategy_driver_id}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">Criticality Tier</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedRole.criticality_tier}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">Criticality Index</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedRole.business_criticality_index}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">Active Headcount</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedRole.current_headcount} FTE</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">Sourcing Risk</div>
                  <div className="font-bold text-rose-700 mt-0.5">{selectedRole.sourcing_risk}</div>
                </div>
              </div>

              {/* Role Skill Requirements Table */}
              <div>
                <div className="text-xs font-bold text-slate-900 mb-2">Role Skill Requirements (The Role-Skill Map)</div>
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="p-2">Skill</th>
                      <th className="p-2 text-center">Target (1-5)</th>
                      <th className="p-2 text-center">Importance</th>
                      <th className="p-2 text-center">Route</th>
                      <th className="p-2 text-center">Time to Acquire</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRole.role_skill_requirements?.map((req: any) => (
                      <tr key={req.role_skill_req_id}>
                        <td className="p-2 font-semibold text-slate-800">{req.skill_name}</td>
                        <td className="p-2 text-center font-bold text-slate-900">Level {req.target_proficiency}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            req.skill_importance === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {req.skill_importance}
                          </span>
                        </td>
                        <td className="p-2 text-center text-slate-600">{req.acquisition_route}</td>
                        <td className="p-2 text-center font-semibold text-slate-800">{req.expected_time_to_acquire_months} mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 5B Fulfilment Strategy */}
              {selectedRole.five_b_strategy && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs font-bold text-slate-900 mb-1">5B Fulfilment Strategy Breakdown</div>
                  <div className="w-full h-2 rounded-full bg-slate-200 flex overflow-hidden mb-2">
                    <div style={{ width: `${selectedRole.five_b_strategy.build_pct}%` }} className="bg-indigo-600 h-full"></div>
                    <div style={{ width: `${selectedRole.five_b_strategy.buy_pct}%` }} className="bg-amber-500 h-full"></div>
                    <div style={{ width: `${selectedRole.five_b_strategy.bot_pct}%` }} className="bg-teal-600 h-full"></div>
                    <div style={{ width: `${selectedRole.five_b_strategy.borrow_pct}%` }} className="bg-violet-600 h-full"></div>
                    <div style={{ width: `${selectedRole.five_b_strategy.bridge_pct}%` }} className="bg-rose-500 h-full"></div>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">{selectedRole.five_b_strategy.summary}</p>
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
      {/* MODAL 2: VERSION DIFF VIEW */}
      {/* ============================================================== */}
      {versionDiffRole && diffData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 text-left">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Version History & Diff</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {diffData.role_title} (Comparing v{diffData.previous_version} with v{diffData.current_version})
                </p>
              </div>
              <button onClick={() => { setVersionDiffRole(null); setDiffData(null); }} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs mb-4">
              {diffData.diff_summary?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-1.5">
                    <span>{item.field}</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Modified</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border border-slate-200 text-slate-600">
                      <div className="text-[10px] text-slate-400 font-medium">Prior v{diffData.previous_version}</div>
                      <div className="mt-0.5">{item.v_previous}</div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200 text-slate-900 font-medium">
                      <div className="text-[10px] text-emerald-600 font-medium">Current v{diffData.current_version}</div>
                      <div className="mt-0.5">{item.v_current}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 italic mt-1.5">Rationale: {item.change}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => { setVersionDiffRole(null); setDiffData(null); }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg cursor-pointer"
                style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
              >
                Close History
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
              <button onClick={() => setIsCreateRoleOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="flex flex-col gap-3.5 text-xs">
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
              <button onClick={() => setIsCreateDriverOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDriverSubmit} className="flex flex-col gap-3.5 text-xs">
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
