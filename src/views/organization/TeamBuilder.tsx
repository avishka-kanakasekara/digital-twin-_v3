import React, { useState, useEffect } from 'react';
import { Users, Wand2, ShieldCheck, CheckCircle2, Search, SlidersHorizontal, GitMerge, Star, Check, Target, Activity, HeartHandshake, Sparkles, BrainCircuit } from 'lucide-react';

import { useSettings } from '../../context/SettingsContext';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  match: number;
  skills: string[];
}

export interface TeamOption {
  id: string;
  name: string;
  successRate: number;
  compatibilityScore: number;
  skillBalance: number;
  performancePrediction: number;
  rationale: string;
  members: TeamMember[];
}

export const TeamBuilder: React.FC = () => {
  const { skills, users, roles, projectTypes } = useSettings();
  const [headcount, setHeadcount] = useState(4);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['AWS', 'Node.js', 'Figma']);
  const [projectType, setProjectType] = useState(projectTypes[0] || 'New Product Development');
  
  useEffect(() => {
    if (projectTypes.length > 0 && !projectTypes.includes(projectType)) {
      setProjectType(projectTypes[0]);
    }
  }, [projectTypes, projectType]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [teamGenerated, setTeamGenerated] = useState(false);
  const [confirmedTeam, setConfirmedTeam] = useState<string | null>(null);
  const [generatedOptions, setGeneratedOptions] = useState<TeamOption[]>([]);
  
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTeamGenerated(false);
    setConfirmedTeam(null);
    
    setTimeout(() => {
      // Find all active users and attach their role's skills
      const activeUsers = users
        .filter(u => u.status === 'Active')
        .map(u => {
          const roleDef = roles.find(r => r.title === u.role);
          const userSkills = roleDef ? roleDef.req : [];
          
          // Calculate skill match percentage against selected skills
          const matchedSkills = userSkills.filter(s => selectedSkills.includes(s));
          const matchPercent = selectedSkills.length > 0 
            ? Math.round((matchedSkills.length / selectedSkills.length) * 100) 
            : 100;
            
          return {
            id: u.id,
            name: u.name,
            role: u.role,
            dept: u.dept,
            skills: userSkills,
            match: Math.min(matchPercent + Math.floor(Math.random() * 20), 100) // fuzzy match
          };
        });

      // If no users, we can't generate teams
      if (activeUsers.length === 0) {
        setIsGenerating(false);
        return; // Alternatively, show an error message
      }

      const actualHeadcount = Math.min(headcount, activeUsers.length);
      
      // Algorithm for Option A: High Collaboration (Cross-functional)
      // Sort by department diversity (randomized for mockup)
      const optionAUsers = [...activeUsers].sort(() => 0.5 - Math.random()).slice(0, actualHeadcount);
      
      const optionA: TeamOption = {
        id: 'opt_a_' + Date.now(),
        name: 'Option A: High Collaboration',
        successRate: 94,
        compatibilityScore: 96,
        skillBalance: 88,
        performancePrediction: 92,
        rationale: 'Excellent cross-departmental synergy and strong past collaboration factors.',
        members: optionAUsers.map(u => ({ id: u.id, name: u.name, role: u.role, match: u.match, skills: u.skills }))
      };

      // Algorithm for Option B: Highest Skill Match
      // Sort by absolute highest match score
      const optionBUsers = [...activeUsers].sort((a, b) => b.match - a.match).slice(0, actualHeadcount);
      
      const optionB: TeamOption = {
        id: 'opt_b_' + Date.now(),
        name: 'Option B: Highest Skill Match',
        successRate: 88,
        compatibilityScore: 75,
        skillBalance: 99,
        performancePrediction: 85,
        rationale: 'Maximum technical skill coverage based on role requirements.',
        members: optionBUsers.map(u => ({ id: u.id, name: u.name, role: u.role, match: u.match, skills: u.skills }))
      };

      setGeneratedOptions([optionA, optionB]);
      setIsGenerating(false);
      setTeamGenerated(true);
    }, 2000);
  };

  const handleConfirm = (teamId: string) => {
    setConfirmedTeam(teamId);
  };

  return (
    <div className="flex flex-col gap-5 relative min-h-full pb-8">
      {/* Decorative Vibrant Background to make glassmorphism pop */}
      <div className="absolute inset-0 -m-8 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px] translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4"></div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between z-10 relative mt-2">
        <div>
          <h1 className="text-3xl font-black mb-1.5 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 tracking-tight">AI Team Builder</h1>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-bold text-indigo-600 shadow-sm">
              <BrainCircuit size={12} /> Optimization Engine
            </span>
            <p className="text-xs text-slate-500 font-bold">
              Assemble high-performing teams based on skill compatibility and predictive success models.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 z-10 relative">
        {/* Left Column: Requirements */}
        <div className="col-span-4 flex flex-col gap-6">
          <div 
            className="backdrop-blur-3xl border border-white/60 p-6 rounded-[2rem] shadow-[0_20px_50px_rgb(0,0,0,0.06)] relative overflow-hidden group h-full flex flex-col"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.8)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex items-center gap-4 mb-6 pb-5 border-b border-slate-200/50">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                   style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)' }}>
                <SlidersHorizontal size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Parameters</h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Define Constraints</p>
              </div>
            </div>
            
            <div className="relative z-10 flex flex-col gap-6 flex-1">
              {/* Project Type */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Target size={14} className="text-indigo-500"/> Project Type
                </label>
                <div className="relative">
                  <select 
                    className="w-full px-4 pr-14 py-3 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer appearance-none shadow-sm hover:-translate-y-0.5"
                    style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                  >
                    {projectTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    {projectTypes.length === 0 && (
                      <option disabled value="">No project types available</option>
                    )}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 bg-indigo-50 p-1.5 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Headcount */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-500"/> Required Headcount
                </label>
                <div className="flex items-center gap-4 p-2.5 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <input 
                    type="range" 
                    min="2" max="10" 
                    value={headcount} 
                    onChange={(e) => setHeadcount(parseInt(e.target.value))}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                    style={{ 
                      background: `linear-gradient(to right, #6366f1 ${((headcount - 2) / 8) * 100}%, #e2e8f0 ${((headcount - 2) / 8) * 100}%)`,
                      accentColor: '#4f46e5'
                    }}
                  />
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg text-white border border-indigo-500 shadow-md shrink-0"
                       style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                    {headcount}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Star size={14} className="text-indigo-500"/> Core Competencies
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{selectedSkills.length} selected</span>
                </div>
                <div className="flex flex-wrap gap-2 p-4 border border-slate-200/60 bg-slate-50/50 rounded-xl min-h-[100px] shadow-inner">
                  {skills.map(skill => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button 
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 scale-105 border-transparent' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm'
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={4} />}
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Context */}
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-500"/> Additional Context
                </label>
                <textarea 
                  className="w-full flex-1 p-3 rounded-xl border border-slate-200/60 bg-white/80 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none min-h-[80px] shadow-sm placeholder-slate-400"
                  placeholder="E.g. Requires high availability due to short timeline..."
                />
              </div>
            </div>
            
            <button 
              className="w-full rounded-2xl py-4 font-black text-sm hover:-translate-y-1 transition-all duration-300 mt-4 z-10 flex items-center justify-center gap-3 relative overflow-hidden group text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.4)] border-none cursor-pointer shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
              onClick={handleGenerate} 
              disabled={isGenerating}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 blur-xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="relative z-10">Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={20} className="group-hover:rotate-12 transition-transform relative z-10" /> <span className="relative z-10 tracking-wide">Generate Optimal Teams</span>
                  </>
                )}
              </button>
          </div>
        </div>

        {/* Right Column: AI Suggestions */}
        <div className="col-span-8 flex flex-col h-full min-h-[600px]">
          
          {!teamGenerated && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 bg-slate-50/40 backdrop-blur-3xl border border-white/60 h-full group">
              {/* High-end animated mesh gradient background */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-400/20 to-emerald-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
              
              <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-2xl transform group-hover:scale-[1.02] transition-transform duration-700">
                
                {/* Futuristic Floating Orb Icon */}
                <div className="w-32 h-32 mb-10 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-spin blur-md opacity-70" style={{ animationDuration: '4s' }}></div>
                  <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <Users size={48} className="text-indigo-600 drop-shadow-sm" strokeWidth={2} />
                  </div>
                  {/* Orbiting particles */}
                  <div className="absolute top-0 left-1/2 w-4 h-4 bg-blue-400 rounded-full blur-[2px] animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-purple-400 rounded-full blur-[2px] animate-bounce" style={{ animationDuration: '3s' }}></div>
                </div>
                
                <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 tracking-tighter mb-6 drop-shadow-sm">AI Team Assembler</h3>
                <p className="text-base font-medium text-slate-600 mb-12 leading-relaxed max-w-lg mx-auto">
                  Configure your constraints on the left. Our neural optimization engine evaluates millions of combinations across skills, availability, and collaboration graphs to surface the ultimate team composition.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-3 text-sm font-bold px-6 py-3 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-white/80 bg-white/60 backdrop-blur-md hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 hover:bg-white transition-all cursor-pointer group/badge">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 group-hover/badge:from-blue-500 group-hover/badge:to-blue-600 group-hover/badge:text-white transition-all shadow-inner"><Search size={16} strokeWidth={2.5}/></div>
                    Skill Optimization
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold px-6 py-3 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-white/80 bg-white/60 backdrop-blur-md hover:-translate-y-1 hover:shadow-lg hover:border-purple-200 hover:bg-white transition-all cursor-pointer group/badge">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 group-hover/badge:from-purple-500 group-hover/badge:to-purple-600 group-hover/badge:text-white transition-all shadow-inner"><HeartHandshake size={16} strokeWidth={2.5}/></div>
                    Compatibility Matrix
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold px-6 py-3 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-white/80 bg-white/60 backdrop-blur-md hover:-translate-y-1 hover:shadow-lg hover:border-emerald-200 hover:bg-white transition-all cursor-pointer group/badge">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 group-hover/badge:from-emerald-500 group-hover/badge:to-emerald-600 group-hover/badge:text-white transition-all shadow-inner"><ShieldCheck size={16} strokeWidth={2.5}/></div>
                    Predictive Success
                  </div>
                </div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center h-full border-2 border-white/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full animate-spin" style={{ animationDuration: '10s' }}></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full shadow-inner"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin shadow-[0_0_20px_rgba(79,70,229,0.4)]" style={{ animationDuration: '1s' }}></div>
                  <div className="absolute inset-2 border-4 border-purple-400 rounded-full border-b-transparent animate-spin-reverse shadow-[0_0_15px_rgba(168,85,247,0.4)]" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BrainCircuit size={36} className="text-indigo-600 animate-pulse drop-shadow-lg" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-900 mb-3 tracking-tighter">Running Optimization Model</h3>
                <p className="text-slate-500 font-bold animate-pulse text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div> Evaluating multi-dimensional workforce graphs...
                </p>
              </div>
            </div>
          )}

          {teamGenerated && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
              {/* Results Header */}
              <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight mb-0.5">Optimization Complete</h3>
                    <p className="text-indigo-100 font-medium text-xs">Surfaced 2 highly viable configurations.</p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-6">
                {generatedOptions.map((option) => {
                  const isConfirmed = confirmedTeam === option.id;
                  const isAnotherConfirmed = confirmedTeam !== null && confirmedTeam !== option.id;
                  
                  if (isAnotherConfirmed) return null;

                  return (
                    <div key={option.id} className={`flex flex-col rounded-[1.5rem] overflow-hidden transition-all duration-500 relative group ${
                      isConfirmed 
                        ? 'bg-emerald-50/90 border-2 border-emerald-400 shadow-[0_20px_50px_rgb(16,185,129,0.15)] scale-[1.02]' 
                        : 'bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1'
                    }`}>
                      
                      {isConfirmed && (
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl opacity-50 z-0 pointer-events-none"></div>
                      )}
                      
                      {/* Header Section */}
                      <div className={`p-6 z-10 border-b ${isConfirmed ? 'border-emerald-200/60' : 'border-slate-100'} flex justify-between items-start`}>
                        <div className="flex-1 pr-6">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{option.name}</h3>
                            {isConfirmed && (
                              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-emerald-500/20">
                                <CheckCircle2 size={14} strokeWidth={3} /> Confirmed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 font-bold flex items-start gap-2 leading-relaxed">
                            <GitMerge size={16} className="text-indigo-400 shrink-0 mt-0.5" /> 
                            {option.rationale}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end shrink-0 bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm backdrop-blur-sm">
                          <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mb-1">Predicted Success</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-4xl font-black tracking-tighter ${option.successRate > 90 ? 'text-emerald-500' : 'text-slate-800'}`}>
                              {option.successRate}%
                            </span>
                            <ShieldCheck size={28} className={option.successRate > 90 ? 'text-emerald-400' : 'text-slate-300'} />
                          </div>
                        </div>
                      </div>

                      {/* Metrics Row */}
                      <div className="grid grid-cols-3 divide-x divide-slate-100/50 bg-white/50 z-10 border-b border-slate-100">
                        <div className="p-4 flex items-center gap-4 hover:bg-white/80 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner border border-blue-100/50 shrink-0">
                            <Target size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mb-0.5">Skill Balance</p>
                            <p className="text-lg font-black text-slate-800">{option.skillBalance}%</p>
                          </div>
                        </div>
                        <div className="p-4 flex items-center gap-4 hover:bg-white/80 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shadow-inner border border-purple-100/50 shrink-0">
                            <HeartHandshake size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mb-0.5">Compatibility</p>
                            <p className="text-lg font-black text-slate-800">{option.compatibilityScore}/100</p>
                          </div>
                        </div>
                        <div className="p-4 flex items-center gap-4 hover:bg-white/80 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner border border-emerald-100/50 shrink-0">
                            <Activity size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mb-0.5">Performance</p>
                            <p className="text-lg font-black text-slate-800">{option.performancePrediction}</p>
                          </div>
                        </div>
                      </div>

                      {/* Members Roster */}
                      <div className="p-6 z-10 bg-slate-50/40">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                          <Users size={14} /> Proposed Roster
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {option.members.map(member => (
                            <div key={member.id} className="flex items-start gap-3 p-4 rounded-xl bg-white/90 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group/member">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-black text-sm border border-slate-300 shadow-inner group-hover/member:from-indigo-50 group-hover/member:to-indigo-100 group-hover/member:text-indigo-600 group-hover/member:border-indigo-200 transition-colors shrink-0">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                  <h5 className="font-black text-sm text-slate-800 truncate group-hover/member:text-indigo-600 transition-colors">{member.name}</h5>
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm shrink-0 flex items-center gap-1">
                                    <Star size={8} className="fill-emerald-600" /> {member.match}% Match
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-500 mb-2 truncate">{member.role}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {member.skills.map(skill => {
                                    const isReq = selectedSkills.includes(skill);
                                    return (
                                      <span key={skill} className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${
                                        isReq 
                                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                                          : 'bg-slate-50 text-slate-500 border-slate-200/60'
                                      }`}>
                                        {skill}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Bar */}
                      {!isConfirmed && (
                        <div className="p-4 bg-white z-10 border-t border-slate-100 flex justify-end">
                          <button 
                            onClick={() => handleConfirm(option.id)} 
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg hover:shadow-xl rounded-xl font-black text-sm flex items-center gap-3 px-6 py-3 hover:-translate-y-0.5 transition-all duration-300 group/btn cursor-pointer border-none"
                          >
                            <CheckCircle2 size={20} className="group-hover/btn:scale-110 transition-transform" /> <span>Confirm & Assemble</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
