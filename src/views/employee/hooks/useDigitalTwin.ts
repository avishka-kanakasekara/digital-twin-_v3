import { useState, useEffect, useCallback } from 'react';
import { employeeAPI, gamificationAPI, knowledgeAPI } from '../../../lib/api';
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
  const [personalAnalyticsAI, setPersonalAnalyticsAI] = useState<any>(null);
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
        
        const results = await Promise.allSettled([
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
          employeeAPI.getPersonalAnalytics(currentEmployee.id),
        ]);

        if (results[0].status === 'fulfilled') setProjects({ current: results[0].value.current || [], completed: results[0].value.completed || [] });
        if (results[1].status === 'fulfilled') setKnowledge(results[1].value);
        if (results[2].status === 'fulfilled') setSkills(results[2].value);
        if (results[3].status === 'fulfilled') setTwinSummary(results[3].value as any);
        if (results[4].status === 'fulfilled') setPersonalAnalytics(results[4].value);
        if (results[5].status === 'fulfilled') setSkillsData(results[5].value);
        if (results[6].status === 'fulfilled') setAIReadiness(results[6].value);
        if (results[7].status === 'fulfilled') setTwinMemory(results[7].value);
        if (results[8].status === 'fulfilled') setCollaborationIntel(results[8].value);
        if (results[9].status === 'fulfilled') setProjectPrediction(results[9].value);
        if (results[10].status === 'fulfilled') setAIRecommendations(results[10].value);
        if (results[11].status === 'fulfilled') setCertifications(results[11].value);
        if (results[12].status === 'fulfilled') setPersonalAnalyticsAI(results[12].value);

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
              learning: gamStreak?.streak_days || 14,
              project: gamStreak?.longest_streak || 7,
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

  const refreshAllData = useCallback(async () => {
    if (!currentEmployee) return;
    try {
      const [newSkills, newSkillsGrouped, newProjects, newCertifications, newTwinSummary, newAIReadiness, newPersonalAnalytics] = await Promise.all([
        employeeAPI.getSkills(currentEmployee.id),
        employeeAPI.getSkillsGrouped(currentEmployee.id),
        employeeAPI.getProjects(currentEmployee.id),
        employeeAPI.getCertifications(currentEmployee.id),
        employeeAPI.getTwinSummary(currentEmployee.id),
        employeeAPI.getAIReadiness(currentEmployee.id),
        employeeAPI.getPersonalAnalytics(currentEmployee.id),
      ]);
      setSkills(newSkills);
      setSkillsData(newSkillsGrouped);
      setProjects({ current: newProjects.current || [], completed: newProjects.completed || [] });
      setCertifications(newCertifications);
      setTwinSummary(newTwinSummary as any);
      setAIReadiness(newAIReadiness);
      setPersonalAnalyticsAI(newPersonalAnalytics);
      console.log('✅ Digital Twin refreshed after data update');
    } catch (error) {
      console.error('Failed to refresh all data:', error);
    }
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
        console.log('Adding project to backend:', projectData);
        await employeeAPI.createProject(currentEmployee.id, projectData);
        await refreshAllData();
        return;
      } catch (error) {
        console.error('Failed to add project:', error);
      }
    }
    setProjects((prev: any) => ({
      ...prev,
      current: [...(prev.current || []), { ...projectData, id: projectData.id || Date.now().toString() }]
    }));
  }, [useAPI, currentEmployee, refreshAllData]);

  const uploadKnowledgeSource = useCallback(async (name: string, type: string) => {
    // Real upload is handled directly by KnowledgeSources component via knowledgeAPI.upload().
    // This callback exists for legacy compatibility — refreshes the knowledge list after upload.
    if (useAPI && currentEmployee) {
      try {
        const sources = await knowledgeAPI.list(currentEmployee.id);
        setKnowledge(sources);
      } catch (error) {
        console.warn('Could not refresh knowledge sources after upload:', error);
      }
    } else {
      // Offline fallback
      setKnowledge((prev: any) => [...prev, {
        id: Date.now().toString(),
        name,
        type,
        status: 'COMPLETED',
        connected: true,
        skills_extracted: 0,
        projects_found: 0,
        confidence: 0,
        coverage: 0,
        last_synced: new Date().toISOString(),
      }]);
    }
  }, [useAPI, currentEmployee]);

  const refreshKnowledge = useCallback(async () => {
    if (!currentEmployee) return;
    try {
      const sources = await knowledgeAPI.list(currentEmployee.id);
      setKnowledge(sources);
    } catch (error) {
      console.warn('Could not refresh knowledge sources:', error);
    }
  }, [currentEmployee]);

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

  const updateProjectProgress = useCallback(async (projectId: string, status: string, progress?: number) => {
    if (useAPI && currentEmployee) {
      try {
        const updateData: any = { status };
        if (progress !== undefined) {
          updateData.progress = progress;
        }
        await employeeAPI.updateProject(currentEmployee.id, projectId, updateData);
        // Refresh projects from backend to get the updated list
        const projectsData = await employeeAPI.getProjects(currentEmployee.id);
        setProjects({ current: projectsData.current || [], completed: projectsData.completed || [] });
        return;
      } catch (error) {
        console.error('Failed to update project status:', error);
      }
    }
    // Fallback for offline mode
    setProjects((prev: any) => {
      const updatedCurrent = (prev.current || []).map((p: any) => 
        p.id === projectId ? { ...p, status, ...(progress !== undefined ? { progress } : {}) } : p
      );
      const updatedCompleted = (prev.completed || []).map((p: any) => 
        p.id === projectId ? { ...p, status, ...(progress !== undefined ? { progress } : {}) } : p
      );
      // If status is Completed, move to completed array
      if (status === 'Completed' || status === 'completed') {
        const projectToMove = updatedCurrent.find((p: any) => p.id === projectId);
        const remainingCurrent = updatedCurrent.filter((p: any) => p.id !== projectId);
        return {
          ...prev,
          current: remainingCurrent,
          completed: [...(prev.completed || []), projectToMove]
        };
      }
      return { ...prev, current: updatedCurrent, completed: updatedCompleted };
    });
  }, [useAPI, currentEmployee]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (useAPI && currentEmployee) {
      try {
        await employeeAPI.deleteProject(currentEmployee.id, projectId);
        await refreshAllData();
        return;
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
    setProjects((prev: any) => ({
      ...prev,
      current: (prev.current || []).filter((p: any) => p.id !== projectId),
      completed: (prev.completed || []).filter((p: any) => p.id !== projectId),
    }));
  }, [useAPI, currentEmployee, refreshAllData]);

  const getProjectTasks = useCallback(async (projectId: string) => {
    if (useAPI && currentEmployee) {
      try {
        const tasks = await employeeAPI.getTasks(currentEmployee.id, projectId);
        return tasks;
      } catch (error) {
        console.error('Failed to get tasks (table may not exist):', error);
        return [];
      }
    }
    return [];
  }, [useAPI, currentEmployee]);

  const addTask = useCallback(async (projectId: string, taskData: any) => {
    if (useAPI && currentEmployee) {
      try {
        console.log('Adding task to backend:', projectId, taskData);
        await employeeAPI.createTask(currentEmployee.id, projectId, taskData);
        // Refresh projects to get updated progress
        const projectsData = await employeeAPI.getProjects(currentEmployee.id);
        setProjects({ current: projectsData.current || [], completed: projectsData.completed || [] });
        return;
      } catch (error) {
        console.error('Failed to add task:', error);
      }
    }
  }, [useAPI, currentEmployee]);

  const updateTask = useCallback(async (projectId: string, taskId: string, taskData: any) => {
    if (useAPI && currentEmployee) {
      try {
        await employeeAPI.updateTask(currentEmployee.id, projectId, taskId, taskData);
        // Refresh projects to get updated progress
        const projectsData = await employeeAPI.getProjects(currentEmployee.id);
        setProjects({ current: projectsData.current || [], completed: projectsData.completed || [] });
        return;
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    }
  }, [useAPI, currentEmployee]);

  const deleteTask = useCallback(async (projectId: string, taskId: string) => {
    if (useAPI && currentEmployee) {
      try {
        await employeeAPI.deleteTask(currentEmployee.id, projectId, taskId);
        // Refresh projects to get updated progress
        const projectsData = await employeeAPI.getProjects(currentEmployee.id);
        setProjects({ current: projectsData.current || [], completed: projectsData.completed || [] });
        return;
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  }, [useAPI, currentEmployee]);

  const refreshAIReadiness = useCallback(async () => {
    if (useAPI && currentEmployee) {
      try {
        const aiReadinessData = await employeeAPI.getAIReadiness(currentEmployee.id);
        setAIReadiness(aiReadinessData);
      } catch (error) {
        console.error('Failed to refresh AI readiness:', error);
      }
    }
  }, [useAPI, currentEmployee]);

  const updateSkill = useCallback(async (skillId: string, skillData: any) => {
    if (useAPI && currentEmployee) {
      try {
        await employeeAPI.updateSkill(currentEmployee.id, skillId, skillData);
        await refreshAllData();
      } catch (error) {
        console.error('Failed to update skill:', error);
      }
    }
  }, [useAPI, currentEmployee, refreshAllData]);

  const deleteSkill = useCallback(async (skillId: string) => {
    if (useAPI && currentEmployee) {
      try {
        await employeeAPI.deleteSkill(currentEmployee.id, skillId);
        await refreshAllData();
      } catch (error) {
        console.error('Failed to delete skill:', error);
      }
    }
  }, [useAPI, currentEmployee, refreshAllData]);

  return {
    profile,
    updateProfile,
    
    projects,
    addProject,
    updateProjectProgress,
    deleteProject,
    getProjectTasks,
    addTask,
    updateTask,
    deleteTask,
    
    knowledge,
    uploadKnowledgeSource,
    refreshKnowledge,
    refreshAllData,
    refreshAIReadiness,

    gamification,
    completeMission,
    updateGamificationXP,
    
    skills,
    updateSkill,
    deleteSkill,
    
    skillsData,
    twinSummary,
    personalAnalyticsAI,
    
    loading,
    useAPI,
    
    // Dynamic data from backend
    certifications,
    aiReadiness,
    twinMemory,
    collaborationIntel,
    projectPrediction,
    personalAnalytics,
    aiRecommendations
  };
};

