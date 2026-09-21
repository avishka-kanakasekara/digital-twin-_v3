import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import {
  FileText, Target, Activity, Plus,
  ArrowUpRight, CheckCircle2, X, Sparkles, Database,
  TrendingUp, Cpu, Search, Download, Layers,
  Compass, ShieldAlert, PieChart, Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

import api from '../../lib/api';

export const StrategyRoleArchitect: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'analytics'>('portfolio');
  const [cycle, setCycle] = useState('2025 – 2030 (Active)');
  const [department, setDepartment] = useState('All Departments');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  // Modals & Selected Role Drawer
  const [selectedRoleSpec, setSelectedRoleSpec] = useState<any | null>(null);
  const [selectedPrimaryInput, setSelectedPrimaryInput] = useState<any | null>(null);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

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
  const [summaryData, setSummaryData] = useState<any>({
    current_headcount: 6055,
    planned_growth: 727,
    target_headcount: 6782,
    future_roles_count: 62,
    key_skills_count: 48,
    primary_goal: '2025–2030 Cloud & AI Transformation'
  });

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
        }
      })
      .catch((err) => console.error('Error fetching Strategy Role Architect backend data:', err));
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
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer ml-4">
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

      {/* 4 Clean Executive Metric KPI Cards in Single Horizontal Line */}
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

        {/* Navigation & Search Bar (Taller 3D Elevated Floating Bar) */}
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
              className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-black tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-2.5 border-none ${
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
              <Briefcase size={17} /> Strategic Role Architecture & 5B Portfolio
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-black tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-2.5 border-none ${
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
              <Activity size={17} /> Strategic Analytics & Competency Radar
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

            {/* 3D Raised Export CSV Button */}
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
                  return (
                    <Card
                      key={item.role_id || index}
                      className="glass-panel p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col gap-4 bg-white rounded-2xl group hover:border-blue-400"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-black text-xs tracking-wider shadow-2xs">
                            {item.role_id || `ROLE-200${index + 1}`}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                                {item.role}
                              </h4>
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                                item.role_evolution === 'Evolving' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                item.role_evolution === 'Emerging' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {item.role_evolution || 'Evolving'}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">{item.business_unit || item.dept} • Level: {item.level}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-xl">
                            Demand: {item.target_headcount || item.gap}
                          </span>
                          <button
                            onClick={() => setSelectedRoleSpec(item)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
                          >
                            <span>Inspect 360° Specs</span>
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Spec Overview Box */}
                      <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/60 text-xs text-slate-700 flex flex-col gap-1">
                        <p className="font-semibold text-slate-800">📌 <span className="font-extrabold text-slate-900">Purpose:</span> {item.role_spec || item.role}</p>
                        <p className="font-medium text-slate-500">🛣️ <span className="font-extrabold text-slate-700">Hierarchy Pathway:</span> {item.career_hierarchy || item.level}</p>
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

                      {/* Bottom Feeder Roles & Sourcing Risk */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-400 text-[10px] uppercase">Internal Feeder Roles:</span>
                          {(item.internal_mobility || ['Internal Feeder']).map((feeder: string, fIdx: number) => (
                            <span key={fIdx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10.5px] font-semibold rounded-md border border-indigo-100">
                              {feeder}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-600">
                          <ShieldAlert size={13} className="text-amber-600" /> Market Risk:
                          <span className="text-slate-800 font-bold truncate max-w-[200px]">{item.market_risk || 'Medium'}</span>
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

              {/* Stored Knowledge Graph Assets */}
              <Card className="glass-panel flex flex-col p-5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100"><Database size={15} /></div>
                    Knowledge Graph Index
                  </h3>
                  <button
                    onClick={() => setIsKnowledgeModalOpen(true)}
                    className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <Search size={13} /> Query Graph
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">Institutional wikis, project histories, and role-skill templates.</p>

                <div className="flex flex-col gap-2.5">
                  {knowledgeAssets.map((asset, i) => (
                    <div 
                      key={asset.id || asset.name || i} 
                      onClick={() => {
                        const queryTerm = asset.name.split(' ')[0];
                        setKgQuery(queryTerm);
                        setIsKnowledgeModalOpen(true);
                      }}
                      className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full shadow-2xs shrink-0" style={{ backgroundColor: asset.color }}></div>
                        <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">{asset.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">{asset.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

          </div>
        )}

        {/* TAB 2: STRATEGIC ANALYTICS & COMPETENCY RADAR */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Trajectory Forecast Chart */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden h-[340px] border border-slate-200/90 shadow-2xs">
              <div className="flex justify-between items-center mb-4 z-10">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" /> Strategic Headcount Demand Forecast (2025 – 2030)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Headcount trajectory aligned with corporate strategy goals.</p>
                </div>
              </div>
              <div className="flex-1 w-full z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[5800, 7000]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }} />
                    <Area type="monotone" dataKey="headcount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHc)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Competency Radar Chart */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden h-[340px] border border-slate-200/90 shadow-2xs">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                <Activity size={18} className="text-indigo-600" /> Organizational Competency Radar
              </h3>
              <p className="text-xs text-slate-500 mb-2 font-medium">Enterprise capability requirements shift across key domains.</p>
              <div className="w-full relative mt-1" style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={competencyRadar}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar name="Target Competency" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>
        )}

      </div>

      {/* MODAL 1: ELEGANT 360 DEGREE ROLE SPECIFICATION DRAWER / MODAL */}
      {selectedRoleSpec && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md">
                  {selectedRoleSpec.role_id || 'ROLE'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedRoleSpec.role}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {selectedRoleSpec.business_unit || selectedRoleSpec.dept} • Level: {selectedRoleSpec.level}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedRoleSpec(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: 4 Clean Sections */}
            <div className="flex flex-col gap-4 text-xs">
              
              {/* Section 1: Role Overview & Strategy Alignment */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col gap-2">
                <h4 className="font-black text-blue-900 uppercase tracking-wider text-[10.5px]">1. Future Role Specification & Purpose</h4>
                <p className="text-slate-800 text-xs font-semibold leading-relaxed">{selectedRoleSpec.role_spec || selectedRoleSpec.role}</p>
                <p className="text-slate-600 text-[11px] font-medium mt-1">🛣️ Hierarchy: {selectedRoleSpec.career_hierarchy || selectedRoleSpec.level}</p>
              </div>

              {/* Section 2: 5B Sourcing & Headcount Demand */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-indigo-950 uppercase tracking-wider text-[10.5px]">2. 5B Fulfillment Strategy Route</h4>
                  <span className="px-3 py-0.5 bg-indigo-600 text-white text-[11px] font-black rounded-full">
                    Demand: {selectedRoleSpec.target_headcount || selectedRoleSpec.gap}
                  </span>
                </div>
                <p className="text-indigo-900 font-extrabold text-xs mt-1">{selectedRoleSpec.fulfillment_5b || 'Build 60% + Buy 40%'}</p>
                <p className="text-indigo-800 font-medium text-[11px]">Capability Gap Target: {selectedRoleSpec.capability_gap_targets || 'High Priority'}</p>
              </div>

              {/* Section 3: HR Parameters & Cost Parameters (if available) */}
              {selectedRoleSpec.hr_inputs && (
                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 flex flex-col gap-2.5">
                  <h4 className="font-black text-purple-950 uppercase tracking-wider text-[10.5px]">3. HR & Business Parameters Baseline</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
              <button onClick={() => setIsKnowledgeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
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
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none w-full"
              />
              {kgQuery && (
                <button onClick={() => setKgQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
              <button onClick={() => setSelectedPrimaryInput(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  triggerToast(`Re-indexing ${selectedPrimaryInput.title} with AI Translation Pipeline...`);
                  setSelectedPrimaryInput(null);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none text-white"
              >
                <Sparkles size={14} /> Re-parse with AI
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
