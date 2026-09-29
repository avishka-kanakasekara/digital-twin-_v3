import React, { useEffect, useState } from 'react';
import {
  Bot, Network, Briefcase, Database, BarChart3, Sparkles,
  Users, Trophy, HandHeart,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useDigitalTwin } from './hooks/useDigitalTwin';
import { EmployeeSelector } from '../../components/EmployeeSelector';
import { Card } from '../../components/Card';
import './PersonalDashboard.css';

import { IdentityProfile } from './components/twin/IdentityProfile';
import { SkillsIntelligence } from './components/twin/SkillsIntelligence';
import { KnowledgeSources } from './components/twin/KnowledgeSources';
import { ProjectsIntelligence } from './components/twin/ProjectsIntelligence';
import { PersonalAnalytics } from './components/twin/PersonalAnalytics';
import { GamificationBoard } from './components/twin/GamificationBoard';
import { TwinSummary } from './components/twin/TwinSummary';
import { CollaborationIntelligence } from './components/twin/CollaborationIntelligence';
import { AIRecommendations } from './components/twin/AIRecommendations';
import { PeerRecommendations } from './components/twin/PeerRecommendations';

type TabId = 'overview' | 'skills' | 'projects' | 'knowledge' | 'peers' | 'progress';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Bot size={14} /> },
  { id: 'skills', label: 'Skills', icon: <Network size={14} /> },
  { id: 'projects', label: 'Projects', icon: <Briefcase size={14} /> },
  { id: 'knowledge', label: 'Knowledge', icon: <Database size={14} /> },
  { id: 'peers', label: 'Peers', icon: <HandHeart size={14} /> },
  { id: 'progress', label: 'Progress', icon: <BarChart3 size={14} /> },
];

const SectionHead: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="pd-section__head">
    <div className="pd-section__title-row">
      <div className="pd-section__icon">{icon}</div>
      <div>
        <h2 className="pd-section__title">{title}</h2>
        {subtitle ? <p className="pd-section__sub">{subtitle}</p> : null}
      </div>
    </div>
    {action}
  </div>
);

