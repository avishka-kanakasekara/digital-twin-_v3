import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Briefcase, BrainCircuit, Users, Target, CheckCircle2, Plus, Sparkles, Network, X } from 'lucide-react';
import api from '../../lib/api';

export const TalentMarketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gigs' | 'mentoring'>('gigs');
  const [showPostModal, setShowPostModal] = useState(false);

  // App state
  const [newOpportunity, setNewOpportunity] = useState({ title: '', type: 'gig', department: 'General', urgency: 'Normal', required_skills: '', description: '', timeCommitment: '' });
  const [gigs, setGigs] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [selectedGigForMatch, setSelectedGigForMatch] = useState<any | null>(null);
  const [showTopMatchOnly, setShowTopMatchOnly] = useState(false);
  const [invitedCandidates, setInvitedCandidates] = useState<string[]>([]);

  const fetchApplications = () => {
    api.organization.getApplications().then(setApplications).catch(console.error);
  };

  const fetchGigs = () => {
    api.organization.getGigs().then(data => {
      const filteredData = data.filter((d: any) => d.role_title !== 'ML Model Reviewer');
      setGigs(filteredData.map((d: any) => ({
        id: d.id,
        title: d.role_title,
        department: d.department || 'General',
        timeCommitment: d.urgency === 'High' ? '10 HRS/WEEK' : '5 HRS/WEEK',
        description: `${d.department || 'General'} department opportunity. Skills needed: ${(d.required_skills || []).join(', ')}.`,
        tags: (d.required_skills || []).map((s: string) => ({ text: s })),
        icon: d.urgency === 'High' ? 'Target' : 'Briefcase',
        aiMatch: d.matched_employees?.[0]?.match_score ?? d.matched_employees?.[0]?.match ?? 85,
        urgency: d.urgency,
        matched_employees: d.matched_employees || [],
        required_skills: d.required_skills || [],
      })));
    }).catch(console.error);
  };

  useEffect(() => {
    fetchGigs();
    api.organization.getMentors().then(data => {
      setMentors(data.map((d: any) => ({
        id: d.id,
        initials: d.initials,
        name: d.name,
        role: d.role,
        description: d.description,
        matchScore: d.match_score,
      })));
    }).catch(console.error);
    fetchApplications();
  }, []);

  const hasApplied = (id: string) => applications.some(a => a.opportunity_id === id);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedApp) return;
    try {
      await api.organization.updateApplicationStatus(selectedApp.id, status);
      fetchApplications();
      setSelectedApp(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async (gig: any) => {
    if (hasApplied(gig.id)) return;
    setApplyingId(gig.id);
    try {
      await api.organization.submitApplication({ opportunity_id: gig.id, opportunity_type: 'gig', opportunity_title: gig.title });
      fetchApplications();
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingId(null);
    }
  };

  const handleRequestMentorship = async (mentor: any) => {
    if (hasApplied(mentor.id)) return;
    setApplyingId(mentor.id);
    try {
      await api.organization.submitApplication({ opportunity_id: mentor.id, opportunity_type: 'mentoring', opportunity_title: mentor.name });
      fetchApplications();
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingId(null);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillsList = newOpportunity.required_skills ? newOpportunity.required_skills.split(',').map(s => s.trim()).filter(Boolean) : ['General'];
      if (newOpportunity.type === 'gig') {
        await fetch('http://localhost:8000/api/organization/talent/gigs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_title: newOpportunity.title, department: newOpportunity.department, required_skills: skillsList, matched_employees: [], urgency: newOpportunity.urgency }),
        });
        await api.organization.submitApplication({ opportunity_id: 'new', opportunity_type: 'gig', opportunity_title: newOpportunity.title });
        fetchGigs();
      } else if (newOpportunity.type === 'mentoring') {
        const initials = newOpportunity.title.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'M';
        const randomScore = Math.floor(Math.random() * 20) + 75; // 75 to 94
        
        await fetch('http://localhost:8000/api/organization/talent/mentors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: newOpportunity.title, 
            role: newOpportunity.department, 
            description: newOpportunity.description,
            match_score: randomScore,
            initials: initials,
            icon_bg: 'bg-orange-500'
          }),
        });
        
        // Refetch mentors
        api.organization.getMentors().then(data => {
          setMentors(data.map((d: any) => ({
            id: d.id,
            initials: d.initials,
            name: d.name,
            role: d.role,
            description: d.description,
            matchScore: d.match_score,
          })));
        }).catch(console.error);
      }
      
      setShowPostModal(false);
      setNewOpportunity({ title: '', type: 'gig', department: 'General', urgency: 'Normal', required_skills: '', description: '', timeCommitment: '' });
      fetchApplications();
    } catch (e) {
      console.error(e);
    }
  };

  const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
    'Under Review': { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    'Accepted': { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    'Rejected': { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

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
                  {gigs.map((gig) => (
                    <div key={gig.id} className="flex gap-6 transition-all shadow-md hover:shadow-2xl rounded-3xl group bg-white/90 hover:bg-white hover:-translate-y-1.5 cursor-pointer" style={{ padding: '28px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-500" style={{ background: gig.urgency === 'High' ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)' }}>
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
                            <button onClick={(e) => { e.stopPropagation(); setShowTopMatchOnly(true); setSelectedGigForMatch(gig); }} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl shadow-md hover:shadow-lg tracking-wide hover:scale-105 transition-all cursor-pointer" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
                              <BrainCircuit size={16} /> {gig.aiMatch}% AI Match
                            </button>
                          </div>
                        </div>
                        <p className="text-[15px] mt-4 mb-6 leading-relaxed font-semibold max-w-2xl" style={{ color: '#334155' }}>
                          {gig.description}
                        </p>
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                          <div className="flex flex-wrap gap-2.5">
                            {gig.tags.map((tag: any, idx: number) => (
                              <span key={idx} className="text-[11px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest" style={{
                                backgroundColor: idx === 0 ? '#eef2ff' : '#f8fafc',
                                color: idx === 0 ? '#4f46e5' : '#475569',
                                border: `1px solid ${idx === 0 ? '#c7d2fe' : '#e2e8f0'}`
                              }}>{tag.text}</span>
                            ))}
                          </div>
                          <button
                            onClick={() => { setShowTopMatchOnly(false); setSelectedGigForMatch(gig); }}
                            className="shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 rounded-full font-black text-sm px-8 py-3.5 text-white hover:scale-105 transition-all duration-300 border-none cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
                            <Sparkles size={16} /> View AI Matches
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === 'mentoring' && (
                <div className="flex flex-col gap-6">
                  {mentors.map((mentor) => (
                    <div key={mentor.id} className="flex gap-6 transition-all shadow-sm hover:shadow-md rounded-[32px] group bg-white cursor-pointer border border-slate-200" style={{ padding: '24px' }}>
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white shrink-0 font-bold text-xl bg-orange-500 shadow-lg shadow-orange-500/30">
                        {mentor.initials}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        {/* Top row */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-[17px] tracking-tight text-slate-800">{mentor.name}</h3>
                            <p className="text-[11px] font-bold mt-1 uppercase tracking-widest text-slate-500">{mentor.role}</p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-orange-500 text-white border-none">
                              <Network size={14} /> {mentor.matchScore}% Complementary
                            </span>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-[14px] mt-4 mb-4 font-semibold max-w-2xl text-slate-600">
                          {mentor.description}
                        </p>
                        
                        {/* Bottom line and Button */}
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                          <button
                            onClick={() => handleRequestMentorship(mentor)}
                            disabled={hasApplied(mentor.id) || applyingId === mentor.id}
                            className="rounded-full font-bold text-xs px-6 py-2 text-white transition-all duration-300 border-none cursor-pointer disabled:opacity-90 disabled:cursor-not-allowed shadow-md"
                            style={{ background: hasApplied(mentor.id) ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}
                          >
                            {applyingId === mentor.id ? 'Sending...' : hasApplied(mentor.id) ? 'Request Sent' : 'Request Mentorship'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                <h3 className="font-black text-slate-900 text-xl tracking-tight">How AI Matches Talent</h3>
                <p className="text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest mt-1">Under the hood AI</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2 z-10">
              <div className="p-5 rounded-2xl shadow-sm border border-slate-100 bg-slate-50/50 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-md hover:border-slate-200">
                <h4 className="text-sm font-black text-slate-800 mb-2.5 tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div> Hybrid Recommender
                </h4>
                <p className="text-[13px] font-medium leading-relaxed text-slate-600">
                  We look at current employee skills (content-based) AND the historical success of employees who made similar moves.
                </p>
              </div>

              <div className="p-5 rounded-2xl shadow-sm border border-slate-100 bg-slate-50/50 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-md hover:border-slate-200">
                <h4 className="text-sm font-black text-slate-800 mb-2.5 tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> Vector Similarity
                </h4>
                <p className="text-[13px] font-medium leading-relaxed text-slate-600">
                  For mentoring, our ML model maps employees and prospective mentors into a vector space, searching for complementary profiles.
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
              <span className="mt-0.5">Incoming Applications</span>
            </h3>

            <div className="flex flex-col gap-3 relative z-10 mt-2">
              {applications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm font-medium">No applications yet.</div>
              ) : (
                applications.slice(0, 5).map(app => {
                  const s = statusStyle[app.status] || statusStyle['Under Review'];
                  return (
                    <div key={app.id} onClick={() => setSelectedApp(app)} className="flex items-center justify-between p-5 rounded-2xl shadow-md border hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group" style={{ backgroundColor: 'white', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                      <div className="flex-1 pr-4">
                        <h4 className="text-[14px] font-black tracking-tight group-hover:text-emerald-600 transition-colors truncate" style={{ color: '#1e293b' }}>{app.opportunity_title}</h4>
                        <p className="text-[11px] font-extrabold mt-1.5 uppercase tracking-wider" style={{ color: '#94a3b8' }}>{relativeTime(app.created_at)} • {app.opportunity_type === 'gig' ? 'Gig' : 'Mentoring'}</p>
                      </div>
                      <span className="shrink-0 inline-flex items-center text-[10px] font-black px-3.5 py-1.5 rounded-full shadow-sm uppercase tracking-widest" style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{app.status}</span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* Post Opportunity Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 animate-in fade-in duration-300 backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
          <div className="backdrop-blur-xl rounded-[2rem] p-6 w-[calc(100%-2rem)] max-w-[600px] max-h-[85vh] overflow-y-auto border animate-in zoom-in-95 duration-300 ease-out relative shadow-2xl custom-scrollbar" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 0.8)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(79, 70, 229, 0.15)', transform: 'translate(30%, -30%)' }}></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center shadow-sm border" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', color: '#4f46e5', borderColor: 'rgba(79, 70, 229, 0.2)' }}>
                  <Briefcase size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Post Opportunity</h2>
                  <p className="text-[13px] font-semibold mt-0.5" style={{ color: '#64748b' }}>Create a new gig or mentorship opening.</p>
                </div>
              </div>
              <button onClick={() => setShowPostModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-none cursor-pointer hover:rotate-90 bg-slate-100 hover:bg-slate-200" style={{ color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePost} className="relative z-10 flex flex-col gap-4">

              <div
                className="relative rounded-[2rem] p-2 transition-all duration-300 shadow-inner flex gap-2 mb-2"
                style={{ backgroundColor: 'rgba(241, 245, 249, 0.7)', border: '1px solid rgba(226, 232, 240, 0.6)' }}
              >
                <button
                  type="button"
                  onClick={() => setNewOpportunity({ ...newOpportunity, type: 'gig' })}
                  className={`flex-1 py-3.5 px-4 rounded-3xl font-black text-[13px] transition-all duration-300 cursor-pointer ${newOpportunity.type === 'gig' ? 'shadow-md scale-[1.02]' : 'hover:bg-slate-200/50'}`}
                  style={newOpportunity.type === 'gig' ? { background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: 'white', border: 'none' } : { backgroundColor: 'transparent', color: '#64748b', border: 'none' }}
                >
                  Internal Gig
                </button>
                <button
                  type="button"
                  onClick={() => setNewOpportunity({ ...newOpportunity, type: 'mentoring' })}
                  className={`flex-1 py-3.5 px-4 rounded-3xl font-black text-[13px] transition-all duration-300 cursor-pointer ${newOpportunity.type === 'mentoring' ? 'shadow-md scale-[1.02]' : 'hover:bg-slate-200/50'}`}
                  style={newOpportunity.type === 'mentoring' ? { background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: 'white', border: 'none' } : { backgroundColor: 'transparent', color: '#64748b', border: 'none' }}
                >
                  Mentorship
                </button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Opportunity Title <span className="text-red-400">*</span></label>
                  <input
                    type="text" required value={newOpportunity.title} onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none font-semibold text-slate-800 text-[14px] focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                    placeholder="e.g. Code Reviewer"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Department</label>
                  <input
                    type="text" required value={newOpportunity.department} onChange={(e) => setNewOpportunity({ ...newOpportunity, department: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none font-semibold text-slate-800 text-[14px] focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                    placeholder="e.g. Engineering"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Required Skills (comma separated) <span className="text-red-400">*</span></label>
                <input
                  type="text" required value={newOpportunity.required_skills} onChange={(e) => setNewOpportunity({ ...newOpportunity, required_skills: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none font-semibold text-slate-800 text-[14px] focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  placeholder="e.g. React, Python"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Time Commitment <span className="text-red-400">*</span></label>
                <input
                  type="text" required value={newOpportunity.timeCommitment} onChange={(e) => setNewOpportunity({ ...newOpportunity, timeCommitment: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none font-semibold text-slate-800 text-[14px] focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  placeholder="e.g. 5 HRS/WEEK"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Description <span className="text-red-400">*</span></label>
                <textarea
                  required value={newOpportunity.description} onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none font-semibold text-slate-800 text-[14px] focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm resize-none h-24"
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

      {/* Review Application Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 animate-in fade-in duration-300 backdrop-blur-md" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="backdrop-blur-2xl rounded-[32px] w-full max-w-[480px] border relative shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 0.8)' }}>

            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[64px] opacity-60 pointer-events-none transition-colors duration-500" style={{ backgroundColor: selectedApp.status === 'Under Review' ? 'rgba(79, 70, 229, 0.2)' : (selectedApp.status === 'Accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)') }}></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[64px] opacity-60 pointer-events-none" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}></div>

            {/* Foolproof Inner Padding Container */}
            <div style={{ padding: '44px' }} className="relative z-10 w-full h-full flex flex-col">

              <div className="flex justify-between items-center mb-14">
                <div className="flex gap-5 items-center">
                  <div className="w-14 h-14 rounded-[1.25rem] shadow-lg flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' }}>
                    <Briefcase size={26} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h2 className="text-2xl font-black tracking-tight leading-tight" style={{ color: '#0f172a' }}>Review Application</h2>
                    <p className="text-[13px] font-extrabold mt-1.5 uppercase tracking-widest leading-none" style={{ color: '#64748b' }}>Manage Status</p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer bg-slate-100 border border-slate-200 hover:border-slate-300">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="flex flex-col gap-5 mb-8" style={{ marginTop: '24px' }}>
                <div className="px-6 py-6 rounded-[24px] shadow-sm border transition-all flex flex-col justify-center bg-white/80" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                  <div className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2.5 flex items-center gap-2">
                    <Target size={16} strokeWidth={2.5} /> Opportunity
                  </div>
                  <div className="text-[17px] font-black text-slate-800 leading-snug">{selectedApp.opportunity_title}</div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="px-6 py-6 rounded-[24px] shadow-sm border flex flex-col justify-center bg-white/80" style={{ borderColor: 'rgba(226, 232, 240, 0.8)', minHeight: '100px' }}>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2.5">Type</div>
                    <div className="text-[15px] font-extrabold text-slate-700 capitalize flex items-center gap-2 leading-none">
                      {selectedApp.opportunity_type === 'gig' ? <Briefcase size={18} className="text-blue-500" strokeWidth={2.5} /> : <Users size={18} className="text-orange-500" strokeWidth={2.5} />}
                      {selectedApp.opportunity_type}
                    </div>
                  </div>
                  <div className="px-6 py-6 rounded-[24px] shadow-sm border flex flex-col justify-center bg-white/80" style={{ borderColor: 'rgba(226, 232, 240, 0.8)', minHeight: '100px' }}>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2.5">Current Status</div>
                    <div className="text-[15px] font-extrabold leading-none" style={{ color: selectedApp.status === 'Accepted' ? '#059669' : (selectedApp.status === 'Rejected' ? '#dc2626' : '#d97706') }}>
                      {selectedApp.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-auto" style={{ marginTop: '32px' }}>
                {selectedApp.status === 'Under Review' && (
                  <div className="grid grid-cols-2 gap-5">
                    <button onClick={() => handleUpdateStatus('Accepted')} className="w-full py-4 rounded-[20px] font-black text-[15px] text-white hover:-translate-y-1 transition-all flex items-center justify-center gap-2.5 group cursor-pointer border-none shadow-xl" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)' }}>
                      <CheckCircle2 size={22} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" /> Accept
                    </button>
                    <button onClick={() => handleUpdateStatus('Rejected')} className="w-full py-4 rounded-[20px] font-black text-[15px] text-white hover:-translate-y-1 transition-all flex items-center justify-center gap-2.5 group cursor-pointer border-none shadow-xl" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.5)' }}>
                      <X size={22} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Reject
                    </button>
                  </div>
                )}
                {selectedApp.status !== 'Under Review' && (
                  <button onClick={() => handleUpdateStatus('Under Review')} className="w-full py-4 rounded-[20px] font-black text-[15px] text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div> Revert to Under Review
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* AI Talent Matcher Modal */}
      {selectedGigForMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 animate-in fade-in duration-300 backdrop-blur-md" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="backdrop-blur-2xl rounded-[32px] w-full max-w-[540px] border relative shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 0.8)' }}>

            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[64px] opacity-60 pointer-events-none transition-colors duration-500 bg-indigo-500/20"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[64px] opacity-60 pointer-events-none bg-blue-500/20"></div>

            <div style={{ padding: '44px' }} className="relative z-10 w-full h-full flex flex-col">

              <div className="flex justify-between items-center mb-10">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-[1rem] shadow-lg flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
                    <BrainCircuit size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h2 className="text-xl font-black tracking-tight leading-tight text-slate-900">AI Talent Matcher</h2>
                    <p className="text-[11px] font-extrabold mt-1 uppercase tracking-widest text-indigo-500 leading-none">Find Best Fit</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedGigForMatch(null); setShowTopMatchOnly(false); }} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer bg-slate-100 border border-slate-200 hover:border-slate-300">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>


              <div className="flex flex-col gap-3">
                {(() => {
                  let allCandidates = (selectedGigForMatch.matched_employees || []).map((emp: any) => ({
                    id: emp.id || emp.employee_id,
                    name: emp.name || 'Unknown Candidate',
                    role: 'Candidate',
                    department: selectedGigForMatch.department,
                    match: emp.match || emp.match_score || 85,
                    skills: selectedGigForMatch.required_skills || []
                  }));

                  if (allCandidates.length === 0) {
                    allCandidates = [{ id: 'no-match', name: 'No candidates found', role: '-', department: '-', match: 0, skills: [] }];
                  }

                  const sortedCandidates = [...allCandidates].sort((a, b) => b.match - a.match);
                  const displayCandidates = showTopMatchOnly ? [sortedCandidates[0]] : sortedCandidates;

                  return displayCandidates.map((candidate, idx) => {
                    const isInvited = invitedCandidates.includes(candidate.id);
                    return (
                      <div key={candidate.id} className="p-4 rounded-[20px] border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group relative overflow-hidden">
                        {/* Match Score Indicator Line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{
                          background: candidate.match >= 90 ? '#10b981' : (candidate.match >= 80 ? '#3b82f6' : '#f59e0b')
                        }}></div>

                        <div className="flex justify-between items-start pl-2">
                          <div>
                            <div className="font-black text-[15px] text-slate-800">{candidate.name}</div>
                            <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{candidate.role} • {candidate.department}</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="font-black text-lg leading-none" style={{ color: candidate.match >= 90 ? '#10b981' : (candidate.match >= 80 ? '#3b82f6' : '#f59e0b') }}>
                              {candidate.match}%
                            </div>
                            <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Match</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pl-2">
                          {candidate.skills.map((skill, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="mt-2 pl-2">
                          <button
                            onClick={() => setInvitedCandidates(prev => [...prev, candidate.id])}
                            disabled={isInvited}
                            className="w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed"
                            style={{
                              background: isInvited ? '#ecfdf5' : '#f8fafc',
                              color: isInvited ? '#059669' : '#475569',
                              border: `1px solid ${isInvited ? '#a7f3d0' : '#e2e8f0'}`,
                              boxShadow: isInvited ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                          >
                            {isInvited ? <><CheckCircle2 size={14} /> Invited</> : <><Sparkles size={14} /> Invite to Apply</>}
                          </button>
                        </div>
                      </div>
                    );
                  })
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
