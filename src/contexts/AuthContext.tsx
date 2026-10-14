import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI, type Employee, type RegisterRequest } from '../lib/api';

const TOKEN_KEY = 'auth_token';

interface AuthContextType {
  user: Employee | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function normalizeEmployee(raw: Partial<Employee> & { id: string; full_name: string; email: string }): Employee {
  const initials = raw.initials || raw.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
  return {
    id: raw.id,
    employee_code: raw.employee_code || '',
    full_name: raw.full_name,
    initials,
    email: raw.email,
    department: raw.department || '',
    role: raw.role || '',
    team: raw.team || '',
    manager_name: raw.manager_name,
    location: raw.location || '',
    timezone_str: raw.timezone_str,
    phone: raw.phone,
    education: raw.education,
    languages: raw.languages,
    biography: raw.biography,
    headline: raw.headline,
    avatar_url: raw.avatar_url,
    years_experience: raw.years_experience,
    years_in_company: raw.years_in_company,
    employment_type: raw.employment_type,
    employment_status: raw.employment_status || 'Active',
    profile_completeness: raw.profile_completeness || 0,
    ai_confidence: raw.ai_confidence || 0,
    created_at: raw.created_at || '',
    updated_at: raw.updated_at || '',
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Employee | null>(null);
  const [ready, setReady] = useState(false);

  const applySession = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    const me = await authAPI.getCurrentUser();
    const employee = normalizeEmployee(me);
    localStorage.setItem('current_employee_id', employee.id);
    setUser(employee);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setReady(true);
      return;
    }
    let live = true;
    authAPI
      .getCurrentUser()
      .then((me) => {
        if (live) setUser(normalizeEmployee(me));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        if (live) setUser(null);
      })
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authAPI.login({ email: email.trim(), password });
    await applySession(session.access_token);
  }, [applySession]);

  const register = useCallback(async (data: RegisterRequest) => {
    const session = await authAPI.register({
      ...data,
      email: data.email.trim(),
      full_name: data.full_name.trim(),
      department: data.department?.trim() || undefined,
      role: data.role?.trim() || undefined,
    });
    await applySession(session.access_token);
  }, [applySession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('current_employee_id');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
