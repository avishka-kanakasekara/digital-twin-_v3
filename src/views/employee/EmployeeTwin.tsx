import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useDigitalTwin } from './hooks/useDigitalTwin';
import { EmployeeSelector } from '../../components/EmployeeSelector';
import './PersonalDashboard.css';

import { IdentityProfile } from './components/twin/IdentityProfile';
import { EmployeeAnalyticsCharts } from './components/twin/EmployeeAnalyticsCharts';

export const EmployeeTwin: React.FC = () => {
  const {
    profile,
    updateProfile,
    gamification,
    twinSummary,
  } = useDigitalTwin();

  const twinHealth =
    (twinSummary as any)?.twinHealth ||
    (twinSummary as any)?.twin_health ||
    Math.round((twinSummary as any)?.aiConfidence || 0) || 94;

  return (
    <div className="flex flex-col gap-5 text-left w-full pb-16">
      {/* Executive Page Header Bar */}
      <div className="flex flex-col gap-1 w-full pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full py-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Employee Digital Twin
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Twin Active
            </span>
          </div>

          {/* Clean Right Toolbar with Employee Selector */}
          <div className="flex items-center gap-2.5">
            <EmployeeSelector />
          </div>
        </div>
        <p className="text-xs font-medium text-slate-500 text-left">
          Unified executive telemetry — real-time competency architecture, cognitive workload health, and career progression horizon.
        </p>
      </div>

      {/* 1. Identity & Capability Profile Blueprint */}
      <IdentityProfile
        profile={profile}
        onUpdate={updateProfile}
        twinHealth={twinHealth}
        gamification={gamification}
      />

      {/* 2. Core Visual Telemetry & Analytics Charts */}
      <EmployeeAnalyticsCharts
        profile={profile}
        gamification={gamification}
        twinHealth={twinHealth}
      />

      {/* 3. Executive Operational Telemetry & Growth Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* Left Card: AI Recommended Growth Actions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">AI Recommended Next Actions</h4>
                  <p className="text-[11px] text-slate-500">Autonomous growth pathways aligned with L5 Staff Architect horizon</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                3 Strategic Actions
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Action 1 */}
              <div className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 transition-all flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800">TARGET ROLE</span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">Complete MLOps CI/CD Production Module</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Closes remaining 7% competency gap for L5 Staff Architect</p>
                </div>
                <span className="shrink-0 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  +15% Fit
                </span>
              </div>

              {/* Action 2 */}
              <div className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 transition-all flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800">MARKETPLACE GIG</span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">Feature Store Pilot — Data Pipelines</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Internal stretch assignment (8 weeks • 20% commitment)</p>
                </div>
                <span className="shrink-0 text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  84% Match
                </span>
              </div>

              {/* Action 3 */}
              <div className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 transition-all flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100/70 text-indigo-800">KNOWLEDGE SYNC</span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">Synchronize Enterprise Inference Whitepaper</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ingest recent technical assets to boost digital twin depth</p>
                </div>
                <span className="shrink-0 text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Digital Twin Telemetry & Collaboration */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Digital Twin Telemetry & Collaboration</h4>
                  <p className="text-[11px] text-slate-500">Live capability synchronization and organizational connectivity</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                94% Verified Sync
              </span>
            </div>

            {/* 3 Status Rows */}
            <div className="flex flex-col gap-2 mb-3.5">
              <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-600 text-[11px]">Availability Status</span>
                <span className="font-bold text-[11px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  Active • Sprint Dedicated
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-600 text-[11px]">Primary Work Mode</span>
                <span className="font-bold text-[11px] text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                  Async First (Digital Twin Enabled)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-600 text-[11px]">Core Domain Expertise</span>
                <span className="font-bold text-[11px] text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-md">
                  AI & Cloud Platform Architecture
                </span>
              </div>
            </div>

            {/* 4 Telemetry Mini Metric Blocks */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Twin Health</span>
                <span className="text-sm font-black text-slate-900 mt-0.5">94% Active</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">Continuous Mesh Telemetry</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Confidence</span>
                <span className="text-sm font-black text-slate-900 mt-0.5">91% High</span>
                <span className="text-[10px] text-blue-600 font-semibold mt-0.5">High Inference Precision</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profile Completeness</span>
                <span className="text-sm font-black text-slate-900 mt-0.5">92% Verified</span>
                <span className="text-[10px] text-purple-600 font-semibold mt-0.5">5 Connected Sources</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peer Benchmarking</span>
                <span className="text-sm font-black text-slate-900 mt-0.5">Top 12%</span>
                <span className="text-[10px] text-amber-600 font-semibold mt-0.5">Enterprise L4/L5 Band</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
