import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Sparkles,
  Plus,
  X,
  ChevronRight,
  Star,
  Check,
  CheckCircle2,
  Briefcase,
  Target,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import {
  DATA3_OPPORTUNITIES,
  DATA3_APPLICATIONS
} from './talentMarketplaceData';
import type {
  MarketplaceOpportunity,
  MarketplaceApplication
} from './talentMarketplaceData';

// Top Hero Highlighted Opportunities matching reference prototype
const SCREENSHOT_HERO_OPPORTUNITIES: (MarketplaceOpportunity & {
  matchScore: number;
  matchType: 'Potential match' | 'Strong match';
  sourceSystem: { code: string; name: string };
  metaSubtitle: string;
  aiRationale: string;
  skillPillList: { name: string; current: number; target: number; desirable?: boolean }[];
})[] = [
  {
    opportunity_id: 'OPP-4001',
    opportunity_type: 'Role',
    linked_role_id: 'ROLE-2001',
    linked_project_id: '',
    org_unit_id: 'OU-004',
    org_unit_name: 'Retail Analytics',
    hiring_manager_id: 'EMP-0042',
    hiring_manager_name: 'Nethmi Madushanka',
    title: 'Senior Data Scientist',
    description: 'Own the machine-learning model lifecycle for retail demand and pricing models, from experimentation to production.',
    required_skills: [
      { skill_id: 'SKL-0065', skill_name: 'Python', target_proficiency: 4, category: 'Technical' },
      { skill_id: 'SKL-0068', skill_name: 'Machine Learning', target_proficiency: 4, category: 'Technical' },
      { skill_id: 'SKL-0071', skill_name: 'MLOps', target_proficiency: 3, category: 'Technical' }
    ],
    preferred_skills: [
      { skill_id: 'SKL-0075', skill_name: 'Statistics', category: 'Technical' }
    ],
    min_years_experience: 5,
    qualifications_required: 'MSc in Computer Science or Data Science',
    criticality_rating: 'Tier 1',
    published_at: '2026-09-15',
    application_deadline: '2026-10-31',
    positions_available: 1,
    duration_months: null,
    capacity_required_pct: 1.0,
    employment_type_eligible: 'Permanent',
    location: 'Colombo HQ',
    work_model: 'Hybrid',
    publication_status: 'Published',
    linked_gap_id: 'GAP-0141',
    matchScore: 85,
    matchType: 'Potential match',
    sourceSystem: { code: 'RS', name: 'From Recruitment System' },
    metaSubtitle: 'Retail Analytics · OU-004 · Hybrid · Permanent',
    aiRationale: 'Potential match: Python and Machine Learning are one level below target; MLOps needs confirmed evidence.',
    skillPillList: [
      { name: 'Python', current: 3, target: 4 },
      { name: 'Machine Learning', current: 3, target: 4 },
      { name: 'MLOps', current: 2, target: 3 },
      { name: 'Statistics', current: 4, target: 4, desirable: true }
    ]
  },
  {
    opportunity_id: 'OPP-GIG-002',
    opportunity_type: 'Gig',
    linked_role_id: 'ROLE-2014',
    linked_project_id: 'PRJ-FEATURE-STORE',
    org_unit_id: 'OU-006',
    org_unit_name: 'Digital Lab',
    hiring_manager_id: 'EMP-0088',
    hiring_manager_name: 'Platform Engineering Lead',
    title: 'Feature Store pilot — data pipelines',
    description: 'Short stretch assignment to build two reusable feature pipelines for the Feature Store pilot.',
    required_skills: [
      { skill_id: 'SKL-0071', skill_name: 'MLOps', target_proficiency: 2, category: 'Technical' },
      { skill_id: 'SKL-0065', skill_name: 'Python', target_proficiency: 3, category: 'Technical' }
    ],
    preferred_skills: [
      { skill_id: 'SKL-0092', skill_name: 'Feature Engineering', category: 'Technical' }
    ],
    min_years_experience: 2,
    qualifications_required: 'Relevant Experience in Data Engineering',
    criticality_rating: 'Tier 2',
    published_at: '2026-10-15',
    application_deadline: '2026-11-08',
    positions_available: 2,
    duration_months: 2,
    capacity_required_pct: 0.2,
    employment_type_eligible: 'Internal Stretch',
    location: 'Remote',
    work_model: 'Remote',
    publication_status: 'Published',
    linked_gap_id: 'GAP-0155',
    matchScore: 84,
    matchType: 'Strong match',
    sourceSystem: { code: 'PS', name: 'From Project System' },
    metaSubtitle: 'Digital Lab · Remote · 8 weeks · 20% of time',
    aiRationale: 'Recommended based on your endorsed MLOps and Python skills and recent project experience.',
    skillPillList: [
      { name: 'MLOps', current: 2, target: 2 },
      { name: 'Python', current: 3, target: 3 },
      { name: 'Feature Engineering', current: 0, target: 2, desirable: true }
    ]
  },
  {
    opportunity_id: 'OPP-PROJ-003',
    opportunity_type: 'Project',
    linked_role_id: 'ROLE-2001',
    linked_project_id: 'PROJ-3001',
    org_unit_id: 'OU-004',
    org_unit_name: 'Retail Analytics',
    hiring_manager_id: 'EMP-0042',
    hiring_manager_name: 'Nethmi Madushanka',
    title: 'ML Engineer — Retail Demand Forecasting Model',
    description: 'Build and deploy the forecasting pipeline for the retail demand model alongside a four-person project team.',
    required_skills: [
      { skill_id: 'SKL-0068', skill_name: 'Machine Learning', target_proficiency: 4, category: 'Technical' },
      { skill_id: 'SKL-0065', skill_name: 'Python', target_proficiency: 4, category: 'Technical' },
      { skill_id: 'SKL-0071', skill_name: 'MLOps', target_proficiency: 3, category: 'Technical' }
    ],
    preferred_skills: [],
    min_years_experience: 3,
    qualifications_required: 'Experience with predictive modeling',
    criticality_rating: 'Tier 1',
    published_at: '2026-10-01',
    application_deadline: '2026-11-15',
    positions_available: 1,
    duration_months: 6,
    capacity_required_pct: 0.6,
    employment_type_eligible: 'Internal Project Assignment',
    location: 'Colombo HQ / Hybrid',
    work_model: 'Hybrid',
    publication_status: 'Published',
    linked_gap_id: 'GAP-0142',
    matchScore: 81,
    matchType: 'Potential match',
    sourceSystem: { code: 'IA', name: 'From Team Assembly' },
    metaSubtitle: 'PROJ-3001 · Retail Analytics · Hybrid · 6 months · 60% of time',
    aiRationale: 'High alignment with current ML modeling credentials and enterprise forecasting initiatives.',
    skillPillList: [
      { name: 'Python', current: 3, target: 4 },
      { name: 'Machine Learning', current: 3, target: 4 },
      { name: 'MLOps', current: 2, target: 3 }
    ]
  }
];

