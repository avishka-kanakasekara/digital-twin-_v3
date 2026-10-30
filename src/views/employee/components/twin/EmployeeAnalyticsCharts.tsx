import React, { useState } from 'react';
import {
  TrendingUp, Sparkles, Award, HeartPulse, Zap, Trophy,
  Target, ShieldCheck, CheckCircle2, ArrowRight, Clock,
  Layers, ChevronRight, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Line
} from 'recharts';

interface EmployeeAnalyticsChartsProps {
  profile?: any;
  gamification?: any;
  twinHealth?: number;
}

const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid rgba(226,232,240,0.9)',
  background: '#ffffff',
  boxShadow: '0 10px 30px rgba(15,23,42,0.1)',
  fontSize: '12px',
  fontWeight: 700,
  padding: '10px 14px',
};

// 1. Skill Mastery & Competency Velocity Data (Monthly)
const SKILL_VELOCITY_DATA = [
  { month: 'May', cloudArch: 72, aiInference: 58, leadership: 64 },
  { month: 'Jun', cloudArch: 75, aiInference: 65, leadership: 68 },
  { month: 'Jul', cloudArch: 80, aiInference: 72, leadership: 74 },
  { month: 'Aug', cloudArch: 85, aiInference: 81, leadership: 79 },
  { month: 'Sep', cloudArch: 90, aiInference: 88, leadership: 83 },
  { month: 'Oct (Now)', cloudArch: 94, aiInference: 91, leadership: 88 },
];

// 2. Weekly Workload & Focus Telemetry Data
const WORKLOAD_TELEMETRY_DATA = [
  { week: 'W39', focusWork: 24, aiTuning: 8, reviews: 5, meetings: 6, total: 43 },
  { week: 'W40', focusWork: 26, aiTuning: 7, reviews: 4, meetings: 5, total: 42 },
  { week: 'W41', focusWork: 22, aiTuning: 9, reviews: 6, meetings: 6, total: 43 },
  { week: 'W42', focusWork: 28, aiTuning: 8, reviews: 4, meetings: 4, total: 44 },
  { week: 'W43 (Cur)', focusWork: 27, aiTuning: 9, reviews: 5, meetings: 3, total: 44 },
];

// 3. Competency Radar — Current vs L5 Staff Architect Target
const COMPETENCY_RADAR_DATA = [
  { subject: 'Cloud & GPU Infra', current: 94, benchmark: 85, fullMark: 100 },
  { subject: 'AI/LLM Orchestration', current: 91, benchmark: 85, fullMark: 100 },
  { subject: 'Distributed Systems', current: 84, benchmark: 80, fullMark: 100 },
  { subject: 'Tech Mentorship', current: 88, benchmark: 75, fullMark: 100 },
  { subject: 'Security & SRE', current: 78, benchmark: 80, fullMark: 100 },
  { subject: 'System Architecture', current: 92, benchmark: 85, fullMark: 100 },
];

// 4. Learning Trajectory & XP Acquisition
const LEARNING_TRAJECTORY_DATA = [
  { month: 'May', xpGain: 480, badges: 3 },
  { month: 'Jun', xpGain: 620, badges: 5 },
  { month: 'Jul', xpGain: 540, badges: 7 },
  { month: 'Aug', xpGain: 780, badges: 9 },
  { month: 'Sep', xpGain: 890, badges: 11 },
  { month: 'Oct', xpGain: 950, badges: 13 },
];

