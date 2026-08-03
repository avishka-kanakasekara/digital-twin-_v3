import React, { useState } from 'react';
import { Bot, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDigitalTwin } from './hooks/useDigitalTwin';
import { EmployeeSelector } from '../../components/EmployeeSelector';

// Components
import { IdentityProfile } from './components/twin/IdentityProfile';
import { TwinSummary } from './components/twin/TwinSummary';
import { SkillsIntelligence } from './components/twin/SkillsIntelligence';
import { AIReadiness } from './components/twin/AIReadiness';
import { KnowledgeSources } from './components/twin/KnowledgeSources';
import { ProjectsIntelligence } from './components/twin/ProjectsIntelligence';
import { PersonalAnalytics } from './components/twin/PersonalAnalytics';
import { GamificationBoard } from './components/twin/GamificationBoard';
import { AIRecommendations } from './components/twin/AIRecommendations';
import { AICareerAssistant } from '../../components/chat/AICareerAssistant';

const EmployeeTwin: React.FC = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const {
    profile, updateProfile,
    projects, addProject, updateProjectProgress,
    knowledge, uploadKnowledgeSource,
    gamification, completeMission,
    skillsData, aiReadiness, twinSummary, twinMemory,
    personalAnalytics, aiRecommendations
  } = useDigitalTwin();

  return (
    <div
      className="min-h-screen font-sans overflow-x-hidden"
      style={{
        background: '#f8fafc',
        color: '#0f172a',
      }}
    >
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.04) 50%, transparent 100%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(14,165,233,0.03) 50%, transparent 100%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '40%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,114,182,0.04) 0%, transparent 100%)',
          filter: 'blur(60px)',
        }} />
      </div>

      {/* Top Navigation */}
      <nav
        className="sticky top-0 z-50 px-4 md:px-8 py-3"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
        }}
      >
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px rgba(59,130,246,0.3)',
            }}>
              <Bot size={18} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Digital Twin</h1>
              <p className="text-xs" style={{ color: '#64748b' }}>Employee Intelligence Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <EmployeeSelector />
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: '#64748b' }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* Row 1: Hero Profile */}
        <IdentityProfile profile={profile} onUpdate={updateProfile} twinHealth={twinSummary.twinHealth} />

        {/* Row 2: Asymmetric Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column — Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <SkillsIntelligence skillsData={skillsData} />
            <ProjectsIntelligence projects={projects} onAddProject={addProject} onUpdateStatus={updateProjectProgress} />
            <GamificationBoard gamification={gamification} onCompleteMission={completeMission} />
            <PersonalAnalytics analytics={personalAnalytics} />
          </div>

          {/* Right Column — Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <TwinSummary summary={twinSummary} />
            <AIReadiness data={aiReadiness} />
            <KnowledgeSources sources={knowledge} onUpload={uploadKnowledgeSource} />
            <AIRecommendations recommendations={aiRecommendations} />
          </div>

        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center rounded-2xl transition-all"
        style={{
          width: '56px', height: '56px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          boxShadow: '0 0 25px rgba(59,130,246,0.35), 0 4px 15px rgba(0,0,0,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
        }}
      >
        <Bot size={24} color="white" />
      </button>

      {/* Chatbot Overlay */}
      <AICareerAssistant
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        twinMemory={twinMemory}
      />
    </div>
  );
};

export { EmployeeTwin };
