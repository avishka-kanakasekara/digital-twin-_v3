import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { Users, TrendingUp, Layers, Target, Activity, Minus, Plus, Equal, AlertCircle, ArrowUpRight, CheckCircle2, X } from 'lucide-react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import {
  mockHiringAttrition, mockDeptDistribution, DEPT_COLORS,
  mockExperience, EXP_COLORS, mockSkills, mockSkillShortages
} from '../../dummy/organization/workforcePlanningData';

export const WorkforcePlanning: React.FC = () => {
  const [scope, setScope] = useState('Engineering');
  const [horizon, setHorizon] = useState('Next 2 Quarters');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      triggerToast('Forecast updated successfully using ARIMA & historical models.');
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 relative pb-8 w-full">

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="absolute top-0 right-0 z-50 animate-fade-in" style={{ marginTop: '1rem', marginRight: '1rem' }}>
          <div className="glass px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div className="rounded-full bg-success flex items-center justify-center text-white shrink-0 shadow-md" style={{ width: '2rem', height: '2rem' }}>
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-success">Requisition Initialized</p>
              <p className="text-xs text-secondary font-medium mt-1">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-secondary hover:text-primary transition-colors p-1 rounded-md cursor-pointer" style={{ marginLeft: '1rem' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div 
        className="z-10 mb-2"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}
      >
        <div>
          <h1 className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">Workforce Planning & Skill Gaps</h1>
          <p className="text-base text-slate-500 font-medium mt-0.5">Forecast headcount and skill shortages based on attrition, retirement, and growth targets.</p>
        </div>

        <div 
          className="transition-all"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}
        >
          {/* Scope */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px', paddingRight: '8px' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Scope</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="text-sm font-bold bg-transparent cursor-pointer focus:outline-none"
              style={{ color: '#1e293b' }}
            >
              <option>Engineering</option>
              <option>Sales</option>
              <option>Marketing</option>
              <option>All Departments</option>
            </select>
          </div>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }}></div>
          
          {/* Horizon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', paddingRight: '8px' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Horizon</span>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="text-sm font-bold bg-transparent cursor-pointer focus:outline-none"
              style={{ color: '#1e293b' }}
            >
              <option>Next 2 Quarters</option>
              <option>Next Year</option>
              <option>Next 3 Years</option>
            </select>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="transition-all cursor-pointer hover:-translate-y-0.5"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '10px 20px', borderRadius: '12px', minWidth: '130px', border: 'none', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}
          >
            {isGenerating ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="animate-pulse">Generating...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={14} /> Run Forecast</span>
            )}
          </button>
        </div>
      </div>

      {/* Loading Overlay for ML Simulation */}
      <div className="transition-all duration-300 w-full" style={{ opacity: isGenerating ? 0.5 : 1, pointerEvents: isGenerating ? 'none' : 'auto', filter: isGenerating ? 'blur(2px)' : 'none' }}>

        {/* Headcount Loss Projection */}
        <Card className="glass p-6 mb-6 transition-all duration-300 hover:shadow-md">
          <h3 className="text-xs font-bold uppercase text-secondary tracking-wider mb-4">Headcount Loss Projection</h3>

          <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-main)]/50 p-4 rounded-xl border border-[var(--border-subtle)]">
            {/* Current Headcount */}
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary group" style={{ width: '9rem' }}>
              <Users className="text-primary mb-2 group-hover:scale-110 transition-transform" size={24} />
              <span className="text-3xl font-extrabold text-primary">40</span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider text-center mt-2">Current Headcount</span>
            </div>

            <Minus className="text-tertiary" size={20} />

            {/* Expected Attrition */}
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group" style={{ width: '9rem' }}>
              <div className="w-8 h-8 rounded-full bg-warning-light flex items-center justify-center text-warning mb-2 group-hover:scale-110 transition-transform">
                <span className="text-sm font-bold">-</span>
              </div>
              <span className="text-3xl font-extrabold text-warning">5</span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider text-center mt-2">Expected Attrition</span>
            </div>

            <Minus className="text-tertiary" size={20} />

            {/* Upcoming Retirements */}
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group" style={{ width: '9rem' }}>
              <div className="w-8 h-8 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-secondary mb-2 border border-[var(--border-subtle)] group-hover:scale-110 transition-transform">
                <span className="text-xs font-bold">R</span>
              </div>
              <span className="text-3xl font-extrabold text-primary">3</span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider text-center mt-2">Upcoming Retirements</span>
            </div>

            <Plus className="text-tertiary" size={20} />

            {/* Planned Growth */}
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group" style={{ width: '9rem' }}>
              <div className="w-8 h-8 rounded-full bg-success-light flex items-center justify-center text-success mb-2 group-hover:scale-110 transition-transform">
                <span className="text-sm font-bold">+</span>
              </div>
              <span className="text-3xl font-extrabold text-success">15</span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider text-center mt-2">Planned Growth</span>
            </div>

            <Equal className="text-tertiary" size={20} />

            {/* Net Shortage */}
            <div className="flex flex-col items-center justify-center bg-danger-light p-4 rounded-xl border border-danger/30 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative group" style={{ width: '10rem' }}>
              <div className="w-8 h-8 rounded-full bg-danger flex items-center justify-center text-white mb-2 shadow-sm animate-pulse">
                <AlertCircle size={16} />
              </div>
              <span className="text-3xl font-extrabold text-danger">-9</span>
              <span className="text-[10px] font-bold text-danger uppercase tracking-wider text-center mt-2">Net Shortage</span>
            </div>
          </div>
        </Card>

        {/* Main Grid: Skill Shortages & Analytics */}
        <div className="grid grid-cols-3 gap-6">

          {/* Left Column: Ranked Skill Shortages */}
          <div className="col-span-2 flex flex-col gap-6">
            <Card className="glass-panel p-6 flex flex-col gap-5 border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-4">
                <h3 className="text-lg font-extrabold text-primary flex items-center gap-3">
                  <div className="p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm text-primary"><Target size={20} /></div>
                  Ranked Skill Shortages
                </h3>
                <button onClick={() => triggerToast("All active skill gap reports exported to PDF.")} className="text-xs font-bold text-primary hover:text-primary-hover transition-colors cursor-pointer p-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] hover:shadow-sm">Export Report</button>
              </div>

              <div className="flex flex-col gap-3">
                {mockSkillShortages.map((item) => (
                  <div key={item.rank} className="p-4 bg-white rounded-xl border border-[var(--border-subtle)] hover:border-primary shadow-sm flex items-center justify-between transition-all hover:shadow-md group">
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-extrabold text-tertiary w-8 text-center">{item.rank}</span>
                      <div>
                        <h4 className="font-bold text-primary text-sm group-hover:text-primary transition-colors">{item.role}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-primary bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-1 rounded-md">Skill: {item.skill}</span>
                          <span className="text-[10px] font-bold text-secondary px-2 py-1 bg-white border border-[var(--border-subtle)] rounded-md">Dept: {item.dept}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider mb-2">Urgency</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md shadow-sm ${item.urgency === 'HIGH' ? 'bg-danger-light text-danger border border-danger/20' : 'bg-warning-light text-warning border border-warning/20'}`}>
                          {item.urgency}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider mb-1">Gap</span>
                        <span className="text-xl font-extrabold text-danger">{item.gap}</span>
                      </div>

                      <button
                        onClick={() => triggerToast(`Created recruitment requisition for ${item.role} (Dept: ${item.dept}). Post live in Workday.`)}
                        className="flex items-center gap-2 bg-danger hover:bg-danger text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer hover:-translate-y-1"
                        style={{ backgroundColor: 'var(--color-danger)' }}
                      >
                        Open Reqs <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Hiring vs Attrition Trends */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md h-[300px]">
              <div className="absolute top-0 right-0 bg-white/50 rounded-full blur-md -z-10" style={{ width: '8rem', height: '8rem' }}></div>
              <div className="flex justify-between items-center mb-6 z-10">
                <div>
                  <h3 className="text-lg font-extrabold text-primary flex items-center gap-2"><TrendingUp size={20} className="text-primary" /> Hiring vs Attrition Trends</h3>
                  <p className="text-xs text-secondary mt-1 font-medium">Net headcount growth over time.</p>
                </div>
                <div className="flex gap-4 text-xs font-bold text-secondary">
                  <span className="flex items-center gap-2 text-success"><div className="w-2 h-2 rounded-full bg-success"></div> Hired</span>
                  <span className="flex items-center gap-2 text-danger"><div className="w-2 h-2 rounded-full bg-danger"></div> Attrition</span>
                </div>
              </div>
              <div className="flex-1 w-full z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockHiringAttrition} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAttr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--bg-surface)' }} />
                    <Area type="monotone" dataKey="hired" stroke="var(--color-success)" strokeWidth={3} fillOpacity={1} fill="url(#colorHired)" />
                    <Area type="monotone" dataKey="attrition" stroke="var(--color-danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorAttr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Right Column: Workforce Distributions */}
          <div className="col-span-1 flex flex-col gap-6">

            {/* Department Distribution */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md" style={{ height: '350px' }}>
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2 mb-1"><Users size={20} className="text-primary" /> Department Distribution</h3>
              <p className="text-xs text-secondary mb-4 font-medium">Headcount spread across major divisions.</p>
              <div className="w-full relative" style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mockDeptDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="employees" stroke="none">
                      {mockDeptDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', backgroundColor: 'var(--bg-surface)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4 overflow-y-auto" style={{ maxHeight: '80px', scrollbarWidth: 'none' }}>
                {mockDeptDistribution.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border border-[var(--border-subtle)] shadow-sm">
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: DEPT_COLORS[i] }}></div>
                    <span className="text-[10px] font-bold text-primary">{d.name} ({d.employees})</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Experience Levels */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md" style={{ height: '350px' }}>
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2 mb-1"><Layers size={20} className="text-primary" /> Experience Levels</h3>
              <p className="text-xs text-secondary mb-4 font-medium">Tenure and seniority makeup.</p>
              <div className="w-full relative" style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mockExperience} cx="50%" cy="50%" innerRadius={0} outerRadius={75} dataKey="value" stroke="var(--bg-main)" strokeWidth={2}>
                      {mockExperience.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={EXP_COLORS[index % EXP_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', backgroundColor: 'var(--bg-surface)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                {mockExperience.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between p-2 bg-white rounded-lg border border-[var(--border-subtle)] shadow-sm hover:border-primary transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: EXP_COLORS[i] }}></div>
                      <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">{d.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-primary bg-[var(--bg-main)] px-2 py-1 rounded border border-[var(--border-subtle)]">{d.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Skill Distribution */}
            <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md bg-gradient-to-br" style={{ height: '350px' }}>
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2 mb-1"><Activity size={20} className="text-primary" /> Skill Distribution</h3>
              <p className="text-xs text-secondary mb-2 font-medium">Organizational competency radar.</p>
              <div className="w-full relative mt-2" style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="60%" data={mockSkills}>
                    <PolarGrid stroke="var(--border-subtle)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar name="Org Average" dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--bg-surface)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

      </div> {/* End of ML Simulation Overlay */}
    </div>
  );
};
