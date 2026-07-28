import { useState, useCallback } from 'react';
import * as mockData from '../../../dummy/employee/digitalTwinMockData';

export const useDigitalTwin = () => {
  const [profile, setProfile] = useState(mockData.employeeProfile);
  const [projects, setProjects] = useState(mockData.projectsIntelligence);
  const [knowledge, setKnowledge] = useState(mockData.knowledgeSources);
  const [gamification, setGamification] = useState(mockData.gamification);

  // Simulate API delays and local state updates
  
  const updateProfile = useCallback(async (updates: Partial<typeof mockData.employeeProfile>) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setProfile(prev => ({ ...prev, ...updates }));
    
    // Add XP for updating profile
    addXp(50, 'Profile Updated');
  }, []);

  const addProject = useCallback(async (projectData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProject = {
      ...projectData,
      id: `p-${Date.now()}`,
      status: 'On Track',
      successScore: 0,
      leadershipScore: 0
    };
    setProjects(prev => ({
      ...prev,
      current: [...prev.current, newProject]
    }));
    addXp(150, 'New Project Logged');
  }, []);

  const updateProjectProgress = useCallback((projectId: string, newStatus: string) => {
    setProjects(prev => {
      const updatedCurrent = prev.current.map(p => 
        p.id === projectId ? { ...p, status: newStatus } : p
      );
      return { ...prev, current: updatedCurrent };
    });
  }, []);

  const uploadKnowledgeSource = useCallback(async (fileOrConnection: any, type: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // longer delay for "upload/sync"
    
    const newSource = {
      id: `ks-${Date.now()}`,
      name: typeof fileOrConnection === 'string' ? fileOrConnection : fileOrConnection.name || 'New Source',
      connected: true,
      lastUpdated: 'Just now',
      coverage: Math.floor(Math.random() * 20) + 10, // Simulate some coverage added
      skillsExtracted: Math.floor(Math.random() * 5) + 1,
      projects: Math.floor(Math.random() * 2),
      confidence: 90,
      type
    };

    setKnowledge(prev => [newSource, ...prev]);
    addXp(100, 'Knowledge Base Fed');
  }, []);

  const addXp = useCallback((amount: number, reason: string) => {
    setGamification(prev => {
      const newXp = prev.xp + amount;
      let newLevel = prev.level;
      let nextLevelXp = prev.nextLevelXp;
      
      // Level up logic (simplified)
      if (newXp >= nextLevelXp) {
        newLevel += 1;
        nextLevelXp = nextLevelXp + 1000;
      }
      
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp
      };
    });
    console.log(`Earned ${amount} XP: ${reason}`); // In a real app, might trigger a toast here
  }, []);

  const completeMission = useCallback((missionIndex: number) => {
    setGamification(prev => {
      const newMissions = [...prev.missions];
      if (!newMissions[missionIndex].completed) {
        newMissions[missionIndex].completed = true;
        addXp(newMissions[missionIndex].xp, `Mission Completed: ${newMissions[missionIndex].name}`);
      }
      return { ...prev, missions: newMissions };
    });
  }, [addXp]);

  return {
    profile,
    updateProfile,
    
    projects,
    addProject,
    updateProjectProgress,
    
    knowledge,
    uploadKnowledgeSource,
    
    gamification,
    completeMission,
    
    // Static data that doesn't need complex mutations for this mock
    skillsData: mockData.skillsData,
    certifications: mockData.certificationsTimeline,
    aiReadiness: mockData.aiReadiness,
    twinSummary: mockData.twinSummary,
    twinMemory: mockData.twinMemory,
    collaborationIntel: mockData.collaborationIntel,
    projectPrediction: mockData.projectPrediction,
    personalAnalytics: mockData.personalAnalytics,
    aiRecommendations: mockData.aiRecommendations
  };
};
