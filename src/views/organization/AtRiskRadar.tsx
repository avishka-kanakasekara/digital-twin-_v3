import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { BrainCircuit, Activity, Calendar, Compass, UserCheck, CheckCircle2, X, Target } from 'lucide-react';
import { TwinChatModal } from '../../components/TwinChatModal';

import { mockRiskyEmployees } from '../../dummy/organization/radarData';

export const AtRiskRadar: React.FC = () => {
  const [searchQuery] = useState('');
  const [chattingEmployee, setChattingEmployee] = useState<{ name: string; role: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const filteredEmployees = mockRiskyEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-8 relative min-h-screen">
      
      {/* Dynamic Multi-Color Background Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-emerald-400/15 rounded-full blur-[100px] -z-10"></div>

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[110] animate-slide-in">
          <div className="glass bg-gradient-to-r from-success/20 to-emerald-400/10 border-2 border-success/40 px-5 py-4 rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.2)] flex items-center gap-3 backdrop-blur-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <CheckCircle2 size={16}/>
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Intervention Logged</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-800 transition-colors ml-3 p-1 rounded-lg">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Top headers */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">At-Risk Radar & Interventions</h1>
          <p className="text-base text-slate-500 font-medium mt-0.5">Prioritized burnout and attrition risks powered by Uplift Modeling.</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Left Column: Uplift Insights & System Learning */}
        <div className="col-span-1 flex flex-col gap-6">
          
          {/* Intervention Effectiveness (Uplift ML Insights) */}
          <Card className="p-6 flex flex-col gap-5 glass border-white/60 rounded-3xl shadow-glass relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10"></div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <BrainCircuit size={16} className="text-primary"/> Intervention Effectiveness
              </h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Uplift ML Insights</p>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Engineering Roles */}
              <div className="p-4 bg-indigo-50/80 backdrop-blur-md rounded-2xl border border-indigo-200/60 shadow-sm hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] hover:-translate-y-1 transition-all cursor-default relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-1.5 h-full bg-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">Engineering Roles</span>
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-sm font-black text-slate-800">1:1 Check-ins</span>
                  <span className="text-xs font-bold text-indigo-700 bg-white/60 backdrop-blur-sm border border-indigo-200 px-2.5 py-1 rounded-lg shadow-sm">-18% Risk</span>
                </div>
                <p className="text-[10px] text-indigo-500/80 font-bold mt-2 uppercase tracking-wide">Highest historical ROI</p>
              </div>

              {/* Sales Roles */}
              <div className="p-4 bg-rose-50/80 backdrop-blur-md rounded-2xl border border-rose-200/60 shadow-sm hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)] hover:-translate-y-1 transition-all cursor-default relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-1.5 h-full bg-rose-400 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-widest">Sales Roles</span>
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-sm font-black text-slate-800">Quota Adjustment</span>
                  <span className="text-xs font-bold text-rose-700 bg-white/60 backdrop-blur-sm border border-rose-200 px-2.5 py-1 rounded-lg shadow-sm">-22% Risk</span>
                </div>
                <p className="text-[10px] text-rose-500/80 font-bold mt-2 uppercase tracking-wide">Effective if done early</p>
              </div>

              {/* Design Roles */}
              <div className="p-4 bg-teal-50/80 backdrop-blur-md rounded-2xl border border-teal-200/60 shadow-sm hover:shadow-[0_8px_30px_rgba(20,184,166,0.15)] hover:-translate-y-1 transition-all cursor-default relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-1.5 h-full bg-teal-400 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest">Design Roles</span>
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-sm font-black text-slate-800">Role/Project Shift</span>
                  <span className="text-xs font-bold text-teal-800 bg-white/60 backdrop-blur-sm border border-teal-200 px-2.5 py-1 rounded-lg shadow-sm">-15% Risk</span>
                </div>
                <p className="text-[10px] text-teal-600/80 font-bold mt-2 uppercase tracking-wide">Counteracts burnout</p>
              </div>

            </div>
          </Card>

          {/* System Learning */}
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 flex flex-col gap-3 shadow-sm rounded-3xl relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-70"></div>
            <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide z-10 text-indigo-900">
              <Compass size={16} className="text-indigo-500 animate-pulse" /> System Learning
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium z-10">
              Every action you log on this page feeds back into the causal ML model, making future recommendations more accurate.
            </p>
          </Card>
        </div>

        {/* Right Column: Urgent Interventions Queue */}
        <div className="col-span-2 flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-5 glass-panel bg-white/40 border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] relative overflow-hidden">
            {/* Subtle colorful backdrop for the right panel */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-rose-400/10 to-orange-400/10 rounded-full blur-[80px] -z-10"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full blur-[80px] -z-10"></div>
            
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <Activity size={16} className="text-rose-500"/> Urgent Interventions Queue
              </h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Sorted by Urgency (Risk × Impact)</p>
            </div>

            <div className="flex flex-col gap-5">
              {filteredEmployees.map((emp) => (
                <div key={emp.name} className="relative flex items-center gap-4 lg:gap-8 p-4 bg-white rounded-xl border border-subtle hover:border-gray-300 hover:shadow-md transition-all duration-200 group">
                  
                  {/* Glowing floating edge indicator */}
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1.5 rounded-r-md shadow-sm ${emp.urgency === 'High' ? 'bg-warning' : emp.urgency === 'Moderate' ? 'bg-info' : 'bg-danger'}`}></div>

                  {/* 1. Avatar & Info (Fixed width ensures metrics align perfectly across all rows) */}
                  <div className="flex items-center gap-3.5 w-[200px] lg:w-[240px] shrink-0 pl-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold shadow-sm ${emp.urgency === 'High' ? 'bg-warning' : emp.urgency === 'Moderate' ? 'bg-info' : 'bg-danger'}`}>
                      {emp.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-semibold text-primary text-sm whitespace-nowrap">{emp.name}</h4>
                      <p className="text-[11px] text-secondary mt-0.5 whitespace-nowrap">{emp.role}</p>
                    </div>
                  </div>

                  {/* 2. Metrics (Clean whitespace layout, no cluttered boxes) */}
                  <div className="flex flex-1 items-center gap-6 lg:gap-12">
                    
                    <div className="flex flex-col">
                      <span className="text-[10px] text-tertiary font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Activity size={12} className="text-info"/> Burnout
                      </span>
                      <span className="text-sm font-semibold text-primary">{emp.burnoutScore}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-tertiary font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Calendar size={12} className="text-danger"/> Attrition
                      </span>
                      <span className="text-sm font-semibold text-danger">{emp.attritionRisk}%</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-tertiary font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Target size={12} className="text-success"/> Performance
                      </span>
                      <span className="text-sm font-semibold text-primary">{emp.perfCurrent}</span>
                    </div>

                  </div>

                  {/* 3. Actions */}
                  <div className="flex items-center gap-2 shrink-0 pr-1">
                    {/* Secondary actions always visible for better UX */}
                    <div className="flex gap-1 transition-opacity duration-200">
                      <button 
                        onClick={() => triggerToast(`Scheduled 1:1 check-in with ${emp.name}.`)}
                        className="p-2 text-tertiary hover:text-info hover:bg-gray-100 rounded-lg transition-colors"
                        title="Schedule 1:1"
                      >
                        <Calendar size={16} />
                      </button>
                      <button 
                        onClick={() => triggerToast(`Logged direct reach out to ${emp.name}.`)}
                        className="p-2 text-tertiary hover:text-danger hover:bg-gray-100 rounded-lg transition-colors"
                        title="Reach Out"
                      >
                        <UserCheck size={16} />
                      </button>
                    </div>
                    
                    {/* Primary AI Action */}
                    <button 
                      onClick={() => setChattingEmployee({ name: emp.name, role: emp.role })}
                      className="bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold px-4 py-2 h-8 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap ml-2"
                    >
                      <BrainCircuit size={14} className="text-white" /> AI Insight
                    </button>
                  </div>

                </div>
              ))}
              
              {filteredEmployees.length === 0 && (
                <div className="text-center py-10 text-slate-500 font-semibold text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-white/30 backdrop-blur-sm">
                  <Activity size={24} className="mx-auto mb-2 text-slate-400 opacity-50" />
                  No employee matches your search criteria.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

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
