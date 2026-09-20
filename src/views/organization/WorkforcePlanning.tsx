import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import {
  Users, TrendingUp, Layers, Target, Activity,
  ArrowUpRight, CheckCircle2, X, Sparkles, BrainCircuit,
  Calendar, UserCheck, Search, ShieldAlert, UserMinus, UserPlus, Award
} from 'lucide-react';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import {
  DEPT_COLORS,
  mockExperience, EXP_COLORS
} from '../../dummy/organization/workforcePlanningData';
import api from '../../lib/api';
import { TwinChatModal } from '../../components/TwinChatModal';

interface WorkforcePlanningProps {
  initialTab?: 'analytics' | 'radar';
}

export const WorkforcePlanning: React.FC<WorkforcePlanningProps> = ({ initialTab = 'analytics' }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'radar'>(initialTab);
  const [scope, setScope] = useState('Engineering');
  const [horizon, setHorizon] = useState('Next 2 Quarters');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hiringAttrition, setHiringAttrition] = useState<any[]>([]);
  const [deptDistribution, setDeptDistribution] = useState<any[]>([]);
  const [skillShortages, setSkillShortages] = useState<any[]>([]);

  // At-Risk Radar & Interventions State
  const [atRiskEmployees, setAtRiskEmployees] = useState<any[]>([]);
  const [interventionEffectiveness, setInterventionEffectiveness] = useState<any[]>([]);
  const [chattingEmployee, setChattingEmployee] = useState<{ name: string; role: string } | null>(null);
  const [riskSearchQuery, setRiskSearchQuery] = useState('');

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    api.organization.getHistory({ limit: 12 }).then((data: any[]) => {
      setHiringAttrition(data.slice(-12).map((d: any) => ({
        month: d.month,
        hired: d.new_hires,
        attrition: Math.round(d.total_headcount * d.voluntary_attrition_rate / 100),
      })));
    }).catch(console.error);

    api.departments.list().then((data: any[]) => {
      setDeptDistribution(data.map((d: any) => ({
        name: d.name,
        employees: d.headcount,
      })));
    }).catch(console.error);

    api.organization.getSkillShortages().then(data => {
      const rankedData = (data && data.length > 0 ? data : [
        { role: 'Senior Cloud Architect', skill: 'AWS / Kubernetes', dept: 'Engineering', urgency: 'HIGH', gap: '-6' },
        { role: 'Lead Data Scientist', skill: 'Machine Learning & PyTorch', dept: 'Data Science', urgency: 'HIGH', gap: '-5' },
        { role: 'Full-stack Engineer', skill: 'React / Node.js Architecture', dept: 'Engineering', urgency: 'HIGH', gap: '-4' },
        { role: 'DevSecOps Specialist', skill: 'Container Security & CI/CD', dept: 'Operations', urgency: 'MEDIUM', gap: '-3' },
        { role: 'Product Manager', skill: 'Agile & Growth Analytics', dept: 'Product', urgency: 'MEDIUM', gap: '-2' }
      ]).map((item, index) => ({
        ...item,
        rank: index + 1,
        role: item.role || item.core_skill || `${item.dept} Specialist`,
        skill: item.skill || item.core_skill || 'Core Competency',
        urgency: item.urgency || (item.risk_score && item.risk_score > 7 ? 'HIGH' : 'MEDIUM'),
        gap: item.gap || (item.shortfall_projection ? `-${item.shortfall_projection}` : '-3')
      }));
      setSkillShortages(rankedData);
    }).catch(console.error);

    // At-Risk & Intervention Data Fetching
    api.organization.getRiskProfiles().then(data => {
      setAtRiskEmployees(data.map((d: any) => ({
        name: d.employee_id,
        role: d.primary_factor,
        dept: 'At-Risk Employee',
        urgency: d.risk_level === 'Critical' ? 'High' : d.risk_level === 'High' ? 'Moderate' : 'Low',
        burnoutScore: `${Math.round(d.burnout_probability * 100)}%`,
        attritionRisk: Math.round(d.risk_score),
        perfCurrent: `${Math.round(d.career_stagnation_score * 100)}%`,
        aiSuggestion: d.ai_retention_suggestion,
        last1on1: d.last_1_on_1,
      })));
    }).catch(console.error);

    api.organization.getInterventionEffectiveness().then(data => {
      setInterventionEffectiveness(data);
    }).catch(console.error);
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      triggerToast('Forecast updated successfully using ARIMA & historical models.');
    }, 1500);
  };

  const filteredRiskEmployees = atRiskEmployees.filter(emp =>
    emp.name.toLowerCase().includes(riskSearchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(riskSearchQuery.toLowerCase())
  );

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
              <p className="text-sm font-bold text-emerald-800">Action Confirmed</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer ml-4">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="z-10 mb-2 flex flex-row items-center justify-between gap-4 flex-nowrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 tracking-wider uppercase border border-blue-200">
              ORGANIZATION TWIN (OT)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 tracking-wider uppercase border border-indigo-200 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" /> Real-time Risk & Workforce Intelligence
            </span>
          </div>
          <h1 className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">
            Workforce Intelligence (WI)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 max-w-xl truncate">
            Assesses capability requirements, skill scarcity, role criticality, and prioritized burnout/attrition risk interventions.
          </p>
        </div>

        {/* Controls */}
        <div
          className="transition-all shrink-0"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}
        >
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

      {/* Integrated Navigation Tabs Segment */}
      <div className="z-10 mb-3 flex items-center">
        <div 
          className="inline-flex items-center p-2 rounded-2xl border transition-all"
          style={{
            backgroundColor: '#f1f5f9',
            borderColor: '#cbd5e1',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
            gap: '8px'
          }}
        >
          {/* Tab 1: Capability & Skill Shortages */}
          <button
            onClick={() => setActiveTab('analytics')}
            className="px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2.5"
            style={{
              minHeight: '48px',
              backgroundColor: activeTab === 'analytics' ? '#1e293b' : 'transparent',
              color: activeTab === 'analytics' ? '#ffffff' : '#475569',
              boxShadow: activeTab === 'analytics' ? '0 4px 14px rgba(30, 41, 59, 0.25)' : 'none',
              border: activeTab === 'analytics' ? '1px solid #334155' : '1px solid transparent'
            }}
          >
            <Target size={18} style={{ color: activeTab === 'analytics' ? '#38bdf8' : '#64748b' }} />
            <span>Capability & Skill Shortages</span>
          </button>

          {/* Tab 2: At-Risk & Burnout Radar */}
          <button
            onClick={() => setActiveTab('radar')}
            className="px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2.5 relative"
            style={{
              minHeight: '48px',
              background: activeTab === 'radar' 
                ? 'linear-gradient(135deg, #e11d48 0%, #b45309 100%)' 
                : 'transparent',
              color: activeTab === 'radar' ? '#ffffff' : '#475569',
              boxShadow: activeTab === 'radar' ? '0 4px 14px rgba(225, 29, 72, 0.3)' : 'none',
              border: activeTab === 'radar' ? '1px solid #f43f5e' : '1px solid transparent'
            }}
          >
            <BrainCircuit size={18} style={{ color: activeTab === 'radar' ? '#ffffff' : '#64748b' }} />
            <span>At-Risk & Burnout Radar</span>
            {atRiskEmployees.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Container Content */}
      <div className="transition-all duration-300 w-full" style={{ opacity: isGenerating ? 0.5 : 1, pointerEvents: isGenerating ? 'none' : 'auto', filter: isGenerating ? 'blur(2px)' : 'none' }}>

        {/* TAB 1: CAPABILITY & SKILL SHORTAGES */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">

            {/* Headcount Trajectory & Net Gap Equation Strip */}
            <div 
              className="p-5 sm:p-6 rounded-3xl border transition-all shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                borderColor: '#cbd5e1',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Headcount Trajectory & Net Gap Pipeline</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Automated Gap Calculation: Baseline - Attrition - Retirements + Growth = Net Gap</p>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80 flex items-center gap-1.5 shadow-2xs">
                  <Sparkles size={12} className="text-amber-500" /> Real-time Simulation
                </span>
              </div>

              {/* Connected Math Equation Flow Strip */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 bg-slate-100/80 p-3 sm:p-4 rounded-2xl border border-slate-200/80 overflow-x-auto">

                {/* 1. Baseline Current Headcount */}
                <div className="flex items-center gap-3.5 bg-white px-4 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900 leading-tight">40</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baseline Staff</span>
                  </div>
                </div>

                {/* Operator 1: - */}
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs border border-slate-300">
                  -
                </div>

                {/* 2. Expected Attrition */}
                <div className="flex items-center gap-3.5 bg-white px-4 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                    <UserMinus size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-amber-600 leading-tight">5</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attrition</span>
                  </div>
                </div>

                {/* Operator 2: - */}
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs border border-slate-300">
                  -
                </div>

                {/* 3. Retirements */}
                <div className="flex items-center gap-3.5 bg-white px-4 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                    <Award size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-purple-700 leading-tight">3</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retirements</span>
                  </div>
                </div>

                {/* Operator 3: + */}
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs border border-emerald-300">
                  +
                </div>

                {/* 4. Planned Growth */}
                <div className="flex items-center gap-3.5 bg-white px-4 py-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 transition-all flex-1 min-w-[145px] min-h-[64px]">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                    <UserPlus size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-emerald-600 leading-tight">15</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Growth Demand</span>
                  </div>
                </div>

                {/* Equal Operator: = */}
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md border border-slate-800">
                  =
                </div>

                {/* 5. Net Shortage Output Highlight */}
                <div 
                  className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all flex-1 min-w-[160px] min-h-[64px]"
                  style={{
                    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                    border: '1.5px solid #f43f5e',
                    boxShadow: '0 6px 16px rgba(225, 29, 72, 0.2)'
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                    <ShieldAlert size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-rose-600 leading-tight">-9</span>
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">NET SHORTAGE</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-6">

              {/* Left Column: Ranked Skill Shortages & Trends */}
              <div className="col-span-2 flex flex-col gap-6">
                <Card className="glass-panel p-6 flex flex-col gap-5 border border-slate-200/80 transition-all duration-300 hover:shadow-md">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-2xs"><Target size={20} /></div>
                      Ranked Skill Shortages
                    </h3>
                    <button onClick={() => triggerToast("All active skill gap reports exported to PDF.")} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                      Export Report
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {skillShortages.map((item) => (
                      <div key={item.rank} className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 hover:border-blue-400 shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md group">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center font-black text-blue-700 text-sm shadow-2xs group-hover:scale-105 transition-transform">
                            {item.rank}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{item.role}</h4>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg shadow-2xs">Skill: {item.skill}</span>
                              <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">Dept: {item.dept}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Urgency</span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-2xs border ${item.urgency === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {item.urgency}
                            </span>
                          </div>

                          <div className="flex flex-col items-center min-w-[40px]">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Gap</span>
                            <span className="text-xl font-black text-rose-600">{item.gap}</span>
                          </div>

                          <button
                            onClick={() => triggerToast(`Created recruitment requisition for ${item.role} (Dept: ${item.dept}). Post live in Workday.`)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
                          >
                            Open Reqs <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Hiring vs Attrition Trends */}
                <Card className="glass-panel flex flex-col p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md h-[300px] border border-slate-200/80">
                  <div className="flex justify-between items-center mb-4 z-10">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><TrendingUp size={20} className="text-blue-600" /> Hiring vs Attrition Trends</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Net headcount growth over time.</p>
                    </div>
                    <div className="flex gap-4 text-xs font-bold text-slate-600">
                      <span className="flex items-center gap-2 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Hired</span>
                      <span className="flex items-center gap-2 text-rose-600"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Attrition</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hiringAttrition} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorAttr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', backgroundColor: '#ffffff' }} />
                        <Area type="monotone" dataKey="hired" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHired)" />
                        <Area type="monotone" dataKey="attrition" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorAttr)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Right Column: Workforce Distributions */}
              <div className="col-span-1 flex flex-col gap-6">

                {/* Department Distribution */}
                <Card className="glass-panel flex flex-col p-6 relative transition-all duration-300 hover:shadow-md border border-slate-200/80" style={{ minHeight: '390px' }}>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-1"><Users size={20} className="text-blue-600" /> Department Distribution</h3>
                  <p className="text-xs text-slate-500 mb-3 font-medium">Headcount spread across major divisions.</p>
                  <div className="w-full relative flex justify-center items-center" style={{ height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="employees" stroke="#ffffff" strokeWidth={2}>
                          {deptDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-3 overflow-y-auto no-scrollbar" style={{ maxHeight: '90px', scrollbarWidth: 'none' }}>
                    {deptDistribution.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: DEPT_COLORS[i] }}></div>
                        <span className="text-[10.5px] font-bold text-slate-800">{d.name} ({d.employees})</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Experience Levels */}
                <Card className="glass-panel flex flex-col p-6 relative transition-all duration-300 hover:shadow-md border border-slate-200/80" style={{ minHeight: '390px' }}>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-1"><Layers size={20} className="text-blue-600" /> Experience Levels</h3>
                  <p className="text-xs text-slate-500 mb-3 font-medium">Tenure and seniority makeup.</p>
                  <div className="w-full relative flex justify-center items-center" style={{ height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie data={mockExperience} cx="50%" cy="50%" innerRadius={35} outerRadius={68} dataKey="value" stroke="#ffffff" strokeWidth={2.5}>
                          {mockExperience.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={EXP_COLORS[index % EXP_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 mt-3">
                    {mockExperience.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shadow-2xs group-hover:scale-110 transition-transform" style={{ backgroundColor: EXP_COLORS[i] }}></div>
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{d.name}</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: AT-RISK & BURNOUT RADAR */}
        {activeTab === 'radar' && (
          <div className="grid grid-cols-3 gap-6">

            {/* Left Column: Intervention Effectiveness (Uplift ML Insights) */}
            <div className="col-span-1 flex flex-col gap-6">
              <Card className="p-6 flex flex-col gap-5 glass border border-slate-200/80 rounded-3xl shadow-xs relative overflow-hidden">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                    <BrainCircuit size={18} className="text-rose-600" /> Intervention Effectiveness
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Uplift ML Insights</p>
                </div>

                <div className="flex flex-col gap-4">
                  {interventionEffectiveness.map((item, index) => (
                    <div key={index} className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default relative overflow-hidden group">
                      <div className="absolute right-0 top-0 w-1.5 h-full bg-rose-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-widest">{item.role_group}</span>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-extrabold text-slate-900">{item.intervention_name}</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs">
                          -{item.risk_reduction_percentage}% Risk
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-2">{item.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column: Urgent Interventions Queue */}
            <div className="col-span-2 flex flex-col gap-6">
              <Card className="p-6 flex flex-col gap-5 glass-panel bg-white/60 border border-slate-200/80 rounded-3xl shadow-xs relative overflow-hidden">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                      <Activity size={18} className="text-rose-600" /> Urgent Interventions Queue
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Prioritized by Urgency (Risk × Impact)</p>
                  </div>

                  {/* Search Bar inside Queue */}
                  <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200 w-64">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={riskSearchQuery}
                      onChange={(e) => setRiskSearchQuery(e.target.value)}
                      placeholder="Filter at-risk employees..."
                      className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none w-full"
                    />
                    {riskSearchQuery && (
                      <button onClick={() => setRiskSearchQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {filteredRiskEmployees.map((emp) => (
                    <div key={emp.name} className="relative flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-300 hover:shadow-md transition-all duration-200 group">
                      
                      {/* Floating edge indicator */}
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1.5 rounded-r-md ${emp.urgency === 'High' ? 'bg-amber-500' : emp.urgency === 'Moderate' ? 'bg-blue-500' : 'bg-rose-600'}`}></div>

                      {/* 1. Avatar & Info */}
                      <div className="flex items-center gap-3.5 w-[200px] shrink-0 pl-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-extrabold shadow-2xs ${emp.urgency === 'High' ? 'bg-amber-500' : emp.urgency === 'Moderate' ? 'bg-blue-500' : 'bg-rose-600'}`}>
                          {emp.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="flex flex-col truncate">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">{emp.name}</h4>
                          <p className="text-[11px] font-medium text-slate-400 truncate">{emp.role}</p>
                        </div>
                      </div>

                      {/* 2. Metrics */}
                      <div className="flex flex-1 items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Activity size={11} className="text-blue-500" /> Burnout
                          </span>
                          <span className="text-sm font-black text-slate-900">{emp.burnoutScore}</span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Calendar size={11} className="text-rose-500" /> Attrition
                          </span>
                          <span className="text-sm font-black text-rose-600">{emp.attritionRisk}%</span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Target size={11} className="text-emerald-500" /> Performance
                          </span>
                          <span className="text-sm font-black text-slate-900">{emp.perfCurrent}</span>
                        </div>
                      </div>

                      {/* 3. Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => triggerToast(`Scheduled 1:1 check-in with ${emp.name}.`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Schedule 1:1"
                        >
                          <Calendar size={16} />
                        </button>
                        <button 
                          onClick={() => triggerToast(`Logged direct reach out to ${emp.name}.`)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Reach Out"
                        >
                          <UserCheck size={16} />
                        </button>
                        
                        {/* Primary AI Action */}
                        <button 
                          onClick={() => setChattingEmployee({ name: emp.name, role: emp.role })}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
                        >
                          <BrainCircuit size={14} /> AI Insight
                        </button>
                      </div>

                    </div>
                  ))}

                  {filteredRiskEmployees.length === 0 && (
                    <div className="text-center py-10 text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      No at-risk employee matches your filter.
                    </div>
                  )}
                </div>
              </Card>
            </div>

          </div>
        )}

      </div>

      {/* Twin Chat Modal for AI Retention Insights */}
      {chattingEmployee && (
        <TwinChatModal 
          isOpen={true} 
          onClose={() => setChattingEmployee(null)} 
          employeeName={chattingEmployee.name} 
          employeeRole={chattingEmployee.role} 
        />
      )}

    </div>
  );
};
