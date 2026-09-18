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
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);

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

  const handleRunTranslation = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
      fetchStrategyData();
      triggerToast('Strategy Role Architect pipeline executed: Future role specs & headcount targets updated from Corporate Strategy.');
    }, 1200);
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
        className="z-10 mb-2 flex flex-row items-center justify-between gap-4 flex-nowrap"
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
      <div className={`transition-all duration-300 w-full ${isSynthesizing ? 'opacity-50 pointer-events-none blur-[1px]' : 'opacity-100'}`}>

        {/* Strategic Target Headcount & Role Pipeline Summary */}
        <Card className="glass p-6 mb-6 transition-all duration-300 hover:shadow-md border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Strategic Headcount & Future Role Pipeline</h3>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Primary Strategy Goal: {summaryData?.primary_goal || '2025–2030 Cloud & AI Transformation'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">

            {/* Current Headcount */}
            <div className="flex flex-col items-center justify-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500 group">
              <Users className="text-blue-600 mb-1 group-hover:scale-110 transition-transform" size={20} />
              <span className="text-2xl font-black text-slate-900">{summaryData?.current_headcount?.toLocaleString() || '6,055'}</span>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider text-center mt-1">Current Headcount</span>
            </div>

            {/* Strategic Growth Demand */}
            <div className="flex flex-col items-center justify-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm group">
              <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1 group-hover:scale-110 transition-transform">
                <span className="text-xs font-bold">+</span>
              </div>
              <span className="text-2xl font-black text-emerald-600">{summaryData?.planned_growth?.toLocaleString() || '727'}</span>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider text-center mt-1">Planned Strategic Growth</span>
            </div>

            {/* Target Headcount (Output) */}
            <div className="flex flex-col items-center justify-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm group">
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1 group-hover:scale-110 transition-transform">
                <Target size={14} />
              </div>
              <span className="text-2xl font-black text-indigo-600">{summaryData?.target_headcount?.toLocaleString() || '6,782'}</span>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider text-center mt-1">Target Headcount</span>
            </div>

            {/* Future Roles Identified */}
            <div className="flex flex-col items-center justify-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm group">
              <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-1 group-hover:scale-110 transition-transform">
                <FileText size={14} />
              </div>
              <span className="text-2xl font-black text-purple-600">{summaryData?.future_roles_count || '62'}</span>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider text-center mt-1">Future Roles Identified</span>
            </div>

            {/* Required Skills */}
            <div className="flex flex-col items-center justify-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm group">
              <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-1 group-hover:scale-110 transition-transform">
                <Star size={14} />
              </div>
              <span className="text-2xl font-black text-amber-600">{summaryData?.key_skills_count || '48'}</span>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider text-center mt-1">Key Skills Required</span>
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
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <Download size={13} /> Export Role Specs
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {futureRoleSpecs.map((item, index) => (
                  <div
                    key={item.id || item.rank || index}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 shadow-2xs transition-all duration-200 hover:shadow-sm group"
                  >
                    <div className="grid grid-cols-12 items-center gap-2">
                      {/* Rank (Col 1) */}
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          #{item.rank || index + 1}
                        </span>
                      </div>

                      {/* Role & Skill / Dept Details (Col 5) */}
                      <div className="col-span-5 flex flex-col justify-center min-w-0 pl-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                            {item.role}
                          </h4>
                          <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                            {item.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-medium text-blue-700 bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded truncate max-w-[180px]">
                            {item.skill}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                            {item.dept}
                          </span>
                        </div>
                      </div>

                      {/* Target Headcount (Col 2) */}
                      <div className="col-span-2 flex flex-col items-center justify-center border-l border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target</span>
                        <span className="text-sm font-black text-emerald-600">{item.gap}</span>
                      </div>

                      {/* Priority (Col 2) */}
                      <div className="col-span-2 flex items-center justify-center border-l border-slate-100">
                        <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded border tracking-wider uppercase ${item.urgency === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'
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
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                          }}
                          className="flex items-center justify-center gap-1 hover:bg-blue-700 active:scale-95 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                        >
                          <span className="text-white">Specs</span> <ArrowUpRight size={12} className="text-white" />
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-purple-600" /> Primary Strategy Inputs
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{primaryInputs.length} Sources</span>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">Corporate documents & business scenarios parsed by AI.</p>

              <div className="flex flex-col gap-2.5">
                {primaryInputs.map((input, idx) => (
                  <div key={input.id || idx} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-purple-300 transition-all flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <FileText size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight group-hover:text-purple-600 transition-colors">{input.title}</h4>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{input.type} • {input.date}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded border border-emerald-100 shrink-0">
                      {input.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Stored Assets & Knowledge Graph */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Database size={18} className="text-blue-600" /> Stored Assets & Knowledge Graph
                </h3>
                <button
                  onClick={() => setIsKnowledgeModalOpen(true)}
                  className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs hover:-translate-y-0.5"
                >
                  <Search size={12} /> Query Graph
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">Institutional wikis, project histories, and role-skill templates.</p>

              <div className="flex flex-col gap-2.5">
                {knowledgeAssets.map((asset, i) => (
                  <div key={asset.id || asset.name || i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: asset.color }}></div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{asset.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{asset.count}</span>
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
              <button onClick={() => setSelectedRoleSpec(null)} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs">
                Close Spec
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
              <button onClick={() => setIsKnowledgeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl mb-4 text-xs font-medium text-purple-950 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600 shrink-0" />
              1,420 Knowledge Graph nodes indexed from institutional wikis & project repositories.
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200 mb-4">
              <Search size={16} className="text-slate-400" />
              <input type="text" placeholder="Search knowledge graph (e.g. Cloud migration history)..." className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none w-full" />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setIsKnowledgeModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs">
                Close Query Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
