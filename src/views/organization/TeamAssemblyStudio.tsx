import React, { useState } from 'react';
import {
  CheckCircle2, Send,
  RefreshCw, Sparkles,
  ChevronRight, ArrowLeft, Check
} from 'lucide-react';
import { saveNotification } from '../../lib/roleNotificationsStore';
import './TeamAssembly.css';

interface CapabilityRequirement {
  id: string;
  name: string;
  roleTitle: string;
  isNewRole: boolean;
  priority: 'Critical' | 'High' | 'Medium';
  assignedEmployee: string;
  fitScore: number;
  skills: string[];
}

interface TalentMatch {
  id: string;
  name: string;
  currentRole: string;
  matchedRole: string;
  fitScore: number;
  capabilities: string[];
  status: 'recommended' | 'invited';
}

export const TeamAssemblyStudio: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // 1. Team Objective & Project Inputs
  const [projectName, setProjectName] = useState('Project Phoenix - AI Supply Chain Automation');
  const [targetTeamSize, setTargetTeamSize] = useState('5 Members');
  const [deliveryWindow, setDeliveryWindow] = useState('Q3 FY26 (6 Months)');
  const [teamObjective, setTeamObjective] = useState(
    'Build and launch the enterprise-grade AI workflow automation engine to accelerate predictive operations across retail supply chain hubs.'
  );
  const [strategicContext, setStrategicContext] = useState(
    'FY26 Enterprise AI Transformation · Core strategic growth pillar to reduce fulfillment latency by 35%.'
  );

  // AI Generation State
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isApproved, setIsApproved] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 3. Required Capabilities & Roles
  const [capabilities] = useState<CapabilityRequirement[]>([
    {
      id: 'cap-1',
      name: 'High-Throughput GPU & Cloud Infrastructure',
      roleTitle: 'AI Infrastructure Lead',
      isNewRole: true,
      priority: 'Critical',
      skills: ['Kubernetes', 'NVIDIA GPU Clustering', 'Distributed Systems'],
      assignedEmployee: 'Kasun Bandara',
      fitScore: 95
    },
    {
      id: 'cap-2',
      name: 'Real-Time Telemetry & Data Streaming',
      roleTitle: 'Data Platform Engineer',
      isNewRole: false,
      priority: 'Critical',
      skills: ['Kafka', 'PySpark', 'ETL Architecture'],
      assignedEmployee: 'Nuwan Perera',
      fitScore: 91
    },
    {
      id: 'cap-3',
      name: 'Simulation & Predictive Model Tuning',
      roleTitle: 'Applied AI Scientist',
      isNewRole: false,
      priority: 'High',
      skills: ['PyTorch', 'Time-Series Forecasting', 'Scikit-Learn'],
      assignedEmployee: 'Kavindi Alwis',
      fitScore: 88
    },
    {
      id: 'cap-4',
      name: 'Operations Workflow UX & Dashboards',
      roleTitle: 'Principal Product Designer',
      isNewRole: false,
      priority: 'High',
      skills: ['Design Systems', 'Data Visualization', 'Figma'],
      assignedEmployee: 'Sanduni Silva',
      fitScore: 92
    },
    {
      id: 'cap-5',
      name: 'DevOps & Site Reliability Governance',
      roleTitle: 'SRE / Cloud Systems Lead',
      isNewRole: false,
      priority: 'Medium',
      skills: ['CI/CD Automation', 'Terraform', 'Observability'],
      assignedEmployee: 'Ruwan Wijesinghe',
      fitScore: 84
    }
  ]);

  // 6. Output Best-Fit Talent
  const [talentMatches, setTalentMatches] = useState<TalentMatch[]>([
    {
      id: 'tm-1',
      name: 'Kasun Bandara',
      currentRole: 'Cloud Architect',
      matchedRole: 'AI Infrastructure Lead',
      fitScore: 95,
      capabilities: ['Kubernetes Orchestration', 'Distributed Cloud Architecture', 'GPU Workloads'],
      status: 'recommended'
    },
    {
      id: 'tm-2',
      name: 'Nuwan Perera',
      currentRole: 'Backend Engineer',
      matchedRole: 'Data Platform Engineer',
      fitScore: 91,
      capabilities: ['Data Streaming', 'Kafka Pipelines', 'Python Performance'],
      status: 'recommended'
    },
    {
      id: 'tm-3',
      name: 'Kavindi Alwis',
      currentRole: 'Data Scientist',
      matchedRole: 'Applied AI Scientist',
      fitScore: 88,
      capabilities: ['Predictive ML Tuning', 'PyTorch Framework', 'Telemetry Pipelines'],
      status: 'recommended'
    },
    {
      id: 'tm-4',
      name: 'Sanduni Silva',
      currentRole: 'UI/UX Lead',
      matchedRole: 'Principal Product Designer',
      fitScore: 92,
      capabilities: ['Enterprise Design Systems', 'Telemetry Dashboard UX', 'Figma Systems'],
      status: 'recommended'
    },
    {
      id: 'tm-5',
      name: 'Ruwan Wijesinghe',
      currentRole: 'DevOps Engineer',
      matchedRole: 'SRE / Cloud Systems Lead',
      fitScore: 84,
      capabilities: ['CI/CD Pipelines', 'Docker', 'Linux Automation'],
      status: 'recommended'
    }
  ]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadPreset = (name: string, obj: string, strat: string, size: string) => {
    setProjectName(name);
    setTeamObjective(obj);
    setStrategicContext(strat);
    setTargetTeamSize(size);
    triggerToast(`Loaded initiative preset for "${name}".`);
  };

  // 3- AI Generation of Capabilities & Roles
  const handleSynthesizeCapabilities = () => {
    if (!projectName.trim() || !teamObjective.trim()) {
      triggerToast('Please provide an initiative name and team objective first.');
      return;
    }

    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
      setCurrentStep(2);
      triggerToast('AI generated capabilities and matched internal talent best-fit scores!');
    }, 1200);
  };

  // 5- Approve Team Structure
  const handleApproveTeamStructure = () => {
    setIsApproved(true);
    triggerToast('Team structure approved! Ready to output best-fit team and dispatch notifications.');
  };

  // 7- Trigger Employee so Employee can Apply (Career Coach & Marketplace)
  const handleTriggerTalent = (talent: TalentMatch) => {
    saveNotification({
      id: `notif-team-${Date.now()}-${talent.id}`,
      type: 'team_assembly_invite',
      roleTitle: `${talent.matchedRole} · ${projectName}`,
      department: 'Cross-Functional Squad',
      source: 'Team Assembly Engine',
      employeeName: talent.name,
      fitScore: talent.fitScore,
      matchedSkills: talent.capabilities,
      skillGaps: [],
      timestamp: 'Just now',
      status: 'unread',
      description: `You have been selected for Team Assembly: "${projectName}" based on a ${talent.fitScore}% match. Apply or review in Career Coach & Talent Marketplace.`,
      channels: ['Digital Talent Marketplace', 'Career Coach Portal']
    });

    setTalentMatches(talentMatches.map(t => t.id === talent.id ? { ...t, status: 'invited' } : t));
    triggerToast(`Sent invite to ${talent.name} through Career Coach & Talent Marketplace!`);
  };

  const handleTriggerAllTalent = () => {
    talentMatches.forEach(t => {
      saveNotification({
        id: `notif-team-${Date.now()}-${t.id}`,
        type: 'team_assembly_invite',
        roleTitle: `${t.matchedRole} · ${projectName}`,
        department: 'Cross-Functional Squad',
        source: 'Team Assembly Engine',
        employeeName: t.name,
        fitScore: t.fitScore,
        matchedSkills: t.capabilities,
        skillGaps: [],
        timestamp: 'Just now',
        status: 'unread',
        description: `You have been selected for Team Assembly: "${projectName}" based on a ${t.fitScore}% match. Apply or review in Career Coach & Talent Marketplace.`,
        channels: ['Digital Talent Marketplace', 'Career Coach Portal']
      });
    });

    setTalentMatches(talentMatches.map(t => ({ ...t, status: 'invited' })));
    triggerToast(`Dispatched team invitations to all ${talentMatches.length} candidates via Career Coach!`);
  };

  return (
    <div className="ta-container pb-28 text-left w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="ta-page-header">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Team Assembly
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Assemble cross-functional project squads, synthesize capabilities, match internal talent, and dispatch opportunities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Step {currentStep} of 3</span>
          </div>
        </div>
      </div>

      {/* 3-Step Navigation Stepper */}
      <nav className="ta-stepper">
        <div className="ta-stepper-pills">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`ta-step-btn ${currentStep === 1 ? 'active' : ''}`}
          >
            <span className="ta-step-badge">1</span>
            <span>1. Objective & Strategic Context</span>
          </button>

          <ChevronRight size={14} className="text-slate-300" />

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`ta-step-btn ${currentStep === 2 ? 'active' : ''}`}
          >
            <span className="ta-step-badge">2</span>
            <span>2. Capabilities & Internal Match</span>
            {isApproved && (
              <span className="ta-step-status-tag">Approved</span>
            )}
          </button>

          <ChevronRight size={14} className="text-slate-300" />

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`ta-step-btn ${currentStep === 3 ? 'active' : ''}`}
          >
            <span className="ta-step-badge">3</span>
            <span>3. Squad Output & Dispatch</span>
          </button>
        </div>
      </nav>

      {/* ================= STEP 1: Objective & Strategic Context ================= */}
      {currentStep === 1 && (
        <section className="ta-card">
          <header className="ta-card-head">
            <div className="ta-card-head-left">
              <div className="ta-card-head-icon">1</div>
              <div>
                <h3 className="ta-card-title">Team Objective & Strategic Context</h3>
                <p className="ta-card-subtitle">
                  Define project goals and strategic business drivers for AI capability synthesis.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Input Stage
            </span>
          </header>

          <div className="ta-card-body">
            {/* Initiative Presets */}
            <div className="ta-presets-strip">
              <span className="ta-presets-label">Initiative Presets:</span>
              <button
                type="button"
                onClick={() => loadPreset(
                  'Project Phoenix - AI Supply Chain Automation',
                  'Build and launch the enterprise-grade AI workflow automation engine to accelerate predictive operations across retail supply chain hubs.',
                  'FY26 Enterprise AI Transformation · Core strategic growth pillar to reduce fulfillment latency by 35%.',
                  '5 Members'
                )}
                className="ta-preset-chip"
              >
                AI Supply Chain Automation
              </button>
              <button
                type="button"
                onClick={() => loadPreset(
                  'Fraud Shield - Real-Time Payment Security',
                  'Deploy distributed payment stream monitoring with ML anomaly detection to cut fraudulent transactions by 60%.',
                  'Corporate Governance & Risk Resilience · Mandated for PCI-DSS 4.0 banking compliance.',
                  '4 Members'
                )}
                className="ta-preset-chip"
              >
                Fintech Fraud Shield
              </button>
              <button
                type="button"
                onClick={() => loadPreset(
                  'Omnichannel CX - Customer Experience 360',
                  'Integrate omni-channel customer support telemetry into unified AI agent desks to enhance first-contact resolution.',
                  'Digital Platforms & IT · Customer Experience Excellence FY26 Strategic Pillar.',
                  '5 Members'
                )}
                className="ta-preset-chip"
              >
                Omnichannel CX Modernization
              </button>
            </div>

            {/* 3-Column Grid: Initiative Name, Squad Size, Delivery Window */}
            <div className="ta-form-grid-3">
              <div className="ta-field">
                <label className="ta-label">
                  Project / Initiative Name <span className="ta-label-req">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Project Phoenix"
                  className="ta-input"
                />
              </div>

              <div className="ta-field">
                <label className="ta-label">
                  Target Squad Size
                </label>
                <select
                  value={targetTeamSize}
                  onChange={(e) => setTargetTeamSize(e.target.value)}
                  className="ta-select"
                >
                  <option>3 Members</option>
                  <option>4 Members</option>
                  <option>5 Members</option>
                  <option>6 Members</option>
                  <option>8 Members</option>
                </select>
              </div>

              <div className="ta-field">
                <label className="ta-label">
                  Delivery Window
                </label>
                <select
                  value={deliveryWindow}
                  onChange={(e) => setDeliveryWindow(e.target.value)}
                  className="ta-select"
                >
                  <option>Q3 FY26 (6 Months)</option>
                  <option>Q4 FY26 (9 Months)</option>
                  <option>FY27 (Full Year)</option>
                </select>
              </div>
            </div>

            {/* Team Objective Textarea */}
            <div className="ta-field mb-4">
              <label className="ta-label">
                Team Objective & Mission Deliverable <span className="ta-label-req">*</span>
              </label>
              <textarea
                rows={3}
                value={teamObjective}
                onChange={(e) => setTeamObjective(e.target.value)}
                placeholder="What does this cross-functional team need to accomplish?"
                className="ta-textarea"
              />
            </div>

            {/* Strategic Context */}
            <div className="ta-field mb-2">
              <label className="ta-label">
                Strategic Context & Business Driver <span className="ta-label-req">*</span>
              </label>
              <input
                type="text"
                value={strategicContext}
                onChange={(e) => setStrategicContext(e.target.value)}
                placeholder="Core strategic growth pillar or corporate OKR..."
                className="ta-input"
              />
            </div>

            {/* Action Bar */}
            <footer className="ta-action-bar justify-end">
              <button
                type="button"
                onClick={handleSynthesizeCapabilities}
                disabled={isSynthesizing}
                className="ta-btn-primary"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Synthesizing Capabilities & Matching Talent...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Synthesize Capabilities & Match Talent with AI</span>
                  </>
                )}
              </button>
            </footer>
          </div>
        </section>
      )}

      {/* ================= STEP 2: Capabilities & Internal Talent Matching ================= */}
      {currentStep === 2 && (
        <section className="ta-card">
          <header className="ta-card-head">
            <div className="ta-card-head-left">
              <div className="ta-card-head-icon" style={{ background: '#4f46e5' }}>2</div>
              <div>
                <h3 className="ta-card-title">Required Capabilities & Internal Talent Match</h3>
                <p className="ta-card-subtitle">
                  AI breakdown of existing vs new roles and internal candidate match scores.
                </p>
              </div>
            </div>

            {!isApproved ? (
              <button
                type="button"
                onClick={handleApproveTeamStructure}
                className="ta-btn-primary ta-btn-emerald"
              >
                <CheckCircle2 size={14} />
                <span>Approve Team Structure</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Check size={14} className="text-emerald-600 stroke-[3]" />
                <span>Team Structure Approved</span>
              </div>
            )}
          </header>

          <div className="ta-card-body">
            <div className="ta-capabilities-list">
              {capabilities.map((cap) => (
                <div key={cap.id} className="ta-cap-card">
                  <div className="ta-cap-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="ta-cap-role-title">{cap.roleTitle}</span>
                      {cap.isNewRole ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          ★ New Role Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Existing Role
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        cap.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {cap.priority}
                      </span>
                    </div>

                    <p className="ta-cap-desc">Capability: {cap.name}</p>

                    <div className="ta-cap-skills">
                      {cap.skills.map((s, idx) => (
                        <span key={idx} className="ta-cap-skill-tag">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Matched Employee Pill */}
                  <div className="ta-cap-right">
                    <div className="ta-cap-avatar">
                      {cap.assignedEmployee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{cap.assignedEmployee}</div>
                      <div className="text-[10px] text-slate-400">Best-Fit Candidate</div>
                    </div>
                    <span className="ta-fit-pill">
                      {cap.fitScore}% Fit
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stepper Footer */}
            <footer className="ta-action-bar">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="ta-btn-secondary"
              >
                <ArrowLeft size={14} />
                <span>Back to Objective</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="ta-btn-primary"
              >
                <span>Proceed to Squad Output & Dispatch</span>
                <ChevronRight size={14} />
              </button>
            </footer>
          </div>
        </section>
      )}

      {/* ================= STEP 3: Squad Output & Career Coach Dispatch ================= */}
      {currentStep === 3 && (
        <section className="ta-card">
          <header className="ta-card-head">
            <div className="ta-card-head-left">
              <div className="ta-card-head-icon" style={{ background: '#059669' }}>3</div>
              <div>
                <h3 className="ta-card-title">Squad Output & Career Coach Dispatch</h3>
                <p className="ta-card-subtitle">
                  Output best-fit squad and dispatch notifications so employees can apply via Career Coach & Marketplace.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTriggerAllTalent}
              className="ta-btn-primary"
              style={{ background: '#7c3aed' }}
            >
              <Send size={13} />
              <span>Trigger All Candidates via Career Coach</span>
            </button>
          </header>

          <div className="ta-card-body">
            {/* Squad Overview Ribbon */}
            <div className="ta-squad-ribbon">
              <div className="ta-squad-stat">
                <span className="ta-squad-stat-label">Overall Squad Synergy</span>
                <div className="ta-squad-stat-val text-emerald-700">93.8% Optimal</div>
              </div>
              <div className="ta-squad-stat">
                <span className="ta-squad-stat-label">Capability Coverage</span>
                <div className="ta-squad-stat-val text-blue-700">100% (5 of 5 Covered)</div>
              </div>
              <div className="ta-squad-stat">
                <span className="ta-squad-stat-label">Delivery Feasibility</span>
                <div className="ta-squad-stat-val text-indigo-700">High (On Schedule)</div>
              </div>
              <div className="ta-squad-stat">
                <span className="ta-squad-stat-label">Syndication Channel</span>
                <div className="ta-squad-stat-val text-slate-700">Career Coach + Marketplace</div>
              </div>
            </div>

            {/* Candidate Cards Grid */}
            <div className="ta-candidates-grid">
              {talentMatches.map((talent) => (
                <div key={talent.id} className="ta-candidate-card">
                  <div>
                    <div className="ta-cand-top">
                      <div className="ta-cand-info">
                        <div className="ta-cand-avatar">
                          {talent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h5 className="ta-cand-name">{talent.name}</h5>
                          <p className="ta-cand-role">{talent.currentRole}</p>
                        </div>
                      </div>

                      <span className="ta-fit-pill">
                        {talent.fitScore}% Fit
                      </span>
                    </div>

                    <div className="mt-2.5 p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-xs font-semibold text-blue-900">
                      Assigned Squad Role: <strong className="text-blue-700">{talent.matchedRole}</strong>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {talent.capabilities.map((c, i) => (
                        <span key={i} className="text-[10px] font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="ta-cand-bottom">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Status: {talent.status === 'invited' ? 'Invited' : 'Recommended'}
                    </span>

                    {talent.status === 'invited' ? (
                      <span className="ta-notified-badge">
                        <CheckCircle2 size={13} />
                        <span>Invitation Sent to Career Coach</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTriggerTalent(talent)}
                        className="ta-btn-notify"
                      >
                        <Send size={12} />
                        <span>Notify via Career Coach</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Stepper Footer */}
            <footer className="ta-action-bar">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="ta-btn-secondary"
              >
                <ArrowLeft size={14} />
                <span>Back to Capabilities</span>
              </button>
            </footer>
          </div>
        </section>
      )}
    </div>
  );
};
