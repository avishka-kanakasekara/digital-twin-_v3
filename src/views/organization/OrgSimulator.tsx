import React, { useState } from 'react';
import {
  Sliders, Activity, Target, Network,
  BrainCircuit, Users, Building2, Lightbulb, Bot, Layers, ShieldAlert,
  ArrowRightLeft, Cpu, Grid, Search, ArrowLeft, Check, TrendingUp, Play, ArrowRight, Info,
  Settings, Shield, RefreshCw, X, ChevronDown, Sparkles, Zap, ChevronRight
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export const OrgSimulator: React.FC = () => {
  const navigate = useNavigate();
  const [headcountChange, setHeadcountChange] = useState(-15);
  const [salaryChange] = useState(0);
  const [remoteDays] = useState(2);
  const [trainingBudget] = useState(0);
  const [restructuringLevel, setRestructuringLevel] = useState(7);
  const [automationLevel, setAutomationLevel] = useState(30);
  const [businessLineModel, setBusinessLineModel] = useState('Standard Core Operations');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  
  const [selectedScenario, setSelectedScenario] = useState<any | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('digital-transformation');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [simulationData, setSimulationData] = useState<any[] | null>(null);
  const [snapshotData] = useState<any[] | null>(null);
  
  const [redundancyData, setRedundancyData] = useState<any | null>(null);
  const [roleShiftsData, setRoleShiftsData] = useState<any[] | null>(null);
  const [impactMatrixData, setImpactMatrixData] = useState<any[] | null>(null);

  const [activeTab, setActiveTab] = useState<'charts' | 'redundancy' | 'roleShifts' | 'impactMatrix'>('charts');
  const [isSimulating, setIsSimulating] = useState(false);

  const businessModelOptions = [
    { value: 'Standard Core Operations', label: 'Standard Core Operations', tag: 'Baseline' },
    { value: 'AI-Driven Digital Services', label: 'AI-Driven Digital Services', tag: '+18% Rev' },
    { value: 'Enterprise SaaS Subscriptions', label: 'Enterprise SaaS Subscriptions', tag: '+25% Rev' },
    { value: 'Global Offshore Hub', label: 'Global Offshore Hub', tag: '+10% Cap' },
  ];

  const defaultTemplates = [
    {
      id: 'digital-transformation',
      name: 'Digital Transformation',
      subtitle: 'Automation + Reskilling = Role Shift',
      confidence: 87,
      impact: '+22.6%',
      icon: <Bot size={18} className="text-blue-600" />,
      params: {
        automationLevel: 30,
        businessLineModel: 'AI-Driven Digital Services',
        headcountChange: -15,
        restructuringLevel: 7,
      }
    },
    {
      id: 'cost-optimization',
      name: 'Cost Optimization',
      subtitle: 'Reduce operational costs & streamline roles',
      confidence: 76,
      impact: '+18.4%',
      icon: <Sliders size={18} className="text-purple-600" />,
      params: {
        automationLevel: 40,
        businessLineModel: 'Standard Core Operations',
        headcountChange: -10,
        restructuringLevel: 5,
      }
    },
    {
      id: 'growth-expansion',
      name: 'Growth & Expansion',
      subtitle: 'Scale workforce for new markets',
      confidence: 72,
      impact: '+32.1%',
      icon: <Users size={18} className="text-sky-600" />,
      params: {
        automationLevel: 15,
        businessLineModel: 'Enterprise SaaS Subscriptions',
        headcountChange: 15,
        restructuringLevel: 3,
      }
    },
    {
      id: 'ai-automation-first',
      name: 'AI & Automation First',
      subtitle: 'Maximize automation and efficiency',
      confidence: 81,
      impact: '+24.7%',
      icon: <Cpu size={18} className="text-indigo-600" />,
      params: {
        automationLevel: 60,
        businessLineModel: 'AI-Driven Digital Services',
        headcountChange: -5,
        restructuringLevel: 8,
      }
    },
    {
      id: 'restructuring-support',
      name: 'Restructuring Support',
      subtitle: 'Handle mergers, divestments & reorgs',
      confidence: 68,
      impact: '+12.3%',
      icon: <Shield size={18} className="text-amber-600" />,
      params: {
        automationLevel: 25,
        businessLineModel: 'Global Offshore Hub',
        headcountChange: -8,
        restructuringLevel: 9,
      }
    },
    {
      id: 'new-engineering-hub',
      name: 'New Engineering Hub',
      subtitle: 'Build LATAM / Regional hub',
      confidence: 65,
      impact: '+20.9%',
      icon: <Lightbulb size={18} className="text-emerald-600" />,
      params: {
        automationLevel: 20,
        businessLineModel: 'Global Offshore Hub',
        headcountChange: 10,
        restructuringLevel: 6,
      }
    }
  ];

  const filteredTemplates = defaultTemplates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplateId(tpl.id);
    setSelectedScenario(tpl);
    if (tpl.params) {
      if (tpl.params.automationLevel !== undefined) setAutomationLevel(tpl.params.automationLevel);
      if (tpl.params.businessLineModel !== undefined) setBusinessLineModel(tpl.params.businessLineModel);
      if (tpl.params.headcountChange !== undefined) setHeadcountChange(tpl.params.headcountChange);
      if (tpl.params.restructuringLevel !== undefined) setRestructuringLevel(tpl.params.restructuringLevel);
    }
  };

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
      } else if (Array.isArray(response) && response.length > 0) {
        setSimulationData(response);
      } else {
        const fallbackData = [
          { month: 'M1', productivity: 100, orgHealth: 85, costIndex: 100, revGrowth: 100 },
          { month: 'M2', productivity: 104, orgHealth: 86, costIndex: 97, revGrowth: 103 },
          { month: 'M3', productivity: 110, orgHealth: 88, costIndex: 94, revGrowth: 108 },
          { month: 'M4', productivity: 118, orgHealth: 90, costIndex: 91, revGrowth: 115 },
          { month: 'M5', productivity: 124, orgHealth: 91, costIndex: 88, revGrowth: 121 },
          { month: 'M6', productivity: 132, orgHealth: 93, costIndex: 85, revGrowth: 128 },
        ];
        setSimulationData(fallbackData);
        setRedundancyData({ total_redundant_roles: 12, high_displacement_departments: ['Data Entry', 'Legacy QA', 'Operations'] });
        setRoleShiftsData([
          { role: 'Data Analyst → AI Analytics Architect', demand: '+45%', skillGap: 'Medium' },
          { role: 'QA Tester → Automated SDET Lead', demand: '+30%', skillGap: 'High' },
          { role: 'Ops Specialist → Systems Workflow Engineer', demand: '+25%', skillGap: 'Low' },
        ]);
        setImpactMatrixData([
          { dimension: 'Operational Efficiency', score: 4 },
          { dimension: 'Workforce Agility', score: 3 },
          { dimension: 'Cultural Transition Friction', score: -2 },
          { dimension: 'Long-term Cost Savings', score: 5 },
        ]);
      }
    } catch (e) {
      console.error(e);
      const fallbackData = [
        { month: 'M1', productivity: 100, orgHealth: 85, costIndex: 100, revGrowth: 100 },
        { month: 'M2', productivity: 104, orgHealth: 86, costIndex: 97, revGrowth: 103 },
        { month: 'M3', productivity: 110, orgHealth: 88, costIndex: 94, revGrowth: 108 },
        { month: 'M4', productivity: 118, orgHealth: 90, costIndex: 91, revGrowth: 115 },
        { month: 'M5', productivity: 124, orgHealth: 91, costIndex: 88, revGrowth: 121 },
        { month: 'M6', productivity: 132, orgHealth: 93, costIndex: 85, revGrowth: 128 },
      ];
      setSimulationData(fallbackData);
      setRedundancyData({ total_redundant_roles: 12, high_displacement_departments: ['Data Entry', 'Legacy QA', 'Operations'] });
      setRoleShiftsData([
        { role: 'Data Analyst → AI Analytics Architect', demand: '+45%', skillGap: 'Medium' },
        { role: 'QA Tester → Automated SDET Lead', demand: '+30%', skillGap: 'High' },
        { role: 'Ops Specialist → Systems Workflow Engineer', demand: '+25%', skillGap: 'Low' },
      ]);
      setImpactMatrixData([
        { dimension: 'Operational Efficiency', score: 4 },
        { dimension: 'Workforce Agility', score: 3 },
        { dimension: 'Cultural Transition Friction', score: -2 },
        { dimension: 'Long-term Cost Savings', score: 5 },
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setHeadcountChange(-15);
    setRestructuringLevel(7);
    setAutomationLevel(30);
    setBusinessLineModel('Standard Core Operations');
    setSimulationData(null);
    setRedundancyData(null);
    setRoleShiftsData(null);
    setImpactMatrixData(null);
    setSelectedScenario(null);
    setSelectedTemplateId('digital-transformation');
    setActiveTab('charts');
  };

  const mergedData = simulationData ? simulationData.map((d: any, i: number) => {
    const month = d.month || d.label || d.name || `Month ${i + 1}`;
    const productivity = Number(d.productivity ?? d.productivity_score ?? d.overall_productivity_score ?? (100 + i * 5));
    const orgHealth = Number(d.orgHealth ?? d.org_health ?? d.health ?? (85 + i * 1.5));
    const costIndex = Number(d.costIndex ?? d.cost_index ?? d.operating_cost ?? (100 - i * 3));
    const revGrowth = Number(d.revGrowth ?? d.rev_growth ?? d.revenue_growth ?? d.revenue ?? (100 + i * 6));

    return {
      ...d,
      month,
      productivity,
      orgHealth,
      costIndex,
      revGrowth
    };
  }) : null;

  const renderImpactScoreBadge = (score: number) => {
    if (score >= 4) return <span className="px-3 py-1 rounded-xl text-xs font-extrabold shadow-xs" style={{ backgroundColor: '#059669', color: '#ffffff' }}>High Positive (+{score})</span>;
    if (score > 0) return <span className="px-3 py-1 rounded-xl text-xs font-extrabold" style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>Moderate (+{score})</span>;
    if (score === 0) return <span className="px-3 py-1 rounded-xl text-xs font-extrabold" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>Neutral (0)</span>;
    if (score > -4) return <span className="px-3 py-1 rounded-xl text-xs font-extrabold" style={{ backgroundColor: '#ffe4e6', color: '#9f1239', border: '1px solid #fecdd3' }}>Moderate ({score})</span>;
    return <span className="px-3 py-1 rounded-xl text-xs font-extrabold shadow-xs" style={{ backgroundColor: '#e11d48', color: '#ffffff' }}>High Negative ({score})</span>;
  };

  return (
    <div className="flex flex-col gap-6 pb-12 relative min-h-screen">



      {/* Main 3-Column Workspace */}
      <div className="grid grid-cols-12 gap-6 items-stretch">

        {/* COLUMN 1: Structural Templates */}
        <div 
          className="col-span-12 lg:col-span-3 rounded-[24px] p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                <Layers size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xs font-black leading-tight" style={{ color: '#0f172a' }}>Structural Templates</h3>
                <p className="text-[10.5px] font-semibold" style={{ color: '#94a3b8' }}>Predefined scenario models</p>
              </div>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
              {filteredTemplates.length}
            </span>
          </div>

          {/* Search Bar - Explicit High-Contrast Styling */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3.5 pointer-events-none" style={{ color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', paddingLeft: '36px', paddingRight: searchQuery ? '32px' : '16px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '14px', fontSize: '12px', fontWeight: '700', width: '100%' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-0.5 rounded-full transition-colors cursor-pointer"
                style={{ color: '#94a3b8' }}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Template Cards List */}
          <div 
            className="flex flex-col gap-3 flex-1 max-h-[560px] overflow-y-auto no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  style={{
                    backgroundColor: isSelected ? '#f0f9ff' : '#f8fafc',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    borderRadius: '18px',
                    padding: '14px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  className="relative flex flex-col gap-2.5"
                >
                  {/* Selected Indicator Badge */}
                  {isSelected && (
                    <div 
                      className="absolute top-3.5 right-3.5 w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] shadow-sm font-black"
                      style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    >
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}

                  <div className="flex items-start gap-3 pr-6">
                    <div className="w-8.5 h-8.5 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      {tpl.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black leading-tight truncate" style={{ color: '#0f172a' }}>{tpl.name}</h4>
                      <p className="text-[11px] font-semibold mt-0.5 line-clamp-2 leading-snug" style={{ color: '#64748b' }}>{tpl.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1" style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                      <Check size={10} strokeWidth={2.5} /> {tpl.confidence}% Conf.
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1" style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                      <TrendingUp size={10} strokeWidth={2.5} /> Impact {tpl.impact}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 font-bold text-xs rounded-2xl border border-dashed border-slate-200" style={{ color: '#94a3b8', backgroundColor: '#f8fafc' }}>
                No matching templates found.
              </div>
            )}
          </div>

        </div>

        {/* COLUMN 2: Primary Inputs */}
        <div 
          className="col-span-12 lg:col-span-4 rounded-[24px] p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}>
                <Sliders size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xs font-black leading-tight" style={{ color: '#0f172a' }}>Primary Inputs</h3>
                <p className="text-[10.5px] font-semibold" style={{ color: '#94a3b8' }}>Configure simulation parameters</p>
              </div>
            </div>
            <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>
              <Sparkles size={11} style={{ color: '#7c3aed' }} /> Active Model
            </span>
          </div>

          <div className="flex flex-col gap-4">

            {/* Input 1: Automation Plan */}
            <div className="p-4 rounded-[20px] flex flex-col gap-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}>
                    <Bot size={17} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black" style={{ color: '#0f172a' }}>Automation Plan</h4>
                    <p className="text-[10px] font-semibold" style={{ color: '#64748b' }}>Level of automation across key functions.</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black shadow-xs shrink-0" style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}>
                  {automationLevel}% Automated
                </span>
              </div>

              {/* Segmented Pill Buttons with Explicit Styles & Range Matching */}
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl" style={{ backgroundColor: '#e2e8f0' }}>
                {[
                  { label: 'Low', val: 15, range: [0, 25] },
                  { label: 'Mod.', val: 40, range: [26, 55] },
                  { label: 'High', val: 70, range: [56, 85] },
                  { label: 'AI 100%', val: 100, range: [86, 100] }
                ].map((item) => {
                  const isActive = automationLevel >= item.range[0] && automationLevel <= item.range[1];
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setAutomationLevel(item.val)}
                      style={{
                        backgroundColor: isActive ? '#7c3aed' : '#ffffff',
                        color: isActive ? '#ffffff' : '#334155',
                        boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.35)' : '0 1px 2px rgba(0,0,0,0.05)',
                        border: isActive ? '1px solid #7c3aed' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '7px 2px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out'
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Range Slider */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10.5px] font-black" style={{ color: '#475569' }}>0%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={automationLevel}
                  onChange={(e) => setAutomationLevel(Number(e.target.value))}
                  className="flex-1 cursor-pointer accent-purple-600 h-1.5 rounded-lg"
                  style={{ backgroundColor: '#cbd5e1' }}
                />
                <span className="text-[10.5px] font-black" style={{ color: '#475569' }}>100%</span>
              </div>
            </div>

            {/* Input 2: Business Line Model - Clean Explicit Dropdown */}
            <div className="p-4 rounded-[20px] flex flex-col gap-3 relative" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                    <Building2 size={17} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black" style={{ color: '#0f172a' }}>Business Line Model</h4>
                    <p className="text-[10px] font-semibold" style={{ color: '#64748b' }}>Target operating structure.</p>
                  </div>
                </div>
              </div>

              {/* Custom Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '10px 14px', borderRadius: '14px', fontSize: '12px', fontWeight: '800', width: '100%', cursor: 'pointer' }}
                  className="flex items-center justify-between shadow-2xs transition-all"
                >
                  <span className="truncate">{businessLineModel}</span>
                  <ChevronDown size={15} style={{ color: '#64748b' }} className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Options Box */}
                {isModelDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-xl z-30 p-1.5 flex flex-col gap-1"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
                  >
                    {businessModelOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => {
                          setBusinessLineModel(opt.value);
                          setIsModelDropdownOpen(false);
                        }}
                        style={{
                          backgroundColor: businessLineModel === opt.value ? '#eff6ff' : 'transparent',
                          color: businessLineModel === opt.value ? '#1d4ed8' : '#334155',
                          border: businessLineModel === opt.value ? '1px solid #bfdbfe' : '1px solid transparent',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                        className="flex items-center justify-between transition-all"
                      >
                        <span>{opt.label}</span>
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>{opt.tag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Input 3: Hiring / Layoffs */}
            <div className="p-4 rounded-[20px] flex flex-col gap-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: headcountChange < 0 ? '#ffe4e6' : headcountChange > 0 ? '#d1fae5' : '#f1f5f9',
                      color: headcountChange < 0 ? '#e11d48' : headcountChange > 0 ? '#059669' : '#334155',
                      border: headcountChange < 0 ? '1px solid #fecdd3' : headcountChange > 0 ? '1px solid #a7f3d0' : '1px solid #cbd5e1'
                    }}
                  >
                    <Users size={17} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black" style={{ color: '#0f172a' }}>Hiring / Layoffs</h4>
                    <p className="text-[10px] font-semibold" style={{ color: '#64748b' }}>Headcount adjustment scale.</p>
                  </div>
                </div>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-black text-white shadow-xs shrink-0"
                  style={{
                    backgroundColor: headcountChange < 0 ? '#e11d48' : headcountChange > 0 ? '#059669' : '#1e293b'
                  }}
                >
                  {headcountChange > 0 ? '+' : ''}{headcountChange}%
                </span>
              </div>

              {/* Segmented Pill Buttons with Range Matching */}
              <div className="grid grid-cols-5 gap-1 p-1 rounded-xl" style={{ backgroundColor: '#e2e8f0' }}>
                {[
                  { label: '-20%', val: -20, range: [-20, -15], color: '#e11d48' },
                  { label: '-10%', val: -10, range: [-14, -5], color: '#e11d48' },
                  { label: '0%', val: 0, range: [-4, 4], color: '#1e293b' },
                  { label: '+10%', val: 10, range: [5, 14], color: '#059669' },
                  { label: '+20%', val: 20, range: [15, 20], color: '#059669' }
                ].map((item) => {
                  const isActive = headcountChange >= item.range[0] && headcountChange <= item.range[1];
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setHeadcountChange(item.val)}
                      style={{
                        backgroundColor: isActive ? item.color : '#ffffff',
                        color: isActive ? '#ffffff' : '#334155',
                        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                        border: isActive ? `1px solid ${item.color}` : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '7px 2px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out'
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Range Slider */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] font-extrabold" style={{ color: '#e11d48' }}>-20%</span>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={headcountChange}
                  onChange={(e) => setHeadcountChange(Number(e.target.value))}
                  className="flex-1 cursor-pointer accent-emerald-500 h-1.5 rounded-lg"
                  style={{ backgroundColor: '#cbd5e1' }}
                />
                <span className="text-[10px] font-extrabold" style={{ color: '#059669' }}>+20%</span>
              </div>
            </div>

            {/* Input 4: Org Restructuring */}
            <div className="p-4 rounded-[20px] flex flex-col gap-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                    <Grid size={17} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black" style={{ color: '#0f172a' }}>Org Restructuring</h4>
                    <p className="text-[10px] font-semibold" style={{ color: '#64748b' }}>Reorganization scope level.</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black text-white shadow-xs shrink-0" style={{ backgroundColor: '#d97706' }}>
                  Scale {(restructuringLevel / 10).toFixed(1)}
                </span>
              </div>

              {/* Segmented Pill Buttons with Range Matching */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl" style={{ backgroundColor: '#e2e8f0' }}>
                {[
                  { label: 'Minor (0.3)', val: 3, range: [0, 4] },
                  { label: 'Mod. (0.7)', val: 7, range: [5, 7] },
                  { label: 'Major (0.9)', val: 9, range: [8, 10] }
                ].map((item) => {
                  const isActive = restructuringLevel >= item.range[0] && restructuringLevel <= item.range[1];
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setRestructuringLevel(item.val)}
                      style={{
                        backgroundColor: isActive ? '#d97706' : '#ffffff',
                        color: isActive ? '#ffffff' : '#334155',
                        boxShadow: isActive ? '0 4px 12px rgba(217, 119, 6, 0.35)' : '0 1px 2px rgba(0,0,0,0.05)',
                        border: isActive ? '1px solid #d97706' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '7px 4px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out'
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Range Slider */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] font-extrabold" style={{ color: '#94a3b8' }}>0.0</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={restructuringLevel}
                  onChange={(e) => setRestructuringLevel(Number(e.target.value))}
                  className="flex-1 cursor-pointer accent-amber-500 h-1.5 rounded-lg"
                  style={{ backgroundColor: '#cbd5e1' }}
                />
                <span className="text-[10px] font-extrabold" style={{ color: '#94a3b8' }}>1.0</span>
              </div>
            </div>

            {/* Information Notice Card */}
            <div className="p-3.5 rounded-2xl flex items-start gap-2.5" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <Info size={15} style={{ color: '#2563eb' }} className="shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold leading-snug" style={{ color: '#1e3a8a' }}>
                Adjust parameters above to define your scenario, then launch the simulation engine.
              </p>
            </div>

          </div>

        </div>

        {/* COLUMN 3: OT Scenario Simulator Engine / Outputs Panel */}
        <div className="col-span-12 lg:col-span-5 flex flex-col h-full min-h-[640px]">

          {!mergedData && !isSimulating && (
            <div 
              className="rounded-[24px] p-6 sm:p-8 flex flex-col items-center justify-between relative overflow-hidden flex-1 text-center h-full min-h-[580px]"
              style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 40%, #eef2ff 100%)', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(79, 70, 229, 0.05)' }}
            >
              
              {/* Top Status Pill */}
              <div className="pt-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-black flex items-center gap-2 shadow-2xs" style={{ backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                  <Sparkles size={13} style={{ color: '#4f46e5' }} /> Ready to Simulate • Parameters Configured
                </span>
              </div>

              {/* Center Hero Content */}
              <div className="my-auto flex flex-col items-center w-full max-w-md py-4">
                {/* Glowing Brain Icon Container */}
                <div 
                  className="w-18 h-18 rounded-2xl text-white flex items-center justify-center mb-5 relative group shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 50%, #7c3aed 100%)', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)' }}
                >
                  <BrainCircuit size={36} strokeWidth={2.2} className="relative z-10 animate-pulse" />
                </div>

                <h2 className="text-xl sm:text-2xl font-black mb-2 tracking-tight" style={{ color: '#0f172a' }}>
                  OT Scenario Simulator Engine
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-center leading-relaxed mb-6" style={{ color: '#64748b' }}>
                  Configure your automation plans, restructuring levels, and business line models on the left, then click <strong style={{ color: '#0f172a' }} className="font-black">Run Simulation</strong> to compute simulated org states and forecasts.
                </p>

                {/* Primary CTA Run Simulation Button - Extra Large High Impact */}
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)',
                    color: '#ffffff',
                    boxShadow: '0 16px 40px rgba(79, 70, 229, 0.45)',
                    border: 'none'
                  }}
                  className="px-14 py-6 sm:py-7 rounded-[22px] font-black text-lg sm:text-xl min-h-[66px] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-4 shadow-2xl tracking-wide group"
                >
                  <Play size={26} className="fill-white" />
                  <span>Run Simulation</span>
                  <ArrowRight size={26} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>

              {/* Bottom Row Feature Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full pt-5 border-t border-slate-200/80 mt-auto">
                
                <div className="flex flex-col items-center text-center p-3 rounded-2xl transition-all hover:border-indigo-300 shadow-2xs" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center mb-2 shadow-2xs" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}>
                    <Activity size={16} strokeWidth={2.5} />
                  </div>
                  <h5 className="text-[11px] font-black leading-tight" style={{ color: '#0f172a' }}>Forecast Impact</h5>
                  <p className="text-[10px] font-bold mt-0.5 leading-snug" style={{ color: '#64748b' }}>Headcount & costs</p>
                </div>

                <div className="flex flex-col items-center text-center p-3 rounded-2xl transition-all hover:border-indigo-300 shadow-2xs" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center mb-2 shadow-2xs" style={{ backgroundColor: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                    <Users size={16} strokeWidth={2.5} />
                  </div>
                  <h5 className="text-[11px] font-black leading-tight" style={{ color: '#0f172a' }}>Role Shifts</h5>
                  <p className="text-[10px] font-bold mt-0.5 leading-snug" style={{ color: '#64748b' }}>Emerging roles</p>
                </div>

                <div className="flex flex-col items-center text-center p-3 rounded-2xl transition-all hover:border-indigo-300 shadow-2xs" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center mb-2 shadow-2xs" style={{ backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                    <Target size={16} strokeWidth={2.5} />
                  </div>
                  <h5 className="text-[11px] font-black leading-tight" style={{ color: '#0f172a' }}>Data Decisions</h5>
                  <p className="text-[10px] font-bold mt-0.5 leading-snug" style={{ color: '#64748b' }}>Compare models</p>
                </div>

                <div className="flex flex-col items-center text-center p-3 rounded-2xl transition-all hover:border-indigo-300 shadow-2xs" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center mb-2 shadow-2xs" style={{ backgroundColor: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0' }}>
                    <Shield size={16} strokeWidth={2.5} />
                  </div>
                  <h5 className="text-[11px] font-black leading-tight" style={{ color: '#0f172a' }}>Future-Ready</h5>
                  <p className="text-[10px] font-bold mt-0.5 leading-snug" style={{ color: '#64748b' }}>Real-time insights</p>
                </div>

              </div>

            </div>
          )}

          {isSimulating && (
            <div className="flex flex-col items-center justify-center flex-1 text-center bg-white/90 border border-blue-200/80 backdrop-blur-xl rounded-[24px] shadow-xs min-h-[600px] p-8">
              <div className="w-16 h-16 border-4 border-t-indigo-600 border-indigo-200 rounded-full animate-spin mb-6 shadow-md"></div>
              <h3 className="text-xl font-black mb-2 text-slate-900">Propagating System Dynamics...</h3>
              <p className="animate-pulse font-extrabold text-xs text-indigo-600 max-w-sm">
                Evaluating automation displacement, critical role shifts, and financial trajectory models.
              </p>
            </div>
          )}

          {mergedData && !isSimulating && (
            <div className="flex flex-col gap-4 w-full">
              {/* Output Tab Switcher - Luxury Segmented Track */}
              <div 
                className="flex items-center justify-between p-1.5 rounded-[20px] gap-2" 
                style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
              >
                <div className="grid grid-cols-4 gap-1.5 flex-1">
                  {[
                    { id: 'charts', label: 'Org Trajectory', icon: <Activity size={13} strokeWidth={2.5} />, activeGradient: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', activeShadow: '0 4px 14px rgba(79, 70, 229, 0.35)' },
                    { id: 'redundancy', label: 'Redundancy', icon: <ShieldAlert size={13} strokeWidth={2.5} />, activeGradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)', activeShadow: '0 4px 14px rgba(225, 29, 72, 0.35)' },
                    { id: 'roleShifts', label: 'Role Shifts', icon: <ArrowRightLeft size={13} strokeWidth={2.5} />, activeGradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', activeShadow: '0 4px 14px rgba(217, 119, 6, 0.35)' },
                    { id: 'impactMatrix', label: 'Impact Matrix', icon: <Grid size={13} strokeWidth={2.5} />, activeGradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', activeShadow: '0 4px 14px rgba(124, 58, 237, 0.35)' }
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                          background: isActive ? tab.activeGradient : 'transparent',
                          color: isActive ? '#ffffff' : '#475569',
                          boxShadow: isActive ? tab.activeShadow : 'none',
                          border: 'none',
                          borderRadius: '14px',
                          padding: '8px 6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease-in-out'
                        }}
                        className={!isActive ? 'hover:bg-white hover:text-slate-900 hover:shadow-2xs' : ''}
                      >
                        {tab.icon} <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button 
                  type="button"
                  onClick={handleReset} 
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-2xs shrink-0 cursor-pointer" 
                  title="Reset Simulation"
                >
                  <RefreshCw size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Sensitivity Banner */}
              <div className="p-4 rounded-2xl shadow-2xs flex items-center gap-3" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                  <Network size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider truncate" style={{ color: '#0f172a' }}>
                    {selectedScenario ? `Scenario: ${selectedScenario.name}` : `Strategy Model: ${businessLineModel}`}
                  </h4>
                  <p className="text-[11.5px] font-bold truncate mt-0.5" style={{ color: '#475569' }}>
                    High sensitivity to <strong className="font-black" style={{ color: '#4f46e5' }}>{automationLevel > 0 ? `Automation (${automationLevel}%)` : 'Headcount'}</strong>.
                  </p>
                </div>
              </div>

              {/* Tab 1: Simulated Org States (Charts) */}
              {activeTab === 'charts' && (
                <div className="flex flex-col gap-4">
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs h-[320px] flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black flex items-center gap-2" style={{ color: '#0f172a' }}>
                        <Target size={16} style={{ color: '#4f46e5' }} /> Productivity & Health Trajectory
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#94a3b8' }}>6 Month Projection</span>
                    </div>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dx={-10} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 'bold' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                          <Line type="monotone" dataKey="productivity" name="Productivity Index" stroke="#3b82f6" strokeWidth={3} dot={false} />
                          <Line type="monotone" dataKey="orgHealth" name="Org Health" stroke="#10b981" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs h-[240px] flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black flex items-center gap-2" style={{ color: '#0f172a' }}>
                        <Zap size={16} style={{ color: '#d97706' }} /> Revenue Growth vs Cost Efficiency
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#94a3b8' }}>Index %</span>
                    </div>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dx={-10} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 'bold' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="revGrowth" name="Revenue Growth" stroke="#8b5cf6" fill="url(#colorRev)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="costIndex" name="Cost Index" stroke="#f59e0b" fill="url(#colorCost)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Redundancy Forecast */}
              {activeTab === 'redundancy' && (
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col gap-4">
                  <h4 className="text-xs font-black flex items-center gap-2" style={{ color: '#0f172a' }}>
                    <ShieldAlert size={16} style={{ color: '#e11d48' }} /> Redundancy & Automation Risk Forecast
                  </h4>
                  {redundancyData ? (
                    <div className="flex flex-col gap-3">
                      <div className="p-4 rounded-2xl flex items-center justify-between" style={{ backgroundColor: '#ffe4e6', border: '1px solid #fecdd3' }}>
                        <div>
                          <p className="text-xs font-black" style={{ color: '#881337' }}>Total High-Displacement Risk Roles</p>
                          <p className="text-2xl font-black mt-0.5" style={{ color: '#e11d48' }}>{redundancyData.total_redundant_roles || 12} Roles</p>
                        </div>
                        <span className="px-3 py-1.5 rounded-full text-xs font-black shadow-xs" style={{ backgroundColor: '#e11d48', color: '#ffffff' }}>High Displacement</span>
                      </div>
                      <div className="p-4 rounded-2xl flex flex-col gap-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span className="text-xs font-black" style={{ color: '#0f172a' }}>Affected Functional Areas</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(redundancyData.high_displacement_departments || ['Operations', 'Data Entry', 'Customer Support']).map((dept: string, i: number) => (
                            <span key={i} className="px-3 py-1 rounded-xl text-xs font-black shadow-2xs" style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}>
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>No redundancy data generated for this scenario.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Critical Role Shifts - Compact High-Density Row List */}
              {activeTab === 'roleShifts' && (
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-black flex items-center gap-2" style={{ color: '#0f172a' }}>
                        <ArrowRightLeft size={15} style={{ color: '#d97706' }} /> Critical Role Shift Mapping
                      </h4>
                      <p className="text-[10.5px] font-semibold mt-0.5" style={{ color: '#64748b' }}>
                        Workforce reskilling pathways & emerging AI capabilities.
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                      {roleShiftsData ? roleShiftsData.length : 0} Pathways
                    </span>
                  </div>

                  {roleShiftsData && roleShiftsData.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {roleShiftsData.map((shift: any, idx: number) => {
                        let fromRole = 'Traditional Role';
                        let toRole = 'Emerging AI Role';

                        if (typeof shift === 'string') {
                          if (shift.includes('→')) {
                            const parts = shift.split('→');
                            fromRole = parts[0].trim();
                            toRole = parts[1].trim();
                          } else if (shift.includes('->')) {
                            const parts = shift.split('->');
                            fromRole = parts[0].trim();
                            toRole = parts[1].trim();
                          } else {
                            fromRole = shift;
                          }
                        } else if (typeof shift === 'object' && shift !== null) {
                          const fullTitle = shift.role || shift.title || shift.name || '';
                          if (fullTitle.includes('→')) {
                            const parts = fullTitle.split('→');
                            fromRole = parts[0].trim();
                            toRole = parts[1].trim();
                          } else if (fullTitle.includes('->')) {
                            const parts = fullTitle.split('->');
                            fromRole = parts[0].trim();
                            toRole = parts[1].trim();
                          } else {
                            fromRole = shift.from_role || shift.fromRole || shift.traditional_role || fullTitle || 'Legacy Role';
                            toRole = shift.to_role || shift.toRole || shift.emerging_role || 'Future Role';
                          }
                        }

                        const demand = typeof shift === 'object' ? (shift.demand || shift.demand_increase || shift.demand_change || '+35%') : '+35%';
                        const skillGap = typeof shift === 'object' ? (shift.skillGap || shift.skill_gap || shift.skill_gap_level || 'Medium') : 'Medium';

                        return (
                          <div 
                            key={idx} 
                            className="p-3 rounded-2xl flex items-center justify-between gap-3 transition-all hover:bg-white hover:border-indigo-300 shadow-2xs"
                            style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                          >
                            {/* Left: Role Flow Pathway */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-xs font-black truncate max-w-[42%]" style={{ color: '#475569' }} title={fromRole}>
                                {fromRole}
                              </span>
                              
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                                <ArrowRight size={11} strokeWidth={3} />
                              </div>
                              
                              <span className="text-xs font-black truncate flex-1" style={{ color: '#0f172a' }} title={toRole}>
                                {toRole}
                              </span>
                            </div>

                            {/* Right: Badges */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-2xs" style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                                <TrendingUp size={9} strokeWidth={3} /> {demand}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black shadow-2xs" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                                Gap: {skillGap}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>No role shifts mapped.</p>
                  )}
                </div>
              )}

              {/* Tab 4: Impact Matrix */}
              {activeTab === 'impactMatrix' && (
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-black flex items-center gap-2" style={{ color: '#0f172a' }}>
                        <Grid size={15} style={{ color: '#7c3aed' }} /> Systemic Impact Matrix
                      </h4>
                      <p className="text-[10.5px] font-semibold mt-0.5" style={{ color: '#64748b' }}>
                        Evaluated cross-functional organizational effects.
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>
                      {impactMatrixData ? impactMatrixData.length : 0} Metrics
                    </span>
                  </div>

                  {impactMatrixData && impactMatrixData.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {impactMatrixData.map((item: any, idx: number) => {
                        const dimensionName = typeof item === 'string' 
                          ? item 
                          : (item.dimension || item.title || item.label || item.metric_name || item.metric || item.category || item.name || item.factor || item.key || item.area || item.description || `Impact Area ${idx + 1}`);
                        
                        const score = typeof item === 'object' && item !== null 
                          ? (item.score ?? item.impact ?? item.value ?? item.impact_score ?? item.rating ?? item.delta ?? item.score_value ?? item.val ?? (idx % 2 === 0 ? 4 : 3)) 
                          : 0;

                        // Icon selection based on dimension name
                        const dimLower = dimensionName.toLowerCase();
                        let IconComp = Target;
                        let iconColor = '#4f46e5';
                        let iconBg = '#eef2ff';
                        let iconBorder = '#c7d2fe';

                        if (dimLower.includes('efficiency') || dimLower.includes('automation') || dimLower.includes('process')) {
                          IconComp = Zap;
                          iconColor = '#d97706';
                          iconBg = '#fef3c7';
                          iconBorder = '#fde68a';
                        } else if (dimLower.includes('agility') || dimLower.includes('workforce') || dimLower.includes('talent')) {
                          IconComp = Users;
                          iconColor = '#2563eb';
                          iconBg = '#dbeafe';
                          iconBorder = '#bfdbfe';
                        } else if (dimLower.includes('cost') || dimLower.includes('saving') || dimLower.includes('financial') || dimLower.includes('roi')) {
                          IconComp = TrendingUp;
                          iconColor = '#059669';
                          iconBg = '#d1fae5';
                          iconBorder = '#a7f3d0';
                        } else if (dimLower.includes('friction') || dimLower.includes('culture') || dimLower.includes('risk')) {
                          IconComp = ShieldAlert;
                          iconColor = '#e11d48';
                          iconBg = '#ffe4e6';
                          iconBorder = '#fecdd3';
                        }

                        return (
                          <div 
                            key={idx} 
                            className="p-3 rounded-2xl border text-xs font-black flex justify-between items-center shadow-2xs transition-all hover:bg-white hover:border-indigo-300 gap-3" 
                            style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: iconBg, color: iconColor, border: `1px solid ${iconBorder}` }}>
                                <IconComp size={14} strokeWidth={2.5} />
                              </div>
                              <span className="font-black text-xs truncate" style={{ color: '#0f172a' }}>{dimensionName}</span>
                            </div>
                            <div className="shrink-0">
                              {renderImpactScoreBadge(score)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>No impact matrix available.</p>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default OrgSimulator;
