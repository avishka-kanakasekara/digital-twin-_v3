import React, { useState } from 'react';


import { Modal } from '../../components/Modal';
import { Users, Target, TrendingUp, ChevronDown, Activity, ExternalLink, HeartPulse, BrainCircuit, Sparkles, AlertTriangle, Calendar, Globe, Briefcase } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
import { mockDrillDownEmployees } from '../../dummy/organization/dashboardData';
import { mockOrgHistory, mockLargeDepartments } from '../../dummy/organization/largeDashboardData';

export const Dashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All Departments');
  const [drillDownInfo, setDrillDownInfo] = useState<{ isOpen: boolean; title: string; type: string } | null>(null);



  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-end bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Activity size={16} strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">Executive Dashboard</h1>
          </div>
          <p className="text-base text-slate-500 font-medium ml-11">Organization Digital Twin • High-level KPIs and intelligent insights.</p>

          <div className="flex items-center gap-4 mt-4 ml-11">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200/60 rounded-full text-xs font-bold text-emerald-700 shadow-sm shadow-emerald-500/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Live Aggregation
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Activity size={14} className="text-slate-300" />
              Last Sync: Today, 02:00 AM
            </div>
          </div>
        </div>

        {/* Global Filters - Premium Glass Pill */}
        <div className="flex items-center gap-2.5 bg-white/40 backdrop-blur-md p-1.5 rounded-[20px] shadow-[0_2px_15px_rgb(0,0,0,0.02)] border border-white/60 relative z-10">

          {/* Filter 1: Time */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-[14px] shadow-sm border border-slate-100 hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] hover:-translate-y-0.5 transition-all cursor-pointer group">
            <div className="w-7 h-7 rounded-[10px] bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
              <Calendar size={14} strokeWidth={2.5} />
            </div>
            <select className="text-sm font-extrabold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-2 focus:ring-0">
              <option>Q2 2026</option>
              <option>Q1 2026</option>
              <option>FY 2025</option>
            </select>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>

          {/* Filter 2: Org */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-[14px] shadow-sm border border-slate-100 hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] hover:-translate-y-0.5 transition-all cursor-pointer group">
            <div className="w-7 h-7 rounded-[10px] bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
              <Globe size={14} strokeWidth={2.5} />
            </div>
            <select
              className="text-sm font-extrabold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-2 focus:ring-0"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option>Global Org</option>
              <option>North America</option>
              <option>EMEA</option>
              <option>APAC</option>
            </select>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>

          {/* Filter 3: Division */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-[14px] shadow-sm border border-slate-100 hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] hover:-translate-y-0.5 transition-all cursor-pointer group">
            <div className="w-7 h-7 rounded-[10px] bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <Briefcase size={14} strokeWidth={2.5} />
            </div>
            <select className="text-sm font-extrabold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-2 focus:ring-0">
              <option>All Divisions</option>
              <option>Product & Eng</option>
              <option>GTM</option>
            </select>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-5">

        {/* Card 1: Org Health */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgb(16,185,129,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <HeartPulse size={22} strokeWidth={2.5} />
            </div>
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <TrendingUp size={12} strokeWidth={3} /> +4 pts
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 mb-0.5">Org Health Score</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">92</h3>
              <span className="text-sm font-bold text-slate-400">/100</span>
            </div>
          </div>
        </div>

        {/* Card 2: Employees */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgb(59,130,246,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
              <Users size={22} strokeWidth={2.5} />
            </div>
            <div className="bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <TrendingUp size={12} strokeWidth={3} /> +2.4%
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 mb-0.5">Total Employees</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">1,248</h3>
            </div>
          </div>
        </div>

        {/* Card 3: Productivity */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgb(139,92,246,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-violet-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-lg shadow-violet-500/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Target size={22} strokeWidth={2.5} />
            </div>
            <div className="bg-violet-50 border border-violet-100 text-violet-600 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Activity size={12} strokeWidth={3} /> Stable
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 mb-0.5">Productivity Score</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">88</h3>
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Anomaly */}
        <div className="bg-white rounded-[20px] p-5 border border-rose-100 shadow-[0_4px_20px_rgb(244,63,94,0.05)] hover:shadow-[0_10px_30px_rgb(244,63,94,0.12)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-rose-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute inset-0 border-2 border-rose-400/20 rounded-[20px] pointer-events-none animate-pulse"></div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/30 flex items-center justify-center text-white group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 relative">
              <div className="absolute inset-0 bg-white/20 rounded-[14px] animate-ping opacity-50"></div>
              <Sparkles size={22} strokeWidth={2.5} />
            </div>
            <div className="bg-rose-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md shadow-rose-500/20">
              <AlertTriangle size={12} strokeWidth={3} /> High Alert
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-bold text-rose-500 mb-0.5 flex items-center gap-1.5">Anomaly Flagged</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-rose-600 tracking-tight">3.2</h3>
              <span className="text-sm font-bold text-rose-400">/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights & Charts Row */}
      <div className="grid grid-cols-3 gap-6">

        {/* AI Insights Panel */}
        <div className="col-span-1 flex flex-col h-[380px] p-0 overflow-hidden relative bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
          <div className="p-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50 to-white relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 relative z-10">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600"><BrainCircuit size={16} /></div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">ML Anomaly Detection</span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4" style={{ scrollbarWidth: 'thin' }}>

            <div className="p-4 bg-gradient-to-r from-rose-50 to-white border border-rose-100/80 rounded-xl flex gap-3 items-start hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Satisfaction Anomaly Flagged</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Unsupervised anomaly model detected a statistically significant dip in employee satisfaction (z-score: -2.8).</p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-emerald-50 to-white border border-emerald-100/80 rounded-xl flex gap-3 items-start hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Engineering Velocity Peak</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Productivity score in Engineering is 92%, driven by recent Agile adoption and automation tools.</p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-100/80 rounded-xl flex gap-3 items-start hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Retention Stabilized</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Attrition risk has decreased by 1.2% globally following the new wellness initiatives launched in Q1.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Charts Container */}
        <div className="col-span-2 grid grid-cols-2 gap-6">
          <div className="flex flex-col h-[180px] p-6 bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-2xl group">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Department Performance
              </h3>
            </div>
            <div className="flex-1 w-full opacity-90 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockLargeDepartments.slice(0, 6)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                  <Bar dataKey="performanceScore" fill="url(#colorBar)" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  </Bar>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col h-[180px] p-6 bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-2xl group">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Workforce Growth
              </h3>
            </div>
            <div className="flex-1 w-full opacity-90 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockOrgHistory.slice(-12)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} domain={['dataMin - 20', 'dataMax + 20']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                  <Area type="monotone" dataKey="totalHeadcount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-2 flex flex-col h-[176px] p-6 relative overflow-hidden rounded-2xl shadow-2xl group" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid #334155' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-700 z-0 pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors duration-700 z-0 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)' }}></div>

            <div className="z-10 flex items-center justify-between h-full relative">
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-blue-400 animate-pulse" />
                  <h3 className="text-2xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Interactive Organization Modules
                  </h3>
                </div>
                <p className="text-slate-300 text-sm font-medium leading-relaxed">
                  Navigate through Workforce Intelligence, Team Builder, and Simulator modules to get deeper insights and manipulate organizational parameters.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <Link to="/workforce" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 text-center hover:scale-105 shadow-lg relative overflow-hidden group/btn flex items-center justify-center gap-2" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(71, 85, 105, 0.5)', backdropFilter: 'blur(8px)' }}>
                  Workforce Analytics <Activity size={16} className="text-slate-400 group-hover/btn:text-white transition-colors" />
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                </Link>
                <Link to="/simulator" className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 text-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:scale-105 relative overflow-hidden group/btn2 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', border: '1px solid rgba(96, 165, 250, 0.3)' }}>
                  Run Simulations <BrainCircuit size={16} className="text-blue-200 group-hover/btn2:text-white transition-colors" />
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn2:opacity-100 transition-opacity"></div>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Drill-down Modal */}
      <Modal
        isOpen={!!drillDownInfo?.isOpen}
        onClose={() => setDrillDownInfo(null)}
        title={`Drill-down: ${drillDownInfo?.title}`}
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-secondary bg-primary-light p-3 rounded-xl border border-primary/20">
            Viewing granular details for <span className="font-bold text-primary">{drillDownInfo?.title}</span>.
          </p>

          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            {mockDrillDownEmployees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] hover:border-primary/50 hover:bg-primary/5 transition-colors group bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold shadow-sm">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary">{emp.name}</h4>
                    <p className="text-xs text-secondary">{emp.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Link to="/employee-twin" className="px-3 py-1.5 text-xs font-bold bg-[var(--bg-main)] rounded-lg text-secondary hover:text-primary hover:bg-primary-light transition-colors border border-[var(--border-subtle)] shadow-sm flex items-center gap-1.5">
                    View Twin <ExternalLink size={12} />
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
