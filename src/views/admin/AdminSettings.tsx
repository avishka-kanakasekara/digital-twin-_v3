import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Settings, Shield, Plus, X, Server, Key, Users, Briefcase, Link2, Unplug, Clock, Layers, Target, Pencil } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const {
    skills, addSkill, removeSkill,
    projectTypes, addProjectType, removeProjectType,
    roles, addRole, updateRole, deleteRole,
    integrations, toggleIntegration,
    users, addUser, toggleUserStatus,
    departments, addDepartment, updateDepartment, deleteDepartment
  } = useSettings();

  const [newSkill, setNewSkill] = useState('');
  const [newProjectType, setNewProjectType] = useState('');
  const [activeTab, setActiveTab] = useState<'competencies' | 'projectTypes' | 'roles' | 'api' | 'users' | 'departments'>('competencies');

  // Role Creation State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ id: '', title: '', dept: '', req: [] as string[] });

  // User Creation State
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: '', dept: '' });

  // Department Creation State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDept, setNewDept] = useState({ id: '', name: '', head: '' });

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim()) {
      addSkill(newSkill);
      setNewSkill('');
    }
  };

  const handleAddProjectType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectType.trim()) {
      addProjectType(newProjectType);
      setNewProjectType('');
    }
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole.title && newRole.dept) {
      if (newRole.id) {
        updateRole({
          id: newRole.id,
          title: newRole.title,
          dept: newRole.dept,
          req: newRole.req,
          icon: roles.find(r => r.id === newRole.id)?.icon || Briefcase,
          color: roles.find(r => r.id === newRole.id)?.color || '#3b82f6'
        });
      } else {
        addRole({
          title: newRole.title,
          dept: newRole.dept,
          req: newRole.req,
          icon: Briefcase,
          color: '#3b82f6'
        });
      }
      setShowRoleModal(false);
      setNewRole({ id: '', title: '', dept: '', req: [] });
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.role && newUser.dept) {
      addUser({ ...newUser, status: 'Active' });
      setShowUserModal(false);
      setNewUser({ name: '', email: '', role: '', dept: '' });
    }
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDept.name && newDept.head) {
      if (newDept.id) {
        updateDepartment({
          id: newDept.id,
          name: newDept.name,
          head: newDept.head,
          memberCount: departments.find(d => d.id === newDept.id)?.memberCount || 0
        });
      } else {
        addDepartment({ name: newDept.name, head: newDept.head, memberCount: 0 });
      }
      setShowDeptModal(false);
      setNewDept({ id: '', name: '', head: '' });
    }
  };

  const toggleRoleSkill = (skill: string) => {
    setNewRole(prev => ({
      ...prev,
      req: prev.req.includes(skill) ? prev.req.filter(s => s !== skill) : [...prev.req, skill]
    }));
  };

  return (
    <div className="flex flex-col gap-6 relative w-full h-full pb-4 overflow-x-hidden">
      {/* Background Orbs for Glassmorphism Context */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full opacity-40 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[50%] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}></div>

      {/* Header */}
      <div className="z-10 flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              boxShadow: '0 12px 30px -10px rgba(15, 23, 42, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            <Settings size={26} className="animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h1 className="font-extrabold mb-1" style={{ fontSize: '2rem', backgroundImage: 'linear-gradient(to right, #0f172a, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>
              Admin Settings
            </h1>
            <p className="text-xs font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-2" style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderColor: 'rgba(226, 232, 240, 0.8)', color: '#475569', backdropFilter: 'blur(8px)' }}>
              <Shield size={12} style={{ color: '#8b5cf6' }} /> System Configuration & Master Data
            </p>
          </div>
        </div>

        <div className="relative group cursor-pointer hover:-translate-y-0.5 transition-transform duration-300">
          <div className="absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)' }}></div>
          <div className="relative flex items-center gap-3.5 p-1.5 pr-6 rounded-full border shadow-sm transition-all duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
            <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center shadow-md border" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', borderColor: 'rgba(255,255,255,0.2)' }}>
              <Shield size={16} strokeWidth={2.5} style={{ color: '#ffffff' }} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.15em] pt-[1px]" style={{ color: '#312e81' }}>Super Admin</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 lg:gap-8 z-10 h-full w-full min-h-0">
        {/* Sidebar Nav */}
        <div className="w-64 lg:w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto pb-8 pr-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveTab('competencies')}
            className="w-full justify-start text-left flex items-center gap-3.5 px-5 py-3 rounded-2xl transition-all font-bold cursor-pointer group relative overflow-hidden"
            style={activeTab === 'competencies'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(226, 232, 240, 0.8)' }
              : { backgroundColor: 'transparent', color: '#64748b', border: '1px solid transparent' }
            }
          >
            {activeTab === 'competencies' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-md" style={{ background: 'linear-gradient(to bottom, #4f46e5, #8b5cf6)' }}></div>}
            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-sm transition-colors" style={activeTab === 'competencies' ? { background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)', color: '#4f46e5' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
              <Server size={18} strokeWidth={activeTab === 'competencies' ? 2.5 : 2} />
            </div>
            <span className="truncate">Core Competencies</span>
          </button>

          <button
            onClick={() => setActiveTab('projectTypes')}
            className="w-full justify-start text-left flex items-center gap-3.5 px-5 py-3 rounded-2xl transition-all font-bold cursor-pointer relative overflow-hidden"
            style={activeTab === 'projectTypes'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(226, 232, 240, 0.8)' }
              : { backgroundColor: 'transparent', color: '#64748b', border: '1px solid transparent' }
            }
          >
            {activeTab === 'projectTypes' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-md" style={{ background: 'linear-gradient(to bottom, #8b5cf6, #d946ef)' }}></div>}
            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-sm transition-colors" style={activeTab === 'projectTypes' ? { background: 'linear-gradient(135deg, #ede9fe 0%, #fae8ff 100%)', color: '#d946ef' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
              <Target size={18} strokeWidth={activeTab === 'projectTypes' ? 2.5 : 2} />
            </div>
            <span className="truncate">Project Types</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className="w-full justify-start text-left flex items-center gap-3.5 px-5 py-3 rounded-2xl transition-all font-bold cursor-pointer relative overflow-hidden"
            style={activeTab === 'users'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(226, 232, 240, 0.8)' }
              : { backgroundColor: 'transparent', color: '#64748b', border: '1px solid transparent' }
            }
          >
            {activeTab === 'users' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-md" style={{ background: 'linear-gradient(to bottom, #ec4899, #be185d)' }}></div>}
            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-sm transition-colors" style={activeTab === 'users' ? { background: 'linear-gradient(135deg, #fce7f3 0%, #ffe4e6 100%)', color: '#db2777' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
              <Users size={18} strokeWidth={activeTab === 'users' ? 2.5 : 2} />
            </div>
            <span className="truncate">User Management</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className="w-full justify-start text-left flex items-center gap-3.5 px-5 py-3 rounded-2xl transition-all font-bold cursor-pointer relative overflow-hidden"
            style={activeTab === 'roles'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(226, 232, 240, 0.8)' }
              : { backgroundColor: 'transparent', color: '#64748b', border: '1px solid transparent' }
            }
          >
            {activeTab === 'roles' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-md" style={{ background: 'linear-gradient(to bottom, #10b981, #059669)' }}></div>}
            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-sm transition-colors" style={activeTab === 'roles' ? { background: 'linear-gradient(135deg, #d1fae5 0%, #ccfbf1 100%)', color: '#059669' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
              <Briefcase size={18} strokeWidth={activeTab === 'roles' ? 2.5 : 2} />
            </div>
            <span className="truncate">Role Definitions</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className="w-full justify-start text-left flex items-center gap-3.5 px-5 py-3 rounded-2xl transition-all font-bold cursor-pointer relative overflow-hidden"
            style={activeTab === 'departments'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(226, 232, 240, 0.8)' }
              : { backgroundColor: 'transparent', color: '#64748b', border: '1px solid transparent' }
            }
          >
            {activeTab === 'departments' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-md" style={{ background: 'linear-gradient(to bottom, #06b6d4, #0891b2)' }}></div>}
            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-sm transition-colors" style={activeTab === 'departments' ? { background: 'linear-gradient(135deg, #cffafe 0%, #dbeafe 100%)', color: '#0891b2' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
              <Layers size={18} strokeWidth={activeTab === 'departments' ? 2.5 : 2} />
            </div>
            <span className="truncate">Departments</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className="w-full justify-start text-left flex items-center gap-3.5 px-5 py-3 rounded-2xl transition-all font-bold cursor-pointer relative overflow-hidden"
            style={activeTab === 'api'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(226, 232, 240, 0.8)' }
              : { backgroundColor: 'transparent', color: '#64748b', border: '1px solid transparent' }
            }
          >
            {activeTab === 'api' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-md" style={{ background: 'linear-gradient(to bottom, #f59e0b, #d97706)' }}></div>}
            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-sm transition-colors" style={activeTab === 'api' ? { background: 'linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)', color: '#d97706' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
              <Key size={18} strokeWidth={activeTab === 'api' ? 2.5 : 2} />
            </div>
            <span className="truncate">API Integrations</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col h-full relative">
          <div
            className="h-full rounded-3xl p-6 lg:p-8 relative overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}
          >
            {activeTab === 'competencies' && (
              <div className="animate-fade-in flex flex-col h-full gap-8">
                <div className="pb-4 lg:pb-6 border-b shrink-0" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
                  <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight mb-2 truncate" style={{ color: '#0f172a' }}>Core Competencies Dictionary</h2>
                  <p className="text-xs lg:text-sm font-medium leading-relaxed max-w-3xl" style={{ color: '#64748b' }}>
                    Manage the master list of technical and soft skills used by the AI Team Assembler. Removing a skill here will immediately make it unavailable across the platform.
                  </p>
                </div>

                {/* Add New Skill Form */}
                <form onSubmit={handleAddSkill} className="flex gap-4 bg-white p-2.5 rounded-full shadow-sm border transition-shadow hover:shadow-md shrink-0" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                  <div className="flex-1 relative flex items-center pl-5">
                    <Plus size={20} style={{ color: '#94a3b8' }} className="mr-3" />
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Type a new skill (e.g. GraphQL, React Native)..."
                      className="w-full py-2.5 text-[15px] font-bold outline-none"
                      style={{ color: '#1e293b', backgroundColor: 'transparent' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newSkill.trim()}
                    className="px-8 py-3 rounded-full font-bold text-sm text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      boxShadow: '0 4px 15px -3px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    Add Skill
                  </button>
                </form>

                {/* Skills List */}
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                  <div className="flex justify-between items-center px-1 shrink-0">
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                      Active Skills Catalog
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {skills.length} Total
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 p-6 rounded-2xl flex-1 items-start align-content-start overflow-y-auto" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
                    {skills.map(skill => (
                      <div
                        key={skill}
                        className="group flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300"
                        style={{ backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                      >
                        <span className="text-xs font-bold" style={{ color: '#334155' }}>{skill}</span>
                        <button
                          onClick={() => removeSkill(skill)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
                          style={{ color: '#cbd5e1' }}
                          title={`Remove ${skill}`}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}

                    {skills.length === 0 && (
                      <div className="w-full h-full flex flex-col items-center justify-center py-20" style={{ color: '#94a3b8' }}>
                        <Server size={48} className="mb-4 opacity-40" />
                        <p className="text-base font-bold text-slate-500">No skills configured.</p>
                        <p className="text-sm mt-2 text-slate-400">Add a skill using the input above to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projectTypes' && (
              <div className="animate-fade-in flex flex-col h-full gap-8">
                <div className="pb-4 lg:pb-6 border-b shrink-0" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
                  <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight mb-2 truncate" style={{ color: '#0f172a' }}>Project Types</h2>
                  <p className="text-xs lg:text-sm font-medium leading-relaxed max-w-3xl" style={{ color: '#64748b' }}>
                    Define the categories of projects your organization undertakes. These types are used as parameters in the AI Team Assembler.
                  </p>
                </div>

                {/* Add New Project Type Form */}
                <form onSubmit={handleAddProjectType} className="flex gap-4 bg-white p-2.5 rounded-full shadow-sm border transition-shadow hover:shadow-md shrink-0" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                  <div className="flex-1 relative flex items-center pl-5">
                    <Plus size={20} style={{ color: '#94a3b8' }} className="mr-3" />
                    <input
                      type="text"
                      value={newProjectType}
                      onChange={(e) => setNewProjectType(e.target.value)}
                      placeholder="Type a new project type (e.g. R&D Exploration)..."
                      className="w-full py-2.5 text-[15px] font-bold outline-none"
                      style={{ color: '#1e293b', backgroundColor: 'transparent' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newProjectType.trim()}
                    className="px-8 py-3 rounded-full font-bold text-sm text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)',
                      boxShadow: '0 4px 15px -3px rgba(217, 70, 239, 0.4)'
                    }}
                  >
                    Add Type
                  </button>
                </form>

                {/* Project Types List */}
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                  <div className="flex justify-between items-center px-1 shrink-0">
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                      Active Project Types
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {projectTypes.length} Total
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 p-6 rounded-2xl flex-1 overflow-y-auto" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
                    {projectTypes.map(type => (
                      <div
                        key={type}
                        className="group flex justify-between items-center px-5 py-4 rounded-xl transition-all duration-300"
                        style={{ backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                      >
                        <div className="flex items-center gap-3">
                          <Target size={16} className="text-fuchsia-500" />
                          <span className="text-sm font-bold" style={{ color: '#334155' }}>{type}</span>
                        </div>
                        <button
                          onClick={() => removeProjectType(type)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
                          style={{ color: '#cbd5e1' }}
                          title={`Remove ${type}`}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                        >
                          <X size={16} strokeWidth={3} />
                        </button>
                      </div>
                    ))}

                    {projectTypes.length === 0 && (
                      <div className="w-full h-full flex flex-col items-center justify-center py-20" style={{ color: '#94a3b8' }}>
                        <Target size={48} className="mb-4 opacity-40" />
                        <p className="text-base font-bold text-slate-500">No project types configured.</p>
                        <p className="text-sm mt-2 text-slate-400">Add a type using the input above to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="animate-fade-in flex flex-col h-full">
                <div className="mb-8 pb-6 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: '#0f172a' }}>Role Definitions</h2>
                    <p className="text-sm font-medium leading-relaxed max-w-2xl" style={{ color: '#64748b' }}>
                      Standardize job titles and default competency requirements across the organization.
                    </p>
                  </div>
                  <button
                    onClick={() => { setNewRole({ id: '', title: '', dept: '', req: [] }); setShowRoleModal(true); }}
                    className="px-6 py-3 rounded-full font-bold text-sm text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <Plus size={18} strokeWidth={3} /> <span>Create Role</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-5 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
                  {roles.map((role) => {
                    const Icon = role.icon || Briefcase;
                    return (
                      <div key={role.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5 border group" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm border" style={{ backgroundColor: `${role.color}15`, color: role.color, borderColor: `${role.color}20` }}>
                              <Icon size={24} />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold" style={{ color: '#1e293b' }}>{role.title}</h3>
                              <span className="text-[11px] font-black uppercase tracking-wider mt-1 block" style={{ color: '#94a3b8' }}>{role.dept}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 transition-opacity">
                            <button
                              onClick={() => {
                                setNewRole({ id: role.id, title: role.title, dept: role.dept, req: role.req });
                                setShowRoleModal(true);
                              }}
                              className="transition-colors bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-slate-100" style={{ color: '#64748b' }}
                              title="Edit Role"
                            >
                              <Pencil size={16} strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => deleteRole(role.id)}
                              className="transition-colors bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-red-50" style={{ color: '#ef4444' }}
                              title="Delete Role"
                            >
                              <X size={16} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                        <div className="pt-4 border-t" style={{ borderColor: 'rgba(226, 232, 240, 0.5)' }}>
                          <p className="text-[10px] font-black uppercase mb-3" style={{ color: '#94a3b8' }}>Required Competencies</p>
                          <div className="flex flex-wrap gap-2">
                            {role.req.map((reqSkill, i) => (
                              <span key={i} className="text-[11px] font-bold px-4 py-1.5 rounded-full border shadow-sm" style={{ backgroundColor: `${role.color}08`, color: role.color, borderColor: `${role.color}20` }}>
                                {reqSkill}
                              </span>
                            ))}
                            {role.req.length === 0 && (
                              <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-slate-400 border border-slate-200 border-dashed">No specific requirements</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="animate-fade-in flex flex-col h-full">
                <div className="mb-8 pb-6 border-b shrink-0" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
                  <h2 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: '#0f172a' }}>API & Data Integrations</h2>
                  <p className="text-sm font-medium leading-relaxed max-w-3xl" style={{ color: '#64748b' }}>
                    Connect Culture Connect to your existing HRIS, communication, and performance management tools to sync workforce intelligence data in real-time.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {integrations.map((api) => {
                    const Icon = api.icon;
                    return (
                      <div key={api.id} className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm transition-colors border hover:shadow-md group" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm border transition-transform group-hover:scale-105" style={{ backgroundColor: `${api.color}15`, color: api.color, borderColor: `${api.color}20` }}>
                            <Icon size={24} />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold" style={{ color: '#1e293b' }}>{api.name}</h3>
                            <div className="flex items-center gap-3 mt-1.5 text-xs font-bold" style={{ color: '#64748b' }}>
                              <span>{api.type}</span>
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#cbd5e1' }}></span>
                              <span className="flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                                <Clock size={12} /> Last sync: {api.sync}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          {api.status === 'connected' ? (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>
                              <Link2 size={14} /> Connected
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
                              <Unplug size={14} /> Disconnected
                            </div>
                          )}
                          <button
                            onClick={() => toggleIntegration(api.id)}
                            className="text-[11px] font-black uppercase tracking-wider hover:underline transition-colors bg-transparent border-none cursor-pointer p-0 m-0" style={{ color: '#4f46e5' }}>
                            {api.status === 'connected' ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="animate-fade-in flex flex-col h-full">
                <div className="mb-8 pb-6 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: '#0f172a' }}>User Management</h2>
                    <p className="text-sm font-medium leading-relaxed max-w-2xl" style={{ color: '#64748b' }}>
                      Manage employee access, invite new users, and view organizational roles.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="px-6 py-3 rounded-full font-bold text-sm text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>
                    <Plus size={18} strokeWidth={3} /> <span>Invite User</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
                  <div className="flex flex-col gap-3">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-white shadow-md border" style={{ background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', borderColor: 'rgba(255,255,255,0.2)' }}>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="text-[15px] font-extrabold" style={{ color: '#1e293b' }}>{user.name}</h3>
                            <div className="flex items-center gap-2.5 mt-1.5">
                              <span className="text-xs text-slate-500 font-bold">{user.email}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">{user.role}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>{user.dept}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-5">
                          {user.status === 'Active' ? (
                            <span className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>
                          ) : (
                            <span className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm bg-red-50 text-red-600 border border-red-200">Suspended</span>
                          )}
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className="text-xs font-black uppercase tracking-wider underline cursor-pointer bg-transparent border-none transition-colors opacity-60 hover:opacity-100"
                            style={{ color: user.status === 'Active' ? '#ef4444' : '#10b981' }}
                          >
                            {user.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'departments' && (
              <div className="animate-fade-in flex flex-col h-full">
                <div className="mb-8 pb-6 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: '#0f172a' }}>Organizational Departments</h2>
                    <p className="text-sm font-medium leading-relaxed max-w-2xl" style={{ color: '#64748b' }}>
                      Define your company's departmental structure and leadership.
                    </p>
                  </div>
                  <button
                    onClick={() => { setNewDept({ id: '', name: '', head: '' }); setShowDeptModal(true); }}
                    className="px-6 py-3 rounded-full font-bold text-sm text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                    <Plus size={18} strokeWidth={3} /> <span>Add Department</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-5 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
                  {departments.map((dept) => (
                    <div key={dept.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5 border" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm border bg-cyan-50 text-cyan-500 border-cyan-100">
                            <Layers size={24} />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-slate-800">{dept.name}</h3>
                            <span className="text-[11px] font-black uppercase tracking-wider mt-1 block text-slate-400">{dept.memberCount} Members</span>
                          </div>
                        </div>
                        <div className="flex gap-1 transition-opacity">
                          <button
                            onClick={() => {
                              setNewDept({ id: dept.id, name: dept.name, head: dept.head });
                              setShowDeptModal(true);
                            }}
                            className="transition-colors bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-slate-100" style={{ color: '#64748b' }}
                            title="Edit Department"
                          >
                            <Pencil size={16} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => deleteDepartment(dept.id)}
                            className="transition-colors bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-red-50" style={{ color: '#ef4444' }}
                            title="Delete Department"
                          >
                            <X size={16} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {dept.head.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Department Head</p>
                          <p className="text-sm font-bold text-slate-700">{dept.head}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Role Creation Modal Overlay */}
            {showRoleModal && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl animate-in fade-in duration-300 backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                <div className="backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 w-[calc(100%-2rem)] max-w-[500px] border animate-in zoom-in-95 duration-300 ease-out relative overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', transform: 'translate(30%, -30%)' }}></div>

                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm border" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #ccfbf1 100%)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                        <Briefcase size={24} />
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>{newRole.id ? 'Edit Role' : 'Create New Role'}</h2>
                    </div>
                    <button onClick={() => setShowRoleModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:rotate-90 transition-all duration-300 shadow-sm cursor-pointer border" style={{ backgroundColor: '#ffffff', color: '#64748b', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  <form onSubmit={handleAddRole} className="flex flex-col gap-5 relative z-10">
                    <div
                      className="relative border rounded-3xl px-6 py-3.5 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-text group"
                      style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                      onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLElement)?.focus()}
                    >
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 cursor-text transition-colors" style={{ color: '#64748b' }}>Role Title</label>
                      <input
                        type="text" required value={newRole.title} onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
                        className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight placeholder-slate-300"
                        style={{ color: '#0f172a' }}
                        placeholder="e.g. Lead Designer"
                      />
                    </div>

                    <div
                      className="relative border rounded-3xl px-6 py-3.5 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-text group"
                      style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                      onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLElement)?.focus()}
                    >
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 cursor-text transition-colors" style={{ color: '#64748b' }}>Department</label>
                      <input
                        type="text" required value={newRole.dept} onChange={(e) => setNewRole({ ...newRole, dept: e.target.value })}
                        className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight placeholder-slate-300"
                        style={{ color: '#0f172a' }}
                        placeholder="e.g. Design"
                      />
                    </div>

                    <div className="mt-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-2 ml-3" style={{ color: '#64748b' }}>Required Competencies</label>
                      <div className="flex flex-wrap gap-2 p-5 rounded-3xl max-h-[160px] overflow-y-auto" style={{ backgroundColor: '#f1f5f9', scrollbarWidth: 'none' }}>
                        {skills.map(skill => {
                          const isSelected = newRole.req.includes(skill);
                          return (
                            <button
                              key={skill} type="button"
                              onClick={() => {
                                if (isSelected) setNewRole({ ...newRole, req: newRole.req.filter(s => s !== skill) });
                                else setNewRole({ ...newRole, req: [...newRole.req, skill] });
                              }}
                              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer border ${isSelected ? 'shadow-sm' : ''}`}
                              style={isSelected
                                ? { backgroundColor: '#10b981', color: '#ffffff', borderColor: '#059669' }
                                : { backgroundColor: '#ffffff', color: '#64748b', borderColor: 'rgba(226, 232, 240, 0.8)' }
                              }
                            >
                              {skill}
                            </button>
                          )
                        })}
                        {skills.length === 0 && (
                          <p className="text-sm font-medium w-full text-center py-4 text-slate-400">No skills available. Add some in the Core Competencies tab.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3 justify-end">
                      <button type="button" onClick={() => setShowRoleModal(false)} className="px-8 py-3 rounded-full font-bold text-sm cursor-pointer transition-all duration-300 shadow-sm border hover:shadow-md" style={{ backgroundColor: '#ffffff', color: '#475569', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={!newRole.title || !newRole.dept} className="px-10 py-3 rounded-full font-bold text-sm text-white border-none cursor-pointer transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 20px -5px rgba(16, 185, 129, 0.4)' }}>
                        Save Role
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* User Creation Modal Overlay */}
            {showUserModal && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl animate-in fade-in duration-300 backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                <div className="backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 w-[calc(100%-2rem)] max-w-[500px] border animate-in zoom-in-95 duration-300 ease-out relative overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(236, 72, 153, 0.12)', transform: 'translate(30%, -30%)' }}></div>

                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm border" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #ffe4e6 100%)', color: '#db2777', borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                        <Users size={24} />
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Invite New User</h2>
                    </div>
                    <button onClick={() => setShowUserModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:rotate-90 transition-all duration-300 shadow-sm cursor-pointer border" style={{ backgroundColor: '#ffffff', color: '#64748b', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  <form onSubmit={handleAddUser} className="flex flex-col gap-5 relative z-10">
                    <div
                      className="relative border rounded-3xl px-6 py-3.5 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-text group"
                      style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                      onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(236, 72, 153, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLElement)?.focus()}
                    >
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 cursor-text transition-colors" style={{ color: '#64748b' }}>Full Name</label>
                      <input
                        type="text" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight placeholder-slate-300"
                        style={{ color: '#0f172a' }}
                        placeholder="e.g. Alex Johnson"
                      />
                    </div>

                    <div
                      className="relative border rounded-3xl px-6 py-3.5 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-text group"
                      style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                      onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(236, 72, 153, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLElement)?.focus()}
                    >
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 cursor-text transition-colors" style={{ color: '#64748b' }}>Email Address</label>
                      <input
                        type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight placeholder-slate-300"
                        style={{ color: '#0f172a' }}
                        placeholder="alex@company.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="relative border rounded-3xl px-6 py-3.5 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-pointer group"
                        style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                        onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(236, 72, 153, 0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                      >
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 cursor-pointer transition-colors" style={{ color: '#64748b' }}>Role</label>
                        <div className="relative">
                          <select required value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight cursor-pointer appearance-none"
                            style={{ color: '#0f172a' }}
                          >
                            <option value="">Select Role</option>
                            {roles.map(r => <option key={r.id} value={r.title}>{r.title}</option>)}
                          </select>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-5 h-5 rounded-full" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                          </div>
                        </div>
                      </div>

                      <div
                        className="relative border rounded-3xl px-6 py-3.5 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-pointer group"
                        style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                        onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(236, 72, 153, 0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                      >
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 cursor-pointer transition-colors" style={{ color: '#64748b' }}>Department</label>
                        <div className="relative">
                          <select required value={newUser.dept} onChange={(e) => setNewUser({ ...newUser, dept: e.target.value })}
                            className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight cursor-pointer appearance-none"
                            style={{ color: '#0f172a' }}
                          >
                            <option value="">Select Dept</option>
                            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                          </select>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-5 h-5 rounded-full" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3 justify-end">
                      <button type="button" onClick={() => setShowUserModal(false)} className="px-8 py-3 rounded-full font-bold text-sm cursor-pointer transition-all duration-300 shadow-sm border hover:shadow-md" style={{ backgroundColor: '#ffffff', color: '#475569', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={!newUser.name || !newUser.email || !newUser.role || !newUser.dept} className="px-10 py-3 rounded-full font-bold text-sm text-white border-none cursor-pointer transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #e11d48 100%)', boxShadow: '0 8px 20px -5px rgba(236, 72, 153, 0.4)' }}>
                        Send Invite
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Department Creation Modal Overlay */}
            {showDeptModal && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl animate-in fade-in duration-300 backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                <div className="backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 w-[calc(100%-2rem)] max-w-[450px] border animate-in zoom-in-95 duration-300 ease-out relative overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', transform: 'translate(30%, -30%)' }}></div>

                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm border" style={{ background: 'linear-gradient(135deg, #cffafe 0%, #dbeafe 100%)', color: '#0891b2', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                        <Layers size={24} />
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>{newDept.id ? 'Edit Department' : 'Add Department'}</h2>
                    </div>
                    <button onClick={() => setShowDeptModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:rotate-90 transition-all duration-300 shadow-sm cursor-pointer border" style={{ backgroundColor: '#ffffff', color: '#64748b', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  <form onSubmit={handleAddDept} className="flex flex-col gap-5 relative z-10">
                    <div
                      className="relative border rounded-3xl px-6 py-3.5 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-text group"
                      style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                      onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#0891b2'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(6, 182, 212, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLElement)?.focus()}
                    >
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 cursor-text transition-colors" style={{ color: '#64748b' }}>Department Name</label>
                      <input
                        type="text" required value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                        className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight placeholder-slate-300"
                        style={{ color: '#0f172a' }}
                        placeholder="e.g. Product Engineering"
                      />
                    </div>

                    <div
                      className="relative border rounded-3xl px-6 py-3.5 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-text group"
                      style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                      onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#0891b2'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(6, 182, 212, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLElement)?.focus()}
                    >
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 cursor-text transition-colors" style={{ color: '#64748b' }}>Department Head</label>
                      <input
                        type="text" required value={newDept.head} onChange={(e) => setNewDept({ ...newDept, head: e.target.value })}
                        className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight placeholder-slate-300"
                        style={{ color: '#0f172a' }}
                        placeholder="Name of leader"
                      />
                    </div>

                    <div className="mt-4 flex gap-3 justify-end">
                      <button type="button" onClick={() => setShowDeptModal(false)} className="px-8 py-3 rounded-full font-bold text-sm cursor-pointer transition-all duration-300 shadow-sm border hover:shadow-md" style={{ backgroundColor: '#ffffff', color: '#475569', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={!newDept.name || !newDept.head} className="px-10 py-3 rounded-full font-bold text-sm text-white border-none cursor-pointer transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', boxShadow: '0 8px 20px -5px rgba(6, 182, 212, 0.4)' }}>
                        Add Department
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
