import React, { useState } from 'react';
import {
  Network, Share2, Database, BarChart3, Sparkles, CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, AreaChart, Area
} from 'recharts';

export const OrgIntelligenceGraphs: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<any | null>({
    id: 'ai-core',
    label: 'Enterprise AI & MLOps',
    category: 'Core Domain',
    health: '94%',
    contributors: 42,
    subNodes: ['PyTorch Clusters', 'Vector Databases', 'Prompt Evaluation', 'GPU Orchestration']
  });

  // 1. Knowledge Graph Nodes & Links Data
  const knowledgeNodes = [
    { id: 'ai-core', label: 'AI & MLOps Platform', x: 260, y: 160, color: '#3b82f6', category: 'Core Domain', health: '94%', contributors: 42, subNodes: ['PyTorch Clusters', 'Vector Databases', 'GPU Orchestration'] },
    { id: 'cloud-infra', label: 'Cloud & Kubernetes', x: 120, y: 80, color: '#06b6d4', category: 'Infrastructure', health: '91%', contributors: 38, subNodes: ['EKS Clusters', 'Terraform Modules', 'Zero-Trust Gateways'] },
    { id: 'data-mesh', label: 'Data Mesh & Telemetry', x: 400, y: 80, color: '#8b5cf6', category: 'Data Architecture', health: '88%', contributors: 29, subNodes: ['Kafka Pipelines', 'Snowflake Vault', 'Telemetry Aggregators'] },
    { id: 'product-ux', label: 'Digital Product Systems', x: 110, y: 250, color: '#10b981', category: 'Product & Design', health: '95%', contributors: 34, subNodes: ['Design Token Engine', 'User Journey Analytics', 'Micro-Frontends'] },
    { id: 'governance', label: 'Risk & Compliance Twin', x: 410, y: 250, color: '#f59e0b', category: 'Governance', health: '89%', contributors: 22, subNodes: ['PCI-DSS Audit Trails', 'RBAC Policies', 'Continuous PenTesting'] },
    { id: 'talent-twin', label: 'Workforce Capability Twin', x: 260, y: 290, color: '#ec4899', category: 'Workforce', health: '96%', contributors: 65, subNodes: ['Skills Matrix', 'Career Coach Pathways', 'Talent Mobility'] },
  ];

  const knowledgeLinks = [
    { from: 'cloud-infra', to: 'ai-core' },
    { from: 'data-mesh', to: 'ai-core' },
    { from: 'ai-core', to: 'product-ux' },
    { from: 'ai-core', to: 'governance' },
    { from: 'ai-core', to: 'talent-twin' },
    { from: 'product-ux', to: 'talent-twin' },
    { from: 'governance', to: 'data-mesh' },
  ];

  // 2. Organization-Wise Knowledge Distributed Graph Data
  const knowledgeDistributionData = [
    { department: 'Engineering', explicitDocs: 94, tacticalSkillFlow: 89, crossDomainIndex: 92 },
    { department: 'Data & AI', explicitDocs: 91, tacticalSkillFlow: 95, crossDomainIndex: 88 },
    { department: 'Product & Design', explicitDocs: 86, tacticalSkillFlow: 84, crossDomainIndex: 90 },
    { department: 'Operations', explicitDocs: 82, tacticalSkillFlow: 78, crossDomainIndex: 75 },
    { department: 'HR & People', explicitDocs: 88, tacticalSkillFlow: 85, crossDomainIndex: 82 },
    { department: 'Sales & Marketing', explicitDocs: 79, tacticalSkillFlow: 80, crossDomainIndex: 76 },
    { department: 'Governance & Risk', explicitDocs: 93, tacticalSkillFlow: 74, crossDomainIndex: 84 },
  ];

  // 3. Organization Skills Inventory Graph Data (Proficiency Levels: Expert, Advanced, Intermediate, Foundational)
  const skillsInventoryData = [
    { skill: 'Cloud Architecture & K8s', expert: 24, advanced: 48, intermediate: 62, foundational: 85 },
    { skill: 'PyTorch / Distributed AI', expert: 18, advanced: 36, intermediate: 54, foundational: 72 },
    { skill: 'High-Throughput Data Streaming', expert: 20, advanced: 42, intermediate: 58, foundational: 65 },
    { skill: 'Product Systems & UI/UX', expert: 28, advanced: 50, intermediate: 70, foundational: 90 },
    { skill: 'Zero-Trust Security & SecOps', expert: 15, advanced: 32, intermediate: 45, foundational: 60 },
    { skill: 'Agile Coaching & Delivery', expert: 30, advanced: 55, intermediate: 80, foundational: 95 },
  ];

  return (
    <div className="flex flex-col gap-6 w-full text-left my-2">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Network size={20} className="text-blue-600" />
            <span>Organizational Knowledge & Skills Intelligence Graphs</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time topology of organizational twin knowledge connections, cross-department distribution, and enterprise skill inventory depth.
          </p>
        </div>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Live Digital Twin Synthesis
        </span>
      </div>

      {/* GRAPH 1: Interactive Knowledge Graph for Organization Twin */}
      <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Share2 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                1. Knowledge Graph for Organization Twin
              </h3>
              <p className="text-xs text-slate-500">
                Interactive topological network map showing knowledge clusters and interconnected capability nodes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Core AI</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Cloud</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Data</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Product</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Workforce</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual SVG Network Canvas */}
          <div className="lg:col-span-2 relative bg-slate-50 border border-slate-200/90 rounded-2xl p-4 overflow-hidden min-h-[340px] flex items-center justify-center shadow-2xs">
            <svg viewBox="0 0 520 360" className="w-full h-full max-h-[350px]">
              {/* Subtle Grid Pattern for clean light blueprint feel */}
              <defs>
                <pattern id="light-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="#94a3b8" opacity="0.25" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#light-dot-grid)" />

              {/* Edges */}
              {knowledgeLinks.map((link, idx) => {
                const source = knowledgeNodes.find(n => n.id === link.from);
                const target = knowledgeNodes.find(n => n.id === link.to);
                if (!source || !target) return null;
                const isHighlighted = selectedNode?.id === source.id || selectedNode?.id === target.id;
                return (
                  <line
                    key={idx}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#2563eb' : '#94a3b8'}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    strokeDasharray={isHighlighted ? 'none' : '4 3'}
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* Nodes */}
              {knowledgeNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer transition-transform duration-200 hover:scale-110"
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        r="24"
                        fill="none"
                        stroke={node.color}
                        strokeWidth="2"
                        className="animate-ping opacity-40"
                      />
                    )}
                    {/* Node circle */}
                    <circle
                      r={isSelected ? 18 : 14}
                      fill={node.color}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 2}
                      className="shadow-md"
                    />
                    {/* Label */}
                    <text
                      y={isSelected ? 30 : 26}
                      textAnchor="middle"
                      fill={isSelected ? '#0f172a' : '#334155'}
                      fontSize={isSelected ? '11px' : '10px'}
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Inspection Panel for Selected Node */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            {selectedNode ? (
              <div className="flex flex-col gap-4">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: selectedNode.color || '#3b82f6' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{selectedNode.label}</h4>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {selectedNode.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={12} /> {selectedNode.health} Health
                    </span>
                  </div>
                </div>

                {/* 3-Column / Responsive Telemetry Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Metric 1: Health & Stability */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Domain Health</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-black text-slate-900">{selectedNode.health}</span>
                      <span className="text-[10px] font-bold text-emerald-600">Optimal</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: selectedNode.health || '90%' }}
                      />
                    </div>
                  </div>

                  {/* Metric 2: Contributors */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Talent</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-black text-slate-900">{selectedNode.contributors}</span>
                      <span className="text-[10px] font-bold text-slate-500">Verified Specialists</span>
                    </div>
                    <p className="text-[10px] text-blue-600 font-semibold mt-1">Cross-department contributors</p>
                  </div>

                  {/* Metric 3: Sub-Domain Knowledge Assets */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between md:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Sub-Domain Knowledge Assets
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.subNodes.map((sub: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-2xs"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">
                Click any node in the knowledge graph to view real-time domain telemetry.
              </div>
            )}

            <div className="pt-2.5 mt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Graph Node Telemetry: <strong className="text-slate-800">{selectedNode?.id || 'none'}</strong></span>
              <span className="font-extrabold text-blue-600 flex items-center gap-1">
                <Sparkles size={11} /> Connected Digital Twin Model
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GRAPH 2 & GRAPH 3: Knowledge Distribution & Skills Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAPH 2: Organization-Wise Knowledge Distributed Graph */}
        <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    2. Organization-Wise Knowledge Distributed Graph
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Depth of documentation, tactical skills transfer & cross-domain flow by department
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={knowledgeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[60, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="explicitDocs" name="Documented Knowledge" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tacticalSkillFlow" name="Tactical Skill Flow" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="crossDomainIndex" name="Cross-Domain Sharing" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Aggregated from enterprise repositories, wikis & PR reviews</span>
            <span className="font-bold text-indigo-600">89.4% Avg Sharing</span>
          </div>
        </div>

        {/* GRAPH 3: Organization Skills Inventory Graph */}
        <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
                  <BarChart3 size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    3. Organization Skills Inventory Graph
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Depth of enterprise workforce capability categorized by proficiency levels
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={skillsInventoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="skill" tick={{ fontSize: 9.5, fill: '#64748b' }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="foundational" name="Foundational (L1)" stackId="1" stroke="#94a3b8" fill="#e2e8f0" />
                  <Area type="monotone" dataKey="intermediate" name="Intermediate (L2)" stackId="1" stroke="#60a5fa" fill="#bfdbfe" />
                  <Area type="monotone" dataKey="advanced" name="Advanced (L3)" stackId="1" stroke="#3b82f6" fill="#60a5fa" />
                  <Area type="monotone" dataKey="expert" name="Expert / Staff (L4+)" stackId="1" stroke="#1d4ed8" fill="#1d4ed8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Proficiency breakdown: Foundational → Expert</span>
            <span className="font-bold text-emerald-600">Enterprise Talent Depth</span>
          </div>
        </div>

      </div>
    </div>
  );
};
