import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, Crosshair, Trophy, Brain, Loader2 } from 'lucide-react';
import { EmployeeSelector } from '../../../components/EmployeeSelector';
import './employeeHub.css';

const HUBS = [
  { path: '/employee-twin', label: 'Dashboard', icon: <Bot size={13} /> },
  { path: '/career-coach', label: 'Career Coach', icon: <Crosshair size={13} /> },
  { path: '/gamification-hub', label: 'Gamification', icon: <Trophy size={13} /> },
  { path: '/learning-hub', label: 'Learning', icon: <Brain size={13} /> },
];

interface EmployeeHubShellProps {
  kicker: string;
  title: string;
  subtitle: string;
  accent?: string;
  accent2?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const EmployeeHubShell: React.FC<EmployeeHubShellProps> = ({
  kicker, title, subtitle, accent = '#3b82f6', accent2 = '#8b5cf6',
  actions, loading, error, onRetry, children,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="employee-hub" style={{ ['--hub-accent' as any]: accent, ['--hub-accent-2' as any]: accent2, ['--hub-glow' as any]: `${accent}33` }}>
      <div className="hub-hero">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 relative z-10">
          <div className="min-w-0">
            <div className="hub-kicker">{kicker}</div>
            <h1 className="hub-title">{title}</h1>
            <p className="hub-sub">{subtitle}</p>
            <div className="hub-switcher">
              {HUBS.map((hub) => (
                <button
                  key={hub.path}
                  className={`hub-chip ${pathname === hub.path ? 'is-active' : ''}`}
                  onClick={() => navigate(hub.path)}
                >
                  {hub.icon} {hub.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-stretch lg:items-end gap-3">
            <div className="bg-white/80 border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <EmployeeSelector />
            </div>
            {actions && <div className="hub-actions">{actions}</div>}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold flex items-center justify-between gap-3">
          <span>{error}</span>
          {onRetry && <button className="hub-btn" onClick={onRetry}>Retry</button>}
        </div>
      )}

      {loading ? (
        <div className="hub-empty flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={18} /> Loading live twin data…
        </div>
      ) : children}
    </div>
  );
};
