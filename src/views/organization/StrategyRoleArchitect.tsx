import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import {
  FileText, Settings, Users, Target, Activity, Minus, Plus, Equal,
  AlertCircle, ArrowUpRight, CheckCircle2, X, Sparkles, Database,
  Share2, TrendingUp, Layers, Compass, Cpu, Search, Download,
  FileSpreadsheet, BookOpen, GitBranch, Star
} from 'lucide-react';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

import api from '../../lib/api';

export const StrategyRoleArchitect: React.FC = () => {
  const [cycle, setCycle] = useState('2025 – 2030 (Active)');
  const [department, setDepartment] = useState('All Departments');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoleSpec, setSelectedRoleSpec] = useState<any | null>(null);
  const [selectedPrimaryInput, setSelectedPrimaryInput] = useState<any | null>(null);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);

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
    setIsLoading(true);
    api.organization.getStrategyOverview(department)
      .then((res: any) => {
        if (res) {
          if (res.summary) setSummaryData(res.summary);
          if (res.role_specs) setFutureRoleSpecs(res.role_specs);
          if (res.forecast_timeline) setForecastTimeline(res.forecast_timeline);
          if (res.primary_inputs) setPrimaryInputs(res.primary_inputs);
          if (res.knowledge_assets) setKnowledgeAssets(res.knowledge_assets);
          if (res.competency_radar) setCompetencyRadar(res.competency_radar);
        }
      })
      .catch((err) => console.error('Error fetching Strategy Role Architect backend data:', err))
      .finally(() => setIsLoading(false));
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
              <p className="text-sm font-bold text-emerald-800">Strategy Translation Complete</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer ml-4">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div
        className="z-10 flex flex-row items-center justify-between gap-4 flex-nowrap"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 tracking-wider uppercase border border-blue-200">
              ORGANIZATION TWIN (OT)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 tracking-wider uppercase border border-indigo-200 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" /> AI Strategy Translation
            </span>
          </div>
          <h1 className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">
            Strategy Role Architect
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 max-w-xl truncate">
            Translates corporate strategy into future role requirements, target headcounts, and organizational knowledge frameworks.
          </p>
        </div>

        {/* Control Bar */}
        <div
          className="transition-all shrink-0"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}
        >
          {/* Strategy Cycle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px', paddingRight: '8px' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Cycle</span>
            <select
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="text-sm font-bold bg-transparent cursor-pointer focus:outline-none"
              style={{ color: '#1e293b' }}
            >
              <option className="bg-white text-slate-800">2025 – 2030 (Active)</option>
              <option className="bg-white text-slate-800">2026 – 2031 (Draft)</option>
            </select>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }}></div>

          {/* Scope */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', paddingRight: '8px' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Scope</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="text-sm font-bold bg-transparent cursor-pointer focus:outline-none"
              style={{ color: '#1e293b' }}
            >
              <option className="bg-white text-slate-800">All Departments</option>
              <option className="bg-white text-slate-800">Engineering</option>
              <option className="bg-white text-slate-800">Operations</option>
              <option className="bg-white text-slate-800">Product</option>
              <option className="bg-white text-slate-800">Sales & Marketing</option>
            </select>
          </div>

          <button
            onClick={handleRunTranslation}
            disabled={isSynthesizing}
            className="transition-all cursor-pointer hover:-translate-y-0.5"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '10px 20px', borderRadius: '12px', minWidth: '140px', border: 'none', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
          >
            {isSynthesizing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="animate-pulse"><Cpu size={14} className="animate-spin text-white" /> Translating...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={14} /> Run Translation</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Overlay */}
      <div className={`flex flex-col gap-6 transition-all duration-300 w-full ${isSynthesizing ? 'opacity-50 pointer-events-none blur-[1px]' : 'opacity-100'}`}>

        {/* Strategic Target Headcount & Role Pipeline Summary */}
        <Card className="glass p-5 transition-all duration-300 hover:shadow-md border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Strategic Headcount & Future Role Pipeline</h3>
            <span className="text-[10.5px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80 flex items-center gap-1.5 shadow-2xs">
              <Sparkles size={12} className="text-amber-500" /> Primary Strategy Goal: {summaryData?.primary_goal || '2025–2030 Cloud & AI Transformation'}
            </span>
          </div>

          {/* Connected Strategy Pipeline Flow Strip */}
          <div className="flex items-center justify-between gap-4 sm:gap-5 bg-slate-100/80 p-4 rounded-2xl border border-slate-200/80 overflow-x-auto">

            {/* 1. Current Headcount */}
            <div className="flex items-center justify-center gap-3.5 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <Users size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-black text-slate-900 leading-tight">{summaryData?.current_headcount?.toLocaleString() || '6,055'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Current Headcount</span>
              </div>
            </div>

            {/* Operator 1: + */}
            <div className="w-8.5 h-8.5 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs border border-emerald-300 mx-0.5">
              +
            </div>

            {/* 2. Planned Growth */}
            <div className="flex items-center justify-center gap-3.5 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <TrendingUp size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-black text-emerald-600 leading-tight">+{summaryData?.planned_growth?.toLocaleString() || '727'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Planned Growth</span>
              </div>
            </div>

            {/* Equal Operator: = */}
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md border border-slate-800 mx-0.5">
              =
            </div>

            {/* 3. Target Headcount Output Highlight */}
            <div 
              className="flex items-center justify-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all flex-1 min-w-[160px] min-h-[64px]"
              style={{
                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                border: '1.5px solid #6366f1',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)'
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Target size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-black text-indigo-700 leading-tight">{summaryData?.target_headcount?.toLocaleString() || '6,782'}</span>
                <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider truncate">TARGET HEADCOUNT</span>
              </div>
            </div>

            {/* Separator Divider */}
            <div className="w-px h-8 bg-slate-300/80 mx-2 shrink-0 hidden lg:block"></div>

            {/* 4. Future Roles */}
            <div className="flex items-center justify-center gap-3.5 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-400 transition-all flex-1 min-w-[135px] min-h-[64px]">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-black text-purple-700 leading-tight">{summaryData?.future_roles_count || '62'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Future Roles</span>
              </div>
            </div>

            {/* 5. Key Skills */}
            <div className="flex items-center justify-center gap-3.5 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 transition-all flex-1 min-w-[135px] min-h-[64px]">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <Star size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-black text-amber-600 leading-tight">{summaryData?.key_skills_count || '48'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Key Skills</span>
              </div>
            </div>

          </div>
        </Card>

        {/* Main Grid: Left 2 Columns (Outputs & Forecasts) + Right 1 Column (Inputs & Knowledge Graph Assets) */}
        <div className="grid grid-cols-3 gap-6">

          {/* Left 2 Columns: Primary Outputs & Strategic Forecast */}
          <div className="col-span-2 flex flex-col gap-6">

            {/* Card 1: Translated Future Role Specifications (Primary Output) */}
            <Card className="glass-panel p-6 flex flex-col gap-5 border border-slate-200/80 transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-2xs"><FileText size={20} /></div>
                    Future Role Specifications & Requirements
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Primary Output: Translated from corporate strategy & operating model.</p>
                </div>
                <button
                  onClick={() => triggerToast(`Exporting ${futureRoleSpecs.length || 62} Future Role Specifications to CSV/PDF...`)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer px-3.5 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <Download size={14} /> Export Role Specs
                </button>
              </div>

              <div className="flex flex-col gap-3.5">
                {futureRoleSpecs.map((item, index) => (
                  <div
                    key={item.id || item.rank || index}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 shadow-2xs transition-all duration-200 hover:shadow-md group"
                  >
                    <div className="grid grid-cols-12 items-center gap-2">
                      {/* Rank (Col 1) */}
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="w-8.5 h-8.5 rounded-xl bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-2xs">
                          #{item.rank || index + 1}
                        </span>
                      </div>

                      {/* Role & Skill / Dept Details (Col 6) */}
                      <div className="col-span-6 flex flex-col justify-center min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            {item.role}
                          </h4>
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                            {item.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <Sparkles size={10} className="text-blue-500" />
                            {item.skill}
                          </span>
                          <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                            {item.dept}
                          </span>
                        </div>
                      </div>

                      {/* Target Headcount (Col 2) */}
                      <div className="col-span-2 flex flex-col items-center justify-center border-l border-slate-100 px-2">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">TARGET</span>
                        <span className="text-base font-black text-emerald-600 leading-tight">{item.gap}</span>
                      </div>

                      {/* Priority Badge (Col 1) */}
                      <div className="col-span-1 flex items-center justify-center border-l border-slate-100 px-1">
                        <span className={`text-[9.5px] font-black px-2.5 py-1 rounded-full border tracking-wider uppercase shadow-2xs ${
                          item.urgency === 'HIGH' 
                            ? 'bg-rose-50 text-rose-600 border-rose-200' 
                            : item.urgency === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {item.urgency}
                        </span>
                      </div>

                      {/* Action Button (Col 2) */}
                      <div className="col-span-2 flex items-center justify-end">
                        <button
                          onClick={() => setSelectedRoleSpec(item)}
                          style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
                          }}
                          className="flex items-center justify-center gap-1.5 hover:bg-blue-700 active:scale-95 text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 border-none"
                        >
                          <span style={{ color: '#ffffff' }}>Specs</span>
                          <ArrowUpRight size={13} style={{ color: '#ffffff' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Card 2: Strategic Headcount Forecast Trends (2025–2030) */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md h-[320px] border border-slate-200/80">
              <div className="flex justify-between items-center mb-4 z-10">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" /> Strategic Headcount Forecast (2025 – 2030)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Headcount trajectory aligned with corporate strategy goals.</p>
                </div>
                <div className="flex gap-4 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-blue-600"><div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div> Total Headcount</span>
                  <span className="flex items-center gap-1.5 text-emerald-600"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Target Capacity</span>
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
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                    <YAxis domain={[5800, 7000]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', backgroundColor: '#ffffff' }} />
                    <Area type="monotone" dataKey="headcount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHc)" />
                    <Area type="monotone" dataKey="target" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTarget)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>

          {/* Right 1 Column: Primary Inputs & Stored Knowledge Assets */}
          <div className="col-span-1 flex flex-col gap-6">

            {/* Primary Strategy Inputs */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 shadow-2xs"><FileText size={16} /></div>
                  Primary Strategy Inputs
                </h3>
                <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">{primaryInputs.length} Sources</span>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">Corporate documents & business scenarios parsed by AI.</p>

              <div className="flex flex-col gap-3">
                {primaryInputs.map((input, idx) => (
                  <div 
                    key={input.id || idx} 
                    onClick={() => setSelectedPrimaryInput(input)}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-300 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer group"
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

            {/* Stored Assets & Knowledge Graph */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-2xs"><Database size={16} /></div>
                  Stored Assets & Knowledge Graph
                </h3>
                <button
                  onClick={() => setIsKnowledgeModalOpen(true)}
                  className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs hover:-translate-y-0.5"
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
                    className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
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

            {/* Role-Skill Map Competency Matrix */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md border border-slate-200/80">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                <Activity size={18} className="text-indigo-600" /> Role-Skill Map Radar
              </h3>
              <p className="text-xs text-slate-500 mb-2 font-medium">Organizational competency requirements shift.</p>
              <div className="w-full relative mt-1" style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={competencyRadar}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar name="Target Competency" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', backgroundColor: '#ffffff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>
        </div>

      </div>

      {/* MODAL 1: Role Specification Details */}
      {selectedRoleSpec && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedRoleSpec.role}</h3>
                  <p className="text-xs font-medium text-slate-400">Future Role Specification • Level: {selectedRoleSpec.level}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRoleSpec(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs mb-5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-600">Department</span>
                <span className="font-bold text-slate-900">{selectedRoleSpec.dept}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-600">Target Headcount Growth</span>
                <span className="font-extrabold text-emerald-600">{selectedRoleSpec.gap} Positions</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-600">Required Skills</span>
                <span className="font-bold text-blue-600">{selectedRoleSpec.skill}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedRoleSpec(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Spec
              </button>
              <button
                onClick={() => {
                  triggerToast(`Added ${selectedRoleSpec.role} (${selectedRoleSpec.gap} roles) to Q4 Recruiting Pipeline!`);
                  setSelectedRoleSpec(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add to Recruiting Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Knowledge Graph Query Modal */}
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
                placeholder="Search knowledge graph (e.g. Cloud, AI, Governance)..."
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
                  Type a keyword above (e.g. "Cloud", "AI", "Governance") to query indexed nodes.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setIsKnowledgeModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer">
                Close Query Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Primary Strategy Input Document Inspection */}
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
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
