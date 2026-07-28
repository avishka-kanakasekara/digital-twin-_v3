import React, { useState } from 'react';
import { Card } from '../../components/Card';

import { Modal } from '../../components/Modal';
import { Users, Target, TrendingUp, ChevronDown, Activity, ExternalLink, Filter, HeartPulse, BrainCircuit, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
import { mockGrowthData, mockDeptPerformance, mockDrillDownEmployees } from '../../dummy/organization/dashboardData';

export const Dashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All Departments');
  const [drillDownInfo, setDrillDownInfo] = useState<{ isOpen: boolean; title: string; type: string } | null>(null);



  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-base text-slate-500 font-medium">Organization Digital Twin • High-level KPIs and intelligent insights.</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700 shadow-sm">
              <Activity size={14} className="animate-pulse" /> Live Aggregation
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Last Sync: Today, 02:00 AM</span>
          </div>
        </div>
        
        {/* Global Filters */}
        <div className="flex gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 px-3 border-r border-slate-200">
            <Filter size={16} className="text-slate-400" />
            <select className="text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-4">
              <option>Q2 2026</option>
              <option>Q1 2026</option>
              <option>FY 2025</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 border-r border-slate-200">
            <select 
              className="text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-4"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option>Global Org</option>
              <option>North America</option>
              <option>EMEA</option>
              <option>APAC</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3">
            <select className="text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-4">
              <option>All Divisions</option>
              <option>Product & Eng</option>
              <option>GTM</option>
            </select>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="flex flex-col gap-5 p-6 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-colors opacity-50"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Org Health Score</p>
              <h3 className="text-3xl font-bold text-slate-900">92<span className="text-lg text-slate-400 font-medium">/100</span></h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <HeartPulse size={24} strokeWidth={2} />
            </div>
          </div>
          <div className="text-sm text-emerald-700 flex items-center gap-1.5 font-medium z-10">
            <TrendingUp size={16} /> +4 pts this quarter
          </div>
        </Card>
        
        <Card className="flex flex-col gap-5 p-6 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors opacity-50"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Total Employees</p>
              <h3 className="text-3xl font-bold text-slate-900">1,248</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Users size={24} strokeWidth={2} />
            </div>
          </div>
          <div className="text-sm text-blue-700 flex items-center gap-1.5 font-medium z-10">
            <TrendingUp size={16} /> +2.4% vs last quarter
          </div>
        </Card>

        <Card className="flex flex-col gap-5 p-6 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-3xl group-hover:bg-sky-100 transition-colors opacity-50"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Productivity Score</p>
              <h3 className="text-3xl font-bold text-slate-900">88<span className="text-lg text-slate-400 font-medium">%</span></h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
              <Target size={24} strokeWidth={2} />
            </div>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1.5 font-medium z-10">
            <Activity size={16} /> Stable this month
          </div>
        </Card>

        <Card className="flex flex-col gap-5 p-6 bg-rose-50/50 border border-rose-200 hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100 rounded-full blur-3xl group-hover:bg-rose-200 transition-colors opacity-50"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-xs text-rose-600 font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5"><Sparkles size={12} className="animate-pulse"/> Anomaly Flagged</p>
              <h3 className="text-3xl font-bold text-rose-700">3.2<span className="text-lg text-rose-400 font-medium">/5</span></h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200 shadow-sm">
              <Sparkles size={24} strokeWidth={2} />
            </div>
          </div>
          <div className="text-sm text-rose-700 flex items-center gap-1.5 font-medium z-10 bg-white/50 w-fit px-3 py-1 rounded-lg border border-rose-200/50">
            <TrendingUp size={16} className="rotate-180" /> Sudden Dip Detected
          </div>
        </Card>
      </div>

      {/* AI Insights & Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* AI Insights Panel */}
        <Card className="col-span-1 flex flex-col h-[380px] p-0 overflow-hidden relative bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BrainCircuit size={16} className="text-slate-400"/> ML Anomaly Detection
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3" style={{ scrollbarWidth: 'thin' }}>
            
            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex gap-3 items-start hover:bg-rose-50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-ping"></div>
              <div>
                <h4 className="text-sm font-semibold text-rose-700">Satisfaction Anomaly Flagged</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Unsupervised anomaly model detected a statistically significant dip in employee satisfaction (z-score: -2.8).</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex gap-3 items-start hover:bg-emerald-50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
              <div>
                <h4 className="text-sm font-semibold text-emerald-700">Engineering Velocity Peak</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Productivity score in Engineering is 92%, driven by recent Agile adoption and automation tools.</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 items-start hover:bg-blue-50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
              <div>
                <h4 className="text-sm font-semibold text-blue-700">Retention Stabilized</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Attrition risk has decreased by 1.2% globally following the new wellness initiatives launched in Q1.</p>
              </div>
            </div>

          </div>
        </Card>

        {/* Charts Container */}
        <div className="col-span-2 grid grid-cols-2 gap-6">
          <Card className="flex flex-col h-[180px] p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Department Performance</h3>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockDeptPerformance} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="flex flex-col h-[180px] p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Workforce Growth</h3>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockGrowthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={['dataMin - 20', 'dataMax + 20']}/>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
                  <Area type="monotone" dataKey="headcount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <Card className="col-span-2 flex flex-col h-[176px] p-6 bg-slate-900 border border-slate-800 text-white relative overflow-hidden rounded-2xl shadow-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>
            
            <div className="z-10 flex items-center justify-between h-full">
              <div className="max-w-md">
                <h3 className="text-xl font-bold mb-2 text-white">Interactive Organization Modules</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Navigate through Workforce Intelligence, Team Builder, and Simulator modules to get deeper insights and manipulate organizational parameters.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link to="/workforce" className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold text-white transition-colors border border-slate-700 text-center">
                  Workforce Analytics
                </Link>
                <Link to="/simulator" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors border border-transparent text-center text-white shadow-sm">
                  Run Simulations
                </Link>
              </div>
            </div>
          </Card>

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
