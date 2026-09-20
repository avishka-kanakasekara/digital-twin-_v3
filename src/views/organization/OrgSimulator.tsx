import React, { useState } from 'react';
import { Sliders, RefreshCw, Activity, Target, Zap, UserMinus, Network, DollarSign, GitCompare, BrainCircuit, ChevronRight, Users, Building2, Briefcase, Lightbulb, Bot, Layers, ShieldAlert, ArrowRightLeft, Cpu, Grid } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { useOrganizationScenarios } from '../../hooks/useOrganization';
import api from '../../lib/api';

export const OrgSimulator: React.FC = () => {
  const [headcountChange, setHeadcountChange] = useState(0);
  const [salaryChange, setSalaryChange] = useState(0);
  const [remoteDays, setRemoteDays] = useState(2);
  const [trainingBudget, setTrainingBudget] = useState(0);
  const [restructuringLevel, setRestructuringLevel] = useState(0);
  const [automationLevel, setAutomationLevel] = useState(0);
  const [businessLineModel, setBusinessLineModel] = useState('Standard Core');
  
  const [selectedScenario, setSelectedScenario] = useState<any | null>(null);
  const [simulationData, setSimulationData] = useState<any[] | null>(null);
  const [snapshotData, setSnapshotData] = useState<any[] | null>(null);
  
  const [redundancyData, setRedundancyData] = useState<any | null>(null);
  const [roleShiftsData, setRoleShiftsData] = useState<any[] | null>(null);
  const [impactMatrixData, setImpactMatrixData] = useState<any[] | null>(null);

  const [activeTab, setActiveTab] = useState<'charts' | 'redundancy' | 'roleShifts' | 'impactMatrix'>('charts');
  const [isSimulating, setIsSimulating] = useState(false);

  const { scenarios } = useOrganizationScenarios();
  const simData = scenarios || [];

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await api.organization.runSimulation({
        headcountChange,
        salaryChange,
        remoteDays,
        trainingBudget,
        restructuringLevel,
        automationLevel,
        businessLineModel,
        isSnapshot: false
      });

      if (response && response.monthly_series) {
        setSimulationData(response.monthly_series);
        setRedundancyData(response.redundancy_forecast || null);
        setRoleShiftsData(response.critical_role_shifts || null);
        setImpactMatrixData(response.impact_matrix || null);
      } else if (Array.isArray(response)) {
        setSimulationData(response);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyScenario = async (scenario: any) => {
    setSelectedScenario(scenario);
    const name = scenario.scenarioName.toLowerCase();

    let hc = 0, sc = 0, rd = 2, tb = 0, rl = 0, auto = 0, model = 'Standard Core';

    if (name.includes('headcount')) hc = name.includes('reduce') ? -5 : 5;
    if (name.includes('salary')) sc = 5;
    if (name.includes('4-day')) rd = 4;
    if (name.includes('office')) rd = 1;
    if (name.includes('r&d') || name.includes('training')) tb = 25;
    if (name.includes('outsource') || name.includes('hub')) { rl = 7; auto = 40; model = 'Global Offshore Hub'; }
    if (name.includes('automation') || name.includes('ai')) { auto = 60; tb = 30; model = 'AI-Driven Digital Services'; }

    setHeadcountChange(hc);
    setSalaryChange(sc);
    setRemoteDays(rd);
    setTrainingBudget(tb);
    setRestructuringLevel(rl);
    setAutomationLevel(auto);
    setBusinessLineModel(model);

    setIsSimulating(true);
    try {
      const response = await api.organization.runSimulation({
        headcountChange: hc,
        salaryChange: sc,
        remoteDays: rd,
        trainingBudget: tb,
        restructuringLevel: rl,
        automationLevel: auto,
        businessLineModel: model,
        isSnapshot: false
      });

      if (response && response.monthly_series) {
        setSimulationData(response.monthly_series);
        setRedundancyData(response.redundancy_forecast || null);
        setRoleShiftsData(response.critical_role_shifts || null);
        setImpactMatrixData(response.impact_matrix || null);
      } else if (Array.isArray(response)) {
        setSimulationData(response);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSnapshot = async () => {
    if (!simulationData) return;
    try {
      const response = await api.organization.runSimulation({
        headcountChange,
        salaryChange,
        remoteDays,
        trainingBudget,
        restructuringLevel,
        automationLevel,
        businessLineModel,
        isSnapshot: true
      });
      const snap = response.monthly_series || response;
      setSnapshotData(snap);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setHeadcountChange(0);
    setSalaryChange(0);
    setRemoteDays(2);
    setTrainingBudget(0);
    setRestructuringLevel(0);
    setAutomationLevel(0);
    setBusinessLineModel('Standard Core');
    setSimulationData(null);
    setSnapshotData(null);
    setRedundancyData(null);
    setRoleShiftsData(null);
    setImpactMatrixData(null);
    setSelectedScenario(null);
    setActiveTab('charts');
  };

  const mergedData = simulationData ? simulationData.map((d, i) => {
    return { ...d, ...(snapshotData ? snapshotData[i] : {}) };
  }) : null;

  const scenarioLibrary = simData.slice(0, 8);

  const renderImpactScoreBadge = (score: number) => {
    if (score >= 4) return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">High Positive (+{score})</span>;
    if (score > 0) return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Moderate (+{score})</span>;
    if (score === 0) return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">Neutral (0)</span>;
    if (score > -4) return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">Moderate ({score})</span>;
    return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">High Negative ({score})</span>;
  };

  return (
    <div className="flex flex-col gap-8 pb-12 relative">
      {/* Background Decorative Blur */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: -10 }}>
        <div className="absolute rounded-full" style={{ top: '-10rem', left: '-5rem', width: '30rem', height: '30rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', filter: 'blur(100px)' }}></div>
        <div className="absolute rounded-full" style={{ top: '20rem', right: '-10rem', width: '25rem', height: '25rem', backgroundColor: 'rgba(167, 139, 250, 0.15)', filter: 'blur(80px)' }}></div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Scenario Simulator</h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 shadow-sm">
              <Cpu size={14} /> Organizational Twin (OT) Engine
            </span>
          </div>
          <p className="text-base font-bold text-slate-600 bg-white/60 px-4 py-2 rounded-xl shadow-sm border border-white backdrop-blur-md inline-flex items-center mt-2">
            <Activity size={16} className="text-blue-600 mr-2" />
            Simulate structural changes, automation plans, redundancy forecasts, & critical role shifts.
          </p>
        </div>
      </div>

      <div className="flex gap-6 items-start relative z-10">

        {/* Left Panel: Scenario Templates */}
        <div className="shrink-0 flex flex-col w-72 bg-white/40 border border-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200/60 shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 bg-gradient-to-br from-amber-500 to-amber-600">
              <Lightbulb size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight text-slate-900">Structural Templates</h3>
              <p className="text-xs font-bold mt-0.5 text-slate-500">Stored change assets</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4">
            {scenarioLibrary.map((scen: any) => (
              <div
                key={scen.id}
                onClick={() => handleApplyScenario(scen)}
                className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-md relative overflow-hidden group ${selectedScenario?.id === scen.id ? 'border-blue-400/80 shadow-[0_8px_20px_rgba(59,130,246,0.15)] scale-[1.02] bg-blue-50/70' : 'border-white/60 hover:border-blue-300/60 hover:shadow-lg bg-white/40 hover:bg-white/60'}`}
              >
                <p className={`text-xs font-extrabold mb-2 transition-colors ${selectedScenario?.id === scen.id ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'}`}>
                  {scen.scenarioName.split(':')[1] || scen.scenarioName}
                </p>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-500">Confidence: <span className="text-emerald-600 font-black">{scen.confidenceLevel}%</span></span>
                  <span className={`px-2 py-0.5 rounded-md font-black shadow-sm ${scen.predictedImpactPercentage > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    Impact: {scen.predictedImpactPercentage > 0 ? '+' : ''}{scen.predictedImpactPercentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel: Primary Controls / Inputs */}
        <div className="shrink-0 flex flex-col w-80 bg-white/40 border border-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-6 border-b border-slate-200/60 shrink-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sliders size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-extrabold leading-tight text-slate-900">Primary Inputs</h3>
              <p className="text-xs font-bold mt-1 uppercase tracking-wider text-indigo-500">Simulation Parameters</p>
            </div>
          </div>

          <div className="flex flex-col flex-1 p-2 overflow-y-auto max-h-[640px]">

            {/* Automation Plan Input */}
            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0 bg-indigo-50/50 border border-indigo-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                    <Bot size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Automation Plan</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm bg-indigo-100 text-indigo-800 border-indigo-200">{automationLevel}%</span>
              </div>
              <input type="range" min="0" max="80" step="5" value={automationLevel} onChange={(e) => setAutomationLevel(Number(e.target.value))} className="w-full cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all" />
            </div>

            {/* New Business Line Model Input */}
            <div className="flex flex-col gap-3 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0 bg-purple-50/50 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)' }}>
                  <Layers size={16} strokeWidth={2.5} />
                </div>
                <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Business Line Model</label>
              </div>
              <select
                value={businessLineModel}
                onChange={(e) => setBusinessLineModel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
              >
                <option value="Standard Core">Standard Core Operations</option>
                <option value="AI-Driven Digital Services">AI-Driven Digital Services (+18% Rev)</option>
                <option value="Enterprise SaaS Subscriptions">Enterprise SaaS Subscriptions (+25% Rev)</option>
                <option value="Global Offshore Hub">Global Offshore Hub (+10% Cap)</option>
              </select>
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0 bg-white/60 border border-white/80">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <Users size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Hiring / Layoffs</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: headcountChange > 0 ? '#ecfdf5' : headcountChange < 0 ? '#fff1f2' : '#f8fafc', color: headcountChange > 0 ? '#059669' : headcountChange < 0 ? '#e11d48' : '#64748b', borderColor: headcountChange > 0 ? '#a7f3d0' : headcountChange < 0 ? '#fecdd3' : '#e2e8f0' }}>{headcountChange > 0 ? '+' : ''}{headcountChange}%</span>
              </div>
              <input type="range" min="-20" max="20" step="1" value={headcountChange} onChange={(e) => setHeadcountChange(Number(e.target.value))} className="w-full cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all" />
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0 bg-white/60 border border-white/80">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <Building2 size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Org Restructuring</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>{restructuringLevel}/10</span>
              </div>
              <input type="range" min="0" max="10" step="1" value={restructuringLevel} onChange={(e) => setRestructuringLevel(Number(e.target.value))} className="w-full cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all" />
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0 bg-white/60 border border-white/80">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                    <DollarSign size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Salary Adjustment</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: salaryChange > 0 ? '#ecfdf5' : salaryChange < 0 ? '#fff1f2' : '#f8fafc', color: salaryChange > 0 ? '#059669' : salaryChange < 0 ? '#e11d48' : '#64748b', borderColor: salaryChange > 0 ? '#a7f3d0' : salaryChange < 0 ? '#fecdd3' : '#e2e8f0' }}>{salaryChange > 0 ? '+' : ''}{salaryChange}%</span>
              </div>
              <input type="range" min="-10" max="20" step="1" value={salaryChange} onChange={(e) => setSalaryChange(Number(e.target.value))} className="w-full cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all" />
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0 bg-white/60 border border-white/80">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
                    <Briefcase size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Remote Work</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}>{remoteDays} / 5</span>
              </div>
              <input type="range" min="0" max="5" step="1" value={remoteDays} onChange={(e) => setRemoteDays(Number(e.target.value))} className="w-full cursor-pointer accent-violet-500 hover:accent-violet-400 transition-all" />
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md shrink-0 bg-white/60 border border-white/80">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}>
                    <Target size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Training Budget</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: trainingBudget > 0 ? '#fff1f2' : '#f8fafc', color: trainingBudget > 0 ? '#e11d48' : '#64748b', borderColor: trainingBudget > 0 ? '#fecdd3' : '#e2e8f0' }}>{trainingBudget > 0 ? '+' : ''}{trainingBudget}%</span>
              </div>
              <input type="range" min="0" max="50" step="5" value={trainingBudget} onChange={(e) => setTrainingBudget(Number(e.target.value))} className="w-full cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all" />
            </div>

          </div>

          <div className="px-6 pt-4 pb-6 flex flex-col gap-3 relative z-10 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
            {simulationData && !snapshotData && (
              <button className="w-full text-xs font-extrabold rounded-full flex justify-center items-center gap-2 border shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0 h-10 bg-white border-blue-200 text-blue-600" onClick={handleSnapshot}>
                <GitCompare size={16} /> Save for Comparison
              </button>
            )}
            <div className="flex gap-3 items-center shrink-0">
              <button className="flex-1 text-sm shadow-xl font-extrabold rounded-full flex justify-center items-center text-white transition-all hover:-translate-y-1 hover:shadow-2xl border-none cursor-pointer whitespace-nowrap shrink-0 h-12 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleRunSimulation} disabled={isSimulating}>
                {isSimulating ? <div className="animate-spin mr-2 w-4 h-4 border-2 border-white/40 border-t-white rounded-full"></div> : <Zap size={18} className="mr-2" />}
                {snapshotData ? 'Run Scenario B' : 'Run Simulation'}
              </button>
              <button onClick={handleReset} className="w-12 h-12 rounded-full shadow-md border-none flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer bg-white text-rose-500">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Primary Outputs & Stored Assets */}
        <div className="flex-1 min-w-0 flex flex-col h-full gap-6">

          {!mergedData && !isSimulating && (
            <div className="flex flex-col items-center justify-center flex-1 text-center relative overflow-hidden bg-white/40 border border-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] min-h-[600px]">
              <div className="absolute top-[10%] right-[10%] w-80 h-80 bg-blue-500/10 rounded-full blur-[60px]"></div>
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-xl relative z-10 bg-gradient-to-br from-blue-50 to-indigo-50 border border-white">
                <BrainCircuit size={48} className="text-indigo-600" />
              </div>
              <h3 className="font-black text-3xl mb-4 relative z-10 text-slate-900">OT Scenario Simulator Engine</h3>
              <p className="text-base font-bold max-w-lg leading-relaxed relative z-10 text-slate-500">
                Configure your automation plans, restructuring levels, and business line models on the left, then click <strong>Run Simulation</strong> to compute simulated org states, critical role shifts, and redundancy forecasts.
              </p>
            </div>
          )}

          {isSimulating && (
            <div className="flex flex-col items-center justify-center flex-1 text-center relative overflow-hidden bg-white/60 border border-blue-200/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] min-h-[600px]">
              <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-indigo-500/15 rounded-full blur-[60px]"></div>
              <div className="w-20 h-20 border-4 border-t-indigo-600 border-indigo-200/20 rounded-full animate-spin mb-8 shadow-lg relative z-10"></div>
              <h3 className="text-2xl font-black mb-3 relative z-10 text-slate-900">Propagating Causal System Dynamics...</h3>
              <p className="animate-pulse font-extrabold text-base relative z-10 text-indigo-500">Evaluating automation displacement, critical role shifts, and financial trajectory.</p>
            </div>
          )}

          {mergedData && !isSimulating && (
            <>
              {/* Output Tab Switcher */}
              <div className="flex items-center justify-between bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-white/90 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('charts')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'charts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Activity size={15} /> Simulated Org States
                  </button>
                  <button
                    onClick={() => setActiveTab('redundancy')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'redundancy' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <ShieldAlert size={15} /> Redundancy Forecast
                  </button>
                  <button
                    onClick={() => setActiveTab('roleShifts')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'roleShifts' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <ArrowRightLeft size={15} /> Critical Role Shifts
                  </button>
                  <button
                    onClick={() => setActiveTab('impactMatrix')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'impactMatrix' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Grid size={15} /> Impact Matrices Asset
                  </button>
                </div>
                <span className="text-xs font-extrabold text-slate-400 px-3">Primary Outputs & Graphs</span>
              </div>

              {/* Sensitivity Banner */}
              <div className="grid grid-cols-12 gap-6 shrink-0">
                <div className={`p-6 flex items-start gap-6 transition-all bg-white/70 border border-white/90 backdrop-blur-xl rounded-3xl shadow-xl ${snapshotData ? 'col-span-8' : 'col-span-12'}`}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white bg-gradient-to-br from-indigo-500 to-purple-500">
                    <Network size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide mb-2 text-slate-900">
                      {selectedScenario ? `Scenario Analysis: ${selectedScenario.scenarioName.split(':')[1] || selectedScenario.scenarioName}` : `Strategy Model: ${businessLineModel}`}
                    </h4>
                    <p className="text-sm leading-relaxed font-bold text-slate-600">
                      System dynamics show high sensitivity to <strong className="font-black px-2 py-1 rounded-lg text-slate-900 bg-slate-100">{automationLevel > 0 ? 'Automation Level' : selectedScenario ? selectedScenario.targetMetric : 'Headcount'}</strong>.
                      {selectedScenario && <span className="ml-2 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">Predicted ROI: {selectedScenario.predictedROI}%</span>}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs font-black p-3 rounded-2xl border border-slate-200 bg-white/80 text-slate-500 w-fit">
                      <span className="text-indigo-600">Automation ({automationLevel}%)</span> <ChevronRight size={16} />
                      <span className="text-emerald-600">Delivery Cap ↑</span> <ChevronRight size={16} />
                      <span className="text-amber-600">Role Transition</span> <ChevronRight size={16} />
                      <span className="text-purple-600">Revenue Growth</span>
                    </div>
                  </div>
                </div>

                {snapshotData && (
                  <div className="col-span-4 p-6 shadow-xl flex items-start gap-5 transition-all bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200 backdrop-blur-xl rounded-3xl">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                      <GitCompare size={24} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide mb-1 text-blue-900">Compare Mode Active</h4>
                      <p className="text-xs leading-relaxed font-bold text-blue-700">
                        Solid lines: <strong className="font-black text-blue-900">Scenario B (Current)</strong>.<br />
                        Dashed lines: <strong className="font-black text-blue-900">Scenario A (Snapshot)</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* TAB 1: SIMULATED ORG STATES (CHARTS) */}
              {activeTab === 'charts' && (
                <div className="grid grid-cols-2 gap-8 pb-4">
                  <div className="flex flex-col h-[340px] p-8 transition-all duration-500 bg-white/50 border border-white/80 backdrop-blur-2xl rounded-[32px] shadow-xl hover:-translate-y-1 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-4 text-slate-900">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600"><Target size={18} className="text-white" /></div>
                        Productivity & Health
                      </h3>
                    </div>
                    <div className="flex-1 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dx={-10} domain={['dataMin - 5', 'dataMax + 5']} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 800, paddingTop: '15px' }} />
                          {snapshotData && <Line type="monotone" dataKey="A_productivity" name="Productivity (A)" stroke="#3b82f6" strokeWidth={3} strokeDasharray="6 6" dot={false} opacity={0.4} />}
                          <Line type="monotone" dataKey="productivity" name="Productivity" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} />
                          {snapshotData && <Line type="monotone" dataKey="A_orgHealth" name="Org Health (A)" stroke="#10b981" strokeWidth={3} strokeDasharray="6 6" dot={false} opacity={0.4} />}
                          <Line type="monotone" dataKey="orgHealth" name="Org Health" stroke="#10b981" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="flex flex-col h-[340px] p-8 transition-all duration-500 bg-white/50 border border-white/80 backdrop-blur-2xl rounded-[32px] shadow-xl hover:-translate-y-1 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-4 text-slate-900">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600"><DollarSign size={18} className="text-white" /></div>
                        Revenue & Customer Sat
                      </h3>
                    </div>
                    <div className="flex-1 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dx={-10} domain={['dataMin - 2', 'dataMax + 2']} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 800, paddingTop: '15px' }} />
                          {snapshotData && <Line type="monotone" dataKey="A_revenue" name="Revenue $M (A)" stroke="#8B5CF6" strokeWidth={3} strokeDasharray="6 6" dot={false} opacity={0.4} />}
                          <Line type="monotone" dataKey="revenue" name="Revenue $M" stroke="#8B5CF6" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} />
                          {snapshotData && <Line type="monotone" dataKey="A_csat" name="CSAT Score (A)" stroke="#F59E0B" strokeWidth={3} strokeDasharray="6 6" dot={false} opacity={0.4} />}
                          <Line type="monotone" dataKey="csat" name="CSAT Score" stroke="#F59E0B" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="flex flex-col h-[300px] p-8 transition-all duration-500 bg-white/50 border border-white/80 backdrop-blur-2xl rounded-[32px] shadow-xl hover:-translate-y-1 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-4 text-slate-900">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0 bg-gradient-to-br from-rose-500 to-rose-600"><UserMinus size={18} className="text-white" /></div>
                        Attrition Risk
                      </h3>
                    </div>
                    <div className="flex-1 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAttrition" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dx={-10} domain={[0, 40]} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 800, paddingTop: '15px' }} />
                          {snapshotData && <Area type="monotone" dataKey="A_attrition" name="Attrition % (A)" stroke="#f43f5e" strokeWidth={3} strokeDasharray="6 6" fill="transparent" opacity={0.4} />}
                          <Area type="monotone" dataKey="attrition" name="Attrition Risk %" stroke="#f43f5e" strokeWidth={4} fill="url(#colorAttrition)" activeDot={{ r: 8 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="flex flex-col h-[300px] p-8 transition-all duration-500 bg-white/50 border border-white/80 backdrop-blur-2xl rounded-[32px] shadow-xl hover:-translate-y-1 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-4 text-slate-900">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0 bg-gradient-to-br from-sky-500 to-sky-600"><Activity size={18} className="text-white" /></div>
                        Delivery Capacity
                      </h3>
                    </div>
                    <div className="flex-1 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dx={-10} domain={['dataMin - 10', 'dataMax + 10']} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 800, paddingTop: '15px' }} />
                          {snapshotData && <Area type="monotone" dataKey="A_capacity" name="Capacity (A)" stroke="#0ea5e9" strokeWidth={3} strokeDasharray="6 6" fill="transparent" opacity={0.4} />}
                          <Area type="monotone" dataKey="capacity" name="Capacity Index" stroke="#0ea5e9" strokeWidth={4} fill="url(#colorCap)" activeDot={{ r: 8 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REDUNDANCY FORECAST */}
              {activeTab === 'redundancy' && redundancyData && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-4 gap-6">
                    <div className="p-6 bg-white/70 border border-white/90 backdrop-blur-xl rounded-3xl shadow-lg flex flex-col gap-2">
                      <span className="text-xs font-black uppercase text-slate-500">Potential Redundancies</span>
                      <span className="text-3xl font-black text-rose-600">{redundancyData.potential_redundant_roles} Roles</span>
                      <span className="text-xs font-bold text-slate-500">Due to automation ({automationLevel}%) & restructures</span>
                    </div>

                    <div className="p-6 bg-white/70 border border-white/90 backdrop-blur-xl rounded-3xl shadow-lg flex flex-col gap-2">
                      <span className="text-xs font-black uppercase text-slate-500">Retraining Capacity</span>
                      <span className="text-3xl font-black text-emerald-600">{redundancyData.retraining_capacity_pct}%</span>
                      <span className="text-xs font-bold text-slate-500">Supported by ${trainingBudget}% training budget</span>
                    </div>

                    <div className="p-6 bg-white/70 border border-white/90 backdrop-blur-xl rounded-3xl shadow-lg flex flex-col gap-2">
                      <span className="text-xs font-black uppercase text-slate-500">Net Position Displacement</span>
                      <span className="text-3xl font-black text-amber-600">{redundancyData.net_redundant_positions} Positions</span>
                      <span className="text-xs font-bold text-slate-500">Unabsorbed by internal reskilling</span>
                    </div>

                    <div className="p-6 bg-white/70 border border-white/90 backdrop-blur-xl rounded-3xl shadow-lg flex flex-col gap-2">
                      <span className="text-xs font-black uppercase text-slate-500">Est. Annual Payroll Savings</span>
                      <span className="text-3xl font-black text-indigo-600">${redundancyData.estimated_payroll_savings_m}M</span>
                      <span className="text-xs font-bold text-slate-500">Based on average base compensation</span>
                    </div>
                  </div>

                  <div className="p-8 bg-white/70 border border-white/90 backdrop-blur-xl rounded-3xl shadow-xl flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="text-rose-600" size={24} />
                      <h3 className="text-base font-black text-slate-900">Workforce Redundancy & Reskilling Assessment</h3>
                    </div>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">
                      With an automation exposure index of <strong className="text-indigo-600">{redundancyData.automation_exposure_index}/100</strong>, approximately {redundancyData.potential_redundant_roles} job functions face structural shift. Allocating {trainingBudget}% to internal training programs reduces net redundancies to <strong>{redundancyData.net_redundant_positions} positions</strong>, preserving organizational morale and avoiding direct severance costs.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: CRITICAL ROLE SHIFTS */}
              {activeTab === 'roleShifts' && roleShiftsData && (
                <div className="p-8 bg-white/70 border border-white/90 backdrop-blur-xl rounded-3xl shadow-xl flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <ArrowRightLeft className="text-amber-600" size={20} /> Critical Role Shifts & Career Mobility
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-1">Predicted job evolution trajectories under simulated parameters</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black border border-amber-200">
                      {roleShiftsData.length} Key Role Transitions
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {roleShiftsData.map((shift, idx) => (
                      <div key={idx} className="p-6 bg-white/80 border border-slate-200/80 rounded-2xl shadow-sm flex flex-col gap-4 hover:shadow-md transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">{shift.category}</span>
                          <span className="text-xs font-bold text-slate-500">Difficulty: <strong className="text-slate-800">{shift.difficulty}</strong></span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">
                            <span className="text-xs font-bold text-rose-500 block">Original Role</span>
                            <strong className="text-sm font-black text-slate-900">{shift.from_role}</strong>
                          </div>

                          <ArrowRightLeft size={20} className="text-amber-500 shrink-0" />

                          <div className="flex-1 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                            <span className="text-xs font-bold text-emerald-500 block">Evolved Future Role</span>
                            <strong className="text-sm font-black text-slate-900">{shift.to_role}</strong>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-100">
                          <span className="text-slate-500">Automation Exposure: <strong className="text-rose-600 font-black">{shift.exposure}</strong></span>
                          <span className="text-slate-500">Target Shift: <strong className="text-emerald-600 font-black">{shift.shift_pct}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: IMPACT MATRICES ASSET */}
              {activeTab === 'impactMatrix' && impactMatrixData && (
                <div className="p-8 bg-white/70 border border-white/90 backdrop-blur-xl rounded-3xl shadow-xl flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Grid className="text-purple-600" size={20} /> Causal Impact Matrix Asset
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-1">Cross-impact sensitivity matrix mapping simulation inputs to organizational outputs</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-black border border-purple-200">
                      Stored Impact Matrix Graph
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs font-black uppercase">
                          <th className="py-3 px-4">Input Parameter</th>
                          <th className="py-3 px-4 text-center">Productivity</th>
                          <th className="py-3 px-4 text-center">Capacity</th>
                          <th className="py-3 px-4 text-center">Attrition</th>
                          <th className="py-3 px-4 text-center">Revenue</th>
                          <th className="py-3 px-4 text-center">CSAT</th>
                          <th className="py-3 px-4 text-center">Redundancy Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold">
                        {impactMatrixData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/60 transition-colors">
                            <td className="py-4 px-4 font-black text-slate-900">{row.parameter}</td>
                            <td className="py-4 px-4 text-center">{renderImpactScoreBadge(row.productivity)}</td>
                            <td className="py-4 px-4 text-center">{renderImpactScoreBadge(row.capacity)}</td>
                            <td className="py-4 px-4 text-center">{renderImpactScoreBadge(row.attrition)}</td>
                            <td className="py-4 px-4 text-center">{renderImpactScoreBadge(row.revenue)}</td>
                            <td className="py-4 px-4 text-center">{renderImpactScoreBadge(row.csat)}</td>
                            <td className="py-4 px-4 text-center">{renderImpactScoreBadge(row.redundancy)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
};
