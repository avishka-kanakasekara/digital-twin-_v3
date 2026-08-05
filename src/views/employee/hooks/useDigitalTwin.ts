import { useState, useEffect, useCallback } from 'react';
import { employeeAPI, gamificationAPI } from '../../../lib/api';
import { useEmployee } from '../../../contexts/EmployeeContext';
import * as digitalTwinMockData from '../../../dummy/employee/digitalTwinMockData';
import * as gamificationData from '../../../dummy/employee/gamificationHubData';

export const useDigitalTwin = () => {
  const { currentEmployee } = useEmployee();
  const [profile, setProfile] = useState(digitalTwinMockData.employeeProfile);
  const [projects, setProjects] = useState<any>({ current: [], completed: [] });
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any>({
    ...gamificationData.playerProfile,
    streaks: { learning: 14, project: 7 },
    missions: [
      { id: 1, name: 'Complete AI Course', xp: 100, completed: false },
      { id: 2, name: 'Submit Project Update', xp: 50, completed: true },
      { id: 3, name: 'Review Peer Code', xp: 75, completed: false },
    ],
    achievements: [
      { id: 'a1', name: 'First Steps', description: 'Completed your first learning module', unlocked: true },
      { id: 'a2', name: 'Streak Master', description: 'Maintained a 7-day learning streak', unlocked: true },
      { id: 'a3', name: 'Team Player', description: 'Collaborated on 5 projects', unlocked: true },
      { id: 'a4', name: 'Code Reviewer', description: 'Reviewed 10 peer submissions', unlocked: false },
      { id: 'a5', name: 'Knowledge Sharer', description: 'Shared 5 knowledge sources', unlocked: false },
    ],
    aiScore: 92,
    impactRank: 'Top 5%',
  });
  const [skills, setSkills] = useState<any[]>([]);
  const [twinSummary, setTwinSummary] = useState(digitalTwinMockData.twinSummary);
  const [personalAnalytics, setPersonalAnalytics] = useState(digitalTwinMockData.personalAnalytics);
  const [skillsData, setSkillsData] = useState(digitalTwinMockData.skillsData);
  const [certifications, setCertifications] = useState(digitalTwinMockData.certificationsTimeline);
  const [aiReadiness, setAIReadiness] = useState(digitalTwinMockData.aiReadiness);
  const [twinMemory, setTwinMemory] = useState(digitalTwinMockData.twinMemory);
  const [collaborationIntel, setCollaborationIntel] = useState(digitalTwinMockData.collaborationIntel);
  const [projectPrediction, setProjectPrediction] = useState(digitalTwinMockData.projectPrediction);
  const [aiRecommendations, setAIRecommendations] = useState(digitalTwinMockData.aiRecommendations);
  const [loading, setLoading] = useState(false);
  const [useAPI, setUseAPI] = useState(false);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      try {
        setLoading(true);
        const empData = await employeeAPI.get(currentEmployee.id);
        // Transform API data to match mock structure
        setProfile({
          ...digitalTwinMockData.employeeProfile,
          id: empData.id,
          fullName: empData.full_name,
          initials: empData.initials,
          department: empData.department,
          role: empData.role,
          team: empData.team || '',
          manager: empData.manager_name || '',
          location: empData.location || '',
          timezone: empData.timezone_str || '',
          email: empData.email,
          phone: empData.phone || '',
          experience: empData.years_experience || 0,
          yearsInCompany: empData.years_in_company || 0,
        });
        setUseAPI(true);
        
        const [projectsData, knowledgeData, skillsData, twinSum, analyticsData, skillsGroupedData, aiReadinessData, twinMemoryData, collaborationData, projectPredictionData, aiRecommendationsData, certificationsData] = await Promise.all([
          employeeAPI.getProjects(currentEmployee.id),
          employeeAPI.getKnowledgeSources(currentEmployee.id),
          employeeAPI.getSkills(currentEmployee.id),
          employeeAPI.getTwinSummary(currentEmployee.id),
          employeeAPI.getAnalytics(currentEmployee.id),
          employeeAPI.getSkillsGrouped(currentEmployee.id),
          employeeAPI.getAIReadiness(currentEmployee.id),
          employeeAPI.getTwinMemory(currentEmployee.id),
          employeeAPI.getCollaboration(currentEmployee.id),
          employeeAPI.getProjectPrediction(currentEmployee.id),
          employeeAPI.getAIRecommendations(currentEmployee.id),
          employeeAPI.getCertifications(currentEmployee.id),
        ]);
        setProjects({ current: projectsData.current || [], completed: projectsData.completed || [] });
        setKnowledge(knowledgeData);
        setSkills(skillsData);
        setTwinSummary(twinSum as any);
        setPersonalAnalytics(analyticsData);
        setSkillsData(skillsGroupedData);
        setAIReadiness(aiReadinessData);
        setTwinMemory(twinMemoryData);
        setCollaborationIntel(collaborationData);
        setProjectPrediction(projectPredictionData);
        setAIRecommendations(aiRecommendationsData);
        setCertifications(certificationsData);

        // Load gamification data
        try {
          const gamProfile = await gamificationAPI.getProfile(currentEmployee.id);
          const gamAchievements = await gamificationAPI.getAchievements(currentEmployee.id);
          const gamStreak = await gamificationAPI.getStreak(currentEmployee.id);
          
          setGamification({
            ...gamificationData.playerProfile,
            level: gamProfile.level,
            xp: gamProfile.xp,
            nextLevelXp: gamProfile.next_level_xp,
            totalXpEarned: gamProfile.total_xp_earned,
            companyRank: gamProfile.company_rank || gamificationData.playerProfile.companyRank,
            departmentRank: gamProfile.department_rank || gamificationData.playerProfile.departmentRank,
            streakDays: gamProfile.streak_days,
            title: gamProfile.title,
            streaks: {
              learning: gamStreak?.learning_streak || 14,
              project: gamStreak?.project_streak || 7,
            },
            achievements: gamAchievements.map((ach: any) => ({
              id: ach.id,
              name: ach.name,
              description: ach.description,
              unlocked: !!ach.unlocked_at,
            })),
            missions: [
              { id: 1, name: 'Complete AI Course', xp: 100, completed: false },
              { id: 2, name: 'Submit Project Update', xp: 50, completed: true },
              { id: 3, name: 'Review Peer Code', xp: 75, completed: false },
            ],
            aiScore: Math.round(empData.profile_completeness || 92),
            impactRank: gamProfile.department_rank ? `Top ${Math.round((gamProfile.department_rank / 28) * 100)}%` : 'Top 5%',
          });
        } catch (gamError) {
          console.log('⚠️ Gamification API not available, using mock data');
        }

        console.log('✅ Loaded data from API');
      } catch (error) {
        console.log('⚠️ API not available, using mock data');
        setUseAPI(false);
        setProjects({ current: [], completed: [] });
        setGamification({
          ...gamificationData.playerProfile,
          streaks: { learning: 14, project: 7 },
          missions: [
            { id: 1, name: 'Complete AI Course', xp: 100, completed: false },
            { id: 2, name: 'Submit Project Update', xp: 50, completed: true },
            { id: 3, name: 'Review Peer Code', xp: 75, completed: false },
          ],
          achievements: [
            { id: 'a1', name: 'First Steps', description: 'Completed your first learning module', unlocked: true },
            { id: 'a2', name: 'Streak Master', description: 'Maintained a 7-day learning streak', unlocked: true },
            { id: 'a3', name: 'Team Player', description: 'Collaborated on 5 projects', unlocked: true },
            { id: 'a4', name: 'Code Reviewer', description: 'Reviewed 10 peer submissions', unlocked: false },
            { id: 'a5', name: 'Knowledge Sharer', description: 'Shared 5 knowledge sources', unlocked: false },
          ],
          aiScore: 92,
          impactRank: 'Top 5%',
        });
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  const updateProfile = useCallback(async (updates: Partial<typeof digitalTwinMockData.employeeProfile>) => {
    if (useAPI && currentEmployee) {
      try {
        await employeeAPI.update(currentEmployee.id, updates);
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    }
    setProfile((prev: any) => ({ ...prev, ...updates }));
  }, [useAPI, currentEmployee]);

  const addProject = useCallback(async (projectData: any) => {
    if (useAPI && currentEmployee) {
      try {
        await employeeAPI.getProjects(currentEmployee.id); // Would be POST in real API
      } catch (error) {
        console.error('Failed to add project:', error);
      }
    }
    setProjects((prev: any) => [...prev, { ...projectData, id: Date.now().toString() }]);
  }, [useAPI, currentEmployee]);

  const uploadKnowledgeSource = useCallback(async (fileOrConnection: any, type: string) => {
    if (useAPI && currentEmployee) {
      try {
        await employeeAPI.getKnowledgeSources(currentEmployee.id); // Would be POST in real API
      } catch (error) {
        console.error('Failed to upload knowledge source:', error);
      }
    }
    setKnowledge((prev: any) => [...prev, { 
      ...fileOrConnection, 
      id: Date.now().toString(),
      type,
      last_synced: new Date().toISOString()
    }]);
  }, [useAPI, currentEmployee]);

  const updateGamificationXP = useCallback(async (xpChange: number) => {
    if (useAPI && currentEmployee) {
      try {
        // Would call gamification API
        console.log('Would update gamification XP by', xpChange);
      } catch (error) {
        console.error('Failed to update XP:', error);
      }
    }
    setGamification((prev: any) => ({
      ...prev,
      xp: (prev.xp || 0) + xpChange,
      total_xp_earned: (prev.total_xp_earned || 0) + xpChange
    }));
  }, [useAPI, currentEmployee]);

  const addXp = useCallback((amount: number, reason: string) => {
    setGamification((prev: any) => {
      const newXp = (prev.xp || 0) + amount;
      let newLevel = prev.level || 1;
      let nextLevelXp = prev.nextLevelXp || 1000;
      
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
    console.log(`Earned ${amount} XP: ${reason}`);
  }, []);

  const completeMission = useCallback((missionIndex: number) => {
    setGamification((prev: any) => {
      const newMissions = [...(prev.missions || [])];
      if (!newMissions[missionIndex].completed) {
        newMissions[missionIndex].completed = true;
        addXp(newMissions[missionIndex].xp, `Mission Completed: ${newMissions[missionIndex].name}`);
      }
      return { ...prev, missions: newMissions };
    });
  }, [addXp]);

  const updateProjectProgress = useCallback((projectId: string, status: string) => {
    setProjects((prev: any) => prev.map((p: any) => 
      p.id === projectId ? { ...p, status } : p
    ));
  }, []);

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
    updateGamificationXP,
    
    skills,
    twinSummary,
    
    loading,
    useAPI,
    
    // Dynamic data from backend
    skillsData,
    certifications,
    aiReadiness,
    twinMemory,
    collaborationIntel,
    projectPrediction,
    personalAnalytics,
    aiRecommendations
  };
};

