import React, { useState } from 'react';
import { Sliders, RefreshCw, Activity, Target, Zap, UserMinus, Network, DollarSign, GitCompare, BrainCircuit, ChevronRight, Users, Building2, Briefcase, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { useOrganizationMetrics, useOrganizationScenarios } from '../../hooks/useOrganization';
import api from '../../lib/api';

export const OrgSimulator: React.FC = () => {
  const [headcountChange, setHeadcountChange] = useState(0);
  const [salaryChange, setSalaryChange] = useState(0);
  const [remoteDays, setRemoteDays] = useState(2);
  const [trainingBudget, setTrainingBudget] = useState(0);
  const [restructuringLevel, setRestructuringLevel] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<any | null>(null);
  const [simulationData, setSimulationData] = useState<any[] | null>(null);
  const [snapshotData, setSnapshotData] = useState<any[] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const { metrics } = useOrganizationMetrics();
  const { scenarios } = useOrganizationScenarios();

  // Use fetched scenarios or fallback
  const simData = scenarios || [];

  // Base metrics from the most recent historical month
  const latestMonth = metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const baseProductivity = latestMonth?.overallProductivityScore || 90;
  const baseHealth = (latestMonth?.enps || 50) + 40; // Approx mapping to 0-100
  const baseCapacity = 100;
  const baseAttrition = parseFloat(latestMonth?.voluntaryAttritionRate || '2') * 4;
  const baseCsat = parseFloat(latestMonth?.csat || '85');
  const baseRevenue = parseFloat(latestMonth?.revenue || '15000000') / 1000000; // In Millions

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const newData = await api.organization.runSimulation({ headcountChange, salaryChange, remoteDays, trainingBudget, restructuringLevel, isSnapshot: false });
      setSimulationData(newData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyScenario = async (scenario: any) => {
    setSelectedScenario(scenario);
    const name = scenario.scenarioName.toLowerCase();

    let hc = 0, sc = 0, rd = 2, tb = 0, rl = 0;

    if (name.includes('headcount')) hc = name.includes('reduce') ? -5 : 5;
    if (name.includes('salary')) sc = 5;
    if (name.includes('4-day')) rd = 4;
    if (name.includes('office')) rd = 1;
    if (name.includes('r&d') || name.includes('training')) tb = 20;
    if (name.includes('outsource') || name.includes('hub')) rl = 8;

    setHeadcountChange(hc);
    setSalaryChange(sc);
    setRemoteDays(rd);
    setTrainingBudget(tb);
    setRestructuringLevel(rl);

    setIsSimulating(true);
    try {
      const newData = await api.organization.runSimulation({ headcountChange: hc, salaryChange: sc, remoteDays: rd, trainingBudget: tb, restructuringLevel: rl, isSnapshot: false });
      setSimulationData(newData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSnapshot = async () => {
    if (!simulationData) return;
    try {
      const snap = await api.organization.runSimulation({ headcountChange, salaryChange, remoteDays, trainingBudget, restructuringLevel, isSnapshot: true });
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
    setSimulationData(null);
    setSnapshotData(null);
    setSelectedScenario(null);
  };

  const mergedData = simulationData ? simulationData.map((d, i) => {
    return { ...d, ...(snapshotData ? snapshotData[i] : {}) };
  }) : null;

  // Take just 8 interesting scenarios for the library
  const scenarioLibrary = simData.slice(0, 8);

  return (
    <div className="flex flex-col gap-8 pb-12 relative">
      {/* Background Decorative Blur */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: -10 }}>
        <div className="absolute rounded-full" style={{ top: '-10rem', left: '-5rem', width: '30rem', height: '30rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', filter: 'blur(100px)' }}></div>
        <div className="absolute rounded-full" style={{ top: '20rem', right: '-10rem', width: '25rem', height: '25rem', backgroundColor: 'rgba(167, 139, 250, 0.15)', filter: 'blur(80px)' }}></div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-slate-900">AI Digital Twin Simulator</h1>
          <p className="text-base font-bold text-slate-600 bg-white/60 px-4 py-2 rounded-xl shadow-sm border border-white backdrop-blur-md inline-flex items-center">
            <Activity size={16} className="text-blue-600 mr-2" />
            Enterprise-grade causal what-if forecasting powered by your historical data.
          </p>
        </div>
      </div>

      <div className="flex gap-6 items-start relative z-10">

        {/* Left Panel: Scenario Library */}
        <div className="shrink-0 flex flex-col w-72 bg-white/40 border border-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200/60 shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 bg-gradient-to-br from-amber-500 to-amber-600">
              <Lightbulb size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight text-slate-900">AI Scenarios</h3>
              <p className="text-xs font-bold mt-0.5 text-slate-500">Pre-calculated outcomes</p>
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

        {/* Middle Panel: Controls */}
        <div className="shrink-0 flex flex-col w-80 bg-white/40 border border-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-6 border-b border-slate-200/60 shrink-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sliders size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-extrabold leading-tight text-slate-900">Parameters</h3>
              <p className="text-xs font-bold mt-1 uppercase tracking-wider text-indigo-500">Adjust model inputs</p>
            </div>
          </div>

          <div className="flex flex-col flex-1 p-2">

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
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Restructuring</label>
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

          <div className="px-6 pt-6 pb-10 flex flex-col gap-4 relative z-10 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
            {simulationData && !snapshotData && (
              <button className="w-full text-sm font-extrabold rounded-full flex justify-center items-center gap-2 border shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0" style={{ height: '48px', backgroundColor: 'white', borderColor: '#bfdbfe', color: '#2563eb' }} onClick={handleSnapshot}>
                <GitCompare size={18} /> Save for Comparison
              </button>
            )}
            <div className="flex gap-3 items-center shrink-0">
              <button className="flex-1 text-sm shadow-xl font-extrabold rounded-full flex justify-center items-center text-white transition-all hover:-translate-y-1 hover:shadow-2xl border-none cursor-pointer whitespace-nowrap shrink-0" style={{ height: '56px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }} onClick={handleRunSimulation} disabled={isSimulating}>
                {isSimulating ? <div className="animate-spin mr-2" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%' }}></div> : <Zap size={18} className="mr-2" />}
                {snapshotData ? 'Run Scenario B' : 'Run Simulation'}
              </button>
              <button onClick={handleReset} className="rounded-full shadow-md border-none flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer shrink-0" style={{ width: '56px', height: '56px', backgroundColor: 'white', color: '#f43f5e' }}>
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Results & Charts */}
        <div className="flex-1 min-w-0 flex flex-col h-full gap-8">

          {!mergedData && !isSimulating && (
            <div className="flex flex-col items-center justify-center flex-1 text-center relative overflow-hidden bg-white/40 border border-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] min-h-[600px]">
              <div className="absolute top-[10%] right-[10%] w-80 h-80 bg-blue-500/10 rounded-full blur-[60px]"></div>
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-xl relative z-10 bg-gradient-to-br from-blue-50 to-indigo-50 border border-white">
                <BrainCircuit size={48} className="text-indigo-600" />
              </div>
              <h3 className="font-black text-3xl mb-4 relative z-10 text-slate-900">Causal System Dynamics</h3>
              <p className="text-base font-bold max-w-lg leading-relaxed relative z-10 text-slate-500">
                Select an AI Scenario on the left, or manually configure your strategy. The simulation uses a calibrated Bayesian Network built on your historical data.
              </p>
            </div>
          )}

          {isSimulating && (
            <div className="flex flex-col items-center justify-center flex-1 text-center relative overflow-hidden bg-white/60 border border-blue-200/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] min-h-[600px]">
              <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-indigo-500/15 rounded-full blur-[60px]"></div>
              <div className="w-20 h-20 border-4 border-t-indigo-600 border-indigo-200/20 rounded-full animate-spin mb-8 shadow-lg relative z-10"></div>
              <h3 className="text-2xl font-black mb-3 relative z-10 text-slate-900">Calculating Causal Probabilities...</h3>
              <p className="animate-pulse font-extrabold text-base relative z-10 text-indigo-500">Propagating causal edges through workload, stress, and revenue nodes.</p>
            </div>
          )}

          {mergedData && !isSimulating && (
            <>
              <div className="grid grid-cols-12 gap-6 shrink-0">
                <div className={`p-6 flex items-start gap-6 transition-all bg-white/70 border border-white/90 backdrop-blur-xl rounded-3xl shadow-xl ${snapshotData ? 'col-span-8' : 'col-span-12'}`}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white bg-gradient-to-br from-indigo-500 to-purple-500">
                    <Network size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide mb-3" style={{ color: '#0f172a' }}>
                      {selectedScenario ? `Scenario Analysis: ${selectedScenario.scenarioName.split(':')[1] || selectedScenario.scenarioName}` : 'Causal AI Sensitivity Analysis'}
                    </h4>
                    <p className="text-sm leading-relaxed font-bold" style={{ color: '#475569' }}>
                      The projected outcome is highly sensitive to <strong className="font-black px-2 py-1 rounded-lg" style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>{selectedScenario ? selectedScenario.targetMetric : 'Headcount'}</strong> changes.
                      {selectedScenario && <span className="ml-2 px-2 py-1 bg-green-50 text-green-700 rounded-md">Predicted ROI: {selectedScenario.predictedROI}%</span>}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-xs font-black p-4 rounded-2xl border shadow-sm w-fit" style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderColor: '#e2e8f0', color: '#64748b' }}>
                      <span className="text-rose-600">Headcount ↓</span> <ChevronRight size={16} />
                      <span className="text-amber-600">Workload ↑</span> <ChevronRight size={16} />
                      <span className="text-rose-600">Burnout ↑</span> <ChevronRight size={16} />
                      <span className="text-rose-600">CSAT ↓</span>
                    </div>
                  </div>
                </div>

                {snapshotData && (
                  <div className="col-span-4 p-6 shadow-xl flex items-start gap-5 transition-all" style={{ background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(238, 242, 255, 0.8) 100%)', border: '1px solid #bfdbfe', backdropFilter: 'blur(20px)', borderRadius: '32px' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md text-white" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                      <GitCompare size={24} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: '#1e3a8a' }}>Compare Mode</h4>
                      <p className="text-xs leading-relaxed font-bold" style={{ color: '#3b82f6' }}>
                        Solid lines: <strong className="font-black" style={{ color: '#1e3a8a' }}>Current</strong>.<br />
                        Dashed lines: <strong className="font-black" style={{ color: '#1e3a8a' }}>Scenario A</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8 pb-4">

                <div className="flex flex-col h-[340px] p-8 transition-all duration-500 bg-white/50 border border-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_rgba(31,38,135,0.04)] hover:shadow-[0_16px_48px_rgba(31,38,135,0.08)] hover:-translate-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-[50px] group-hover:bg-blue-400/10 transition-all duration-700 pointer-events-none"></div>
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
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(10px)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 800, paddingTop: '15px' }} />

                        {snapshotData && <Line type="monotone" dataKey="A_productivity" name="Productivity (A)" stroke="#3b82f6" strokeWidth={3} strokeDasharray="6 6" dot={false} opacity={0.4} />}
                        <Line type="monotone" dataKey="productivity" name="Productivity" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} />

                        {snapshotData && <Line type="monotone" dataKey="A_orgHealth" name="Org Health (A)" stroke="#10b981" strokeWidth={3} strokeDasharray="6 6" dot={false} opacity={0.4} />}
                        <Line type="monotone" dataKey="orgHealth" name="Org Health" stroke="#10b981" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col h-[340px] p-8 transition-all duration-500 bg-white/50 border border-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_rgba(31,38,135,0.04)] hover:shadow-[0_16px_48px_rgba(31,38,135,0.08)] hover:-translate-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-[50px] group-hover:bg-emerald-400/10 transition-all duration-700 pointer-events-none"></div>
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
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(10px)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 800, paddingTop: '15px' }} />

                        {snapshotData && <Line type="monotone" dataKey="A_revenue" name="Revenue $M (A)" stroke="#8B5CF6" strokeWidth={3} strokeDasharray="6 6" dot={false} opacity={0.4} />}
                        <Line type="monotone" dataKey="revenue" name="Revenue $M" stroke="#8B5CF6" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} />

                        {snapshotData && <Line type="monotone" dataKey="A_csat" name="CSAT Score (A)" stroke="#F59E0B" strokeWidth={3} strokeDasharray="6 6" dot={false} opacity={0.4} />}
                        <Line type="monotone" dataKey="csat" name="CSAT Score" stroke="#F59E0B" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col h-[300px] p-8 transition-all duration-500 bg-white/50 border border-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_rgba(31,38,135,0.04)] hover:shadow-[0_16px_48px_rgba(31,38,135,0.08)] hover:-translate-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400/5 rounded-full blur-[50px] group-hover:bg-rose-400/10 transition-all duration-700 pointer-events-none"></div>
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
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(10px)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 800, paddingTop: '15px' }} />

                        {snapshotData && <Area type="monotone" dataKey="A_attrition" name="Attrition % (A)" stroke="#f43f5e" strokeWidth={3} strokeDasharray="6 6" fill="transparent" opacity={0.4} />}
                        <Area type="monotone" dataKey="attrition" name="Attrition Risk %" stroke="#f43f5e" strokeWidth={4} fill="url(#colorAttrition)" activeDot={{ r: 8 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col h-[300px] p-8 transition-all duration-500 bg-white/50 border border-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_rgba(31,38,135,0.04)] hover:shadow-[0_16px_48px_rgba(31,38,135,0.08)] hover:-translate-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/5 rounded-full blur-[50px] group-hover:bg-sky-400/10 transition-all duration-700 pointer-events-none"></div>
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
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(10px)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 800, paddingTop: '15px' }} />

                        {snapshotData && <Area type="monotone" dataKey="A_capacity" name="Capacity (A)" stroke="#0ea5e9" strokeWidth={3} strokeDasharray="6 6" fill="transparent" opacity={0.4} />}
                        <Area type="monotone" dataKey="capacity" name="Capacity Index" stroke="#0ea5e9" strokeWidth={4} fill="url(#colorCap)" activeDot={{ r: 8 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
