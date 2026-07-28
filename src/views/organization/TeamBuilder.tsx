import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { Users, Wand2, ShieldCheck, CheckCircle2, Search, SlidersHorizontal, GitMerge, Star, Check, Target, Activity, HeartHandshake } from 'lucide-react';

import { mockOptionA, mockOptionB, predefinedSkills } from '../../dummy/organization/teamBuilderData';

export const TeamBuilder: React.FC = () => {
  const [headcount, setHeadcount] = useState(4);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['AWS', 'Node.js', 'Figma']);
  const [projectType, setProjectType] = useState('New Product Development');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [teamGenerated, setTeamGenerated] = useState(false);
  const [confirmedTeam, setConfirmedTeam] = useState<string | null>(null);
  
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTeamGenerated(false);
    setConfirmedTeam(null);
    setTimeout(() => {
      setIsGenerating(false);
      setTeamGenerated(true);
    }, 2000);
  };

  const handleConfirm = (teamId: string) => {
    setConfirmedTeam(teamId);
  };

  return (
    <div className="flex flex-col gap-6 relative pb-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">AI Team Builder</h1>
        <p className="text-sm text-slate-500 font-bold mt-1 bg-slate-100/80 inline-block px-3 py-1.5 rounded-lg border border-slate-200">
          Organization Digital Twin • Assemble teams based on skill matching, compatibility, and predictive performance.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Requirements */}
        <div className="col-span-1 flex flex-col gap-6">
          <Card className="flex flex-col h-fit p-6 transition-all duration-300 rounded-3xl relative overflow-hidden group shadow-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(255,255,255,0.6)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl group-hover:bg-indigo-100/50 transition-colors opacity-50 z-0" style={{ backgroundColor: 'rgba(79, 70, 229, 0.08)' }}></div>
            
            <div className="flex items-center gap-4 mb-6 border-b border-[var(--border-subtle)] pb-5 z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
                <SlidersHorizontal size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Define Requirements</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#64748b' }}>Combinatorial Optimization</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-6 z-10 flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2" style={{ color: '#4f46e5' }}><Target size={14}/> Project Type</label>
                <select 
                  className="w-full p-3.5 rounded-2xl border text-sm font-bold text-slate-800 outline-none transition-colors cursor-pointer appearance-none shadow-sm"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(226, 232, 240, 0.8)' }}
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                >
                  <option>New Product Development</option>
                  <option>System Migration</option>
                  <option>Maintenance & Support</option>
                  <option>Tiger Team / Crisis Resp</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2" style={{ color: '#4f46e5' }}><Users size={14}/> Required Headcount</label>
                <div className="flex items-center gap-4 p-2 rounded-2xl border shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                  <input 
                    type="range" 
                    min="2" max="10" 
                    value={headcount} 
                    onChange={(e) => setHeadcount(parseInt(e.target.value))}
                    className="flex-1 cursor-pointer accent-indigo-600"
                  />
                  <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-slate-800 shadow-sm border border-slate-200">{headcount}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2" style={{ color: '#4f46e5' }}><Star size={14}/> Required Skills & Tech</label>
                <div className="flex flex-wrap gap-2 p-4 border rounded-2xl min-h-[100px] shadow-inner" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                  {predefinedSkills.map(skill => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button 
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className="text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? '#4f46e5' : 'white',
                          color: isSelected ? 'white' : '#475569',
                          border: isSelected ? '1px solid #4338ca' : '1px solid #e2e8f0',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mb-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2" style={{ color: '#4f46e5' }}>Additional Context (Optional)</label>
                <textarea 
                  className="w-full p-4 rounded-2xl border text-sm outline-none transition-colors resize-none h-24 shadow-sm font-medium"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(226, 232, 240, 0.8)' }}
                  placeholder="e.g. Needs high availability due to short timeline..."
                />
              </div>
            </div>
            
            <button 
              className="w-full shadow-lg rounded-2xl py-4 font-black text-sm hover:-translate-y-1 transition-transform mt-4 z-10 flex items-center justify-center gap-2 relative overflow-hidden group border-none text-white cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}
              onClick={handleGenerate} 
              disabled={isGenerating}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating Teams...
                </>
              ) : (
                <>
                  <Wand2 size={18} /> Generate Candidate Teams
                </>
              )}
            </button>
          </Card>
        </div>

        {/* Right Column: AI Suggestions */}
        <div className="col-span-2 flex flex-col gap-6">
          
          {!teamGenerated && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center relative rounded-3xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
              {/* Decorative backgrounds */}
              <div className="absolute top-0 left-0 w-full h-1/2" style={{ background: 'linear-gradient(180deg, rgba(79, 70, 229, 0.03) 0%, transparent 100%)' }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-60 pointer-events-none" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}></div>
              
              <div className="relative z-10 flex flex-col items-center text-center px-10">
                
                {/* Huge Icon */}
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl mb-8 relative border-4 border-white" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
                  <div className="absolute inset-0 rounded-3xl border border-indigo-300 animate-ping opacity-30"></div>
                  <Users size={40} className="text-white" />
                </div>
                
                <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-4 drop-shadow-sm">AI Team Assembler</h3>
                <p className="text-sm font-semibold max-w-lg mx-auto mb-10 leading-relaxed" style={{ color: '#64748b' }}>
                  Define your headcount and required skills on the left. Our constraint-satisfaction AI will analyze the entire workforce's skills, availability, and collaboration graph to propose the most successful team compositions.
                </p>
                
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-2xl shadow-sm border hover:-translate-y-1 transition-transform cursor-pointer" style={{ backgroundColor: 'white', color: '#475569', borderColor: '#e2e8f0' }}>
                    <div className="p-1 rounded-md" style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}><Search size={14}/></div>
                    Skill Optimization
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-2xl shadow-sm border hover:-translate-y-1 transition-transform cursor-pointer" style={{ backgroundColor: 'white', color: '#475569', borderColor: '#e2e8f0' }}>
                    <div className="p-1 rounded-md" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}><HeartHandshake size={14}/></div>
                    Compatibility Score
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-2xl shadow-sm border hover:-translate-y-1 transition-transform cursor-pointer" style={{ backgroundColor: 'white', color: '#475569', borderColor: '#e2e8f0' }}>
                    <div className="p-1 rounded-md" style={{ backgroundColor: '#dcfce7', color: '#10b981' }}><ShieldCheck size={14}/></div>
                    Success Prediction
                  </div>
                </div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-900 border border-slate-200 bg-white/50 rounded-3xl shadow-sm relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)', backdropFilter: 'blur(10px)' }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-60" style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(59,130,246,0.2) 100%)' }}></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-sm"></div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Running Combinatorial Optimization</h3>
                <p className="animate-pulse font-bold text-slate-500">Evaluating collaboration graphs and scoring success probabilities...</p>
              </div>
            </div>
          )}

          {teamGenerated && (
            <div className="flex flex-col gap-6 pb-8 animate-fade-in">
              <div className="flex items-center justify-between rounded-3xl shadow-md border" style={{ padding: '20px 24px', background: 'linear-gradient(90deg, rgba(238, 242, 255, 0.8) 0%, rgba(224, 242, 254, 0.8) 100%)', borderColor: 'rgba(199, 210, 254, 0.5)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}><Wand2 size={24}/></div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight" style={{ color: '#1e293b' }}>Candidate Teams Generated</h3>
                    <p className="text-[13px] font-bold mt-0.5" style={{ color: '#64748b' }}>Found 2 highly viable options based on your requirements.</p>
                  </div>
                </div>
              </div>

              {[mockOptionA, mockOptionB].map((option) => {
                const isConfirmed = confirmedTeam === option.id;
                const isAnotherConfirmed = confirmedTeam !== null && confirmedTeam !== option.id;
                
                if (isAnotherConfirmed) return null;

                return (
                  <Card key={option.id} className="flex flex-col shadow-xl rounded-3xl overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group" style={{ border: isConfirmed ? '2px solid #10b981' : '1px solid rgba(226, 232, 240, 0.8)', backgroundColor: isConfirmed ? 'rgba(236, 253, 244, 0.8)' : 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)' }}>
                    {isConfirmed && (
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl opacity-50 z-0"></div>
                    )}
                    
                    {/* Header */}
                    <div className="flex justify-between items-start z-10" style={{ padding: '24px 28px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', backgroundColor: isConfirmed ? 'transparent' : 'rgba(248, 250, 252, 0.8)' }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{option.name}</h3>
                          {isConfirmed && <span className="text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wide" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}><Check size={14}/> Confirmed</span>}
                        </div>
                        <p className="text-sm font-semibold flex items-center gap-2 mt-2" style={{ color: '#64748b' }}>
                          <GitMerge size={16} style={{ color: '#94a3b8' }}/> {option.rationale}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-extrabold tracking-widest mb-1" style={{ color: '#64748b' }}>Predicted Success</span>
                        <div className="flex items-center gap-2">
                          <span className="text-4xl font-black tracking-tighter" style={{ color: option.successRate > 90 ? '#10b981' : '#1e293b' }}>{option.successRate}%</span>
                          <ShieldCheck size={32} style={{ color: option.successRate > 90 ? '#34d399' : '#94a3b8' }} />
                        </div>
                      </div>
                    </div>

                    {/* New Metric Row */}
                    <div className="grid grid-cols-3 gap-6 bg-white z-10" style={{ padding: '20px 28px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9', border: '1px solid #bae6fd' }}>
                          <Target size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-extrabold tracking-widest mb-0.5" style={{ color: '#94a3b8' }}>Skill Balance</p>
                          <p className="text-sm font-black" style={{ color: '#1e293b' }}>{option.skillBalance}% Coverage</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pl-6" style={{ borderLeft: '1px solid rgba(226, 232, 240, 0.8)' }}>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                          <HeartHandshake size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-extrabold tracking-widest mb-0.5" style={{ color: '#94a3b8' }}>Compatibility</p>
                          <p className="text-sm font-black" style={{ color: '#1e293b' }}>{option.compatibilityScore}/100 Index</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pl-6" style={{ borderLeft: '1px solid rgba(226, 232, 240, 0.8)' }}>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                          <Activity size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-extrabold tracking-widest mb-0.5" style={{ color: '#94a3b8' }}>Est. Performance</p>
                          <p className="text-sm font-black" style={{ color: '#1e293b' }}>{option.performancePrediction} Velocity</p>
                        </div>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="z-10" style={{ padding: '28px', backgroundColor: isConfirmed ? 'transparent' : 'rgba(248, 250, 252, 0.5)' }}>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-widest mb-5" style={{ color: '#64748b' }}>Proposed Members</h4>
                      <div className="grid grid-cols-2 gap-5">
                        {option.members.map(member => (
                          <div key={member.id} className="flex items-start gap-4 p-5 rounded-2xl border transition-all group shadow-sm bg-white hover:shadow-md cursor-pointer" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-black shrink-0 border" style={{ backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0', fontSize: '15px' }}>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1.5">
                                <h5 className="font-black text-sm truncate transition-colors" style={{ color: '#1e293b' }}>{member.name}</h5>
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 border shadow-sm" style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                                  {member.match}% Match
                                </span>
                              </div>
                              <p className="text-xs font-bold mb-3 truncate" style={{ color: '#64748b' }}>{member.role}</p>
                              <div className="flex flex-wrap gap-2">
                                {member.skills.map(skill => (
                                  <span key={skill} className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border shadow-sm" style={{ 
                                    backgroundColor: selectedSkills.includes(skill) ? '#eef2ff' : '#f8fafc', 
                                    color: selectedSkills.includes(skill) ? '#4338ca' : '#64748b', 
                                    borderColor: selectedSkills.includes(skill) ? '#c7d2fe' : '#e2e8f0' 
                                  }}>
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    {!isConfirmed && (
                      <div className="flex justify-end z-10" style={{ padding: '20px 28px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                        <button onClick={() => handleConfirm(option.id)} className="shadow-lg hover:shadow-xl rounded-2xl font-black text-sm flex items-center gap-2 px-8 py-4 text-white hover:-translate-y-1 transition-all duration-300 border-none cursor-pointer" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                          <CheckCircle2 size={20}/> Confirm & Assemble Team
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
