import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, Globe, Send,
  Plus, Trash2, Award, Clock,
  Share2, RefreshCw, Layers,
  ChevronRight, ArrowLeft, Check, UserCheck, Briefcase
} from 'lucide-react';
import { saveNotification } from '../../lib/roleNotificationsStore';
import './RoleArchitect.css';

interface SkillItem {
  id: string;
  name: string;
  level: string;
  marketTrend: string;
}

interface BehavioralItem {
  id: string;
  name: string;
  description: string;
  importance: 'Critical' | 'High';
}

interface BestFitEmployee {
  id: string;
  name: string;
  currentRole: string;
  department: string;
  fitScore: number;
  topSkills: string[];
  readiness: string;
  notified?: boolean;
}

export const RoleArchitectStudio: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // 1. Role Blueprint Inputs
  const [roleTitle, setRoleTitle] = useState('Senior AI Platform Architect');
  const [department, setDepartment] = useState('Engineering & AI');
  const [seniority, setSeniority] = useState('L5 - Principal / Staff');
  const [roleDescription, setRoleDescription] = useState(
    'Lead enterprise adoption of Large Language Models and fine-tuning pipelines. Architect scalable inference clusters on Kubernetes with GPU pooling, establish prompt evaluation and guardrail frameworks, and mentor machine learning engineers.'
  );

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [marketAnalysisStatus, setMarketAnalysisStatus] = useState<string | null>(null);
  const [isSynthesized, setIsSynthesized] = useState(true);

  // 2. AI Generated Skills & Competencies
  const [technicalSkills, setTechnicalSkills] = useState<SkillItem[]>([
    { id: 'ts-1', name: 'Kubernetes & GPU Orchestration', level: 'Expert (L5)', marketTrend: '+38% YoY' },
    { id: 'ts-2', name: 'PyTorch / Distributed Training', level: 'Advanced (L4)', marketTrend: '+42% YoY' },
    { id: 'ts-3', name: 'Vector DBs (Pinecone, Milvus)', level: 'Advanced (L4)', marketTrend: '+55% YoY' },
    { id: 'ts-4', name: 'MLOps & CI/CD Pipelines (MLflow)', level: 'Advanced (L4)', marketTrend: '+28% YoY' },
    { id: 'ts-5', name: 'Python / C++ Performance Tuning', level: 'Advanced (L4)', marketTrend: '+18% YoY' },
  ]);

  const behavioralSkills: BehavioralItem[] = [
    { id: 'bs-1', name: 'Cross-Functional Influence', description: 'Align product, security, and AI research teams on architecture standards', importance: 'Critical' },
    { id: 'bs-2', name: 'Complex Problem Solving', description: 'Decompose ambiguous distributed systems bottlenecks under tight SLAs', importance: 'High' },
    { id: 'bs-3', name: 'Mentorship & Knowledge Sharing', description: 'Upskill senior backend engineers into production AI infrastructure engineers', importance: 'High' },
  ];

  const [competencies, setCompetencies] = useState([
    'Minimum 6+ years designing high-throughput distributed systems or production cloud infrastructures.',
    'Proven track record running GPU clusters (NVIDIA A100/H100) on Kubernetes in production environments.',
    'Hands-on expertise with enterprise AI governance, latency optimization, and cost-aware scaling.',
  ]);

  // Market Intelligence Benchmark
  const marketBenchmark = {
    salaryRange: '$145k – $185k / yr',
    salaryLocal: 'LKR 2.8M – 3.6M / mo',
    marketAvailability: 'High Scarcity (Top 6% Talent)',
    projectedDemandGrowth: '+34% across APAC',
    sources: 'LinkedIn, O*NET & Lightcast'
  };

  // 3. Human in the Loop (HR Approval state)
  const [approvalStatus, setApprovalStatus] = useState<'draft' | 'hr_approved'>('hr_approved');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 4. Publishing state
  const [publishChannels, setPublishChannels] = useState({
    marketplace: true,
    linkedin: true,
  });
  const [isPublished, setIsPublished] = useState(false);

  // 5. Internal Best Fit Employees
  const [candidates, setCandidates] = useState<BestFitEmployee[]>([
    {
      id: 'emp-101',
      name: 'Kasun Bandara',
      currentRole: 'Cloud Architect',
      department: 'Engineering',
      fitScore: 94,
      topSkills: ['Kubernetes & GPU Orchestration', 'MLOps CI/CD', 'Python Performance'],
      readiness: 'Ready Now',
      notified: false
    },
    {
      id: 'emp-103',
      name: 'Nuwan Perera',
      currentRole: 'Backend Engineer',
      department: 'Engineering',
      fitScore: 86,
      topSkills: ['Distributed Systems', 'Python High-Throughput', 'CI/CD Pipelines'],
      readiness: 'Ready in 3-6 Months',
      notified: false
    },
    {
      id: 'emp-108',
      name: 'Ruwan Wijesinghe',
      currentRole: 'DevOps Engineer',
      department: 'Operations',
      fitScore: 79,
      topSkills: ['Kubernetes Infrastructure', 'CI/CD Automation'],
      readiness: 'Requires Upskilling',
      notified: false
    },
    {
      id: 'emp-106',
      name: 'Kavindi Alwis',
      currentRole: 'Data Scientist',
      department: 'Data & Analytics',
      fitScore: 74,
      topSkills: ['PyTorch Model Tuning', 'Python / C++'],
      readiness: 'Requires Upskilling',
      notified: false
    }
  ]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadTemplate = (title: string, dept: string, desc: string) => {
    setRoleTitle(title);
    setDepartment(dept);
    setRoleDescription(desc);
    triggerToast(`Loaded blueprint for "${title}".`);
  };

  // 1- Click AI Generation Trigger
  const handleGenerateRoleWithAI = () => {
    if (!roleTitle.trim()) {
      triggerToast('Please provide a role title first.');
      return;
    }

    setIsGenerating(true);
    setMarketAnalysisStatus('Scanning external databases (LinkedIn Talent Insights, O*NET, Lightcast)...');

    setTimeout(() => {
      setMarketAnalysisStatus('Synthesizing technical skills, behavioral competencies & benchmarks...');
    }, 700);

    setTimeout(() => {
      setIsGenerating(false);
      setMarketAnalysisStatus(null);
      setIsSynthesized(true);
      setApprovalStatus('draft');
      setIsPublished(false);
      setCurrentStep(2);
      triggerToast('AI Role Architecture synthesized from market data! Ready for HR review.');
    }, 1400);
  };

  // Skill Management
  const handleAddTechnicalSkill = () => {
    const name = window.prompt('Enter new technical skill name:');
    if (!name?.trim()) return;
    const newSkill: SkillItem = {
      id: `ts-${Date.now()}`,
      name: name.trim(),
      level: 'Advanced (L4)',
      marketTrend: '+25% YoY'
    };
    setTechnicalSkills([...technicalSkills, newSkill]);
  };

  const handleUpdateSkillLevel = (id: string, newLevel: string) => {
    setTechnicalSkills(technicalSkills.map(s => s.id === id ? { ...s, level: newLevel } : s));
  };

  const handleRemoveTechnicalSkill = (id: string) => {
    setTechnicalSkills(technicalSkills.filter(s => s.id !== id));
  };

  const handleAddRequirement = () => {
    const req = window.prompt('Enter new requirement bullet point:');
    if (!req?.trim()) return;
    setCompetencies([...competencies, req.trim()]);
  };

  const handleRemoveRequirement = (idx: number) => {
    setCompetencies(competencies.filter((_, i) => i !== idx));
  };

  // 3. Human in the Loop: Approve Architecture
  const handleApproveArchitecture = () => {
    setApprovalStatus('hr_approved');
    triggerToast('Role Architecture verified by HR! Ready to publish.');
  };

  // 4. Publish in Digital Marketplace & Public places
  const handlePublishRole = () => {
    const channels = [];
    if (publishChannels.marketplace) channels.push('Digital Talent Marketplace');
    if (publishChannels.linkedin) channels.push('LinkedIn Jobs');

    if (channels.length === 0) {
      triggerToast('Please select at least one publishing channel.');
      return;
    }

    setIsPublished(true);
    triggerToast(`Role published to ${channels.join(' & ')}!`);
  };

  // 6. Send Notification to Employee through Career Coach
  const handleNotifyEmployee = (employee: BestFitEmployee) => {
    saveNotification({
      id: `notif-${Date.now()}-${employee.id}`,
      type: 'role_architect_match',
      roleTitle: roleTitle,
      department: department,
      source: 'Role Architect AI Engine',
      employeeId: employee.id,
      employeeName: employee.name,
      fitScore: employee.fitScore,
      matchedSkills: employee.topSkills,
      skillGaps: ['Advanced Domain Certifications'],
      timestamp: 'Just now',
      status: 'unread',
      description: `HR Role Architect matched you (${employee.fitScore}% fit) for "${roleTitle}".`,
      channels: ['Internal Talent Marketplace', 'Career Coach Portal']
    });

    setCandidates(candidates.map(c => c.id === employee.id ? { ...c, notified: true } : c));
    triggerToast(`Notification dispatched to ${employee.name}'s Career Coach!`);
  };

  const handleNotifyAllMatches = () => {
    candidates.forEach(c => {
      saveNotification({
        id: `notif-${Date.now()}-${c.id}`,
        type: 'role_architect_match',
        roleTitle: roleTitle,
        department: department,
        source: 'Role Architect AI Engine',
        employeeId: c.id,
        employeeName: c.name,
        fitScore: c.fitScore,
        matchedSkills: c.topSkills,
        skillGaps: ['Advanced Domain Certifications'],
        timestamp: 'Just now',
        status: 'unread',
        description: `HR Role Architect matched you (${c.fitScore}% fit) for "${roleTitle}".`,
        channels: ['Internal Talent Marketplace', 'Career Coach Portal']
      });
    });

    setCandidates(candidates.map(c => ({ ...c, notified: true })));
    triggerToast(`Notifications dispatched to all ${candidates.length} candidates via Career Coach!`);
  };

  return (
    <div className="ra-container pb-28 text-left w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="ra-page-header">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Role Architect
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Architect future-ready roles, benchmark labor market skills, verify with HR, and match internal talent.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Step {currentStep} of 3</span>
          </div>
        </div>
      </div>

      {/* 3-Step Navigation */}
      <nav className="ra-stepper">
        <div className="ra-stepper-pills">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`ra-step-btn ${currentStep === 1 ? 'active' : ''}`}
          >
            <span className="ra-step-badge">1</span>
            <span>1. Role Definition & AI Input</span>
          </button>

          <ChevronRight size={14} className="text-slate-300" />

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`ra-step-btn ${currentStep === 2 ? 'active' : ''}`}
          >
            <span className="ra-step-badge">2</span>
            <span>2. Skills & HR Review</span>
            {approvalStatus === 'hr_approved' && (
              <span className="ra-step-status-tag">Approved</span>
            )}
          </button>

          <ChevronRight size={14} className="text-slate-300" />

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`ra-step-btn ${currentStep === 3 ? 'active' : ''}`}
          >
            <span className="ra-step-badge">3</span>
            <span>3. Syndication & Talent Matching</span>
            {isPublished && (
              <span className="ra-step-status-tag">Published</span>
            )}
          </button>
        </div>
      </nav>

      {/* ================= STEP 1: Role Definition & AI Input ================= */}
      {currentStep === 1 && (
        <section className="ra-card">
          <header className="ra-card-head">
            <div className="ra-card-head-left">
              <div className="ra-card-head-icon">1</div>
              <div>
                <h3 className="ra-card-title">Role Definition & Strategic Business Context</h3>
                <p className="ra-card-subtitle">
                  Input role description; AI scans labor market data to synthesize technical skills and competencies.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Input Stage
            </span>
          </header>

          <div className="ra-card-body">
            {/* Presets Strip */}
            <div className="ra-presets-strip">
              <span className="ra-presets-label">Quick Presets:</span>
              <button
                type="button"
                onClick={() => loadTemplate(
                  'Senior AI Platform Architect',
                  'Engineering & AI',
                  'Lead enterprise adoption of Large Language Models and fine-tuning pipelines. Architect scalable inference clusters on Kubernetes with GPU pooling, establish prompt evaluation and guardrail frameworks, and mentor machine learning engineers.'
                )}
                className="ra-preset-chip"
              >
                AI Platform Lead
              </button>
              <button
                type="button"
                onClick={() => loadTemplate(
                  'Fintech Security & Zero-Trust Lead',
                  'Corporate Governance',
                  'Architect zero-trust cloud infrastructure, conduct automated security posture evaluations, audit distributed payment gateways against PCI-DSS and Central Bank guidelines, and ensure banking compliance.'
                )}
                className="ra-preset-chip"
              >
                Fintech Security Lead
              </button>
              <button
                type="button"
                onClick={() => loadTemplate(
                  'Digital Twin Simulation Engineer',
                  'Operations & Supply Chain',
                  'Develop discrete-event simulation models for supply chain fulfillment logistics. Synchronize telemetry from IoT edge devices to calibrate real-time digital twin states and mitigate delivery bottlenecks.'
                )}
                className="ra-preset-chip"
              >
                Digital Twin Lead
              </button>
            </div>

            {/* Form Row: Perfectly Aligned 3-Column Grid */}
            <div className="ra-form-grid-3">
              <div className="ra-field">
                <label className="ra-label">
                  Role Title <span className="ra-label-req">*</span>
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior AI Platform Architect"
                  className="ra-input"
                />
              </div>

              <div className="ra-field">
                <label className="ra-label">
                  Target Department <span className="ra-label-req">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="ra-select"
                >
                  <option>Engineering & AI</option>
                  <option>Data & Analytics</option>
                  <option>Operations & Supply Chain</option>
                  <option>Product & Design</option>
                  <option>Corporate Governance</option>
                  <option>Human Resources</option>
                </select>
              </div>

              <div className="ra-field">
                <label className="ra-label">
                  Seniority & Career Level
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="ra-select"
                >
                  <option>L3 - Mid-Level Specialist</option>
                  <option>L4 - Senior Professional</option>
                  <option>L5 - Principal / Staff</option>
                  <option>L6 - Director / Department Head</option>
                </select>
              </div>
            </div>

            {/* Description Row */}
            <div className="ra-field">
              <label className="ra-label">
                Role Description & Strategic Business Context <span className="ra-label-req">*</span>
              </label>
              <textarea
                rows={4}
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Describe key responsibilities, deliverables, and domain context..."
                className="ra-textarea"
              />
            </div>

            {/* Card Action Bar */}
            <footer className="ra-action-bar justify-end">

              <button
                type="button"
                onClick={handleGenerateRoleWithAI}
                disabled={isGenerating}
                className="ra-btn-primary"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Analyzing External Databases...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Role Architecture with AI</span>
                  </>
                )}
              </button>
            </footer>

            {marketAnalysisStatus && (
              <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-900 animate-pulse font-medium">
                <RefreshCw size={14} className="animate-spin text-blue-600 shrink-0" />
                <span>{marketAnalysisStatus}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= STEP 2: Skills & HR Review ================= */}
      {currentStep === 2 && isSynthesized && (
        <section className="ra-card">
          <header className="ra-card-head">
            <div className="ra-card-head-left">
              <div className="ra-card-head-icon" style={{ background: '#4f46e5' }}>2</div>
              <div>
                <h3 className="ra-card-title">AI Specifications & Human-in-the-Loop Review</h3>
                <p className="ra-card-subtitle">
                  AI formulated skills from external market data. HR can modify, calibrate levels, and approve.
                </p>
              </div>
            </div>

            {approvalStatus !== 'hr_approved' ? (
              <button
                type="button"
                onClick={handleApproveArchitecture}
                className="ra-btn-primary ra-btn-emerald"
              >
                <CheckCircle2 size={14} />
                <span>Approve Architecture</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Check size={14} className="text-emerald-600 stroke-[3]" />
                <span>Verified & Approved by HR</span>
              </div>
            )}
          </header>

          <div className="ra-card-body">
            {/* Clean Market Intelligence Strip - Single Row Precision Grid */}
            <div className="ra-market-grid">
              <div className="ra-market-card">
                <span className="ra-market-label">Market Salary Benchmark</span>
                <span className="ra-market-val text-emerald-700">{marketBenchmark.salaryRange}</span>
                <span className="text-[11px] text-slate-400 font-medium">{marketBenchmark.salaryLocal}</span>
              </div>

              <div className="ra-market-card">
                <span className="ra-market-label">External Talent Scarcity</span>
                <span className="ra-market-val text-amber-700">{marketBenchmark.marketAvailability}</span>
                <span className="text-[11px] text-slate-400 font-medium">High Competition</span>
              </div>

              <div className="ra-market-card">
                <span className="ra-market-label">Projected Demand Growth</span>
                <span className="ra-market-val text-blue-700">{marketBenchmark.projectedDemandGrowth}</span>
                <span className="text-[11px] text-slate-400 font-medium">Fastest Growing Tier</span>
              </div>

              <div className="ra-market-card">
                <span className="ra-market-label">External Data Reference</span>
                <span className="ra-market-val text-slate-700">{marketBenchmark.sources}</span>
                <span className="text-[11px] text-slate-400 font-medium">Real-time Syndicated</span>
              </div>
            </div>

            {/* 2-Column Split: Technical Skills & Behavioral Requirements */}
            <div className="ra-split-2">
              {/* Technical Skills Column */}
              <div className="ra-subpanel">
                <div className="ra-subpanel-head">
                  <div className="ra-subpanel-title">
                    <Layers size={15} className="text-blue-600" />
                    <span>Technical Skills (HR Calibration)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTechnicalSkill}
                    className="ra-btn-xs-blue"
                  >
                    <Plus size={12} />
                    <span>Add Skill</span>
                  </button>
                </div>

                <div className="ra-skills-list">
                  {technicalSkills.map((skill) => (
                    <div key={skill.id} className="ra-skill-clean-row">
                      <div className="min-w-0 flex-1">
                        <span className="ra-skill-name truncate block">{skill.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <select
                            value={skill.level}
                            onChange={(e) => handleUpdateSkillLevel(skill.id, e.target.value)}
                            className="ra-skill-level-select"
                          >
                            <option>Foundational (L2)</option>
                            <option>Proficient (L3)</option>
                            <option>Advanced (L4)</option>
                            <option>Expert (L5)</option>
                          </select>
                          <span className="ra-trend-pill">{skill.marketTrend}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveTechnicalSkill(skill.id)}
                        className="ra-delete-btn"
                        title="Delete Skill"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavioral & Requirements Column */}
              <div className="flex flex-col gap-3">
                {/* Behavioral Competencies */}
                <div className="ra-subpanel">
                  <div className="ra-subpanel-head">
                    <div className="ra-subpanel-title">
                      <Award size={15} className="text-purple-600" />
                      <span>Behavioral Competencies</span>
                    </div>
                  </div>

                  <div className="ra-beh-list">
                    {behavioralSkills.map((b) => (
                      <div key={b.id} className="ra-beh-item">
                        <div className="ra-beh-top">
                          <span className="ra-beh-name">{b.name}</span>
                          <span className="ra-beh-prio">{b.importance}</span>
                        </div>
                        <p className="ra-beh-desc">{b.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Requirements */}
                <div className="ra-subpanel">
                  <div className="ra-subpanel-head">
                    <div className="ra-subpanel-title">
                      <Clock size={15} className="text-amber-600" />
                      <span>Special Requirements & Experience</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="ra-btn-xs-amber"
                    >
                      <Plus size={11} />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="ra-req-list">
                    {competencies.map((comp, idx) => (
                      <div key={idx} className="ra-req-item">
                        <span className="ra-req-bullet" />
                        <span className="ra-req-text">{comp}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(idx)}
                          className="ra-delete-btn ra-req-delete"
                          title="Remove requirement"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Footer Action */}
            <footer className="ra-action-bar">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="ra-btn-secondary"
              >
                <ArrowLeft size={14} />
                <span>Back to Role Definition</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="ra-btn-primary"
              >
                <span>Proceed to Syndication & Talent Matching</span>
                <ChevronRight size={14} />
              </button>
            </footer>
          </div>
        </section>
      )}

      {/* ================= STEP 3: Multi-Channel Syndication & Best-Fit Talent ================= */}
      {currentStep === 3 && isSynthesized && (
        <section className="ra-card">
          <header className="ra-card-head">
            <div className="ra-card-head-left">
              <div className="ra-card-head-icon" style={{ background: '#059669' }}>3</div>
              <div>
                <h3 className="ra-card-title">Syndication & Internal Best-Fit Talent Matching</h3>
                <p className="ra-card-subtitle">
                  Publish role to marketplace and dispatch notifications directly to internal matches' Career Coach.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNotifyAllMatches}
              className="ra-btn-primary ra-btn-purple"
            >
              <Send size={13} />
              <span>Notify All Top Matches via Career Coach</span>
            </button>
          </header>

          <div className="ra-card-body">
            {/* 4. Publishing Channels Selection */}
            <div className="ra-pub-box">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Share2 size={13} className="text-blue-600" />
                  <span>4. Multi-Channel Syndication & Publishing</span>
                </span>

                <button
                  type="button"
                  onClick={handlePublishRole}
                  className={`ra-btn-primary ${isPublished ? 'ra-btn-emerald' : ''}`}
                >
                  <Share2 size={13} />
                  <span>{isPublished ? '✓ Published to Selected Channels' : 'Publish Role to Channels'}</span>
                </button>
              </div>

              <div className="ra-pub-options-grid">
                <label className={`ra-pub-channel-card ${publishChannels.marketplace ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={publishChannels.marketplace}
                    onChange={(e) => setPublishChannels({ ...publishChannels, marketplace: e.target.checked })}
                    className="ra-pub-checkbox"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Briefcase size={13} className="text-blue-600" />
                      <span>Internal Digital Talent Marketplace</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Instantly visible to all internal employees with AI match scoring and 1-click apply.
                    </p>
                  </div>
                </label>

                <label className={`ra-pub-channel-card ${publishChannels.linkedin ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={publishChannels.linkedin}
                    onChange={(e) => setPublishChannels({ ...publishChannels, linkedin: e.target.checked })}
                    className="ra-pub-checkbox"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Globe size={13} className="text-sky-600" />
                      <span>LinkedIn Jobs & Public Aggregators</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Public requisition syndicated to external talent search queries and aggregators.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 5 & 6. Internal Best Fit Employees List */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-violet-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800">
                    5. Internal Best-Fit Talent & 6. Career Coach Dispatch
                  </h4>
                </div>
                <span className="text-xs text-slate-500">Ranked by AI skill & capability fit score</span>
              </div>

              <div className="ra-candidates-grid">
                {candidates.map((employee) => (
                  <div key={employee.id} className="ra-candidate-card">
                    <div>
                      {/* Top row */}
                      <div className="ra-cand-top">
                        <div className="ra-cand-info">
                          <div className="ra-cand-avatar">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h5 className="ra-cand-name">{employee.name}</h5>
                            <p className="ra-cand-role">
                              {employee.currentRole} • {employee.department}
                            </p>
                          </div>
                        </div>

                        <span className="ra-fit-pill">
                          {employee.fitScore}% Fit
                        </span>
                      </div>

                      {/* Top Skills Tags */}
                      <div className="ra-cand-skills mt-2.5">
                        {employee.topSkills.map((s, i) => (
                          <span key={i} className="ra-skill-tag">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Dispatch Action */}
                    <div className="ra-cand-bottom">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {employee.readiness}
                      </span>

                      {employee.notified ? (
                        <span className="ra-notified-badge">
                          <CheckCircle2 size={13} />
                          <span>Sent to Career Coach</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNotifyEmployee(employee)}
                          className="ra-btn-notify"
                        >
                          <Send size={12} />
                          <span>Notify via Career Coach</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Back button */}
            <footer className="ra-action-bar">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="ra-btn-secondary"
              >
                <ArrowLeft size={14} />
                <span>Back to Skills & HR Review</span>
              </button>
            </footer>
          </div>
        </section>
      )}
    </div>
  );
};
