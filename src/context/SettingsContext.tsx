import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { predefinedSkills } from '../dummy/organization/teamBuilderData';
import { Briefcase, Layers, Server, RefreshCw, AlertTriangle, type LucideIcon } from 'lucide-react';

export interface RoleDef {
  id: string;
  title: string;
  dept: string;
  req: string[];
  icon: LucideIcon;
  color: string;
}

export interface ApiIntegration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected';
  sync: string;
  icon: LucideIcon;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  dept: string;
  status: 'Active' | 'Suspended';
}

export interface Department {
  id: string;
  name: string;
  head: string;
  memberCount: number;
}

interface SettingsContextType {
  skills: string[];
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;

  roles: RoleDef[];
  addRole: (role: Omit<RoleDef, 'id'>) => void;
  deleteRole: (id: string) => void;

  integrations: ApiIntegration[];
  toggleIntegration: (id: string) => void;

  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  toggleUserStatus: (id: string) => void;

  departments: Department[];
  addDepartment: (dept: Omit<Department, 'id'>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const initialRoles: RoleDef[] = [
  { id: '1', title: "Senior Frontend Engineer", dept: "Engineering", req: ["React", "TypeScript", "TailwindCSS"], icon: Briefcase, color: "#3b82f6" },
  { id: '2', title: "Product Manager", dept: "Product", req: ["Agile", "User Research", "Roadmapping"], icon: Layers, color: "#8b5cf6" },
  { id: '3', title: "Data Scientist", dept: "Data & AI", req: ["Python", "Machine Learning", "SQL"], icon: Server, color: "#10b981" },
  { id: '4', title: "UX Designer", dept: "Design", req: ["Figma", "Wireframing", "Prototyping"], icon: Briefcase, color: "#f59e0b" }
];

const initialIntegrations: ApiIntegration[] = [
  { id: '1', name: "Workday HRIS", type: "Core HR Data", status: "connected", sync: "10 mins ago", icon: Layers, color: "#3b82f6" },
  { id: '2', name: "Slack", type: "Communication / Sentiment", status: "connected", sync: "1 hour ago", icon: RefreshCw, color: "#eab308" },
  { id: '3', name: "BambooHR", type: "Performance Reviews", status: "disconnected", sync: "Never", icon: AlertTriangle, color: "#94a3b8" }
];

const initialUsers: User[] = [
  { id: '1', name: "David Chen", email: "david.c@company.com", role: "Senior Frontend Engineer", dept: "Engineering", status: 'Active' },
  { id: '2', name: "Sarah Jenkins", email: "sarah.j@company.com", role: "Product Manager", dept: "Product", status: 'Active' },
  { id: '3', name: "Michael Rodriguez", email: "michael.r@company.com", role: "Data Scientist", dept: "Data & AI", status: 'Active' }
];

const initialDepartments: Department[] = [
  { id: '1', name: "Engineering", head: "Elena Rostova", memberCount: 142 },
  { id: '2', name: "Product", head: "Marcus Vance", memberCount: 38 },
  { id: '3', name: "Design", head: "Sophie Lin", memberCount: 24 }
];

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [skills, setSkills] = useState<string[]>(predefinedSkills);
  const [roles, setRoles] = useState<RoleDef[]>(initialRoles);
  const [integrations, setIntegrations] = useState<ApiIntegration[]>(initialIntegrations);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const addRole = (role: Omit<RoleDef, 'id'>) => {
    setRoles(prev => [...prev, { ...role, id: Date.now().toString() }]);
  };

  const deleteRole = (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        return { 
          ...int, 
          status: int.status === 'connected' ? 'disconnected' : 'connected',
          sync: int.status === 'connected' ? 'Never' : 'Just now'
        };
      }
      return int;
    }));
  };

  const addUser = (user: Omit<User, 'id'>) => {
    setUsers(prev => [...prev, { ...user, id: Date.now().toString() }]);
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u
    ));
  };

  const addDepartment = (dept: Omit<Department, 'id'>) => {
    setDepartments(prev => [...prev, { ...dept, id: Date.now().toString() }]);
  };

  return (
    <SettingsContext.Provider value={{ 
      skills, addSkill, removeSkill,
      roles, addRole, deleteRole,
      integrations, toggleIntegration,
      users, addUser, toggleUserStatus,
      departments, addDepartment
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
