import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { 
  Users, Target, TrendingUp, Activity, ExternalLink, HeartPulse, 
  BrainCircuit, Sparkles, AlertTriangle, 
  Zap, ShieldAlert, Layers
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
import { mockDrillDownEmployees } from '../../dummy/organization/dashboardData';
import { useOrganizationMetrics, useOrganizationAnomalies, useOrganizationSkillShortages, useOrganizationRiskProfiles } from '../../hooks/useOrganization';
import api from '../../lib/api';

export const Dashboard: React.FC = () => {
  const [drillDownInfo, setDrillDownInfo] = useState<{ isOpen: boolean; title: string; category?: string; data?: any[] } | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  const { metrics, loading: metricsLoading } = useOrganizationMetrics();
  const { anomalies, loading: anomaliesLoading } = useOrganizationAnomalies();
  const { shortages, loading: shortagesLoading } = useOrganizationSkillShortages();
  const { riskProfiles, loading: risksLoading } = useOrganizationRiskProfiles();

  // History data
  const orgHistoryData = metrics && metrics.length > 0 ? metrics : [
    { month: 'Sep 25', totalHeadcount: 6201 },
    { month: 'Nov 25', totalHeadcount: 6350 },
    { month: 'Jan 26', totalHeadcount: 6501 },
    { month: 'Mar 26', totalHeadcount: 6600 },
    { month: 'May 26', totalHeadcount: 6680 },
    { month: 'Jul 26', totalHeadcount: 6720 },
  ];

  const latestMetric = orgHistoryData[orgHistoryData.length - 1];

  useEffect(() => {
    api.departments.list({ limit: 6 }).then(data => {
      if (data && data.length > 0) {
        setDepartments(data.map((d: any) => ({
          name: d.name.length > 12 ? d.name.substring(0, 10) + '..' : d.name,
          performanceScore: d.performance_score || Math.floor(Math.random() * 15) + 80,
        })));
      } else {
        setDepartments([
          { name: 'Customer Service', performanceScore: 90 },
          { name: 'Human Resources', performanceScore: 88 },
          { name: 'Engineering', performanceScore: 95 },
          { name: 'Sales', performanceScore: 85 },
          { name: 'Marketing', performanceScore: 92 },
          { name: 'Product', performanceScore: 94 },
        ]);
      }
    }).catch(() => {
      setDepartments([
        { name: 'Customer Service', performanceScore: 90 },
        { name: 'Human Resources', performanceScore: 88 },
        { name: 'Engineering', performanceScore: 95 },
        { name: 'Sales', performanceScore: 85 },
        { name: 'Marketing', performanceScore: 92 },
        { name: 'Product', performanceScore: 94 },
      ]);
    });
  }, []);

  // Anomalies
  const displayAnomalies = (anomalies && anomalies.length > 0) ? anomalies : [
    {
      title: 'Satisfaction Anomaly Flagged',
      description: 'Unsupervised anomaly model detected a statistically significant dip in employee satisfaction (z-score: -2.8).',
      color: 'rose',
      type: 'negative'
    },
    {
      title: 'Engineering Velocity Peak',
      description: 'Productivity score in Engineering is 92%, driven by recent Agile adoption and automation tools.',
      color: 'emerald',
      type: 'positive'
    },
    {
      title: 'Retention Stabilized',
      description: 'Attrition risk has decreased by 1.2% globally.',
      color: 'blue',
      type: 'info'
    }
  ];

  return (
    <div className="flex flex-col gap-6 relative pb-10 w-full">
      
      {/* ROW 1: 4 Executive KPI Cards ALWAYS in 1 SINGLE HORIZONTAL LINE */}
      <div className="flex flex-row items-center gap-4 w-full">
        
        {/* Card 1: Org Health Score */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Org Health Index Breakdown', category: 'Health' })}
          className="flex-1 min-w-0 bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgb(16,185,129,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#00c58e] shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shrink-0">
              <HeartPulse size={22} strokeWidth={2.5} />
            </div>
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
              <TrendingUp size={12} strokeWidth={3} /> +4 pts
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 mb-0.5 truncate">Org Health Score</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {metricsLoading ? '...' : (latestMetric?.enps || 43)}
              </h3>
              <span className="text-sm font-bold text-slate-400">/100</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Employees */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Active Workforce Distribution', category: 'Workforce' })}
          className="flex-1 min-w-0 bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgb(59,130,246,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#3b82f6] shadow-lg shadow-blue-500/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shrink-0">
              <Users size={22} strokeWidth={2.5} />
            </div>
            <div className="bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
              <TrendingUp size={12} strokeWidth={3} /> +2.4%
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 mb-0.5 truncate">Total Employees</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {metricsLoading ? '...' : (latestMetric?.totalHeadcount?.toLocaleString() || '6,700')}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 3: Productivity Score */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Departmental Productivity Index', category: 'Productivity' })}
          className="flex-1 min-w-0 bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgb(139,92,246,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#a855f7] shadow-lg shadow-purple-500/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shrink-0">
              <Target size={22} strokeWidth={2.5} />
            </div>
            <div className="bg-purple-50 border border-purple-100 text-purple-600 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
              <Activity size={12} strokeWidth={3} /> Stable
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 mb-0.5 truncate">Productivity Score</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {metricsLoading ? '...' : (latestMetric?.overallProductivityScore || 95)}
              </h3>
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Anomaly Flagged */}
        <div 
          onClick={() => setDrillDownInfo({ isOpen: true, title: 'Critical AI Anomaly Log', category: 'Anomalies' })}
          className="flex-1 min-w-0 bg-white rounded-[20px] p-5 border border-rose-100 shadow-[0_4px_20px_rgb(244,63,94,0.05)] hover:shadow-[0_10px_30px_rgb(244,63,94,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#ff4d4d] shadow-lg shadow-rose-500/30 flex items-center justify-center text-white group-hover:scale-105 transition-transform shrink-0">
              <Sparkles size={22} strokeWidth={2.5} />
            </div>
            <div className="bg-rose-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md shadow-rose-500/20 shrink-0">
              <AlertTriangle size={12} strokeWidth={3} /> High Alert
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-rose-500 mb-0.5 truncate">Anomaly Flagged</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-rose-600 tracking-tight">
                {anomaliesLoading ? '...' : (anomalies?.length || 2)}
              </h3>
              <span className="text-sm font-bold text-rose-400">/5</span>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: 3 Equal-Width Columns ALWAYS in 1 HORIZONTAL LINE */}
      <div className="flex flex-row gap-5 w-full">

        {/* Column 1: ML Anomaly Detection */}
        <div className="flex-1 min-w-0 flex flex-col bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[20px] p-5 h-[270px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
              <BrainCircuit size={16} />
            </div>
            <h3 className="text-sm font-bold text-purple-600">ML Anomaly Detection</h3>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1" style={{ scrollbarWidth: 'thin' }}>
            {displayAnomalies.map((anomaly, idx) => {
              let bgStyle = "bg-rose-50/70 border-rose-100";
              let dotStyle = "bg-rose-500";

              if (anomaly.color === 'emerald' || anomaly.type === 'positive') {
                bgStyle = "bg-emerald-50/70 border-emerald-100";
                dotStyle = "bg-emerald-500";
              } else if (anomaly.color === 'blue' || anomaly.type === 'info') {
                bgStyle = "bg-blue-50/70 border-blue-100";
                dotStyle = "bg-blue-500";
              }

              return (
                <div 
                  key={idx}
                  onClick={() => setDrillDownInfo({ isOpen: true, title: anomaly.title, category: 'Anomaly Detail' })}
                  className={`p-3.5 border rounded-xl flex gap-3 items-start hover:shadow-sm transition-all duration-200 cursor-pointer ${bgStyle}`}
                >
                  <div className="w-3 h-3 rounded-full shrink-0 mt-1 flex items-center justify-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotStyle}`}></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{anomaly.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{anomaly.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Department Performance */}
        <div className="flex-1 min-w-0 flex flex-col bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[20px] p-5 h-[270px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <h3 className="text-sm font-bold text-slate-800">Department Performance</h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="performanceScore" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column 3: Workforce Growth */}
        <div className="flex-1 min-w-0 flex flex-col bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[20px] p-5 h-[270px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <h3 className="text-sm font-bold text-slate-800">Workforce Growth</h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orgHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="totalHeadcount" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ROW 3: Predictive Analytics Grid (Skill Shortages & Talent Retention Risks) */}
      <div className="flex flex-row gap-5 w-full">
        
        {/* Predictive Skill Shortages Card */}
        <div className="flex-1 min-w-0 bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[20px] p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600"><Zap size={18} /></div>
              Predictive Skill Shortages
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">Next 12 Months</span>
          </div>

          <div className="flex flex-col gap-3">
            {shortagesLoading ? (
              <div className="text-center text-xs text-slate-400 py-4 font-bold">Analyzing workforce skills...</div>
            ) : shortages && shortages.length > 0 ? (
              shortages.slice(0, 3).map((shortage, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setDrillDownInfo({ isOpen: true, title: `Skill Gap: ${shortage.core_skill}`, category: 'Skill Shortage' })}
                  className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-orange-50/30 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="font-bold text-xs text-slate-700 group-hover:text-orange-700 truncate">{shortage.core_skill}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">Impacts {shortage.dept} Department</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-orange-600">+{shortage.shortfall_projection} needed</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Risk Score: {shortage.risk_score?.toFixed(1) || '4.2'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-slate-400 py-4 font-bold">No critical shortages predicted.</div>
            )}
          </div>
        </div>

        {/* Talent Retention Risks Card */}
        <div className="flex-1 min-w-0 bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[20px] p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600"><ShieldAlert size={18} /></div>
              Talent Retention Risks
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">High Risk</span>
          </div>

          <div className="flex flex-col gap-3">
            {risksLoading ? (
              <div className="text-center text-xs text-slate-400 py-4 font-bold">Evaluating retention probabilities...</div>
            ) : riskProfiles && riskProfiles.length > 0 ? (
              riskProfiles.filter(r => r.risk_level === 'High' || r.risk_level === 'Critical').slice(0, 3).map((risk, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setDrillDownInfo({ isOpen: true, title: `Retention Risk: EMP-${risk.employee_id}`, category: 'Retention Risk' })}
                  className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-rose-50/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 flex items-center justify-center text-[10px] font-black text-rose-600 shrink-0">
                      #{risk.employee_id?.replace('EMP-', '') || idx + 101}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-rose-600 truncate">{risk.primary_factor || 'High Workload'}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{risk.ai_retention_suggestion || 'Review workload & schedule'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      {((risk.burnout_probability || 0.85) * 100).toFixed(0)}%
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Burnout Risk</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-slate-400 py-4 font-bold">No high retention risks detected.</div>
            )}
          </div>
        </div>

      </div>

      {/* Drill-down Interactive Modal */}
      <Modal
        isOpen={!!drillDownInfo?.isOpen}
        onClose={() => setDrillDownInfo(null)}
        title={drillDownInfo?.title || 'Drill-down Inspection'}
      >
        <div className="flex flex-col gap-4 p-1">
          <div className="flex items-center gap-3 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs font-bold text-blue-900">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
              <Layers size={15} />
            </div>
            <div>
              <p>Granular breakdown for <span className="font-black text-blue-700">{drillDownInfo?.title}</span>.</p>
              <p className="text-[10px] text-blue-600/80 font-medium mt-0.5">Real-time telemetry and employee twin connections.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {mockDrillDownEmployees.map((emp) => (
              <div 
                key={emp.id} 
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-slate-50/80 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-[11px]">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                      {emp.name}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{emp.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Score: {emp.score}%
                  </span>
                  <Link 
                    to="/employee-twin" 
                    className="px-2.5 py-1 text-[11px] font-black bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-2xs flex items-center gap-1"
                  >
                    View Twin <ExternalLink size={11} />
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
