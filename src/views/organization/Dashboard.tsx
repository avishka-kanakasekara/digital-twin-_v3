import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { 
  Users, Target, TrendingUp, Activity, ExternalLink, HeartPulse, 
  BrainCircuit, Sparkles, AlertTriangle, 
  Zap, ShieldAlert, Layers, ShieldCheck, Clock, Building2, ChevronDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, Line } from 'recharts';
import { Link } from 'react-router-dom';
import { mockDrillDownEmployees } from '../../dummy/organization/dashboardData';
import { useOrganizationMetrics, useOrganizationAnomalies } from '../../hooks/useOrganization';
import api from '../../lib/api';
import { OrgIntelligenceGraphs } from './OrgIntelligenceGraphs';

export const Dashboard: React.FC = () => {
  const [drillDownInfo, setDrillDownInfo] = useState<{ isOpen: boolean; title: string; category?: string; data?: any[] } | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedPeriod, setSelectedPeriod] = useState('Current Quarter (FY26)');

  const { metrics, loading: metricsLoading } = useOrganizationMetrics();
  const { anomalies, loading: anomaliesLoading } = useOrganizationAnomalies();

  // History data for Headcount growth
  const orgHistoryData = metrics && metrics.length > 0 ? metrics : [
    { month: 'Sep 25', totalHeadcount: 6201, hires: 45, attrition: 12 },
    { month: 'Nov 25', totalHeadcount: 6350, hires: 52, attrition: 14 },
    { month: 'Jan 26', totalHeadcount: 6501, hires: 60, attrition: 11 },
    { month: 'Mar 26', totalHeadcount: 6600, hires: 48, attrition: 15 },
    { month: 'May 26', totalHeadcount: 6680, hires: 55, attrition: 10 },
    { month: 'Jul 26', totalHeadcount: 6720, hires: 58, attrition: 9 },
  ];

  const latestMetric = orgHistoryData[orgHistoryData.length - 1];

  useEffect(() => {
    api.departments.list({ limit: 6 }).then(data => {
      if (data && data.length > 0) {
        setDepartments(data.map((d: any) => ({
          name: d.name.length > 14 ? d.name.substring(0, 12) + '..' : d.name,
          performanceScore: d.performance_score || Math.floor(Math.random() * 15) + 80,
          headcount: d.headcount || 120
        })));
      } else {
        setDepartments([
          { name: 'Engineering & AI', performanceScore: 95, headcount: 185 },
          { name: 'Data & Analytics', performanceScore: 92, headcount: 140 },
          { name: 'Product & Design', performanceScore: 94, headcount: 110 },
          { name: 'Operations & SCM', performanceScore: 88, headcount: 220 },
          { name: 'Customer Care', performanceScore: 90, headcount: 310 },
          { name: 'HR & Governance', performanceScore: 89, headcount: 85 },
        ]);
      }
    }).catch(() => {
      setDepartments([
        { name: 'Engineering & AI', performanceScore: 95, headcount: 185 },
        { name: 'Data & Analytics', performanceScore: 92, headcount: 140 },
        { name: 'Product & Design', performanceScore: 94, headcount: 110 },
        { name: 'Operations & SCM', performanceScore: 88, headcount: 220 },
        { name: 'Customer Care', performanceScore: 90, headcount: 310 },
        { name: 'HR & Governance', performanceScore: 89, headcount: 85 },
      ]);
    });
  }, []);


  // Diagram 1 Data: ML Anomaly Telemetry Drift (Z-Scores)
  const anomalyTelemetryData = [
    { period: 'W1', zScore: 0.4 },
    { period: 'W2', zScore: 0.8 },
    { period: 'W3', zScore: -0.6 },
    { period: 'W4 (Dip)', zScore: -2.4 },
    { period: 'W5', zScore: -0.5 },
    { period: 'W6', zScore: 0.5 },
  ];

  // Diagram 2 Data: Predictive Skill Shortages FTE Deficit
  const predictiveShortagesData = [
    { skill: 'Cloud & GPU', deficit: 4.2 },
    { skill: 'MLOps AI', deficit: 3.8 },
    { skill: 'Zero-Trust Sec', deficit: 2.6 },
    { skill: 'Kafka Mesh', deficit: 2.1 },
    { skill: 'Product UI', deficit: 1.5 },
  ];

  // Diagram 3 Data: Talent Retention Survival Curve
  const retentionSurvivalData = [
    { month: 'M1', baseline: 98.5, operations: 95.2 },
    { month: 'M3', baseline: 97.4, operations: 91.0 },
    { month: 'M6', baseline: 95.8, operations: 86.5 },
    { month: 'M9', baseline: 94.8, operations: 81.8 },
    { month: 'M12', baseline: 94.2, operations: 78.2 },
  ];

  return (
    <div className="flex flex-col gap-6 text-left w-full pb-16">

      {/* Page Header Bar */}
      <div className="flex flex-col gap-1 w-full pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full py-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Organization Twin Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Twin Active
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Department Scope */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-6 appearance-none text-slate-800 font-semibold text-xs"
                >
                  <option>All Departments</option>
                  <option>Engineering & AI</option>
                  <option>Data & Analytics</option>
                  <option>Operations & Supply Chain</option>
                  <option>Product & Design</option>
                  <option>Human Resources</option>
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>

            {/* Timeframe */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-6 appearance-none text-slate-800 font-semibold text-xs"
                >
                  <option>Current Quarter (FY26)</option>
                  <option>Year to Date (FY26)</option>
                  <option>Trailing 12 Months</option>
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 max-w-2xl">
          Real-time enterprise organizational health, predictive workforce capability metrics, and digital twin knowledge graphs.
        </p>
      </div>

      {/* ROW 1: 5 Executive KPI Stat Cards (Locked Single Line) */}
      <div className="w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px' }}>
        {/* Card 1: Org Health Score */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Org Health Index Breakdown', category: 'Health' })}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group min-w-0 h-[104px]"
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <HeartPulse size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
              <TrendingUp size={10} strokeWidth={2.5} /> +4.2
            </span>
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate mb-1">Org Health</span>
            <div className="flex items-baseline gap-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {metricsLoading ? '...' : (latestMetric?.enps || 88)}
              </h3>
              <span className="text-xs font-bold text-slate-400 leading-none">/100</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Employees */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Active Workforce Distribution', category: 'Workforce' })}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group min-w-0 h-[104px]"
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Users size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
              <TrendingUp size={10} strokeWidth={2.5} /> +2.4%
            </span>
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate mb-1">Workforce</span>
            <div className="flex items-baseline gap-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {metricsLoading ? '...' : (latestMetric?.totalHeadcount?.toLocaleString() || '6,720')}
              </h3>
              <span className="text-xs font-semibold text-slate-400 leading-none">Staff</span>
            </div>
          </div>
        </div>

        {/* Card 3: Productivity Score */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Departmental Productivity Index', category: 'Productivity' })}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group min-w-0 h-[104px]"
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <Target size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
              <Activity size={10} strokeWidth={2.5} /> Optimal
            </span>
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate mb-1">Productivity</span>
            <div className="flex items-baseline gap-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {metricsLoading ? '...' : (latestMetric?.overallProductivityScore || 95)}
              </h3>
              <span className="text-xs font-bold text-slate-400 leading-none">%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Retention Stability */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Workforce Retention Stability Index', category: 'Retention' })}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group min-w-0 h-[104px]"
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
              <ShieldCheck size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
              <TrendingUp size={10} strokeWidth={2.5} /> +1.2%
            </span>
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate mb-1">Retention</span>
            <div className="flex items-baseline gap-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
                94.2
              </h3>
              <span className="text-xs font-bold text-slate-400 leading-none">%</span>
            </div>
          </div>
        </div>

        {/* Card 5: Anomaly Flagged */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Critical AI Anomaly Log', category: 'Anomalies' })}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-rose-200/90 shadow-2xs hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group min-w-0 h-[104px]"
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <Sparkles size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
              <AlertTriangle size={10} strokeWidth={2.5} /> Review
            </span>
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block truncate mb-1">Anomaly Watch</span>
            <div className="flex items-baseline gap-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-rose-600 tracking-tight leading-none">
                {anomaliesLoading ? '...' : (anomalies?.length || 2)}
              </h3>
              <span className="text-xs font-bold text-rose-400 leading-none">Signals</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: Primary Analytics Charts (2 Spacious Equal Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        {/* Chart 1: Workforce Growth & Retention Trajectory */}
        <div className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Workforce Headcount & Growth Trajectory</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Net active employee count across FY25–FY26 hiring cycles</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
              +519 Net Growth
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orgHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="headcountGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip 
                  formatter={(val: any) => [`${val.toLocaleString()} Employees`, 'Headcount']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} 
                />
                <Area type="monotone" dataKey="totalHeadcount" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#headcountGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Average monthly onboarding: 52 hires</span>
            <span className="font-semibold text-slate-700">6,720 Active Staff</span>
          </div>
        </div>

        {/* Chart 2: Departmental Performance Index */}
        <div className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Department Performance & Output Velocity</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Quarterly KPI delivery score aggregated from OKR telemetry</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
              91.8% Org Average
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[70, 100]} />
                <Tooltip 
                  formatter={(val: any) => [`${val}% Output Score`, 'Performance']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} 
                />
                <Bar dataKey="performanceScore" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Highest delivery: Engineering & AI (95%)</span>
            <span className="font-semibold text-slate-700">6 Operating Units</span>
          </div>
        </div>
      </div>

      {/* Organization Intelligence Graphs: Knowledge Network, Distribution & Skills Inventory */}
      <OrgIntelligenceGraphs />

      {/* ROW 3: Predictive Intelligence Diagrams (Anomaly, Skill Deficits, Retention) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
        {/* Diagram 1: ML Anomaly Telemetry Drift Diagram */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'ML Anomaly Telemetry Drift Analysis', category: 'Anomaly Detail' })}
          className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl p-5 flex flex-col justify-between hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                <BrainCircuit size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">ML Anomaly Detection Diagram</h3>
                <p className="text-[11px] text-slate-500">Continuous Z-Score telemetry drift curve</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
              -2.4σ Outlier
            </span>
          </div>

          <div className="h-[200px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={anomalyTelemetryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[-3, 2]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}σ`} />
                <Tooltip
                  formatter={(val: any) => [`${val}σ Z-Score`, 'Drift Metric']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
                <ReferenceLine y={-2} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Anomaly Limit (-2.0σ)', fill: '#f43f5e', fontSize: 9, position: 'insideBottomRight' }} />
                <Area type="monotone" dataKey="zScore" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#anomalyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>Model: Isolation Forest</span>
            <span className="font-extrabold text-purple-700">1 Anomaly (Operations Shift Dip)</span>
          </div>
        </div>

        {/* Diagram 2: Predictive Skill Shortages (Horizontal FTE Deficit Chart) */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Predictive Skill Shortages FTE Deficit', category: 'Skill Shortage' })}
          className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl p-5 flex flex-col justify-between hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Zap size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Predictive Skill Shortages Diagram</h3>
                <p className="text-[11px] text-slate-500">12-Month forward talent deficit projection</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              -14.2 FTE Total
            </span>
          </div>

          <div className="h-[200px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictiveShortagesData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `-${v}`} />
                <YAxis dataKey="skill" type="category" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  formatter={(val: any) => [`-${val} FTE Deficit`, 'Required Headcount']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="deficit" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>Demand Model: Strategic Workforce</span>
            <span className="font-extrabold text-amber-700">5 Shortages Projecting</span>
          </div>
        </div>

        {/* Diagram 3: Talent Retention Survival Curve */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Talent Retention Survival Curve & Flight Risk', category: 'Retention' })}
          className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl p-5 flex flex-col justify-between hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <ShieldAlert size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Talent Retention Survival Diagram</h3>
                <p className="text-[11px] text-slate-500">12-Month retention probability trajectory</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              94.2% Stability
            </span>
          </div>

          <div className="h-[200px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionSurvivalData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val}%`, name === 'baseline' ? 'Enterprise Baseline' : 'Operations (Watch)']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="baseline" stroke="#0ea5e9" strokeWidth={2} fill="url(#retentionGrad)" />
                <Line type="monotone" dataKey="operations" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3, fill: '#f43f5e' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>Model: Cox Proportional Survival</span>
            <span className="font-extrabold text-rose-600">Operations (78.2% Watch)</span>
          </div>
        </div>
      </div>

      {/* Drill-down Interactive Modal */}
      <Modal
        isOpen={!!drillDownInfo?.isOpen}
        onClose={() => setDrillDownInfo(null)}
        title={drillDownInfo?.title || 'Drill-down Inspection'}
      >
        <div className="flex flex-col gap-4 p-1">
          <div className="flex items-center gap-3 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs font-bold text-blue-900">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
              <Layers size={15} />
            </div>
            <div>
              <p>Granular breakdown for <span className="font-black text-blue-700">{drillDownInfo?.title}</span>.</p>
              <p className="text-[10px] text-blue-600/80 font-medium mt-0.5">Real-time telemetry and employee twin connections.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {mockDrillDownEmployees.map((emp) => (
              <div 
                key={emp.id} 
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-slate-50/80 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-[11px]">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                      {emp.name}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{emp.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Score: {emp.score}%
                  </span>
                  <Link 
                    to="/employee-twin" 
                    className="px-2.5 py-1 text-[11px] font-black bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-2xs flex items-center gap-1"
                  >
                    View Twin <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

    </div>
  );
};
