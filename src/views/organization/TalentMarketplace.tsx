import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { Briefcase, BrainCircuit, Users, Target, CheckCircle2, Plus, Sparkles, Network, X } from 'lucide-react';
import { mockGigs, mockMentors } from '../../dummy/organization/talentMarketplaceData';

export const TalentMarketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gigs' | 'mentoring'>('gigs');
  const [showPostModal, setShowPostModal] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState({ title: '', type: 'gig', description: '', timeCommitment: '' });

  return (
    <div className="flex flex-col gap-6 relative pb-8 animate-fade-in z-0">
      {/* Background ambient glows */}
      <div className="absolute top-0 -left-32 w-[500px] h-[500px] rounded-full blur-[100px] -z-10 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0) 70%)' }}></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(255,255,255,0) 70%)' }}></div>

      {/* Header */}
      <div className="flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-950 via-slate-800 to-slate-600 tracking-tighter drop-shadow-sm">AI Talent Marketplace</h1>
          <p className="text-sm text-slate-500 font-bold mt-1 bg-white/60 backdrop-blur-md inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm" style={{ border: '1px solid rgba(255,255,255,0.8)' }}>
            <Sparkles size={14} className="text-indigo-500" /> Organization Digital Twin • Internal mobility, gig assignments, and mentoring.
          </p>
        </div>
        <button onClick={() => setShowPostModal(true)} className="shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 rounded-full font-black text-sm flex items-center gap-3 px-10 py-4 text-white hover:-translate-y-1 transition-all duration-300 border-none cursor-pointer whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
          <Plus size={20} /> Post Opportunity
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-8 mt-2 relative z-10">

        {/* Left Column: Recommendations */}
        <div className="col-span-2 flex flex-col gap-6">
          <Card className="flex flex-col gap-0 p-0 overflow-hidden shadow-2xl rounded-[32px] relative transition-all duration-500" style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>

            {/* Tabs */}
            <div className="px-8 py-6 border-b z-10 relative flex justify-start overflow-x-auto" style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: 'rgba(248, 250, 252, 0.4)' }}>
              <div className="flex flex-row flex-nowrap items-center gap-2 p-1.5 rounded-2xl relative w-max" style={{ backgroundColor: 'rgba(226, 232, 240, 0.5)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)' }}>
                <button
                  onClick={() => setActiveTab('gigs')}
                  className="text-[13px] font-black transition-all duration-300 px-8 py-3 flex flex-row items-center gap-2 rounded-xl border-none cursor-pointer relative overflow-hidden whitespace-nowrap shrink-0"
                  style={{
                    backgroundColor: activeTab === 'gigs' ? 'white' : 'transparent',
                    color: activeTab === 'gigs' ? '#4f46e5' : '#64748b',
                    boxShadow: activeTab === 'gigs' ? '0 4px 12px -2px rgba(79, 70, 229, 0.1)' : 'none',
                  }}
                >
                  {activeTab === 'gigs' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 opacity-50"></div>}
                  <Briefcase size={18} className="relative z-10 shrink-0" style={{ color: activeTab === 'gigs' ? '#4f46e5' : '#94a3b8' }} />
                  <span className="relative z-10 leading-none mt-0.5">Internal Gigs & Projects</span>
                </button>
                <button
                  onClick={() => setActiveTab('mentoring')}
                  className="text-[13px] font-black transition-all duration-300 px-8 py-3 flex flex-row items-center gap-2 rounded-xl border-none cursor-pointer relative overflow-hidden whitespace-nowrap shrink-0"
                  style={{
                    backgroundColor: activeTab === 'mentoring' ? 'white' : 'transparent',
                    color: activeTab === 'mentoring' ? '#4f46e5' : '#64748b',
                    boxShadow: activeTab === 'mentoring' ? '0 4px 12px -2px rgba(79, 70, 229, 0.1)' : 'none',
                  }}
                >
                  {activeTab === 'mentoring' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 opacity-50"></div>}
                  <Users size={18} className="relative z-10 shrink-0" style={{ color: activeTab === 'mentoring' ? '#4f46e5' : '#94a3b8' }} />
                  <span className="relative z-10 leading-none mt-0.5">Mentoring Matches</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-6 z-10" style={{ padding: '32px', backgroundColor: 'transparent' }}>
              {activeTab === 'gigs' && (
                <>
                  {mockGigs.map((gig) => (
                    <div key={gig.id} className="flex gap-6 transition-all shadow-md hover:shadow-2xl rounded-3xl group bg-white/90 hover:bg-white hover:-translate-y-1.5 cursor-pointer" style={{ padding: '28px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-500" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)' }}>
                        {gig.icon === 'Target' && <Target size={28} />}
                        {gig.icon === 'Briefcase' && <Briefcase size={28} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-black text-xl tracking-tight transition-colors group-hover:text-indigo-600" style={{ color: '#0f172a' }}>{gig.title}</h3>
                            <p className="text-[13px] font-bold mt-1 uppercase tracking-widest" style={{ color: '#64748b' }}>{gig.timeCommitment}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl shadow-md tracking-wide" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
                              <BrainCircuit size={16} /> {gig.aiMatch}% AI Match
                            </span>
                          </div>
                        </div>
                        <p className="text-[15px] mt-4 mb-6 leading-relaxed font-semibold max-w-2xl" style={{ color: '#334155' }}>
                          {gig.description}
                        </p>
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                          <div className="flex flex-wrap gap-2.5">
                            {gig.tags.map((tag, idx) => (
                              <span key={idx} className="text-[11px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest" style={{
                                backgroundColor: idx === 0 ? '#eef2ff' : '#f8fafc',
                                color: idx === 0 ? '#4f46e5' : '#475569',
                                border: `1px solid ${idx === 0 ? '#c7d2fe' : '#e2e8f0'}`
                              }}>{tag.text}</span>
                            ))}
                          </div>
                          <button className="shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 rounded-full font-black text-sm px-8 py-3.5 text-white hover:scale-105 transition-all duration-300 border-none cursor-pointer whitespace-nowrap shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
                            Review & Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === 'mentoring' && (
                <>
                  {mockMentors.map((mentor) => (
                    <div key={mentor.id} className="flex gap-6 transition-all shadow-md hover:shadow-2xl rounded-3xl group bg-white/90 hover:bg-white hover:-translate-y-1.5 cursor-pointer" style={{ padding: '28px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white shrink-0 shadow-xl font-black text-2xl group-hover:scale-110 transition-transform duration-500" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}>
                        {mentor.initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-black text-xl tracking-tight transition-colors group-hover:text-amber-600" style={{ color: '#0f172a' }}>{mentor.name}</h3>
                            <p className="text-[13px] font-bold mt-1 uppercase tracking-widest" style={{ color: '#64748b' }}>{mentor.role}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl shadow-md tracking-wide" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none' }}>
                              <Network size={16} /> {mentor.matchScore}% Complementary
                            </span>
                          </div>
                        </div>
                        <p className="text-[15px] mt-4 mb-6 leading-relaxed font-semibold max-w-2xl" style={{ color: '#334155' }}>
                          {mentor.description}
                        </p>
                        <div className="flex justify-end mt-6 pt-6 border-t border-slate-100">
                          <button className="shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 rounded-full font-black text-sm px-8 py-3.5 text-white hover:scale-105 transition-all duration-300 border-none cursor-pointer whitespace-nowrap shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}>
                            Request Mentorship
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

            </div>
          </Card>
        </div>

        {/* Right Column: AI Explainer & Activity */}
        <div className="col-span-1 flex flex-col gap-8">

          <Card className="p-8 flex flex-col gap-6 relative overflow-hidden shadow-xl rounded-[32px] border border-slate-200 bg-white group">
            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 bg-blue-300"></div>
            <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 bg-emerald-300"></div>

            <div className="flex items-center gap-5 z-10 border-b border-slate-100 pb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white relative bg-gradient-to-br from-blue-500 to-indigo-600">
                <Sparkles size={28} className="relative z-10" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">How We Match You</h3>
                <p className="text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest mt-1">Under the hood AI</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2 z-10">
              <div className="p-5 rounded-2xl shadow-sm border border-slate-100 bg-slate-50/50 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-md hover:border-slate-200">
                <h4 className="text-sm font-black text-slate-800 mb-2.5 tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div> Hybrid Recommender
                </h4>
                <p className="text-[13px] font-medium leading-relaxed text-slate-600">
                  We look at your current skills (content-based) AND the historical success of employees who made similar moves.
                </p>
              </div>

              <div className="p-5 rounded-2xl shadow-sm border border-slate-100 bg-slate-50/50 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-md hover:border-slate-200">
                <h4 className="text-sm font-black text-slate-800 mb-2.5 tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> Vector Similarity
                </h4>
                <p className="text-[13px] font-medium leading-relaxed text-slate-600">
                  For mentoring, our ML model maps you and prospective mentors into a vector space, searching for complementary profiles.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 flex flex-col gap-6 shadow-2xl rounded-[32px] transition-all duration-300 relative overflow-hidden border-none" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <h3 className="font-extrabold text-[12px] uppercase tracking-widest flex items-center gap-3 relative z-10" style={{ color: '#475569' }}>
              <div className="w-7 h-7 rounded-full shadow-sm flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                <CheckCircle2 size={16} />
              </div>
              <span className="mt-0.5">Your Applications</span>
            </h3>

            <div className="flex flex-col gap-3 relative z-10 mt-2">
              <div className="flex items-center justify-between p-5 rounded-2xl shadow-md border hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group" style={{ backgroundColor: 'white', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                <div className="flex-1 pr-4">
                  <h4 className="text-[14px] font-black tracking-tight group-hover:text-emerald-600 transition-colors truncate" style={{ color: '#1e293b' }}>Cloud Migration Tiger Team</h4>
                  <p className="text-[11px] font-extrabold mt-1.5 uppercase tracking-wider" style={{ color: '#94a3b8' }}>Applied 2 days ago</p>
                </div>
                <span className="shrink-0 inline-flex items-center text-[10px] font-black px-3.5 py-1.5 rounded-full shadow-sm uppercase tracking-widest" style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>Under Review</span>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Post Opportunity Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
          <div className="backdrop-blur-xl rounded-[2rem] p-8 w-[calc(100%-2rem)] max-w-[600px] border animate-in zoom-in-95 duration-300 ease-out relative overflow-hidden shadow-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 0.8)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(79, 70, 229, 0.15)', transform: 'translate(30%, -30%)' }}></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm border" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', color: '#4f46e5', borderColor: 'rgba(79, 70, 229, 0.2)' }}>
                  <Briefcase size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Post Opportunity</h2>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#64748b' }}>Create a new gig or mentorship opening.</p>
                </div>
              </div>
              <button onClick={() => setShowPostModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-none cursor-pointer hover:rotate-90 bg-slate-100 hover:bg-slate-200" style={{ color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowPostModal(false); }} className="relative z-10 flex flex-col gap-4">
              
              <div 
                className="relative rounded-[2rem] p-2 transition-all duration-300 shadow-inner flex gap-2 mb-2" 
                style={{ backgroundColor: 'rgba(241, 245, 249, 0.7)', border: '1px solid rgba(226, 232, 240, 0.6)' }}
              >
                <button 
                  type="button" 
                  onClick={() => setNewOpportunity({...newOpportunity, type: 'gig'})} 
                  className={`flex-1 py-3.5 px-4 rounded-3xl font-black text-[13px] transition-all duration-300 cursor-pointer ${newOpportunity.type === 'gig' ? 'shadow-md scale-[1.02]' : 'hover:bg-slate-200/50'}`} 
                  style={newOpportunity.type === 'gig' ? { background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: 'white', border: 'none' } : { backgroundColor: 'transparent', color: '#64748b', border: 'none' }}
                >
                  Internal Gig
                </button>
                <button 
                  type="button" 
                  onClick={() => setNewOpportunity({...newOpportunity, type: 'mentoring'})} 
                  className={`flex-1 py-3.5 px-4 rounded-3xl font-black text-[13px] transition-all duration-300 cursor-pointer ${newOpportunity.type === 'mentoring' ? 'shadow-md scale-[1.02]' : 'hover:bg-slate-200/50'}`} 
                  style={newOpportunity.type === 'mentoring' ? { background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: 'white', border: 'none' } : { backgroundColor: 'transparent', color: '#64748b', border: 'none' }}
                >
                  Mentorship
                </button>
              </div>

              <div 
                className="relative border rounded-3xl px-6 py-4 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-text group hover:border-indigo-200" 
                style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                onClick={(e) => (e.currentTarget.querySelector('input') as HTMLElement)?.focus()}
              >
                <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 cursor-text transition-colors group-focus-within:text-indigo-600" style={{ color: '#475569' }}>Opportunity Title</label>
                <input
                  type="text" required value={newOpportunity.title} onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                  className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight placeholder-slate-400"
                  style={{ color: '#0f172a' }}
                  placeholder="e.g. Senior Frontend Architecture Reviewer"
                />
              </div>

              <div 
                className="relative border rounded-3xl px-6 py-4 transition-all duration-300 shadow-sm flex flex-col justify-center cursor-text group hover:border-indigo-200" 
                style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                onClick={(e) => (e.currentTarget.querySelector('input') as HTMLElement)?.focus()}
              >
                <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 cursor-text transition-colors group-focus-within:text-indigo-600" style={{ color: '#475569' }}>Time Commitment</label>
                <input
                  type="text" required value={newOpportunity.timeCommitment} onChange={(e) => setNewOpportunity({ ...newOpportunity, timeCommitment: e.target.value })}
                  className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-tight placeholder-slate-400"
                  style={{ color: '#0f172a' }}
                  placeholder="e.g. 5 HRS/WEEK"
                />
              </div>
              
              <div 
                className="relative border rounded-3xl px-6 py-5 transition-all duration-300 shadow-sm flex flex-col cursor-text group hover:border-indigo-200" 
                style={{ borderColor: 'rgba(226, 232, 240, 0.8)', backgroundColor: '#f8fafc' }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                onClick={(e) => (e.currentTarget.querySelector('textarea') as HTMLElement)?.focus()}
              >
                <label className="block text-[11px] font-black uppercase tracking-widest mb-2 cursor-text transition-colors group-focus-within:text-indigo-600" style={{ color: '#475569' }}>Description</label>
                <textarea
                  required value={newOpportunity.description} onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                  className="w-full bg-transparent outline-none font-bold text-[15px] p-0 m-0 leading-relaxed placeholder-slate-400 resize-none h-24"
                  style={{ color: '#0f172a' }}
                  placeholder="Describe the opportunity and what you're looking for..."
                />
              </div>

              <div className="mt-4 flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setShowPostModal(false)} className="px-8 py-3 rounded-full font-bold text-[13px] cursor-pointer transition-all duration-300 shadow-sm border hover:shadow-md hover:bg-slate-50" style={{ backgroundColor: '#ffffff', color: '#475569', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={!newOpportunity.title} className="px-10 py-3 rounded-full font-black text-[13px] text-white border-none cursor-pointer transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', boxShadow: '0 8px 20px -5px rgba(79, 70, 229, 0.4)' }}>
                  Post {newOpportunity.type === 'gig' ? 'Gig' : 'Mentorship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