const ARCHITECTED_OPPORTUNITIES: MarketplaceOpportunity[] = [
  {
    opportunity_id: 'OPP-ARCH-001',
    opportunity_type: 'Role',
    linked_role_id: 'ROLE-AI-01',
    linked_project_id: '',
    org_unit_id: 'OU-001',
    org_unit_name: 'Engineering & AI',
    hiring_manager_id: 'EMP-0010',
    hiring_manager_name: 'Lead AI Director',
    title: 'Senior AI Platform Architect (Role Architect Published)',
    description: 'Formulated via Role Architect Studio. Lead enterprise adoption of Large Language Models and fine-tuning pipelines. Architect scalable inference clusters on Kubernetes with GPU pooling, prompt evaluation frameworks, and mentor engineers.',
    required_skills: [
      { skill_id: 'SK-01', skill_name: 'Kubernetes & GPU Orchestration', target_proficiency: 5, category: 'Technical' },
      { skill_id: 'SK-02', skill_name: 'PyTorch / Distributed Training', target_proficiency: 4, category: 'Technical' },
      { skill_id: 'SK-03', skill_name: 'Vector DBs (Pinecone, Milvus)', target_proficiency: 4, category: 'Technical' }
    ],
    preferred_skills: [{ skill_id: 'SK-04', skill_name: 'MLOps & CI/CD', category: 'Technical' }],
    min_years_experience: 6,
    qualifications_required: 'CKA or Cloud Architect Certification',
    criticality_rating: 'Tier 1',
    published_at: '2026-10-30',
    application_deadline: '2026-11-30',
    positions_available: 2,
    duration_months: null,
    capacity_required_pct: 100,
    employment_type_eligible: 'Full Time',
    location: 'Colombo HQ / Remote',
    work_model: 'Hybrid',
    publication_status: 'Published',
    linked_gap_id: 'GAP-AI-01'
  },
  {
    opportunity_id: 'OPP-TEAM-002',
    opportunity_type: 'Project',
    linked_role_id: 'ROLE-TM-02',
    linked_project_id: 'PRJ-PHOENIX',
    org_unit_id: 'OU-002',
    org_unit_name: 'Supply Chain Operations',
    hiring_manager_id: 'EMP-0012',
    hiring_manager_name: 'Operations VP',
    title: 'Project Phoenix - AI Supply Chain Automation Squad',
    description: 'High-impact 6-month cross-functional squad from Team Assembly Studio. Deploy automated predictive retail fulfillment models with real-time telemetry streaming.',
    required_skills: [
      { skill_id: 'SK-05', skill_name: 'Kafka Streaming', target_proficiency: 4, category: 'Technical' },
      { skill_id: 'SK-06', skill_name: 'Time-Series Forecasting', target_proficiency: 4, category: 'Technical' }
    ],
    preferred_skills: [{ skill_id: 'SK-07', skill_name: 'Figma Dashboards', category: 'Design' }],
    min_years_experience: 4,
    qualifications_required: 'Data or Engineering Degree',
    criticality_rating: 'Tier 1',
    published_at: '2026-10-30',
    application_deadline: '2026-11-20',
    positions_available: 5,
    duration_months: 6,
    capacity_required_pct: 50,
    employment_type_eligible: 'Internal Secondment / Gig',
    location: 'Hybrid',
    work_model: 'Hybrid',
    publication_status: 'Published',
    linked_gap_id: 'GAP-OPS-02'
  }
];

