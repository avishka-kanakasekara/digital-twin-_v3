import React, { useState } from 'react';
import { Sliders, RefreshCw, Activity, Target, Zap, UserMinus, Network, DollarSign, GitCompare, BrainCircuit, ChevronRight, Users, Building2, Briefcase, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { useOrganizationMetrics, useOrganizationScenarios } from '../../hooks/useOrganization';

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

  const { metrics, loading: loadingMetrics } = useOrganizationMetrics();
  const { scenarios, loading: loadingScenarios } = useOrganizationScenarios();

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

  const generateData = (params: any, isSnapshot: boolean = false) => {
    return Array.from({ length: 6 }, (_, i) => {
      const monthMultiplier = (i + 1) * 0.2;

      const prodEffect = params.headcountChange * 0.5 + (params.remoteDays - 2) * 1.5 + params.trainingBudget * 1.2 - params.restructuringLevel * 2;
      const healthEffect = params.salaryChange * 0.5 + (params.remoteDays - 2) * 2 + params.trainingBudget * 0.5 - params.headcountChange * 0.1 - params.restructuringLevel * 3;
      const capEffect = params.headcountChange * 2 - params.restructuringLevel * 1.5 + params.trainingBudget * 0.5;
      const attritionEffect = -params.salaryChange * 0.8 - (params.remoteDays - 2) * 2 - params.trainingBudget * 0.4 + params.headcountChange * 0.3 + params.restructuringLevel * 4;

      const revEffect = (capEffect * 0.4) - (attritionEffect * 0.3) - (params.restructuringLevel * 2);
      const csatEffect = (healthEffect * 0.3) - (attritionEffect * 0.5) + (params.trainingBudget * 0.2);

      const prefix = isSnapshot ? 'A_' : '';

      return {
        month: `Month ${i + 1}`,
        [`${prefix}productivity`]: Math.max(0, Math.min(100, baseProductivity + prodEffect * monthMultiplier)),
        [`${prefix}orgHealth`]: Math.max(0, Math.min(100, baseHealth + healthEffect * monthMultiplier)),
        [`${prefix}capacity`]: Math.max(0, baseCapacity + capEffect * monthMultiplier),
        [`${prefix}attrition`]: Math.max(0, Math.min(100, baseAttrition + attritionEffect * monthMultiplier)),
        [`${prefix}revenue`]: Math.max(0, baseRevenue + revEffect * monthMultiplier),
        [`${prefix}csat`]: Math.max(0, Math.min(100, baseCsat + csatEffect * monthMultiplier))
      }
    });
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newData = generateData({ headcountChange, salaryChange, remoteDays, trainingBudget, restructuringLevel });
      setSimulationData(newData);
      setIsSimulating(false);
    }, 1200);
  };

  const handleApplyScenario = (scenario: any) => {
    setSelectedScenario(scenario);
    // Parse the scenario to map to sliders (dummy mapping for effect)
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

    // Auto-run simulation
    setIsSimulating(true);
    setTimeout(() => {
      const newData = generateData({ headcountChange: hc, salaryChange: sc, remoteDays: rd, trainingBudget: tb, restructuringLevel: rl });
      setSimulationData(newData);
      setIsSimulating(false);
    }, 1200);
  };

  const handleSnapshot = () => {
    if (!simulationData) return;
    const snap = generateData({ headcountChange, salaryChange, remoteDays, trainingBudget, restructuringLevel }, true);
    setSnapshotData(snap);
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
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: '#0f172a' }}>AI Digital Twin Simulator</h1>
          <p className="text-base font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-white" style={{ color: '#475569', display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)' }}>
            <Activity size={16} className="inline mr-2" style={{ color: '#2563eb', marginBottom: '2px' }} />
            Enterprise-grade causal what-if forecasting powered by your historical data.
          </p>
        </div>
      </div>

      <div className="flex gap-6 items-start relative z-10">

        {/* Left Panel: Scenario Library */}
        <div className="shrink-0 flex flex-col shadow-2xl overflow-hidden" style={{ width: '280px', backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(24px)', borderRadius: '32px' }}>
          <div className="flex items-center gap-3 px-6 py-6 shrink-0" style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <Lightbulb size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight" style={{ color: '#0f172a' }}>AI Scenarios</h3>
              <p className="text-xs font-bold mt-0.5" style={{ color: '#64748b' }}>Pre-calculated outcomes</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4">
            {scenarioLibrary.map((scen: any) => (
              <div
                key={scen.id}
                onClick={() => handleApplyScenario(scen)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedScenario?.id === scen.id ? 'border-blue-400 shadow-md scale-[1.02]' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}
                style={{ backgroundColor: selectedScenario?.id === scen.id ? '#eff6ff' : 'white' }}
              >
                <p className="text-xs font-extrabold mb-2" style={{ color: selectedScenario?.id === scen.id ? '#1e40af' : '#0f172a' }}>
                  {scen.scenarioName.split(':')[1] || scen.scenarioName}
                </p>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span style={{ color: '#64748b' }}>Confidence: <span style={{ color: '#059669' }}>{scen.confidenceLevel}%</span></span>
                  <span style={{ color: scen.predictedImpactPercentage > 0 ? '#059669' : '#e11d48' }}>
                    Impact: {scen.predictedImpactPercentage > 0 ? '+' : ''}{scen.predictedImpactPercentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel: Controls */}
        <div className="shrink-0 flex flex-col shadow-2xl overflow-hidden" style={{ width: '320px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '32px' }}>

          <div className="flex items-center gap-4 px-6 py-6 shrink-0" style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)' }}>
              <Sliders size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-extrabold leading-tight" style={{ color: '#0f172a' }}>Parameters</h3>
              <p className="text-xs font-bold mt-1 uppercase tracking-wider" style={{ color: '#6366f1' }}>Adjust model inputs</p>
            </div>
          </div>

          <div className="flex flex-col flex-1 p-2">

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <Users size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Hiring / Layoffs</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: headcountChange > 0 ? '#ecfdf5' : headcountChange < 0 ? '#fff1f2' : '#f8fafc', color: headcountChange > 0 ? '#059669' : headcountChange < 0 ? '#e11d48' : '#64748b', borderColor: headcountChange > 0 ? '#a7f3d0' : headcountChange < 0 ? '#fecdd3' : '#e2e8f0' }}>{headcountChange > 0 ? '+' : ''}{headcountChange}%</span>
              </div>
              <input type="range" min="-20" max="20" step="1" value={headcountChange} onChange={(e) => setHeadcountChange(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: '#10b981' }} />
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <Building2 size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Restructuring</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>{restructuringLevel}/10</span>
              </div>
              <input type="range" min="0" max="10" step="1" value={restructuringLevel} onChange={(e) => setRestructuringLevel(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: '#f59e0b' }} />
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                    <DollarSign size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Salary Adjustment</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: salaryChange > 0 ? '#ecfdf5' : salaryChange < 0 ? '#fff1f2' : '#f8fafc', color: salaryChange > 0 ? '#059669' : salaryChange < 0 ? '#e11d48' : '#64748b', borderColor: salaryChange > 0 ? '#a7f3d0' : salaryChange < 0 ? '#fecdd3' : '#e2e8f0' }}>{salaryChange > 0 ? '+' : ''}{salaryChange}%</span>
              </div>
              <input type="range" min="-10" max="20" step="1" value={salaryChange} onChange={(e) => setSalaryChange(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: '#0ea5e9' }} />
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md mb-2 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
                    <Briefcase size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Remote Work</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}>{remoteDays} / 5</span>
              </div>
              <input type="range" min="0" max="5" step="1" value={remoteDays} onChange={(e) => setRemoteDays(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: '#8b5cf6' }} />
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:shadow-md shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}>
                    <Target size={16} strokeWidth={2.5} />
                  </div>
                  <label className="text-sm font-extrabold" style={{ color: '#0f172a' }}>Training Budget</label>
                </div>
                <span className="text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-lg border shadow-sm" style={{ backgroundColor: trainingBudget > 0 ? '#fff1f2' : '#f8fafc', color: trainingBudget > 0 ? '#e11d48' : '#64748b', borderColor: trainingBudget > 0 ? '#fecdd3' : '#e2e8f0' }}>{trainingBudget > 0 ? '+' : ''}{trainingBudget}%</span>
              </div>
              <input type="range" min="0" max="50" step="5" value={trainingBudget} onChange={(e) => setTrainingBudget(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: '#f43f5e' }} />
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
            <div className="flex flex-col items-center justify-center flex-1 text-center shadow-2xl relative overflow-hidden" style={{ minHeight: '600px', backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '32px' }}>
              <div className="absolute rounded-full" style={{ top: '10%', right: '10%', width: '20rem', height: '20rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', filter: 'blur(60px)' }}></div>
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-xl relative z-10" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)', border: '1px solid white' }}>
                <BrainCircuit size={48} style={{ color: '#4f46e5' }} />
              </div>
              <h3 className="font-black text-3xl mb-4 relative z-10" style={{ color: '#0f172a' }}>Causal System Dynamics</h3>
              <p className="text-base font-bold max-w-lg leading-relaxed relative z-10" style={{ color: '#64748b' }}>
                Select an AI Scenario on the left, or manually configure your strategy. The simulation uses a calibrated Bayesian Network built on your historical data.
              </p>
            </div>
          )}

          {isSimulating && (
            <div className="flex flex-col items-center justify-center flex-1 text-center shadow-2xl relative overflow-hidden" style={{ minHeight: '600px', backgroundColor: 'rgba(255,255,255,0.8)', border: '1px solid rgba(191, 219, 254, 0.8)', backdropFilter: 'blur(20px)', borderRadius: '32px' }}>
              <div className="absolute rounded-full" style={{ bottom: '10%', left: '10%', width: '20rem', height: '20rem', backgroundColor: 'rgba(99, 102, 241, 0.15)', filter: 'blur(60px)' }}></div>
              <div className="w-20 h-20 border-4 border-t-transparent rounded-full animate-spin mb-8 shadow-lg relative z-10" style={{ borderColor: 'rgba(79, 70, 229, 0.2)', borderTopColor: '#4f46e5' }}></div>
              <h3 className="text-2xl font-black mb-3 relative z-10" style={{ color: '#0f172a' }}>Calculating Causal Probabilities...</h3>
              <p className="animate-pulse font-extrabold text-base relative z-10" style={{ color: '#6366f1' }}>Propagating causal edges through workload, stress, and revenue nodes.</p>
            </div>
          )}

          {mergedData && !isSimulating && (
            <>
              <div className="grid grid-cols-12 gap-6 shrink-0">
                <div className={`p-6 shadow-xl flex items-start gap-6 transition-all ${snapshotData ? 'col-span-8' : 'col-span-12'}`} style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '32px' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
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

                <div className="flex flex-col h-[340px] p-8 shadow-xl transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '32px' }}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-4" style={{ color: '#0f172a' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}><Target size={18} className="text-white" /></div>
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

                <div className="flex flex-col h-[340px] p-8 shadow-xl transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '32px' }}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-4" style={{ color: '#0f172a' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}><DollarSign size={18} className="text-white" /></div>
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

                <div className="flex flex-col h-[300px] p-8 shadow-xl transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '32px' }}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-4" style={{ color: '#0f172a' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}><UserMinus size={18} className="text-white" /></div>
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

                <div className="flex flex-col h-[300px] p-8 shadow-xl transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '32px' }}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-4" style={{ color: '#0f172a' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}><Activity size={18} className="text-white" /></div>
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
