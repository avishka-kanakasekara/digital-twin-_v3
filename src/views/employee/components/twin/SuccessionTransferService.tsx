import React, { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, FileText, Clock, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HandoverTask {
  id: string;
  title: string;
  category: 'Documentation' | 'Shadowing' | 'Technical Runbook' | 'Sign-off';
  successor: string;
  status: 'completed' | 'in_progress' | 'pending';
  dueDate: string;
}

export const SuccessionTransferService: React.FC = () => {
  const [tasks, setTasks] = useState<HandoverTask[]>([
    {
      id: 'task-1',
      title: 'Distributed Cloud Architecture & Disaster Recovery Runbook',
      category: 'Technical Runbook',
      successor: 'Nuwan Perera (Backend Lead)',
      status: 'completed',
      dueDate: 'Oct 20, 2026'
    },
    {
      id: 'task-2',
      title: 'Shadowing: Enterprise Production Escalation & P1 Incident Handling',
      category: 'Shadowing',
      successor: 'Nuwan Perera (Backend Lead)',
      status: 'in_progress',
      dueDate: 'Nov 12, 2026'
    },
    {
      id: 'task-3',
      title: 'Handover of Kubernetes Cluster Access & Secret Management Policies',
      category: 'Documentation',
      successor: 'Ruwan Wijesinghe (DevOps)',
      status: 'in_progress',
      dueDate: 'Nov 25, 2026'
    },
    {
      id: 'task-4',
      title: 'Final Knowledge Transfer Verification & Architecture Governance Sign-off',
      category: 'Sign-off',
      successor: 'HR Mobility & Head of Engineering',
      status: 'pending',
      dueDate: 'Dec 15, 2026'
    }
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'completed' ? 'in_progress' : 'completed'
        };
      }
      return t;
    }));
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold mb-2">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span>Succession & Knowledge Transfer Service</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white mb-1">
            Critical Role Handover & Succession Readiness
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Preserve enterprise institutional knowledge, facilitate smooth leadership succession, and verify technical capability transfer to designated successors.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider block font-bold">Transfer Completion</span>
            <span className="text-2xl font-black text-white">{progressPct}%</span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-400/30 border-t-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-200">
            {completedCount}/{tasks.length}
          </div>
        </div>
      </div>

      {/* Primary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Designated Role & Successor */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Target Succession Position
          </span>
          <h4 className="font-extrabold text-slate-900 text-sm">Lead Cloud Solutions Architect</h4>
          <p className="text-xs text-slate-500 mt-1">Designated Successor: <strong className="text-slate-800">Nuwan Perera</strong> (88% Match)</p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <CheckCircle2 size={13} />
            <span>Succession Plan Active & Approved</span>
          </div>
        </div>

        {/* Card 2: Mentorship Transfer */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Knowledge Transfer Pairing
          </span>
          <h4 className="font-extrabold text-slate-900 text-sm">Bi-Weekly 1:1 Architecture Mentorship</h4>
          <p className="text-xs text-slate-500 mt-1">Logged Sessions: <strong className="text-slate-800">6 of 8 Completed</strong> (12 Hours)</p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            <Clock size={13} />
            <span>Next Session: Friday, 10:00 AM</span>
          </div>
        </div>

        {/* Card 3: Enterprise Matrix Link */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Enterprise Talent Mobility
            </span>
            <p className="text-xs text-slate-600">
              Access the full corporate succession matrix, knowledge retention protocols, and cross-departmental succession trees.
            </p>
          </div>
          <Link
            to="/succession"
            className="mt-3 inline-flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-2 border-t border-slate-200"
          >
            <span>Open Succession Matrix</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Handover & Knowledge Transfer Action Items */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-emerald-600" />
            <h4 className="font-bold text-slate-900 text-sm">Handover Tasks & Knowledge Artifacts</h4>
          </div>
          <span className="text-[11px] text-slate-500">Click checkmark to toggle milestone completion</span>
        </div>

        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                task.status === 'completed'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    task.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'border-2 border-slate-300 hover:border-emerald-500 bg-white'
                  }`}
                >
                  {task.status === 'completed' && <CheckCircle2 size={16} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className={`text-xs font-bold truncate ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h5>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                      {task.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Target Successor: <strong className="text-slate-700">{task.successor}</strong> • Due: {task.dueDate}
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 ${
                task.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : task.status === 'in_progress'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {task.status === 'completed' ? 'Verified' : task.status === 'in_progress' ? 'In Progress' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