const EmployeeTwin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'overview';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    if (TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam as TabId);
    }
  }, [tabParam]);

  const setTab = (id: TabId) => {
    setActiveTab(id);
    setSearchParams(id === 'overview' ? {} : { tab: id }, { replace: true });
  };

  const {
    profile, updateProfile,
    projects, addProject, updateProjectProgress, deleteProject,
    getProjectTasks, addTask, updateTask, deleteTask,
    knowledge, uploadKnowledgeSource, refreshAllData,
    gamification, completeMission,
    updateSkill, deleteSkill,
    skillsData, twinSummary,
    personalAnalytics, personalAnalyticsAI,
    collaborationIntel, aiRecommendations,
  } = useDigitalTwin();

  const twinHealth =
    (twinSummary as any)?.twinHealth ||
    (twinSummary as any)?.twin_health ||
    Math.round((twinSummary as any)?.aiConfidence || 0);

  return (
    <div className="personal-dashboard">
      <header className="pd-page-head">
        <div>
          <h1 className="pd-page-head__title">Personal Dashboard</h1>
          <p className="pd-page-head__sub">
            One live twin across career, learning, XP, and peer recognition.
          </p>
        </div>
        <div className="pd-head-right">
          <div className="pd-tabs-wrap">
            <div className="pd-tabs" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`pd-tab ${activeTab === tab.id ? 'pd-tab--active' : ''}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pd-employee-select">
            <EmployeeSelector />
          </div>
        </div>
      </header>

      <IdentityProfile
        profile={profile}
        onUpdate={updateProfile}
        twinHealth={twinHealth}
        gamification={gamification}
      />

      {activeTab === 'overview' && (
        <div className="pd-overview-grid">
          <div className="pd-stack">
            <Card glass={false} className="glass-panel pd-section">
              <SectionHead
                icon={<Sparkles size={20} />}
                title="Twin status"
                subtitle="How complete and current your digital twin is"
              />
              <TwinSummary summary={twinSummary} />
            </Card>

            <Card glass={false} className="glass-panel pd-section">
              <SectionHead
                icon={<Sparkles size={20} />}
                title="AI recommendations"
                subtitle="Next actions based on your twin profile"
                action={
                  <button type="button" className="pd-link-btn" onClick={() => setTab('skills')}>
                    View skills
                  </button>
                }
              />
              <AIRecommendations recommendations={aiRecommendations || []} />
            </Card>
          </div>

          <div className="pd-stack">
            <Card glass={false} className="glass-panel pd-section">
              <SectionHead
                icon={<HandHeart size={20} />}
                title="Peer recommendations"
                subtitle="What colleagues say about you — and who you can recommend"
                action={
                  <button type="button" className="pd-link-btn" onClick={() => setTab('peers')}>
                    Open peers
                  </button>
                }
              />
              <PeerRecommendations compact />
            </Card>

            <Card glass={false} className="glass-panel pd-section">
              <SectionHead
                icon={<Users size={20} />}
                title="Collaboration"
                subtitle="How colleagues experience your twin"
              />
              <CollaborationIntelligence intel={collaborationIntel} />
            </Card>

            <Card glass={false} className="glass-panel pd-section">
              <SectionHead
                icon={<Database size={20} />}
                title="Knowledge sources"
                subtitle="Documents feeding your twin"
                action={
                  <button type="button" className="pd-link-btn" onClick={() => setTab('knowledge')}>
                    Manage
                  </button>
                }
              />
              {(knowledge || []).length === 0 ? (
                <div className="pd-empty">
                  No documents yet. Upload a CV or project file to enrich your twin.
                </div>
              ) : (
                <div className="pd-rec-list">
                  {(knowledge || []).slice(0, 4).map((src: any) => (
                    <div key={src.id} className="pd-rec-item">
                      <div
                        className="pd-rec-item__icon"
                        style={{
                          background: 'rgba(37,99,235,0.1)',
                          borderColor: 'rgba(37,99,235,0.25)',
                          color: '#2563eb',
                        }}
                      >
                        <Database size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="pd-rec-item__text truncate">{src.name || src.filename || 'Document'}</p>
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                          {src.status || src.source_type || 'Uploaded'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <Card glass={false} className="glass-panel pd-section">
          <SectionHead
            icon={<Network size={20} />}
            title="Skill DNA"
            subtitle="Competencies mapped from your twin and knowledge sources"
          />
          <SkillsIntelligence skillsData={skillsData} updateSkill={updateSkill} deleteSkill={deleteSkill} />
        </Card>
      )}

      {activeTab === 'projects' && (
        <Card glass={false} className="glass-panel pd-section">
          <SectionHead
            icon={<Briefcase size={20} />}
            title="Projects"
            subtitle="Active work, progress, and task tracking"
          />
          <ProjectsIntelligence
            projects={projects}
            onAddProject={addProject}
            onUpdateStatus={updateProjectProgress}
            onDeleteProject={deleteProject}
            getProjectTasks={getProjectTasks}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
          />
        </Card>
      )}

      {activeTab === 'knowledge' && (
        <Card glass={false} className="glass-panel pd-section">
          <SectionHead
            icon={<Database size={20} />}
            title="Knowledge intelligence"
            subtitle="Upload documents to enrich your digital twin"
          />
          <KnowledgeSources
            sources={knowledge}
            onUpload={uploadKnowledgeSource}
            onPipelineComplete={refreshAllData}
          />
        </Card>
      )}

      {activeTab === 'peers' && (
        <Card glass={false} className="glass-panel pd-section">
          <SectionHead
            icon={<HandHeart size={20} />}
            title="Peer recommendations"
            subtitle="Every teammate can recommend any other — view what you received and give recognition"
          />
          <PeerRecommendations />
        </Card>
      )}

      {activeTab === 'progress' && (
        <div className="pd-stack">
          <Card glass={false} className="glass-panel pd-section">
            <SectionHead
              icon={<Trophy size={20} />}
              title="Gamification"
              subtitle="XP, missions, and achievements"
            />
            <GamificationBoard gamification={gamification} onCompleteMission={completeMission} />
          </Card>
          <Card glass={false} className="glass-panel pd-section">
            <SectionHead
              icon={<BarChart3 size={20} />}
              title="Personal analytics"
              subtitle="Productivity trends and AI insights"
            />
            <PersonalAnalytics analytics={personalAnalytics} personalAnalyticsAI={personalAnalyticsAI} />
          </Card>
        </div>
      )}
    </div>
  );
};

export { EmployeeTwin };
