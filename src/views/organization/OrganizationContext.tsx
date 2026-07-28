import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { 
  Briefcase, 
  Target, BrainCircuit, Leaf, CheckCircle, 
  ChevronRight, Flag, Bot, Cpu, Layers, Rocket, AlertTriangle, Activity
} from 'lucide-react';

import { mockOKRs, mockAIReadiness, mockCapabilities, mockTransformations } from '../../dummy/organization/contextData';

export const OrganizationContext: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'ai' | 'capability' | 'transformation'>('strategy');

  const tabs = [
    { id: 'strategy', label: 'Business Goals', icon: Target, desc: 'The strategic targets, KPIs, and ESG goals the company is aiming to achieve.' },
    { id: 'ai', label: 'AI Readiness', icon: Bot, desc: 'How prepared the workforce is to adopt AI and automation tools.' },
    { id: 'capability', label: 'Skills Map', icon: Layers, desc: 'A breakdown of current employee skills versus missing required skills.' },
    { id: 'transformation', label: 'Roadmap', icon: Rocket, desc: 'The timeline and progress of ongoing company upgrades and projects.' }
  ] as const;

  return (
    <div className="flex flex-col gap-6 relative w-full pb-4">
      <div 
        className="z-10 mb-2"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}
      >
        <div>
          <h1 className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">Organization Context</h1>
          <p className="text-sm text-slate-500 font-bold mt-1 bg-slate-100/80 inline-block px-3 py-1.5 rounded-lg border border-slate-200">
            {tabs.find(t => t.id === activeTab)?.desc}
          </p>
        </div>
        
        <div 
          className="overflow-x-auto" 
          style={{ 
            display: 'flex', 
            gap: '4px', 
            backgroundColor: 'rgba(241, 245, 249, 0.8)', 
            padding: '4px', 
            borderRadius: '16px', 
            border: '1px solid rgba(226, 232, 240, 0.8)', 
            scrollbarWidth: 'none' 
          }}
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="transition-all duration-300"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'white' : 'transparent',
                  color: isActive ? '#4f46e5' : '#64748b',
                  boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
                  transform: isActive ? 'translateY(-1px)' : 'none'
                }}
              >
                <Icon size={16} style={{ color: isActive ? '#6366f1' : '#94a3b8' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full">
        {activeTab === 'strategy' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="grid grid-cols-3 gap-6">
              
              <Card className="glass-panel p-6 flex flex-col gap-4 border border-[var(--border-subtle)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md" style={{ borderTopWidth: '4px', borderTopColor: 'var(--color-info)'}}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--bg-main)] rounded-lg flex items-center justify-center text-info shadow-sm border border-[var(--border-subtle)]"><Target size={16}/></div>
                  <h3 className="text-base font-bold text-primary">Vision & KPIs</h3>
                </div>
                <p className="text-sm text-secondary font-medium leading-relaxed bg-[var(--bg-main)]/50 p-3 rounded-lg border border-[var(--border-subtle)]">
                  Make our App the number 1 choice for local shops by next year.
                </p>
                <div className="mt-auto pt-4 border-t border-[var(--border-subtle)]">
                  <p className="text-[10px] font-bold text-tertiary uppercase tracking-wider mb-2">Main Targets</p>
                  <ul className="text-xs text-primary font-bold space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-success"/> Reach 10,000 active users</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-success"/> Get 5-star ratings from 90% of users</li>
                  </ul>
                </div>
              </Card>

              <Card className="glass-panel p-6 flex flex-col gap-4 border border-[var(--border-subtle)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md" style={{ borderTopWidth: '4px', borderTopColor: 'var(--color-secondary)'}}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--bg-main)] rounded-lg flex items-center justify-center text-secondary shadow-sm border border-[var(--border-subtle)]"><BrainCircuit size={16}/></div>
                  <h3 className="text-base font-bold text-primary">Tech & Team</h3>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-wider mb-2">App Features</p>
                    <ul className="text-xs text-primary font-semibold space-y-2">
                      <li className="flex items-center gap-2"><div className="rounded-full bg-secondary" style={{ width: '6px', height: '6px' }}></div> Auto-sort user messages</li>
                      <li className="flex items-center gap-2"><div className="rounded-full bg-secondary" style={{ width: '6px', height: '6px' }}></div> Make the app safe and easy to use</li>
                    </ul>
                  </div>
                  <div className="pt-3 border-t border-[var(--border-subtle)]">
                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-wider mb-2">Team Goals</p>
                    <ul className="text-xs text-primary font-semibold space-y-2">
                      <li className="flex items-center gap-2"><div className="rounded-full bg-secondary" style={{ width: '6px', height: '6px' }}></div> Move all our files to the Cloud</li>
                      <li className="flex items-center gap-2"><div className="rounded-full bg-secondary" style={{ width: '6px', height: '6px' }}></div> Work faster as a team</li>
                    </ul>
                  </div>
                </div>
              </Card>
              
              <Card className="glass-panel p-6 flex flex-col gap-4 border border-[var(--border-subtle)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md" style={{ borderTopWidth: '4px', borderTopColor: 'var(--color-success)'}}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--bg-main)] rounded-lg flex items-center justify-center text-success shadow-sm border border-[var(--border-subtle)]"><Leaf size={16}/></div>
                  <h3 className="text-base font-bold text-primary">Good Habits</h3>
                </div>
                <ul className="text-xs text-primary font-semibold space-y-2 mt-1">
                  <li className="flex items-start gap-2 bg-[var(--bg-main)]/50 p-2.5 rounded-lg border border-[var(--border-subtle)]">
                    <div className="mt-1 rounded-sm bg-success shrink-0" style={{ width: '6px', height: '6px' }}></div>
                    <span>Plant 100 trees this year</span>
                  </li>
                  <li className="flex items-start gap-2 bg-[var(--bg-main)]/50 p-2.5 rounded-lg border border-[var(--border-subtle)]">
                    <div className="mt-1 rounded-sm bg-success shrink-0" style={{ width: '6px', height: '6px' }}></div>
                    <span>Give everyone equal chances</span>
                  </li>
                  <li className="flex items-start gap-2 bg-[var(--bg-main)]/50 p-2.5 rounded-lg border border-[var(--border-subtle)]">
                    <div className="mt-1 rounded-sm bg-success shrink-0" style={{ width: '6px', height: '6px' }}></div>
                    <span>Stop using plastic in the office</span>
                  </li>
                </ul>
              </Card>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
                  <div className="p-1 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)] shadow-sm"><Flag size={18} className="text-info" /></div>
                  Quarterly OKRs Tracking
                </h2>
                <div className="text-xs font-bold text-primary bg-white px-3 py-1 rounded-lg border border-[var(--border-subtle)] shadow-sm flex items-center gap-1.5">
                  <Activity size={14} className="text-info"/> Q2 2026 Active
                </div>
              </div>

              <div className="grid grid-cols-3" style={{ gap: '24px' }}>
                {mockOKRs.map((okr) => (
                  <Card key={okr.id} className="flex flex-col group transition-all duration-300 hover:shadow-xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl" style={{ padding: '0', border: '1px solid #e0e7ff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    
                    {/* Top Section */}
                    <div style={{ padding: '24px 24px 20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1" style={{ paddingRight: '12px' }}>
                          <h3 className="text-sm font-black tracking-tight mt-1" style={{ color: '#1e293b', marginBottom: '8px' }}>{okr.title}</h3>
                          <p className="flex items-center" style={{ gap: '6px', fontSize: '10px', fontWeight: '800', color: '#64748b' }}>
                            Owner: <span style={{ color: '#4f46e5', backgroundColor: '#eef2ff', padding: '2px 6px', borderRadius: '6px', border: '1px solid #c7d2fe' }}>{okr.owner}</span>
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end shrink-0">
                          <span style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.05em' }}>{okr.progress}<span style={{ fontSize: '12px', color: '#94a3b8' }}>%</span></span>
                          {okr.status === 'at-risk' ? (
                            <span className="shadow-sm" style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecaca', marginTop: '4px' }}>At Risk</span>
                          ) : (
                            <span className="shadow-sm" style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', marginTop: '4px' }}>On Track</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Section */}
                    <div className="flex flex-col flex-1" style={{ padding: '20px 24px 24px 24px', gap: '20px' }}>
                      
                      {/* Progress Bar */}
                      <div className="w-full rounded-full overflow-hidden shadow-inner border relative" style={{ height: '24px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0', padding: '3px' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            borderRadius: '9999px', 
                            background: okr.status === 'at-risk' ? 'linear-gradient(90deg, #f87171 0%, #dc2626 100%)' : 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                            width: `${okr.progress}%`,
                            boxShadow: okr.status === 'at-risk' ? '0 0 12px rgba(220, 38, 38, 0.4)' : '0 0 12px rgba(16, 185, 129, 0.4)',
                            transition: 'width 1s ease-in-out'
                          }}
                        >
                          {/* Inner Shine */}
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)', borderRadius: '9999px 9999px 0 0' }}></div>
                        </div>
                      </div>

                      {/* Initiatives */}
                      <div className="flex flex-col flex-1" style={{ gap: '12px' }}>
                        <p style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>Key Initiatives</p>
                        <ul className="flex flex-col" style={{ gap: '12px' }}>
                          {okr.initiatives.map((init, idx) => (
                            <li key={idx} className="flex items-start" style={{ gap: '8px' }}>
                              <CheckCircle size={14} style={{ marginTop: '2px', color: okr.progress > 50 ? '#10b981' : '#94a3b8' }} className="shrink-0" />
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', lineHeight: '1.4' }}>{init}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="flex flex-col animate-fade-in" style={{ gap: '24px' }}>
            {/* Top Header Card - Light, Clean, Airy */}
            <Card className="p-0 rounded-3xl overflow-hidden relative bg-white/90 backdrop-blur-xl" style={{ border: '1px solid #e0e7ff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
              {/* Subtle background glows */}
              <div className="absolute top-0 right-0 pointer-events-none -translate-y-1/2 translate-x-1/3" style={{ width: '400px', height: '400px', backgroundColor: '#eef2ff', borderRadius: '50%', filter: 'blur(64px)' }}></div>
              <div className="absolute bottom-0 left-0 pointer-events-none translate-y-1/2 -translate-x-1/2" style={{ width: '256px', height: '256px', backgroundColor: '#eff6ff', borderRadius: '50%', filter: 'blur(64px)' }}></div>
              
              <div className="relative z-10 flex items-center justify-between" style={{ padding: '24px', gap: '24px' }}>
                <div className="flex items-center flex-1" style={{ gap: '20px' }}>
                  <div className="rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ width: '56px', height: '56px', minWidth: '56px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                    <Bot size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-800" style={{ marginBottom: '4px' }}>AI Readiness Index</h2>
                    <p className="text-xs font-semibold text-slate-500 max-w-lg leading-relaxed">
                      A holistic evaluation of your organization's AI adoption signals, workforce literacy, and potential for automation.
                    </p>
                  </div>
                </div>
                
                {/* Score Blocks */}
                <div className="flex items-center rounded-2xl bg-white/60 shadow-sm shrink-0" style={{ border: '1px solid #f1f5f9', padding: '16px 24px', gap: '24px' }}>
                  <div className="text-center flex flex-col items-center">
                    <span className="text-3xl font-black tracking-tighter" style={{ color: '#4f46e5' }}>
                      {mockAIReadiness.overallScore}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Overall Score</span>
                  </div>
                  <div style={{ width: '1px', height: '40px', backgroundColor: '#e2e8f0' }}></div>
                  <div className="text-center flex flex-col items-center">
                    <span className="text-xl font-black tracking-tight" style={{ color: '#334155' }}>{mockAIReadiness.literacyScore}</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Literacy</span>
                  </div>
                  <div style={{ width: '1px', height: '40px', backgroundColor: '#e2e8f0' }}></div>
                  <div className="text-center flex flex-col items-center">
                    <span className="text-xl font-black tracking-tight" style={{ color: '#334155' }}>{mockAIReadiness.adoptionScore}</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Adoption</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <div className="grid grid-cols-3" style={{ gap: '20px' }}>
              {/* Automation Opportunities */}
              <Card className="col-span-2 p-0 flex flex-col rounded-3xl overflow-hidden shadow-lg bg-white/85 backdrop-blur-xl" style={{ border: '1px solid #f1f5f9' }}>
                <div className="flex items-center bg-slate-50/50" style={{ padding: '16px 20px', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #ea580c 100%)' }}>
                    <Cpu size={16}/>
                  </div>
                  <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight">High-Yield Automation</h3>
                </div>
                
                <div className="flex flex-col" style={{ padding: '16px', gap: '12px' }}>
                  {mockAIReadiness.automationOpportunities.map((opp, idx) => (
                    <div key={idx} className="group flex items-center justify-between rounded-2xl hover:bg-slate-50 transition-all duration-300" style={{ padding: '12px 16px', border: '1px solid #f8fafc', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                      <div className="flex items-center" style={{ gap: '16px' }}>
                        <div className="rounded-full flex items-center justify-center shrink-0 text-white shadow-sm" style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
                          <span className="text-[11px] font-black">{idx + 1}</span>
                        </div>
                        <div className="flex flex-col">
                          <h4 className="font-extrabold text-[13px] tracking-tight" style={{ color: '#1e293b' }}>{opp.role}</h4>
                          <span className="text-[10px] font-bold mt-0.5 flex items-center" style={{ color: '#64748b', gap: '6px' }}>
                            <Layers size={10} style={{ color: '#94a3b8' }} /> {opp.department}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col shrink-0" style={{ width: '160px', gap: '8px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Susceptibility</span>
                          <span style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.05em', color: '#ea580c' }}>{opp.potential}%</span>
                        </div>
                        <div style={{ width: '100%', height: '24px', backgroundColor: '#f8fafc', borderRadius: '9999px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)', padding: '3px', border: '1px solid #e2e8f0', position: 'relative' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              borderRadius: '9999px', 
                              background: 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                              width: `${opp.potential}%`,
                              transition: 'width 1s ease-in-out',
                              boxShadow: '0 0 12px rgba(234, 88, 12, 0.3)'
                            }}
                          >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)', borderRadius: '9999px 9999px 0 0' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              
              {/* Active AI Projects */}
              <Card className="col-span-1 p-0 flex flex-col rounded-3xl overflow-hidden shadow-lg bg-white/85 backdrop-blur-xl" style={{ border: '1px solid #f1f5f9' }}>
                <div className="flex items-center bg-slate-50/50" style={{ padding: '16px 20px', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)' }}>
                    <BrainCircuit size={16}/>
                  </div>
                  <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Active AI Projects</h3>
                </div>
                
                <div className="flex flex-col" style={{ padding: '16px', gap: '12px' }}>
                  {mockAIReadiness.deptProjects.map((dp, idx) => {
                    const gradients = [
                      'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald
                      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
                      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'  // Purple
                    ];
                    const gradient = gradients[idx % gradients.length];
                    
                    return (
                      <div key={idx} className="flex items-center justify-between rounded-2xl bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group" style={{ padding: '12px 16px', border: '1px solid #f1f5f9' }}>
                        <div className="flex items-center" style={{ gap: '12px' }}>
                          <div className="rounded-full text-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform" style={{ width: '28px', height: '28px', background: gradient }}>
                            <Layers size={12} />
                          </div>
                          <span className="text-[12px] font-bold" style={{ color: '#334155' }}>{dp.dept}</span>
                        </div>
                        <div className="flex items-center justify-center bg-slate-50 font-black text-[11px] rounded-lg shadow-sm group-hover:bg-slate-100 transition-colors" style={{ padding: '4px 10px', color: '#475569', border: '1px solid #e2e8f0' }}>
                          {dp.count}
                        </div>
                      </div>
                    )
                  })}
                  
                  <button className="w-full rounded-2xl border-dashed font-bold text-[10px] uppercase tracking-widest transition-all" style={{ padding: '12px', marginTop: '4px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                    + Add Project
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'capability' && (
          <div className="flex flex-col animate-fade-in" style={{ gap: '24px' }}>
            <div className="flex items-center" style={{ gap: '16px', marginBottom: '8px' }}>
              <div className="rounded-2xl flex items-center justify-center text-white shadow-md shrink-0" style={{ width: '56px', height: '56px', minWidth: '56px', background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' }}>
                <Layers size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ marginBottom: '4px' }}>Business Capability Map</h2>
                <p className="text-xs font-semibold text-slate-500">Identify critical skill gaps linked to business goals and maturity.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2" style={{ gap: '24px' }}>
              {mockCapabilities.map((cap, idx) => (
                <Card key={idx} className="flex flex-col group transition-all duration-300 hover:shadow-xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl" style={{ padding: '0', border: '1px solid #e0e7ff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  
                  {/* Top Section */}
                  <div style={{ padding: '24px 24px 20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>{cap.type} Capability</span>
                        <h3 className="text-[17px] font-black tracking-tight mt-1" style={{ color: '#1e293b' }}>{cap.name}</h3>
                      </div>
                      {cap.gap > 0 ? (
                        <span className="flex items-center shadow-sm" style={{ gap: '4px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#fef2f2', color: '#dc2626', padding: '6px 10px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                          <AlertTriangle size={12} /> Gap Detected
                        </span>
                      ) : (
                        <span className="flex items-center shadow-sm" style={{ gap: '4px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '6px 10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          <CheckCircle size={12} /> Optimized
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="grid grid-cols-2" style={{ padding: '20px 24px', gap: '24px' }}>
                    
                    {/* Maturity Level */}
                    <div className="flex flex-col justify-end" style={{ gap: '8px' }}>
                      <div className="flex justify-between items-end w-full">
                        <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>Maturity Level</span>
                        <div className="flex items-baseline" style={{ gap: '2px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.05em', color: '#3b82f6' }}>{cap.maturity}</span>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#cbd5e1' }}>/5</span>
                        </div>
                      </div>
                      <div className="w-full rounded-full overflow-hidden shadow-inner border relative" style={{ height: '24px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0', padding: '3px' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            borderRadius: '9999px', 
                            background: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
                            width: `${(cap.maturity / 5) * 100}%`,
                            boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)'
                          }}
                        >
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)', borderRadius: '9999px 9999px 0 0' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Skill Gap Impact */}
                    <div className="flex flex-col justify-end" style={{ gap: '8px' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>Skill Gap Impact</span>
                      <div className="flex items-center" style={{ gap: '8px', height: '21px' }}>
                        <div 
                          className={cap.gap > 1 ? 'animate-pulse' : ''} 
                          style={{ 
                            width: '10px', height: '10px', borderRadius: '50%', 
                            backgroundColor: cap.gap > 1 ? '#ef4444' : cap.gap === 1 ? '#f59e0b' : '#10b981',
                            boxShadow: cap.gap > 1 ? '0 0 6px #ef4444' : cap.gap === 1 ? '0 0 6px #f59e0b' : '0 0 6px #10b981'
                          }}
                        ></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: cap.gap > 1 ? '#ef4444' : cap.gap === 1 ? '#f59e0b' : '#10b981' }}>
                          {cap.gap > 1 ? 'High Risk' : cap.gap === 1 ? 'Medium Risk' : 'None'}
                        </span>
                      </div>
                    </div>
                    
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transformation' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
              <div className="rounded-2xl flex items-center justify-center text-white shadow-md border border-indigo-400 shrink-0" style={{ width: '48px', height: '48px', minWidth: '48px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
                <Rocket size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Transformation Roadmap</h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">Active organizational transformation initiatives and scorecards.</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-5">
              {mockTransformations.map((trans) => (
                <Card key={trans.id} className="p-0 flex flex-col group transition-all duration-300 hover:shadow-xl rounded-2xl border border-slate-200 overflow-hidden bg-white/90 backdrop-blur-md">
                  <div className="flex flex-col">
                    {/* Top Section */}
                    <div className="p-5 relative">
                      {/* Soft background glow */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: trans.status === 'at-risk' ? 'linear-gradient(to right, #fef2f2, transparent)' : 'linear-gradient(to right, #ecfdf5, transparent)' }}></div>
                      
                      {/* Edge Indicator */}
                      <div className="absolute left-0 top-0 h-full w-1" style={{ background: trans.status === 'at-risk' ? '#ef4444' : '#10b981' }}></div>
                      
                      <div className="flex justify-between items-center pl-3 relative z-10">
                        <div className="flex flex-col gap-2">
                          <div>
                            {trans.status === 'at-risk' ? (
                              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm text-red-600 bg-red-50 border-red-200">At Risk</span>
                            ) : (
                              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm text-emerald-600 bg-emerald-50 border-emerald-200">On Track</span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 tracking-tight">{trans.name}</h3>
                          <div className="flex items-center text-xs font-medium text-slate-500 mt-0.5">
                            <Briefcase size={14} className="mr-1.5 text-slate-400" /> 
                            <span>Lead: <span className="text-slate-700 font-semibold">{trans.owner}</span></span>
                          </div>
                        </div>
                        
                        <div className="text-right w-48">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Progress</span>
                            <span className="text-lg font-black text-slate-800 tracking-tight">{trans.progress}%</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-200 bg-slate-100">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 relative"
                              style={{ 
                                width: `${trans.progress}%`, 
                                background: trans.status === 'at-risk' ? 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)' : 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                                boxShadow: trans.status === 'at-risk' ? '0 0 8px rgba(239, 68, 68, 0.4)' : '0 0 8px rgba(16, 185, 129, 0.4)'
                              }}
                            >
                              <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 skew-x-12 animate-[shimmer_2s_infinite]"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Section - Timeline */}
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-500">
                        <Activity size={14} className="text-blue-500"/> Milestone Tracker
                      </p>
                      
                      <div className="relative ml-2">
                        {/* Vertical Line perfectly centered with 32px circles -> left is 15px */}
                        <div className="absolute top-4 bottom-4 bg-slate-200 -z-10 rounded-full" style={{ left: '15px', width: '2px' }}></div>
                        
                        <div className="flex flex-col gap-4">
                          {trans.milestones.map((ms, idx) => (
                            <div key={idx} className="flex items-center gap-4 transition-all duration-300 group">
                              <div className="rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 relative z-10 transition-colors bg-white" style={{ 
                                  width: '32px',
                                  height: '32px',
                                  minWidth: '32px',
                                  backgroundColor: ms.completed ? '#10b981' : 'white',
                                  color: ms.completed ? 'white' : '#94a3b8',
                                  borderColor: ms.completed ? '#10b981' : '#e2e8f0'
                              }}>
                                {ms.completed ? <CheckCircle size={16} strokeWidth={2.5} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                              </div>
                              
                              <div className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md bg-white cursor-pointer" style={{
                                borderColor: ms.completed ? '#a7f3d0' : '#e2e8f0',
                                boxShadow: ms.completed ? '0 2px 4px -1px rgba(16, 185, 129, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                              }}>
                                <span className="text-sm font-semibold" style={{ color: ms.completed ? '#065f46' : '#334155' }}>
                                  {ms.name}
                                </span>
                                {!ms.completed && (
                                  <div className="text-slate-400 group-hover:text-indigo-500 transition-colors bg-slate-50 group-hover:bg-indigo-50 p-1.5 rounded-md">
                                    <ChevronRight size={14} />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