export const EmployeeAnalyticsCharts: React.FC<EmployeeAnalyticsChartsProps> = ({
  gamification,
  twinHealth = 94,
}) => {
  const [timeframe, setTimeframe] = useState<'6m' | 'ytd'>('6m');
  const [targetRole, setTargetRole] = useState<'l5-staff' | 'l6-principal'>('l5-staff');

  const currentXP = gamification?.totalXpEarned || gamification?.xp || 3940;

  return (
    <div className="flex flex-col gap-5 w-full text-left">
      {/* SECTION HEADER & CONTROLS */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 w-full text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <BarChart3 size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Twin Talent Intelligence & Analytics
              </h3>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} /> Live Telemetry • {twinHealth}% Sync
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">
              Real-time competency velocity, cognitive workload health, and career progression horizon.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold h-8">
            <button
              type="button"
              onClick={() => setTimeframe('6m')}
              className={`px-3 h-7 rounded-md transition-all cursor-pointer ${
                timeframe === '6m'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 6 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('ytd')}
              className={`px-3 h-7 rounded-md transition-all cursor-pointer ${
                timeframe === 'ytd'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FY26 YTD
            </button>
          </div>

          <div className="relative">
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as any)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold h-8 pl-3 pr-7 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="l5-staff">Target: L5 Staff Architect</option>
              <option value="l6-principal">Target: L6 Principal Fellow</option>
            </select>
            <ChevronRight
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* TOP ROW: 4 PERSONAL KPI METRIC SCORECARDS (Single Line Row) */}
      <div className="grid grid-cols-4 gap-3.5 w-full" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {/* Card 1: Competency Readiness */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-all min-w-0 h-[116px]">
          <div className="flex justify-between items-center mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Award size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
              <TrendingUp size={10} /> +6.5% QoQ
            </span>
          </div>
          <div className="min-w-0 flex flex-col justify-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate leading-none mb-1">
              Competency Readiness
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 leading-none">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">92%</h3>
              <span className="text-[11px] font-bold text-emerald-600 leading-none">L5 Target (85%)</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: '92%' }} />
            </div>
          </div>
        </div>

        {/* Card 2: Workload & Burnout Balance */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-all min-w-0 h-[116px]">
          <div className="flex justify-between items-center mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <HeartPulse size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              Optimal Band
            </span>
          </div>
          <div className="min-w-0 flex flex-col justify-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate leading-none mb-1">
              Cognitive Workload Index
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 leading-none">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">26%</h3>
              <span className="text-[11px] font-semibold text-slate-400 leading-none">74% Safe Headroom</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '26%' }} />
            </div>
          </div>
        </div>

        {/* Card 3: Deep Work & Sprint Velocity */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-purple-300 transition-all min-w-0 h-[116px]">
          <div className="flex justify-between items-center mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <Zap size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
              +14.2 hrs Focus
            </span>
          </div>
          <div className="min-w-0 flex flex-col justify-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate leading-none mb-1">
              Sprint Focus Time
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 leading-none">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">84.5</h3>
              <span className="text-[11px] font-bold text-slate-400 leading-none">hrs / sprint</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-sky-500 h-full rounded-full" style={{ width: '82%' }} />
            </div>
          </div>
        </div>

        {/* Card 4: Learning XP & Badges */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-all min-w-0 h-[116px]">
          <div className="flex justify-between items-center mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <Trophy size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              Tier 1 (Top 5%)
            </span>
          </div>
          <div className="min-w-0 flex flex-col justify-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate leading-none mb-1">
              Professional Development
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 leading-none">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {currentXP.toLocaleString()}
              </h3>
              <span className="text-[11px] font-bold text-amber-600 leading-none">13 Credentials</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '88%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* DUAL CHARTS GRID 1: Skill Velocity AreaChart + Weekly Workload BarChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* CHART 1: Skill Mastery & Competency Velocity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Target size={16} className="text-blue-600" />
                Skill Mastery & Competency Velocity
              </h4>
              <p className="text-xs font-semibold text-slate-500">
                Monthly progression trajectory across core engineering & leadership domains.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Cloud & GPU
              </span>
              <span className="flex items-center gap-1.5 text-sky-500">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> AI Inference
              </span>
              <span className="flex items-center gap-1.5 text-purple-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Leadership
              </span>
            </div>
          </div>

          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SKILL_VELOCITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.8)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[40, 100]}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: any, name: any) => [
                    `${value}%`,
                    name === 'cloudArch' ? 'Cloud & GPU' : name === 'aiInference' ? 'AI Inference' : 'Leadership'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="cloudArch"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cloudGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="aiInference"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#aiGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="leadership"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#leadGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Weekly Focus & Workload Telemetry */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock size={16} className="text-purple-600" />
                Weekly Cognitive Load & Time Allocation
              </h4>
              <p className="text-xs font-semibold text-slate-500">
                Deep work hours vs meetings vs architecture reviews per sprint week.
              </p>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              44 hrs / wk (Healthy)
            </span>
          </div>

          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WORKLOAD_TELEMETRY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.8)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 50]}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(val: any, name: any) => [
                    `${val} hrs`,
                    name === 'focusWork'
                      ? 'Deep Work'
                      : name === 'aiTuning'
                      ? 'AI Tuning'
                      : name === 'reviews'
                      ? 'Code Reviews'
                      : 'Meetings'
                  ]}
                />
                <Bar dataKey="focusWork" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
                <Bar dataKey="aiTuning" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                <Bar dataKey="reviews" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="meetings" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-blue-700">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" /> Deep Work (61%)
              </span>
              <span className="flex items-center gap-1 text-sky-700">
                <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block" /> AI Tuning (20%)
              </span>
              <span className="flex items-center gap-1 text-purple-700">
                <span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block" /> Reviews (11%)
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Meetings (8%)
              </span>
            </div>
            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
              <CheckCircle2 size={12} /> Low Fatigue
            </span>
          </div>
        </div>
      </div>

      {/* DUAL CHARTS GRID 2: Benchmark Radar + Learning Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* CHART 3: Competency Benchmark Radar vs L5 Role */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" />
                Competency Radar vs Target Benchmark
              </h4>
              <p className="text-xs font-semibold text-slate-500">
                Comparing current twin capabilities against {targetRole === 'l5-staff' ? 'L5 Staff Architect' : 'L6 Principal'} tier.
              </p>
            </div>
            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              +7.8% Net Surplus
            </span>
          </div>

          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={COMPETENCY_RADAR_DATA}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                />
                <Radar
                  name="Current Mastery"
                  dataKey="current"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.35}
                />
                <Radar
                  name="Target Benchmark"
                  dataKey="benchmark"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.15}
                  strokeDasharray="4 4"
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Current Skill (Avg 87.8%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Benchmark (Avg 80.8%)
              </span>
            </div>
            <span className="text-blue-700 font-extrabold">Ready for Promotion</span>
          </div>
        </div>

        {/* CHART 4: Learning Velocity & Badges */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers size={16} className="text-amber-600" />
                Capability Acquisition & Credential Velocity
              </h4>
              <p className="text-xs font-semibold text-slate-500">
                Monthly capability development hours and verified competency credentials unlocked.
              </p>
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={11} /> 13 Credentials
            </span>
          </div>

          <div className="h-[250px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={LEARNING_TRAJECTORY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.8)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}h`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 16]}
                  tick={{ fill: '#f59e0b', fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(val: any, name: any) => [
                    name === 'xpGain' ? `${val}h Dev Time` : `${val} Verified Credentials`,
                    name === 'xpGain' ? 'Monthly Hours' : 'Cumulative Credentials'
                  ]}
                />
                <Bar yAxisId="left" dataKey="xpGain" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={28} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="badges"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f59e0b' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" /> Monthly Dev Time (Avg +71h)
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Verified Credentials
              </span>
            </div>
            <span className="text-amber-700 font-extrabold">+2 Credentials pending verification</span>
          </div>
        </div>
      </div>

      {/* CAREER PROGRESSION HORIZON & PROMOTION TIMELINE */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Award size={16} className="text-indigo-600" />
              Career Progression Horizon & Promotion Milestones
            </h4>
            <p className="text-xs font-semibold text-slate-500">
              Automated progression roadmap synthesized from twin skill mastery and performance telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 size={13} /> 88% Promotion Readiness
            </span>
          </div>
        </div>

        {/* 4-Stage Step Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Stage 1 */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">L3 Tier</span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Completed
              </span>
            </div>
            <h5 className="text-xs font-black text-slate-900">Senior Platform Engineer</h5>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Core services & distributed API design.</p>
          </div>

          {/* Stage 2 (Current) */}
          <div className="p-3.5 rounded-xl border-2 border-blue-500 bg-blue-50/50 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">L4 Tier</span>
              <span className="text-[10px] font-extrabold text-white bg-blue-600 px-2 py-0.5 rounded-full">
                Current Role
              </span>
            </div>
            <h5 className="text-xs font-black text-slate-900">Lead AI Platform Specialist</h5>
            <p className="text-[11px] font-medium text-slate-500 mt-1">GPU clusters, PyTorch & inferencing.</p>
          </div>

          {/* Stage 3 (Next Target) */}
          <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">L5 Tier</span>
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                Target (88% Match)
              </span>
            </div>
            <h5 className="text-xs font-black text-slate-900">Principal / Staff Architect</h5>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Enterprise scale & AI governance.</p>
          </div>

          {/* Stage 4 (Future Horizon) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between opacity-75">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">L6 Tier</span>
              <span className="text-[10px] font-extrabold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                Horizon FY28
              </span>
            </div>
            <h5 className="text-xs font-black text-slate-800">Enterprise AI Fellow</h5>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Cross-industry research & board advisory.</p>
          </div>
        </div>

        {/* AI Action Steps to Close Remaining Gap */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600 shrink-0" />
            <span>
              <strong className="text-slate-900 font-extrabold">AI Next Action:</strong> Complete MLOps CI/CD production deployment module to close remaining 7% gap for L5 Staff Architect.
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 shrink-0 hover:underline"
          >
            Open Learning Hub Module <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
