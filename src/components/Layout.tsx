import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Crosshair, BarChart3, AlertTriangle, Users2, Search, Building2, UserCircle, Target, Briefcase, Lightbulb, Trophy, Brain, Settings, LogOut, Bell, UserCog } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { Modal } from './Modal';

export const Layout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const navigate = useNavigate();

  const orgNavItems = [
    { name: 'Executive Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Strategy & Context', path: '/context', icon: <Target size={20} /> },
    { name: 'Workforce Intelligence', path: '/workforce', icon: <BarChart3 size={20} /> },
    { name: 'Organization Health', path: '/radar', icon: <AlertTriangle size={20} /> },
    { name: 'Team Builder', path: '/team-builder', icon: <Users2 size={20} /> },
    { name: 'Talent Marketplace', path: '/talent-marketplace', icon: <Briefcase size={20} /> },
    { name: 'Innovation Hub', path: '/innovation-hub', icon: <Lightbulb size={20} /> },
    { name: 'Organizational Simulation', path: '/simulator', icon: <Activity size={20} /> },
  ];

  const empNavItems = [
    { name: 'Personal Dashboard', path: '/employee-twin', icon: <Users size={20} /> },
    { name: 'Career Coach', path: '/career-coach', icon: <Crosshair size={20} /> },
    { name: 'Gamification Hub', path: '/gamification-hub', icon: <Trophy size={20} /> },
    { name: 'Learning Hub', path: '/learning-hub', icon: <Brain size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass flex flex-col m-4 rounded-lg overflow-hidden border border-[var(--border-color)]">
        <div className="p-6">
          <h1 className="text-lg font-extrabold bg-clip-text text-transparent leading-tight" style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text' }}>
            Culture Connect
          </h1>
          <p className="text-[11px] font-semibold text-secondary mt-1.5 leading-snug tracking-wide">
            Predictive Workforce Intelligence
          </p>
        </div>
        <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-4">
          
          {/* Organization Twin Section */}
          <div className="space-y-2">
            <div className="twin-section-header twin-section-header--org">
              <div className="twin-section-icon">
                <Building2 size={15} strokeWidth={2.5} />
              </div>
              <span className="twin-section-label">Organization Twin</span>
            </div>
            {orgNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-white shadow-sm text-primary font-bold border border-[var(--border-subtle)]' 
                      : 'text-secondary hover:bg-white/50 hover:text-primary'
                  }`
                }
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Employee Twin Section */}
          <div className="space-y-2 pt-4">
            <div className="twin-section-header twin-section-header--emp">
              <div className="twin-section-icon">
                <UserCircle size={15} strokeWidth={2.5} />
              </div>
              <span className="twin-section-label">Employee Twin</span>
            </div>
            {empNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-white shadow-sm text-primary font-bold border border-[var(--border-subtle)]' 
                      : 'text-secondary hover:bg-white/50 hover:text-primary'
                  }`
                }
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        <button onClick={() => setIsProfileOpen(true)} className="p-4 border-t border-[var(--border-subtle)] hover:bg-white/50 transition-colors text-left w-full cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white font-bold shadow-sm group-hover:shadow-md transition-shadow">
              HR
            </div>
            <div>
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">Admin User</p>
              <p className="text-xs text-tertiary">HR Leader</p>
            </div>
          </div>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden m-4 ml-0">
        <header className="h-16 glass rounded-lg mb-4 flex items-center justify-between px-6 border border-[var(--border-color)]">
          <div className="text-sm text-tertiary">Organization Overview</div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-72 h-10 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] px-3 flex items-center justify-between text-sm text-tertiary hover:border-primary hover:text-secondary transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <Search size={16} className="shrink-0 group-hover:text-primary transition-colors"/> 
                <span className="truncate whitespace-nowrap">Search employees, skills...</span>
              </div>
              <div className="shrink-0 flex items-center">
                <kbd className="hidden sm:flex items-center justify-center h-5 px-2 text-[10px] font-bold bg-white border border-[var(--border-subtle)] rounded shadow-sm text-secondary uppercase tracking-wider">Ctrl K</kbd>
              </div>
            </button>
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="w-10 h-10 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-secondary hover:text-primary transition-colors shadow-sm border border-transparent hover:border-[var(--border-subtle)] relative"
            >
              <AlertTriangle size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-danger rounded-full border border-white"></span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto animate-fade-in pr-2" style={{ scrollbarWidth: 'thin' }}>
          <Outlet />
        </div>
      </main>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      <Modal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} title="System Notifications">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
            <div className="p-4 bg-warning-light/30 border border-warning/20 rounded-xl flex gap-3 items-start">
              <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-warning-dark">High Attrition Risk Detected</h4>
                <p className="text-xs text-secondary mt-1">David Chen's burnout score has reached 78. Immediate action recommended.</p>
                <span className="text-[10px] text-tertiary mt-2 block">10 minutes ago</span>
              </div>
            </div>
            <div className="p-4 bg-white border border-[var(--border-subtle)] rounded-xl flex gap-3 items-start">
              <Activity size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-primary">Model Retraining Complete</h4>
                <p className="text-xs text-secondary mt-1">The workforce prediction model has successfully incorporated new intervention data.</p>
                <span className="text-[10px] text-tertiary mt-2 block">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="User Profile Settings">
        <div className="flex flex-col items-center justify-center py-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-30" style={{ backgroundColor: '#8b5cf6', transform: 'translate(20%, -40%)' }}></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-3xl pointer-events-none opacity-20" style={{ backgroundColor: '#3b82f6', transform: 'translate(-30%, 30%)' }}></div>
          
          <div className="relative group mb-5">
            <div className="absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)' }}></div>
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-xl relative z-10 border-[3px]" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', borderColor: 'rgba(255,255,255,0.8)' }}>
              HR
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 bg-emerald-500 z-20" style={{ borderColor: '#ffffff' }}></div>
          </div>
          
          <h3 className="text-xl font-extrabold text-slate-800 mb-1">Admin User</h3>
          <p className="text-sm font-bold text-slate-500 mb-8 uppercase tracking-wider">HR Leader • Super Admin</p>
          
          <div className="w-full flex flex-col gap-3 relative z-10">
            <button 
              onClick={() => {
                setIsProfileOpen(false);
                navigate('/admin/settings');
              }}
              className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl transition-all shadow-sm hover:shadow text-left flex items-center justify-between border cursor-pointer group"
              style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                  <Settings size={16} strokeWidth={2.5} />
                </div>
                <span>Admin Dashboard</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-indigo-400 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            
            <button className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl transition-all shadow-sm hover:shadow text-left flex items-center justify-between border cursor-pointer group" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
                  <UserCog size={16} strokeWidth={2.5} />
                </div>
                <span>Manage Account Settings</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-sky-400 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            
            <button className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl transition-all shadow-sm hover:shadow text-left flex items-center justify-between border cursor-pointer group mb-2" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <Bell size={16} strokeWidth={2.5} />
                </div>
                <span>Notification Preferences</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-amber-400 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            
            <button 
              className="w-full py-4 px-5 text-white text-[15px] font-extrabold tracking-wide rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-left flex items-center justify-center gap-3 border-none cursor-pointer group mt-3"
              style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', boxShadow: '0 8px 20px -6px rgba(225, 29, 72, 0.5)' }}
            >
              <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" /> 
              <span>Log Out Securely</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
