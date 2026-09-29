import { useState, useEffect, useCallback } from 'react';
import { employeeAPI, gamificationAPI, knowledgeAPI } from '../../../lib/api';
import { useEmployee } from '../../../contexts/EmployeeContext';

const emptyProfile = {
  id: '',
  avatarUrl: '',
  initials: '—',
  status: 'Offline',
  fullName: '',
  department: '',
  role: '',
  team: '',
  manager: '',
  location: '',
  timezone: '',
  email: '',
  phone: '',
  education: '',
  experience: 0,
  yearsInCompany: 0,
  employmentType: '',
  languages: [],
  biography: '',
  headline: '',
};

const emptyGamification = {
  level: 1,
  xp: 0,
  nextLevelXp: 1000,
  totalXpEarned: 0,
  streakDays: 0,
  title: 'Newcomer',
  streaks: { learning: 0, project: 0 },
  missions: [],
  achievements: [],
  aiScore: 0,
  impactRank: 'Unranked',
};

export const useDigitalTwin = () => {
  const { currentEmployee } = useEmployee();
  const [profile, setProfile] = useState(emptyProfile);
  const [projects, setProjects] = useState<any>({ current: [], completed: [] });
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any>(emptyGamification);
  const [skills, setSkills] = useState<any[]>([]);
  const [twinSummary, setTwinSummary] = useState({
    aiConfidence: 0,
    profileCompleteness: 0,
    knowledgeFreshness: 'Low',
    lastUpdated: '',
    representationQuality: 'Needs Data',
    twinHealth: 0,
    summaryText: '',
  });
  const [personalAnalytics, setPersonalAnalytics] = useState({ productivity: [], skills: [] });
  const [personalAnalyticsAI, setPersonalAnalyticsAI] = useState<any>(null);
  const [skillsData, setSkillsData] = useState<any>({});
  const [certifications, setCertifications] = useState<any[]>([]);
  const [twinMemory, setTwinMemory] = useState<any[]>([]);
  const [collaborationIntel, setCollaborationIntel] = useState<any>({});
  const [aiRecommendations, setAIRecommendations] = useState<any[]>([]);
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
          ...emptyProfile,
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
          headline: empData.headline || '',
          biography: empData.biography || '',
        });
        setUseAPI(true);

        const applyTwinSummary = (raw: any) => {
          setTwinSummary({
            aiConfidence: raw.aiConfidence ?? raw.ai_confidence ?? 0,
            profileCompleteness: raw.profileCompleteness ?? raw.profile_completeness ?? 0,
            knowledgeFreshness: raw.knowledgeFreshness ?? raw.knowledge_freshness ?? 'Low',
            lastUpdated: raw.lastUpdated ?? raw.updated_at,
            representationQuality: raw.representationQuality ?? raw.representation_quality,
            twinHealth: raw.twinHealth ?? raw.twin_health ?? 0,
            summaryText: raw.summaryText ?? raw.summary_text ?? '',
          });
        };

        const coreResults = await Promise.allSettled([
          employeeAPI.getProjects(currentEmployee.id),
          employeeAPI.getKnowledgeSources(currentEmployee.id),
          employeeAPI.getSkills(currentEmployee.id),
          employeeAPI.getTwinSummary(currentEmployee.id),
          employeeAPI.getAnalytics(currentEmployee.id),
          employeeAPI.getSkillsGrouped(currentEmployee.id),
          employeeAPI.getTwinMemory(currentEmployee.id),
          employeeAPI.getCollaboration(currentEmployee.id),
          employeeAPI.getAIRecommendations(currentEmployee.id),
          employeeAPI.getCertifications(currentEmployee.id),
        ]);

        if (coreResults[0].status === 'fulfilled') setProjects({ current: coreResults[0].value.current || [], completed: coreResults[0].value.completed || [] });
        if (coreResults[1].status === 'fulfilled') setKnowledge(coreResults[1].value);
        if (coreResults[2].status === 'fulfilled') setSkills(coreResults[2].value);
        if (coreResults[3].status === 'fulfilled') applyTwinSummary(coreResults[3].value);
        if (coreResults[4].status === 'fulfilled') setPersonalAnalytics(coreResults[4].value);
        if (coreResults[5].status === 'fulfilled') setSkillsData(coreResults[5].value);
        if (coreResults[6].status === 'fulfilled') setTwinMemory(coreResults[6].value);
        if (coreResults[7].status === 'fulfilled') setCollaborationIntel(coreResults[7].value);
        if (coreResults[8].status === 'fulfilled') setAIRecommendations(coreResults[8].value);
        if (coreResults[9].status === 'fulfilled') setCertifications(coreResults[9].value);

        setLoading(false);

        const aiResults = await Promise.allSettled([
          employeeAPI.getPersonalAnalytics(currentEmployee.id),
        ]);
        if (aiResults[0].status === 'fulfilled') setPersonalAnalyticsAI(aiResults[0].value);

        // Load gamification data
        try {
          const gamProfile = await gamificationAPI.getProfile(currentEmployee.id);
          const gamAchievements = await gamificationAPI.getAchievements(currentEmployee.id);
          const gamStreak = await gamificationAPI.getStreak(currentEmployee.id);
          const missionsRaw = await gamificationAPI.getMissions(currentEmployee.id).catch(() => []);
          const missions = Array.isArray(missionsRaw) ? missionsRaw : (missionsRaw?.missions || []);
          const totalPlayers = gamProfile.total_players || 0;
          const rankPct = gamProfile.company_rank && totalPlayers
            ? Math.max(1, Math.round((gamProfile.company_rank / totalPlayers) * 100))
            : null;

          setGamification({
            ...emptyGamification,
            level: gamProfile.level,
            xp: gamProfile.xp,
            nextLevelXp: gamProfile.next_level_xp,
            totalXpEarned: gamProfile.total_xp_earned,
            companyRank: gamProfile.company_rank,
            departmentRank: gamProfile.department_rank,
            streakDays: gamProfile.streak_days,
            title: gamProfile.title,
            streaks: {
              learning: gamStreak?.streak_days || gamProfile.streak_days || 0,
              project: gamStreak?.longest_streak || gamProfile.longest_streak || 0,
            },
            achievements: (gamAchievements || []).map((ach: any) => ({
              id: ach.id,
              name: ach.name,
              description: ach.description,
              emoji: ach.emoji,
              unlocked: !!ach.unlocked,
            })),
            missions: (missions || []).map((m: any) => ({
              id: m.id,
              name: m.name,
              xp: m.xp,
              completed: !!m.completed,
              type: m.type,
            })),
            aiScore: Math.round(empData.profile_completeness || 0),
            impactRank: rankPct ? `Top ${rankPct}%` : (gamProfile.title || 'Newcomer'),
          });
        } catch (gamError) {
          console.log('⚠️ Gamification API not available, using mock data');
        }

        console.log('✅ Loaded data from API');
      } catch (error) {
        console.log('⚠️ API not available');
        setUseAPI(false);
        setProjects({ current: [], completed: [] });
        setGamification(emptyGamification);
      } finally {
        setLoading(false);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

  const refreshAllData = useCallback(async () => {
    if (!currentEmployee) return;
    try {
      const [newSkills, newSkillsGrouped, newProjects, newCertifications, newTwinSummary, newPersonalAnalytics] = await Promise.all([
        employeeAPI.getSkills(currentEmployee.id),
        employeeAPI.getSkillsGrouped(currentEmployee.id),
        employeeAPI.getProjects(currentEmployee.id),
        employeeAPI.getCertifications(currentEmployee.id),
        employeeAPI.getTwinSummary(currentEmployee.id),
        employeeAPI.getPersonalAnalytics(currentEmployee.id),
      ]);
      setSkills(newSkills);
      setSkillsData(newSkillsGrouped);
      setProjects({ current: newProjects.current || [], completed: newProjects.completed || [] });
      setCertifications(newCertifications);
      setTwinSummary(newTwinSummary as any);
      setPersonalAnalyticsAI(newPersonalAnalytics);
      console.log('✅ Digital Twin refreshed after data update');
    } catch (error) {
      console.error('Failed to refresh all data:', error);
    }
  }, [currentEmployee]);

  const updateProfile = useCallback(async (updates: Partial<typeof emptyProfile>) => {
    if (useAPI && currentEmployee) {
      try {
        const payload: Record<string, any> = {};
        const map: Record<string, string> = {
          fullName: 'full_name',
          initials: 'initials',
          department: 'department',
          role: 'role',
          team: 'team',
          manager: 'manager_name',
          location: 'location',
          timezone: 'timezone_str',
          phone: 'phone',
          headline: 'headline',
          biography: 'biography',
          experience: 'years_experience',
          yearsInCompany: 'years_in_company',
        };
        Object.entries(updates).forEach(([key, value]) => {
          const backendKey = map[key];
          if (backendKey && value !== undefined) payload[backendKey] = value;
        });
        if (Object.keys(payload).length) {
          await employeeAPI.update(currentEmployee.id, payload);
        }
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

  const completeMission = useCallback(async (missionIndex: number) => {
    if (!currentEmployee) return;
    try {
      const missionsRaw = await gamificationAPI.getMissions(currentEmployee.id).catch(() => []);
      const missionsNow = Array.isArray(missionsRaw) ? missionsRaw : (missionsRaw?.missions || []);
      const mission = (missionsNow || [])[missionIndex];
      if (!mission || mission.completed) return;

      if (mission.type === 'daily' || mission.id === 'daily_login') {
        await employeeAPI.dailyCheckin(currentEmployee.id);
        const [gamProfile, missionsResp] = await Promise.all([
          gamificationAPI.getProfile(currentEmployee.id),
          gamificationAPI.getMissions(currentEmployee.id).catch(() => []),
        ]);
        const missions = Array.isArray(missionsResp) ? missionsResp : (missionsResp?.missions || []);
        setGamification((prev: any) => ({
          ...prev,
          level: gamProfile.level,
          xp: gamProfile.xp,
          nextLevelXp: gamProfile.next_level_xp,
          totalXpEarned: gamProfile.total_xp_earned,
          streakDays: gamProfile.streak_days,
          title: gamProfile.title,
          missions: (missions || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            xp: m.xp,
            completed: !!m.completed,
            type: m.type,
          })),
        }));
        return;
      }

      if (mission.type === 'challenge') {
        window.location.assign('/gamification-hub');
      } else if (mission.type === 'learning') {
        window.location.assign('/learning-hub');
      }
    } catch (error) {
      console.error('Failed to complete mission:', error);
    }
  }, [currentEmployee]);

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
    twinMemory,
    collaborationIntel,
    personalAnalytics,
    aiRecommendations
  };
};

