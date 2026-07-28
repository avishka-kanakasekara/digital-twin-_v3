import React, { useState } from 'react';
import { Briefcase, Plus, TrendingUp, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/Tabs';

interface ProjectsIntelligenceProps {
  projects: any;
  onAddProject: (project: any) => void;
  onUpdateStatus: (projectId: string, status: string) => void;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  'On Track': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  'At Risk': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  'Behind': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
};

const TECH_COLORS = [
  'rgba(124,58,237,0.15)', 'rgba(6,182,212,0.15)', 'rgba(16,185,129,0.15)',
  'rgba(245,158,11,0.15)', 'rgba(236,72,153,0.15)',
];

export const ProjectsIntelligence: React.FC<ProjectsIntelligenceProps> = ({ projects, onAddProject, onUpdateStatus }) => {
  const [newProjectName, setNewProjectName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onAddProject({ name: newProjectName, description: 'New project logged via Digital Twin.', role: 'Contributor', technologies: [], duration: 'Ongoing' });
    setNewProjectName('');
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.8)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      borderRadius: '24px',
      padding: '1.75rem',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 style={{
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#64748b',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
          }}>
            <Briefcase size={14} style={{ color: '#7c3aed' }} /> Project Intelligence
          </h3>
          <p style={{ fontSize: '11px', color: '#475569' }}>Impact and success prediction for your logged initiatives</p>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Log new project..."
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            style={{
              height: '36px', padding: '0 12px',
              borderRadius: '10px', fontSize: '12px', fontWeight: 600,
              background: 'rgba(248, 250, 252, 0.8)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              color: '#0f172a', outline: 'none', width: '100%',
            }}
            className="sm:w-48"
          />
          <button
            type="submit"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '0 14px', borderRadius: '10px', height: '36px',
              fontSize: '12px', fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white', border: 'none', cursor: 'pointer',
              boxShadow: '0 0 15px rgba(59,130,246,0.25)',
              flexShrink: 0,
            }}
          >
            <Plus size={14} /> Log
          </button>
        </form>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList
          className="grid w-full grid-cols-2 mb-6 p-1 rounded-xl"
          style={{ background: 'rgba(241, 245, 249, 0.8)' }}
        >
          <TabsTrigger value="current" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all" style={{ color: '#64748b' }}>
            Active & Pending
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all" style={{ color: '#64748b' }}>
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="m-0 space-y-4">
          {projects.current.map((project: any) => {
            const statusStyle = STATUS_STYLES[project.status] || STATUS_STYLES['Behind'];
            return (
              <div
                key={project.id}
                style={{
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  padding: '18px 20px',
                  transition: 'all 0.2s',
                }}
                className="hover:bg-white/[0.9]"
              >
                {/* Project Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: project.status === 'At Risk' ? 'rgba(239,68,68,0.15)' : project.successScore > 85 ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)',
                      color: project.status === 'At Risk' ? '#ef4444' : project.successScore > 85 ? '#10b981' : '#a78bfa',
                      border: `1px solid ${project.status === 'At Risk' ? 'rgba(239,68,68,0.25)' : project.successScore > 85 ? 'rgba(16,185,129,0.25)' : 'rgba(124,58,237,0.25)'}`,
                    }}>
                      {project.status === 'At Risk' ? <AlertTriangle size={15} /> : <TrendingUp size={15} />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        {project.name}
                      </h4>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <select
                          value={project.status}
                          onChange={e => onUpdateStatus(project.id, e.target.value)}
                          style={{
                            padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            background: statusStyle.bg, color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`, outline: 'none', cursor: 'pointer',
                          }}
                        >
                          <option>On Track</option>
                          <option>At Risk</option>
                          <option>Behind</option>
                        </select>
                        <span style={{
                          padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700,
                          background: 'rgba(248, 250, 252, 0.8)', color: '#64748b',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                        }}>
                          {project.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      {project.successScore}%
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>
                      Predicted Success
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  padding: '10px 12px', borderRadius: '10px', marginBottom: '14px',
                  background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)',
                }}>
                  <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <Sparkles size={11} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} />
                    {project.description}
                  </p>
                </div>

                {/* Leadership Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Leadership Impact
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#7c3aed' }}>{project.leadershipScore}%</span>
                  </div>
                  <div style={{ height: '5px', background: 'rgba(226, 232, 240, 0.8)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${project.leadershipScore}%`,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #7c3aed 100%)',
                      borderRadius: '99px',
                      boxShadow: '0 0 8px rgba(59,130,246,0.3)',
                    }} />
                  </div>
                </div>

                {/* Tech Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {project.technologies.map((tech: string, _ti: number) => (
                    <span key={tech} style={{
                      padding: '2px 8px', borderRadius: '6px',
                      fontSize: '10px', fontWeight: 700, color: '#64748b',
                      background: TECH_COLORS[_ti % TECH_COLORS.length],
                      border: '1px solid rgba(226, 232, 240, 0.5)',
                    }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="completed" className="m-0 space-y-3">
          {projects.completed.map((project: any) => (
            <div
              key={project.id}
              style={{
                padding: '16px 18px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(226, 232, 240, 0.6)',
              }}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
                <h4 style={{
                  fontSize: '14px', fontWeight: 700, color: '#0f172a',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                  {project.name}
                </h4>
                <span style={{
                  padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'rgba(16,185,129,0.12)', color: '#34d399',
                  border: '1px solid rgba(16,185,129,0.25)',
                  width: 'fit-content',
                }}>
                  Completed
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {project.technologies.map((tech: string, _ti: number) => (
                  <span key={tech} style={{
                    padding: '2px 8px', borderRadius: '6px',
                    fontSize: '10px', fontWeight: 700, color: '#64748b',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
