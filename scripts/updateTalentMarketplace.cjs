const fs = require('fs');
const path = './src/views/organization/TalentMarketplace.tsx';

let content = fs.readFileSync(path, 'utf8');

const roleArchitectOpp = `const ARCHITECTED_OPPORTUNITIES: MarketplaceOpportunity[] = [
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

`;

content = content.replace(
  "export const TalentMarketplace: React.FC = () => {",
  roleArchitectOpp + "export const TalentMarketplace: React.FC = () => {"
);

content = content.replace(
  "const [opportunities, setOpportunities] = useState<MarketplaceOpportunity[]>(DATA3_OPPORTUNITIES);",
  "const [opportunities, setOpportunities] = useState<MarketplaceOpportunity[]>([...ARCHITECTED_OPPORTUNITIES, ...DATA3_OPPORTUNITIES]);"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated TalentMarketplace.tsx');
