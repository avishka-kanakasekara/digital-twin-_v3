import React, { useState, useMemo } from 'react';
import {
  Users, DollarSign, Clock, Coins, Sliders, TrendingUp, CheckCircle,
  Lock, RefreshCw, ArrowDownRight,
  ShieldCheck, X, Zap, ChevronDown, Building2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export interface Data3Scenario {
  id: string;
  name: string;
  type: 'Automation' | 'Contraction' | 'Restructure' | 'Outsourcing' | 'Expansion';
  orgUnitId: string;
  horizon: string;
  defaultAutomation: number;
  defaultHeadcountDelta: number;
  defaultReskilling: number;
  defaultOffshoring: number;
  defaultAttrition: number;
}

export interface Data3OrgUnit {
  id: string;
  name: string;
  fteCount: number;
  head: string;
}

// =========================================================================
// DATA3 CONFIGURATION LISTS (Easily add or modify new scenarios & departments here)
// =========================================================================
export const DATA3_SCENARIOS: Data3Scenario[] = [
  { id: 'SCN-5001', name: 'SCN-5001 · Analytics Automation FY26–28', type: 'Automation', orgUnitId: 'OU-004', horizon: 'FY26 – FY28', defaultAutomation: 35, defaultHeadcountDelta: -12, defaultReskilling: 10, defaultOffshoring: 5, defaultAttrition: 7.5 },
  { id: 'SCN-5002', name: 'SCN-5002 · Virtual Agent Deflection FY26–29', type: 'Automation', orgUnitId: 'OU-005', horizon: 'FY26 – FY29', defaultAutomation: 40, defaultHeadcountDelta: -15, defaultReskilling: 12, defaultOffshoring: 8, defaultAttrition: 8.0 },
  { id: 'SCN-5003', name: 'SCN-5003 · Hiring Freeze plus 10% Attrition FY27', type: 'Contraction', orgUnitId: 'OU-005', horizon: 'FY27 – FY28', defaultAutomation: 15, defaultHeadcountDelta: -10, defaultReskilling: 6, defaultOffshoring: 0, defaultAttrition: 10.0 },
  { id: 'SCN-5004', name: 'SCN-5004 · Legacy Switching Exit FY26–28', type: 'Restructure', orgUnitId: 'OU-001', horizon: 'FY26 – FY28', defaultAutomation: 25, defaultHeadcountDelta: -14, defaultReskilling: 8, defaultOffshoring: 10, defaultAttrition: 7.0 },
  { id: 'SCN-5005', name: 'SCN-5005 · Outsource Cloud Managed Services', type: 'Outsourcing', orgUnitId: 'OU-003', horizon: 'FY27 – FY28', defaultAutomation: 20, defaultHeadcountDelta: -18, defaultReskilling: 5, defaultOffshoring: 30, defaultAttrition: 6.5 },
  { id: 'SCN-5006', name: 'SCN-5006 · 5G Slicing Expansion FY26–29', type: 'Expansion', orgUnitId: 'OU-008', horizon: 'FY26 – FY29', defaultAutomation: 10, defaultHeadcountDelta: 12, defaultReskilling: 15, defaultOffshoring: 0, defaultAttrition: 5.5 },
  { id: 'SCN-5007', name: 'SCN-5007 · SD-WAN Growth Plan FY26–28', type: 'Expansion', orgUnitId: 'OU-002', horizon: 'FY26 – FY28', defaultAutomation: 15, defaultHeadcountDelta: 8, defaultReskilling: 10, defaultOffshoring: 5, defaultAttrition: 6.0 },
  { id: 'SCN-5008', name: 'SCN-5008 · AI-assisted SOC Triage FY27–28', type: 'Automation', orgUnitId: 'OU-007', horizon: 'FY27 – FY28', defaultAutomation: 45, defaultHeadcountDelta: -8, defaultReskilling: 14, defaultOffshoring: 10, defaultAttrition: 7.0 },
  { id: 'SCN-5009', name: 'SCN-5009 · Analytics Expansion - Buy Heavy', type: 'Expansion', orgUnitId: 'OU-004', horizon: 'FY26 – FY28', defaultAutomation: 20, defaultHeadcountDelta: 15, defaultReskilling: 12, defaultOffshoring: 5, defaultAttrition: 6.5 },
  { id: 'SCN-5010', name: 'SCN-5010 · Contact Centre Regional Hub Consolidation', type: 'Restructure', orgUnitId: 'OU-005', horizon: 'FY27 – FY28', defaultAutomation: 30, defaultHeadcountDelta: -12, defaultReskilling: 8, defaultOffshoring: 25, defaultAttrition: 8.5 }
];

export const DATA3_ORG_UNITS: Data3OrgUnit[] = [
  { id: 'ALL', name: 'Enterprise (All 146 FTEs)', fteCount: 146, head: 'Group CEO' },
  { id: 'OU-001', name: 'Network Operations', fteCount: 34, head: 'Head of Networks' },
  { id: 'OU-002', name: 'Enterprise & SD-WAN Solutions', fteCount: 18, head: 'Head of Enterprise' },
  { id: 'OU-003', name: 'Cloud & Data Centre', fteCount: 22, head: 'Head of Cloud Infra' },
  { id: 'OU-004', name: 'Data Science & Retail Analytics', fteCount: 16, head: 'Chief Data Officer' },
  { id: 'OU-005', name: 'Customer Experience & Contact Centre', fteCount: 48, head: 'Head of CX' },
  { id: 'OU-006', name: 'Digital Platforms & IT', fteCount: 28, head: 'Head of IT Platforms' },
  { id: 'OU-007', name: 'Cybersecurity', fteCount: 12, head: 'Chief Information Security Officer' },
  { id: 'OU-008', name: 'Mobile Core & 5G', fteCount: 20, head: 'Head of 5G Core' },
  { id: 'OU-009', name: 'Human Resources & Talent', fteCount: 14, head: 'Chief People Officer' }
];

export const DATA3_HORIZONS: string[] = [
  'FY26 – FY28 (3 Years)',
  'FY26 – FY29 (4 Years)',
  'FY26 – FY30 (5 Years)'
];

export const OrgSimulator: React.FC = () => {
  // Global Filters & Scenario Context
  const [selectedScenario, setSelectedScenario] = useState<string>('SCN-5001');
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string>('ALL');
  const [planningHorizon, setPlanningHorizon] = useState<string>('FY26 – FY28 (3 Years)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Chart View
  const [activeChartMetric, setActiveChartMetric] = useState<'headcount' | 'cost' | 'savings'>('headcount');

  // Precision What-If Levers (Calibrated to SCN-5001 defaults)
  const [automationShare, setAutomationShare] = useState<number>(35);
  const [headcountDeltaPct, setHeadcountDeltaPct] = useState<number>(-12);
  const [reskillingRate, setReskillingRate] = useState<number>(10.0);
  const [attritionRate, setAttritionRate] = useState<number>(7.5);
  const [offshoringRate, setOffshoringRate] = useState<number>(5.0);
  const [wageInflation, setWageInflation] = useState<number>(4.0);
  const [activeArchetype, setActiveArchetype] = useState<string>('auto');

  // Modals
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState<boolean>(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState<boolean>(false);
  const [freezeTag, setFreezeTag] = useState<string>('FY26-Q4-Approved-Master');
  const [promoteJustification, setPromoteJustification] = useState<string>('Target operating model verified against FY26-FY28 cost envelopes.');

  // Notification Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Scenario Selection Handler (Auto-calibrates levers based on Data3 scenario specifications)
  const handleSelectScenario = (scenId: string) => {
    setSelectedScenario(scenId);
    const scen = DATA3_SCENARIOS.find(s => s.id === scenId);
    if (scen) {
      setAutomationShare(scen.defaultAutomation);
      setHeadcountDeltaPct(scen.defaultHeadcountDelta);
      setReskillingRate(scen.defaultReskilling);
      setOffshoringRate(scen.defaultOffshoring);
      setAttritionRate(scen.defaultAttrition);
      setActiveArchetype('custom');
      triggerToast(`Calibrated to ${scen.name}`);
    }
  };

  // 1-Click Archetype Presets
  const applyArchetype = (type: string) => {
    setActiveArchetype(type);
    if (type === 'genai') {
      setAutomationShare(40);
      setHeadcountDeltaPct(-16);
      setReskillingRate(14);
      setOffshoringRate(10);
      triggerToast('Applied Preset: GenAI Acceleration');
    } else if (type === 'auto') {
      setAutomationShare(30);
      setHeadcountDeltaPct(-12);
      setReskillingRate(8);
      setOffshoringRate(5);
      triggerToast('Applied Preset: Intelligent Automation');
    } else if (type === 'cloud') {
      setAutomationShare(20);
      setHeadcountDeltaPct(-6);
      setReskillingRate(12);
      setOffshoringRate(8);
      triggerToast('Applied Preset: Cloud Modernization');
    } else if (type === 'offshore') {
      setAutomationShare(15);
      setHeadcountDeltaPct(-10);
      setReskillingRate(5);
      setOffshoringRate(25);
      triggerToast('Applied Preset: Regional Shared Services');
    }
  };

  // Reset to Baseline
  const resetToBaseline = () => {
    setActiveArchetype('none');
    setAutomationShare(10);
    setHeadcountDeltaPct(0);
    setReskillingRate(4);
    setAttritionRate(7.5);
    setOffshoringRate(0);
    setWageInflation(4.0);
    triggerToast('Reset simulator levers to active baseline');
  };

  // Core Calculations (Anchored to 146 Active Employees)
  const baselineHC = 146;
  const baselineCostM = 482.4; // LKR 482.4M Annual OpEx

  const simulatedHC = Math.round(baselineHC * (1 + headcountDeltaPct / 100));
  const hcDelta = simulatedHC - baselineHC;
  const hcDeltaPct = Math.round((hcDelta / baselineHC) * 100);

  // Financial Estimates
  const laborEfficiencyFactor = 1 - (automationShare * 0.004) - (offshoringRate * 0.003);
  const simulatedCostM = Number((baselineCostM * (simulatedHC / baselineHC) * laborEfficiencyFactor * (1 + wageInflation / 100 * 0.5)).toFixed(1));
  const annualSavingsM = Number((baselineCostM - simulatedCostM).toFixed(1));
  const savingsPct = Math.round((annualSavingsM / baselineCostM) * 100);

  // Transition Cap & Payback
  const severanceCostM = Math.max(0, Math.abs(hcDelta)) * 1.2; // ~1.2M LKR per severed role
  const reskillCostM = (baselineHC * (reskillingRate / 100)) * 0.45; // ~450k LKR per reskilled FTE
  const transitionCostM = Number((severanceCostM + reskillCostM + 4.5).toFixed(1)); // +4.5M tooling/transition
  const paybackMonths = annualSavingsM > 0 ? Number(((transitionCostM / annualSavingsM) * 12).toFixed(1)) : 0;

  // Trajectory Multi-Year Forecast Chart Data
  const chartData = useMemo(() => {
    const y1HC = Math.round(baselineHC + (simulatedHC - baselineHC) * 0.4);
    const y2HC = Math.round(baselineHC + (simulatedHC - baselineHC) * 0.75);
    const y3HC = simulatedHC;

    const y1Cost = Number((baselineCostM * 1.03 - annualSavingsM * 0.35).toFixed(1));
    const y2Cost = Number((baselineCostM * 1.06 - annualSavingsM * 0.7).toFixed(1));
    const y3Cost = simulatedCostM;

    return [
      {
        year: 'FY25 (Base)',
        baselineHC,
        simulatedHC: baselineHC,
        baselineCost: Math.round(baselineCostM),
        simulatedCost: Math.round(baselineCostM),
        savings: 0
      },
      {
        year: 'FY26 (Y1)',
        baselineHC,
        simulatedHC: y1HC,
        baselineCost: Math.round(baselineCostM * 1.04),
        simulatedCost: Math.round(y1Cost),
        savings: Math.max(0, Math.round(baselineCostM * 1.04 - y1Cost))
      },
      {
        year: 'FY27 (Y2)',
        baselineHC,
        simulatedHC: y2HC,
        baselineCost: Math.round(baselineCostM * 1.08),
        simulatedCost: Math.round(y2Cost),
        savings: Math.max(0, Math.round(baselineCostM * 1.08 - y2Cost))
      },
      {
        year: 'FY28 (Y3)',
        baselineHC,
        simulatedHC: y3HC,
        baselineCost: Math.round(baselineCostM * 1.12),
        simulatedCost: Math.round(y3Cost),
        savings: Math.max(0, Math.round(baselineCostM * 1.12 - y3Cost))
      }
    ];
  }, [simulatedHC, simulatedCostM, annualSavingsM]);

  return (
    <div className="flex flex-col gap-5 w-full pb-14 text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-fade-in border border-slate-700">
          <CheckCircle size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header Bar - Clean Structured Two-Row Layout */}
      <div className="flex flex-col gap-2.5 w-full pt-1">
        {/* Top Row: Main Title & Subtitle Description */}
        <div className="flex flex-col gap-0.5 w-full">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Scenario & Workforce Simulator
          </h1>
          <p className="text-xs text-slate-500 w-full whitespace-nowrap">
            Model what-if organizational futures, automation impacts, reskilling trajectories, and multi-year cost forecasts against frozen baselines.
          </p>
        </div>

        {/* Bottom Row: Controls Toolbar (Swapped to be below Subtitle) */}
        <div className="flex items-center justify-between gap-3 w-full flex-wrap pb-0.5">
          {/* Left: Dynamic Configuration Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scenario Selector (Dynamic from Data3) */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs">
                <Sliders size={13} className="text-slate-400 shrink-0" />
                <select
                  value={selectedScenario}
                  onChange={(e) => handleSelectScenario(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-6 appearance-none text-slate-800 font-semibold text-xs"
                >
                  {DATA3_SCENARIOS.map((scen) => (
                    <option key={scen.id} value={scen.id}>
                      {scen.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>

            {/* Org Unit Selector (Dynamic from Data3) */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <select
                  value={selectedOrgUnit}
                  onChange={(e) => {
                    setSelectedOrgUnit(e.target.value);
                    const ou = DATA3_ORG_UNITS.find(u => u.id === e.target.value);
                    triggerToast(`Scope: ${ou?.name || e.target.value}`);
                  }}
                  className="bg-transparent focus:outline-none cursor-pointer pr-6 appearance-none text-slate-800 font-semibold text-xs"
                >
                  {DATA3_ORG_UNITS.map((ou) => (
                    <option key={ou.id} value={ou.id}>
                      {ou.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>

            {/* Horizon Selector (Dynamic) */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-2xs">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <select
                  value={planningHorizon}
                  onChange={(e) => {
                    setPlanningHorizon(e.target.value);
                    triggerToast(`Horizon: ${e.target.value}`);
                  }}
                  className="bg-transparent focus:outline-none cursor-pointer pr-6 appearance-none text-slate-800 font-semibold text-xs"
                >
                  {DATA3_HORIZONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>
          </div>

          {/* Right: Primary Governance Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Freeze Baseline Button */}
            <button
              onClick={() => setIsFreezeModalOpen(true)}
              className="flex items-center gap-2 h-9 px-3 bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
              title="Lock current metrics as an official baseline"
            >
              <Lock size={13} className="text-slate-500" />
              <span>Freeze Baseline</span>
            </button>

            {/* Promote Model Primary Action */}
            <button
              onClick={() => setIsPromoteModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <ShieldCheck size={14} className="text-white shrink-0" />
              <span className="text-white">Promote Model</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 HERO METRIC CARDS (In ONE single row across: eka peliylta) */}
      <div 
        className="w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '12px'
        }}
      >
        {/* Card 1: PROJECTED HEADCOUNT (Blue) */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-[116px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Projected Headcount
            </span>
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={14} />
            </div>
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {simulatedHC}
            </span>
            <span className="text-xs font-bold text-slate-400">FTEs</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              hcDelta < 0
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {hcDelta >= 0 ? `+${hcDelta}` : hcDelta} FTEs ({hcDeltaPct}%)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">vs {baselineHC} base</span>
          </div>
        </div>

        {/* Card 2: PROJECTED ANNUAL OPEX (Green) */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-[116px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Projected Annual OpEx
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              LKR {simulatedCostM}M
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ArrowDownRight size={11} />
              <span>
                {annualSavingsM >= 0
                  ? `LKR ${annualSavingsM}M / yr saved (${savingsPct}%)`
                  : `LKR ${Math.abs(annualSavingsM)}M expansion`}
              </span>
            </span>
          </div>
        </div>

        {/* Card 3: RESTRUCTURING CAP (Amber) */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-[116px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Restructuring Cap
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Coins size={14} />
            </div>
          </div>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-800 tracking-tight">
              LKR {transitionCostM}M
            </span>
          </div>
          <div className="text-[10.5px] font-medium text-slate-400">
            One-time transition budget
          </div>
        </div>

        {/* Card 4: PAYBACK DURATION (Purple) */}
        <div className="bg-white border border-purple-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-[116px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
              Payback Duration
            </span>
            <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Clock size={14} />
            </div>
          </div>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-purple-700 tracking-tight">
              {paybackMonths > 0 ? `${paybackMonths} mo` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle size={11} className="text-emerald-600" />
              <span>ROI Compliant (&lt; 12 mo)</span>
            </span>
          </div>
        </div>
      </div>

      {/* STRATEGIC ARCHETYPES SECTION (100% PRECISELY ALIGNED TO THE 4 COLUMNS ABOVE) */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between w-full px-0.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap size={13} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Strategic Archetypes
            </h2>
            <span className="text-xs text-slate-400 font-medium">· 1-Click Transformation Templates</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Auto-calibrates simulator levers</span>
        </div>

        <div 
          className="w-full"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '12px'
          }}
        >
          {/* Preset 1: GenAI */}
          <button
            type="button"
            onClick={() => applyArchetype('genai')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer h-[84px] flex flex-col justify-between shadow-2xs hover:shadow-xs ${
              activeArchetype === 'genai'
                ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/30'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs">⚡</span>
              <span className="text-[9.5px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">High Tech</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">GenAI Velocity</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Auto 40% · Reskill 14%</div>
            </div>
          </button>

          {/* Preset 2: Lean Ops */}
          <button
            type="button"
            onClick={() => applyArchetype('auto')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer h-[84px] flex flex-col justify-between shadow-2xs hover:shadow-xs ${
              activeArchetype === 'auto'
                ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/30'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs">🤖</span>
              <span className="text-[9.5px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Automation</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">Process Automation</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Auto 30% · -12% HC</div>
            </div>
          </button>

          {/* Preset 3: Cloud Pivot */}
          <button
            type="button"
            onClick={() => applyArchetype('cloud')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer h-[84px] flex flex-col justify-between shadow-2xs hover:shadow-xs ${
              activeArchetype === 'cloud'
                ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/30'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs">☁️</span>
              <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">Cloud</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">Cloud & DevOps</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Auto 20% · Reskill 12%</div>
            </div>
          </button>

          {/* Preset 4: Shared Services */}
          <button
            type="button"
            onClick={() => applyArchetype('offshore')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer h-[84px] flex flex-col justify-between shadow-2xs hover:shadow-xs ${
              activeArchetype === 'offshore'
                ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs">🌐</span>
              <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Offshore</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">Shared Services</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Offshore 25% · -10% HC</div>
            </div>
          </button>
        </div>
      </div>

      {/* CORE 2-COLUMN SIMULATION WORKBENCH */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full items-start">
        
        {/* LEFT COLUMN: STRATEGIC LEVERS (5 cols - ~40%) */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-4">

          {/* Interactive Calibration Levers */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders size={14} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Precision Levers
                </h2>
              </div>
              <button
                type="button"
                onClick={resetToBaseline}
                className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw size={11} />
                <span>Reset</span>
              </button>
            </div>

            {/* Lever 1: Automation Share */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Automation Adoption</span>
                <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {automationShare}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={automationShare}
                onChange={(e) => {
                  setAutomationShare(Number(e.target.value));
                  setActiveArchetype('custom');
                }}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0% Manual</span>
                <span>30% Standard</span>
                <span>60% Autonomous</span>
              </div>
            </div>

            {/* Lever 2: Headcount Trajectory */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Target Headcount Adjustment</span>
                <span className={`font-extrabold px-2 py-0.5 rounded border ${
                  headcountDeltaPct < 0
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
                  {headcountDeltaPct > 0 ? `+${headcountDeltaPct}` : headcountDeltaPct}%
                </span>
              </div>
              <input
                type="range"
                min="-25"
                max="20"
                step="1"
                value={headcountDeltaPct}
                onChange={(e) => {
                  setHeadcountDeltaPct(Number(e.target.value));
                  setActiveArchetype('custom');
                }}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>-25% Rationalize</span>
                <span>0% Hold Base</span>
                <span>+20% Expand</span>
              </div>
            </div>

            {/* Lever 3: Internal Reskilling Target */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Internal Reskilling Commitment</span>
                <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {reskillingRate}% / yr
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={reskillingRate}
                onChange={(e) => {
                  setReskillingRate(Number(e.target.value));
                  setActiveArchetype('custom');
                }}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0% No Training</span>
                <span>8% Industry Norm</span>
                <span>20% Aggressive Pivot</span>
              </div>
            </div>

            {/* Lever 4: Offshoring / Regional Hub Shift */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Regional Delivery Center Share</span>
                <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {offshoringRate}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={offshoringRate}
                onChange={(e) => {
                  setOffshoringRate(Number(e.target.value));
                  setActiveArchetype('custom');
                }}
                className="w-full accent-slate-700 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0% Onsite Only</span>
                <span>15% Hybrid</span>
                <span>40% Distributed</span>
              </div>
            </div>

            {/* Lever 5: Natural Attrition Absorption */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Natural Attrition Absorption</span>
                <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {attritionRate}% / yr
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="0.5"
                value={attritionRate}
                onChange={(e) => {
                  setAttritionRate(Number(e.target.value));
                  setActiveArchetype('custom');
                }}
                className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>2% Low Turnover</span>
                <span>7.5% Baseline</span>
                <span>15% High Absorption</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MULTI-YEAR TRAJECTORY & DEPARTMENTAL SHIFTS (7 cols - ~60%) */}
        <div className="col-span-12 md:col-span-7 flex flex-col gap-4">
          
          {/* Multi-Year Trajectory Chart Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Multi-Year Strategic Trajectory
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Baseline vs Simulated Target over FY26 - FY28
                  </p>
                </div>
              </div>

              {/* Chart Metric Selector */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('headcount')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeChartMetric === 'headcount'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Headcount
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('cost')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeChartMetric === 'cost'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  OpEx (LKR M)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('savings')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeChartMetric === 'savings'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Net Savings
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-[340px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={activeChartMetric === 'cost' ? '#10b981' : activeChartMetric === 'savings' ? '#9333ea' : '#2563eb'}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={activeChartMetric === 'cost' ? '#10b981' : activeChartMetric === 'savings' ? '#9333ea' : '#2563eb'}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  />
                  {activeChartMetric === 'headcount' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="baselineHC"
                        name="Frozen Baseline"
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        fill="url(#colorBaseline)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="simulatedHC"
                        name="Simulated Headcount"
                        stroke="#2563eb"
                        fill="url(#colorSimulated)"
                        strokeWidth={3}
                      />
                    </>
                  )}
                  {activeChartMetric === 'cost' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="baselineCost"
                        name="Baseline OpEx (LKR M)"
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        fill="url(#colorBaseline)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="simulatedCost"
                        name="Simulated OpEx (LKR M)"
                        stroke="#10b981"
                        fill="url(#colorSimulated)"
                        strokeWidth={3}
                      />
                    </>
                  )}
                  {activeChartMetric === 'savings' && (
                    <Area
                      type="monotone"
                      dataKey="savings"
                      name="Annual Net Savings (LKR M)"
                      stroke="#9333ea"
                      fill="url(#colorSimulated)"
                      strokeWidth={3}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-400"></span>
                  <span className="text-slate-500 font-medium">Frozen Baseline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-1 rounded-full ${
                    activeChartMetric === 'cost' ? 'bg-emerald-600' : activeChartMetric === 'savings' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}></span>
                  <span className="text-slate-800 font-bold">Simulated Horizon</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Values projected to Q4 FY28</span>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: FREEZE BASELINE SNAPSHOT */}
      {isFreezeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Freeze Baseline Snapshot</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Lock current metrics as an official comparison point</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFreezeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Input Form */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Snapshot Identifier Tag</label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Official Reference
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Lock size={14} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={freezeTag}
                    onChange={(e) => setFreezeTag(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 text-xs font-bold text-slate-800 bg-slate-50/80 border border-slate-200/90 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="e.g. FY26-Q4-Approved-Master"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1.5">
                  This snapshot tag acts as an immutable anchor in Fabric SQL Database for audit compliance.
                </p>
              </div>

              {/* Locked Metrics Cards */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Frozen Baseline Parameters
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {/* Card 1 */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Active Headcount
                    </span>
                    <div className="text-xl font-black text-slate-900 mt-1">
                      {baselineHC} <span className="text-xs font-semibold text-slate-400">FTEs</span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 w-fit mt-2">
                      100% Active Roster
                    </span>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Annual Run Cost
                    </span>
                    <div className="text-xl font-black text-emerald-600 mt-1">
                      LKR {baselineCostM}M
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit mt-2">
                      FY25 Approved OpEx
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsFreezeModalOpen(false)}
                className="h-10 px-5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFreezeModalOpen(false);
                  triggerToast(`Baseline Snapshot '${freezeTag}' successfully frozen.`);
                }}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Lock size={13} />
                <span>Confirm & Freeze</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROMOTE SCENARIO */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Promote to Target Operating Model</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Submit simulated workforce architecture for executive approval</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4">
              {/* Target Summary Cards */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Operating Model Impact Summary
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Target HC
                    </span>
                    <span className="text-lg font-black text-slate-900 block mt-0.5">
                      {simulatedHC}
                    </span>
                    <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 inline-block mt-1">
                      {hcDelta >= 0 ? `+${hcDelta}` : hcDelta} FTEs
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Net Savings
                    </span>
                    <span className="text-lg font-black text-emerald-600 block mt-0.5">
                      +LKR {annualSavingsM}M
                    </span>
                    <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                      {savingsPct}% / year
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Payback
                    </span>
                    <span className="text-lg font-black text-purple-700 block mt-0.5">
                      {paybackMonths} mo
                    </span>
                    <span className="text-[9.5px] font-bold text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200 inline-block mt-1">
                      ROI Compliant
                    </span>
                  </div>
                </div>
              </div>

              {/* Justification Field */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Executive Justification</label>
                <textarea
                  rows={3}
                  value={promoteJustification}
                  onChange={(e) => setPromoteJustification(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all leading-relaxed"
                  placeholder="Enter strategic rationale for executive board review..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                className="h-10 px-5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPromoteModalOpen(false);
                  triggerToast(`Scenario promoted to Target Operating Model. Audit trail updated.`);
                }}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <ShieldCheck size={14} />
                <span>Approve & Promote</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