// Circular Score Gauge Component
const CircularScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 24;
  const stroke = 3.5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const isHigh = score >= 84;
  const strokeColor = isHigh ? '#10b981' : '#f59e0b';

  return (
    <div className="relative flex items-center justify-center shrink-0 w-16 h-16">
      <svg className="w-16 h-16 transform -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-lg font-black text-slate-800 tracking-tight">
        {score}
      </span>
    </div>
  );
};

export const TalentMarketplace: React.FC = () => {
  // Perspective state (Employee | Manager | HR)
  const [perspective, setPerspective] = useState<'Employee' | 'Manager' | 'HR'>('Employee');

  // Opportunities State: Merged list with screenshot heroes first, followed by others without duplicates
  const [opportunities, setOpportunities] = useState<MarketplaceOpportunity[]>(() => {
    const existingHeroIds = new Set(SCREENSHOT_HERO_OPPORTUNITIES.map(h => h.opportunity_id));
    const otherData3 = DATA3_OPPORTUNITIES.filter(o => !existingHeroIds.has(o.opportunity_id));
    return [...SCREENSHOT_HERO_OPPORTUNITIES, ...ARCHITECTED_OPPORTUNITIES, ...otherData3];
  });

  const [applications, setApplications] = useState<MarketplaceApplication[]>(DATA3_APPLICATIONS);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Role' | 'Gig' | 'Project'>('All');
  const [appliedOppIds, setAppliedOppIds] = useState<string[]>(['OPP-4001']);
  const [savedOppIds, setSavedOppIds] = useState<string[]>(['OPP-4002', 'OPP-SAVED-01']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Panels
  const [showDetailModal, setShowDetailModal] = useState<MarketplaceOpportunity | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAnnotationsModal, setShowAnnotationsModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);

  // Post Opportunity Form
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'Role' | 'Gig' | 'Project' | 'Secondment'>('Role');
  const [newDept, setNewDept] = useState('Retail Analytics');
  const [newSkills, setNewSkills] = useState('');
  const [newWorkModel, setNewWorkModel] = useState('Hybrid');
  const [newDescription, setNewDescription] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Distinct Departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach(o => set.add(o.org_unit_name));
    return Array.from(set);
  }, [opportunities]);

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      const matchSearch =
        searchQuery === '' ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.org_unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.required_skills.some(s => s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType =
        activeFilter === 'All' ||
        opp.opportunity_type.toLowerCase() === activeFilter.toLowerCase();

      return matchSearch && matchType;
    });
  }, [opportunities, searchQuery, activeFilter]);

  // Handle Apply
  const handleApply = (opp: MarketplaceOpportunity) => {
    if (appliedOppIds.includes(opp.opportunity_id)) return;

    setAppliedOppIds(prev => [...prev, opp.opportunity_id]);

    const newApp: MarketplaceApplication = {
      application_id: `APP-00${450 + applications.length}`,
      opportunity_id: opp.opportunity_id,
      opportunity_title: opp.title,
      opportunity_type: opp.opportunity_type,
      org_unit_name: opp.org_unit_name,
      employee_id: 'EMP-1112',
      employee_name: 'Nadeesha Perera (You)',
      current_role_title: 'Data Analyst',
      current_org_unit_id: 'OU-006',
      current_org_unit_name: 'Digital Platforms & IT',
      employee_location: 'Colombo HQ',
      tenure_years: 3.3,
      application_date: new Date().toISOString().split('T')[0],
      current_stage: 'Applied',
      stage_entered_at: new Date().toISOString(),
      stage_history: 'Applied (Just now)',
      override_reason: null,
      manager_release_status: 'Requested',
      outcome_reason: null,
      closed_gap_id: null,
      scores: {
        overall_match_pct: 85.0,
        skill_match_pct: 82.0,
        experience_match_pct: 84.0,
        qualification_match_pct: 100.0,
        career_fit_pct: 95.0,
        location_fit_pct: 100.0,
        readiness_score: 0.85
      },
      skill_gaps: [],
      time_to_ready_months: 2.0,
      backfill_impact: 'Standard vacancy'
    };

    setApplications(prev => [newApp, ...prev]);
    triggerToast(`Application submitted for ${opp.title}!`);
  };

  // Toggle Save
  const handleToggleSave = (id: string, title: string) => {
    if (savedOppIds.includes(id)) {
      setSavedOppIds(savedOppIds.filter(x => x !== id));
      triggerToast(`Removed '${title}' from saved.`);
    } else {
      setSavedOppIds([...savedOppIds, id]);
      triggerToast(`Saved '${title}' to your profile.`);
    }
  };

  // Create New Opportunity
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newOpp: MarketplaceOpportunity = {
      opportunity_id: `OPP-${4000 + opportunities.length + 1}`,
      opportunity_type: newType,
      linked_role_id: `ROLE-${2000 + opportunities.length}`,
      linked_project_id: '',
      org_unit_id: 'OU-004',
      org_unit_name: newDept,
      hiring_manager_id: 'EMP-0042',
      hiring_manager_name: 'Hiring Manager',
      title: newTitle,
      description: newDescription || 'Strategic cross-functional opportunity.',
      required_skills: newSkills
        ? newSkills.split(',').map((s, idx) => ({
            skill_id: `SKL-${idx}`,
            skill_name: s.trim(),
            target_proficiency: 3,
            category: 'Core'
          }))
        : [{ skill_id: 'SKL-01', skill_name: 'General', target_proficiency: 3, category: 'Core' }],
      preferred_skills: [],
      min_years_experience: 2,
      qualifications_required: 'Relevant Experience',
      criticality_rating: 'Tier 1',
      published_at: new Date().toISOString().split('T')[0],
      application_deadline: '2026-11-30',
      positions_available: 1,
      duration_months: newType === 'Role' ? null : 6,
      capacity_required_pct: 1.0,
      employment_type_eligible: 'FTE',
      location: 'Colombo HQ',
      work_model: newWorkModel,
      publication_status: 'Published',
      linked_gap_id: 'GAP-0141'
    };

    setOpportunities(prev => [newOpp, ...prev]);
    setShowPostModal(false);
    setNewTitle('');
    setNewSkills('');
    setNewDescription('');
    triggerToast(`Opportunity '${newTitle}' published successfully!`);
  };

  return (
    <div className="flex flex-col gap-4 w-full pb-14 text-slate-800">
      {/* Toast Notification */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom-2 border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>,
        document.body
      )}

      {/* Corporate Page Header Bar matching all other views */}
      <div className="flex flex-col gap-1 w-full pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full py-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Digital Talent Marketplace
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Marketplace Active
            </span>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Perspective Selector */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 h-9">
              {(['Employee', 'Manager', 'HR'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPerspective(p)}
                  className={`px-3 h-7 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    perspective === p
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Annotations Button */}
            <button
              onClick={() => setShowAnnotationsModal(true)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span className="text-slate-500 font-normal">+</span>
              <span>Annotations</span>
            </button>

            {/* Connected Sources Status Badge */}
            <div className="h-9 px-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] sm:text-xs text-slate-600 font-medium">5 of 8 sources connected</span>
            </div>

            {/* Post Opportunity Button */}
            <button
              onClick={() => setShowPostModal(true)}
              className="h-9 px-3.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Post Opportunity</span>
            </button>

            {/* User Profile Avatar */}
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer" title="Nadeesha Perera (Employee)">
              NP
            </div>
          </div>
        </div>
        <p className="text-xs font-medium text-slate-500 text-left">
          Internal career mobility, project gigs, and AI-recommended skill opportunities across the enterprise.
        </p>
      </div>

      {/* Spacious Search Bar (with 48px left indent preventing icon overlap) */}
      <div className="relative w-full">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search roles, projects, gigs, skills or people..."
          className="w-full pl-12 pr-4 h-11 bg-white hover:border-slate-300 focus:bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-teal-600 transition-all shadow-2xs placeholder:text-slate-400"
        />
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="flex flex-col xl:flex-row items-start gap-4 w-full">
        {/* LEFT / MAIN COLUMN: Opportunities & Filters */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-3.5">
          {/* Quick Filter Toolbar & System Notice */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Filter by Type Horizontal Segmented Pills */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
              {(['All', 'Role', 'Gig', 'Project'] as const).map(type => {
                const count = type === 'All'
                  ? opportunities.length
                  : opportunities.filter(o => o.opportunity_type.toLowerCase() === type.toLowerCase()).length;

                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeFilter === type
                        ? 'bg-white text-teal-800 shadow-2xs font-extrabold border border-teal-200/60'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{type === 'All' ? 'All Types' : `${type}s`}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeFilter === type ? 'bg-teal-50 text-teal-700' : 'bg-slate-200/70 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Clean Connected System Notice */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="hidden sm:inline">The marketplace reads from connected modules.</span>
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold shrink-0">
                Connected Twin
              </span>
            </div>
          </div>

          {/* Header Row: "Recommended for you" + "All matches >" */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Recommended for you
            </h2>
            <button
              onClick={() => {
                setActiveFilter('All');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>All matches</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Opportunity Cards List */}
          <div className="flex flex-col gap-3">
            {filteredOpportunities.map((opp, idx) => {
              const isApplied = appliedOppIds.includes(opp.opportunity_id);
              const isSaved = savedOppIds.includes(opp.opportunity_id);

              // Extract or compute display attributes matching prototype
              const heroData = SCREENSHOT_HERO_OPPORTUNITIES.find(h => h.opportunity_id === opp.opportunity_id);
              const score = heroData ? heroData.matchScore : (86 - (idx % 12));
              const matchType = heroData ? heroData.matchType : (score >= 84 ? 'Strong match' : 'Potential match');
              const priority = opp.criticality_rating || (idx % 2 === 0 ? 'Tier 1' : 'Tier 2');
              const deadline = opp.application_deadline ? `Closes ${new Date(opp.application_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Closes 15 Nov 2026';
              const sourceCode = heroData ? heroData.sourceSystem.code : (opp.opportunity_type === 'Role' ? 'RS' : opp.opportunity_type === 'Project' ? 'IA' : 'PS');
              const sourceName = heroData ? heroData.sourceSystem.name : (opp.opportunity_type === 'Role' ? 'From Recruitment System' : opp.opportunity_type === 'Project' ? 'From Team Assembly' : 'From Project System');

              const metaSubtitle = heroData
                ? heroData.metaSubtitle
                : `${opp.org_unit_name} · ${opp.org_unit_id} · ${opp.work_model || 'Hybrid'} · ${opp.opportunity_type}`;

              const rationale = heroData
                ? heroData.aiRationale
                : `${matchType}: Core skill match evaluated against employee telemetry baseline. High alignment on ${opp.required_skills[0]?.skill_name || 'technical domain'}.`;

              const skillPills = heroData?.skillPillList || opp.required_skills.slice(0, 4).map((s, sIdx) => ({
                name: s.skill_name,
                current: Math.max(1, s.target_proficiency - (sIdx % 2)),
                target: s.target_proficiency,
                desirable: sIdx === 3
              }));

              const typeBadgeLabel = opp.opportunity_type === 'Role' ? 'Internal Job' : opp.opportunity_type === 'Gig' ? 'Gig / stretch' : 'Project';

              return (
                <div
                  key={opp.opportunity_id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row items-start justify-between gap-4"
                >
                  {/* Left: Circular Match Score Dial */}
                  <div className="flex md:flex-col items-center justify-center shrink-0">
                    <CircularScoreGauge score={score} />
                  </div>

                  {/* Middle: Content & Badges */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {/* Badges Row */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] leading-tight">
                      {/* Type Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200/70">
                        {opp.opportunity_type === 'Role' ? <Briefcase size={11} className="text-slate-500" /> : opp.opportunity_type === 'Gig' ? <Sparkles size={11} className="text-amber-500" /> : <Target size={11} className="text-indigo-500" />}
                        <span>{typeBadgeLabel}</span>
                      </span>

                      {/* Match Level */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold border ${
                          matchType === 'Strong match'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {matchType}
                      </span>

                      {/* Priority */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200">
                        <span>▲</span>
                        <span>{priority} priority</span>
                      </span>

                      {/* Source System */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                        <span className="w-3.5 h-3.5 rounded bg-blue-700 text-white text-[9px] font-black flex items-center justify-center leading-none">
                          {sourceCode}
                        </span>
                        <span>{sourceName}</span>
                      </span>

                      {/* Closing Date (Right aligned on desktop) */}
                      <span className="ml-auto text-[11px] font-semibold text-slate-600">
                        {deadline}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug hover:text-teal-700 transition-colors">
                      {opp.title}
                    </h3>

                    {/* Subtitle / Meta Line */}
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span>{metaSubtitle}</span>
                    </div>

                    {/* Description Paragraph */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-0.5">
                      {opp.description}
                    </p>

                    {/* Skills Proficiency Tags Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {skillPills.map((sk, skIdx) => (
                        <span
                          key={skIdx}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            sk.desirable
                              ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
                              : sk.name === 'MLOps'
                              ? 'bg-slate-50 text-slate-800 border-dashed border-slate-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sk.name} {sk.current}/{sk.target}
                          {sk.desirable && <span className="font-normal text-emerald-600"> · desirable</span>}
                        </span>
                      ))}
                    </div>

                    {/* AI Rationale / Explanation */}
                    <div className="text-[11px] text-slate-500 italic mt-1 leading-normal">
                      {rationale}
                    </div>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0 w-full md:w-44 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* View Details Button */}
                    <button
                      onClick={() => setShowDetailModal(opp)}
                      className="w-full md:w-36 h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer text-center"
                    >
                      View details
                    </button>

                    {/* Primary Apply / Express interest button */}
                    <button
                      onClick={() => handleApply(opp)}
                      disabled={isApplied}
                      className={`w-full md:w-36 h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isApplied
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default font-extrabold'
                          : 'bg-[#0f6b5c] hover:bg-[#0c594c] text-white'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check size={13} className="text-emerald-700" />
                          <span>Applied</span>
                        </>
                      ) : opp.opportunity_type === 'Role' ? (
                        <>
                          <span>Apply in Recruitment System</span>
                          <ArrowUpRight size={12} />
                        </>
                      ) : (
                        <span>Express interest</span>
                      )}
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={() => handleToggleSave(opp.opportunity_id, opp.title)}
                      className={`flex items-center gap-1 text-xs font-semibold py-1 px-1 transition-colors cursor-pointer ${
                        isSaved ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Star size={13} className={isSaved ? 'fill-amber-400 text-amber-500' : 'text-slate-400'} />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Stack (Applications & interest, Recently viewed & saved, SUPPLY - YOUR PROFILE) */}
        <div className="w-full xl:w-88 shrink-0 flex flex-col gap-4">
          {/* CARD 1: Applications & interest */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Applications & interest
              </h3>
              <button
                onClick={() => setShowTrackingModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Track</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Item 1 */}
              <div className="flex items-start justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-slate-900 leading-snug">
                    Data Science Associate
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Application · Interview 29 Oct, 10:00
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100/70 text-purple-800 border border-purple-200">
                  Interview
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-start justify-between gap-2 text-xs pt-2.5 border-t border-slate-100">
                <div>
                  <div className="font-bold text-slate-900 leading-snug">
                    ML Engineer — Retail Demand Forecasting Model
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Invitation · Respond by 30 Oct
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100/70 text-pink-800 border border-pink-200">
                  Invited
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-start justify-between gap-2 text-xs pt-2.5 border-t border-slate-100">
                <div>
                  <div className="font-bold text-slate-900 leading-snug">
                    Churn model review gig
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Expression of interest · Intro call 28 Oct
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                  Shortlisted
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: Recently viewed & saved */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight pb-2 border-b border-slate-100">
              Recently viewed & saved
            </h3>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 truncate pr-2">
                  Feature Store pilot — data pipelines
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">Viewed</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="font-medium text-slate-800 truncate pr-2">
                  Analytics Product Owner
                </span>
                <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 shrink-0">
                  <span>★</span>
                  <span>Saved</span>
                </span>
              </div>

              {savedOppIds.filter(id => id !== 'OPP-4002' && id !== 'OPP-SAVED-01').map(savedId => {
                const item = opportunities.find(o => o.opportunity_id === savedId);
                if (!item) return null;
                return (
                  <div key={savedId} className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="font-medium text-slate-800 truncate pr-2">{item.title}</span>
                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 shrink-0">
                      <span>★</span>
                      <span>Saved</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 3: SUPPLY - YOUR PROFILE (From Employee Twin) */}
          <div className="bg-white border-2 border-teal-700/80 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 relative overflow-hidden">
            {/* Top Tag Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-black text-teal-800 tracking-wider uppercase">
                <span>▼</span>
                <span>SUPPLY - YOUR PROFILE</span>
              </div>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                <span className="w-3.5 h-3.5 rounded bg-blue-700 text-white text-[8px] font-black flex items-center justify-center">
                  ET
                </span>
                <span>From Employee Twin</span>
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-900">Your position</div>
              <p className="text-[11px] text-slate-500">Live verified telemetry from employee capability model</p>
            </div>

            {/* Segmented Skill Bars */}
            <div className="flex flex-col gap-2.5 pt-1">
              {/* MLOps */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-semibold text-[11px]">MLOps</span>
                <div className="flex items-center gap-1">
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs border-2 border-dashed border-teal-600 bg-teal-50" />
                </div>
              </div>

              {/* Machine Learning */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-semibold text-[11px]">Machine Learning</span>
                <div className="flex items-center gap-1">
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs border-2 border-dashed border-teal-600 bg-teal-50" />
                </div>
              </div>

              {/* Python */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-semibold text-[11px]">Python</span>
                <div className="flex items-center gap-1">
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs border-2 border-dashed border-teal-600 bg-teal-50" />
                </div>
              </div>

              {/* Statistics */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-semibold text-[11px]">Statistics</span>
                <div className="flex items-center gap-1">
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                  <span className="w-5 h-2 rounded-xs bg-teal-700" />
                </div>
              </div>
            </div>

            {/* Segmented Bar Legend */}
            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 leading-tight">
              Solid = confirmed or endorsed · dashed = declared or inferred
            </div>
          </div>

          {/* Ask Career Coach Floating / Fixed Purple Pill Button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => setShowCoachModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#7942cf] hover:bg-[#6833be] active:scale-95 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
            >
              <Sparkles size={14} className="text-purple-200" />
              <span>Ask Career Coach</span>
            </button>
          </div>
        </div>
      </div>

      {/* TRACKING PIPELINE MODAL */}
      {showTrackingModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[85vh] shadow-2xl flex flex-col gap-4 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Application & Interest Tracker</h3>
                <p className="text-xs text-slate-500">Track real-time candidate progression and mobility stage transitions ({applications.length} Active Records)</p>
              </div>
              <button
                onClick={() => setShowTrackingModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Opportunity</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Fit</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.slice(0, 15).map(app => (
                    <tr key={app.application_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {app.employee_name}
                        <span className="block text-[10px] font-normal text-slate-400">{app.application_id}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {app.opportunity_title}
                        <span className="block text-[10px] font-normal text-slate-400">{app.opportunity_type}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{app.org_unit_name}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                          {app.scores.overall_match_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {app.current_stage}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-semibold text-slate-600">
                          {app.manager_release_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowTrackingModal(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800"
              >
                Close Tracker
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* VIEW DETAILS MODAL */}
      {showDetailModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4 border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold text-[10px] border border-teal-200 uppercase tracking-wider">
                  {showDetailModal.opportunity_type}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{showDetailModal.title}</h3>
                <p className="text-xs text-slate-500">{showDetailModal.org_unit_name} · {showDetailModal.location}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Opportunity Scope & Impact</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {showDetailModal.description}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1.5">Required Competencies & Proficiency Targets</h4>
                <div className="flex flex-wrap gap-1.5">
                  {showDetailModal.required_skills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                      {s.skill_name} (Target L{s.target_proficiency})
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-medium">Hiring Manager</span>
                  <span className="font-bold text-slate-800">{showDetailModal.hiring_manager_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Work Arrangement</span>
                  <span className="font-bold text-slate-800">{showDetailModal.work_model}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Back
              </button>
              <button
                onClick={() => {
                  handleApply(showDetailModal);
                  setShowDetailModal(null);
                }}
                disabled={appliedOppIds.includes(showDetailModal.opportunity_id)}
                className="px-5 py-2 rounded-xl bg-[#0f6b5c] hover:bg-[#0c594c] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {appliedOppIds.includes(showDetailModal.opportunity_id) ? 'Already Applied' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* POST OPPORTUNITY MODAL */}
      {showPostModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Post Opportunity</h3>
                  <p className="text-[11px] text-slate-500">Publish internal gig, project, or full-time role</p>
                </div>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Senior Machine Learning Engineer"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                  >
                    <option value="Role">Internal Job</option>
                    <option value="Gig">Gig / Stretch</option>
                    <option value="Project">Project Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Work Model</label>
                  <select
                    value={newWorkModel}
                    onChange={e => setNewWorkModel(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={e => setNewSkills(e.target.value)}
                  placeholder="Python, MLOps, SQL"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Key responsibilities and goals..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ANNOTATIONS MODAL */}
      {showAnnotationsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-3 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass size={16} className="text-teal-600" />
                <span>Marketplace Annotations</span>
              </h3>
              <button
                onClick={() => setShowAnnotationsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Active telemetry connects 5 enterprise systems including Human Capital ERP, Learning Experience Platform, GitHub Commit Graph, and Project Jira boards.
            </p>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Recommendation matching engine: Cosine similarity on verified skill embedding vectors with tenure weighting.
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAnnotationsModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ASK CAREER COACH MODAL */}
      {showCoachModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-3.5 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Career Coach AI</h3>
                  <p className="text-[10px] text-slate-500">Autonomous Career Mobility Advisor</p>
                </div>
              </div>
              <button
                onClick={() => setShowCoachModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <div className="bg-purple-50/70 border border-purple-200/80 p-3.5 rounded-2xl text-xs text-purple-950 leading-relaxed flex flex-col gap-2">
              <p className="font-semibold text-purple-900">
                ✦ Career Insight for Nadeesha Perera:
              </p>
              <p>
                You are currently an <strong>85% fit</strong> for the <em>Senior Data Scientist</em> role in Retail Analytics. Taking the <em>Feature Store pilot gig</em> will close your 1-level MLOps gap within 8 weeks, elevating your match fit score to <strong>96%</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCoachModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowCoachModal(false);
                  triggerToast('Learning plan generated and synced to your Employee Twin!');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Sync Mobility Plan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
