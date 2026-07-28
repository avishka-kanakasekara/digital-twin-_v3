import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { Lightbulb, Network, BrainCircuit, Rocket, TrendingUp, Sparkles, ChevronRight, Share2 } from 'lucide-react';
import { mockTopIdeas, mockCommunities } from '../../dummy/organization/innovationData';

export const InnovationHub: React.FC = () => {
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ impact: string, feasibility: string, similar: number } | null>(null);

  const handleScoreIdea = () => {
    if (!ideaTitle || !ideaDesc) return;
    setIsScoring(true);
    setTimeout(() => {
      setIsScoring(false);
      setScoreResult({
        impact: 'High',
        feasibility: '82%',
        similar: 2
      });
    }, 1500);
  };

  const getAuthorGradient = (bgString: string) => {
    if (bgString.includes('success')) return 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)';
    if (bgString.includes('info')) return 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)';
    return 'linear-gradient(135deg, #64748b 0%, #334155 100%)';
  };

  const getCommunityGradient = (bgString: string) => {
    if (bgString.includes('info')) return 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)';
    if (bgString.includes('primary')) return 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)';
    return 'linear-gradient(135deg, #64748b 0%, #334155 100%)';
  };

  return (
    <div className="flex flex-col gap-8 relative pb-4" style={{ paddingBottom: '3rem' }}>
      {/* Background Decorative Blur */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: -10 }}>
        <div className="absolute rounded-full" style={{ top: '-10rem', right: '-10rem', width: '24rem', height: '24rem', backgroundColor: 'rgba(147, 197, 253, 0.3)', filter: 'blur(100px)' }}></div>
        <div className="absolute rounded-full" style={{ top: '15rem', left: '-5rem', width: '20rem', height: '20rem', backgroundColor: 'rgba(110, 231, 183, 0.2)', filter: 'blur(80px)' }}></div>
      </div>

      {/* Header */}
      <div className="mt-4">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: '#0f172a' }}>Innovation & Knowledge Hub</h1>
        <p className="text-base font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-white" style={{ color: '#475569', display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)' }}>
          <Sparkles size={16} className="inline mr-2" style={{ color: '#6366f1', marginBottom: '2px' }} />
          Organization Digital Twin • Submit ideas, join communities, and track innovation pipeline using ML text embeddings.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: Submit & Predict */}
        <div className="col-span-1 flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-6 relative overflow-hidden shadow-2xl rounded-3xl transition-all duration-300" style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
            <div className="absolute rounded-full" style={{ top: '-5rem', right: '-5rem', width: '12rem', height: '12rem', backgroundColor: 'rgba(96, 165, 250, 0.15)', filter: 'blur(40px)' }}></div>
            
            <div className="flex items-center gap-4 pb-6 relative z-10" style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)', border: '1px solid white' }}>
                <Lightbulb size={24} style={{ color: scoreResult ? '#10b981' : '#2563eb' }}/>
              </div>
              <div>
                <h3 className="font-extrabold text-lg uppercase tracking-wide" style={{ color: '#0f172a' }}>Submit Idea</h3>
                <p className="text-xs font-extrabold uppercase tracking-wider mt-1" style={{ color: '#6366f1' }}>Real-time ML Scoring</p>
              </div>
            </div>

            <div className="flex flex-col gap-5 z-10">
              <input 
                type="text" 
                placeholder="Idea Title (e.g. Automated Onboarding)" 
                className="w-full p-4 rounded-2xl text-sm font-bold outline-none transition-all duration-300"
                style={{ backgroundColor: 'rgba(241, 245, 249, 0.5)', border: '1px solid white', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)', color: '#1e293b' }}
                value={ideaTitle}
                onChange={e => setIdeaTitle(e.target.value)}
              />
              <textarea 
                placeholder="Describe your idea in detail..." 
                className="w-full p-4 rounded-2xl text-sm font-bold outline-none transition-all duration-300"
                style={{ backgroundColor: 'rgba(241, 245, 249, 0.5)', border: '1px solid white', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)', color: '#334155', height: '160px', resize: 'none' }}
                value={ideaDesc}
                onChange={e => setIdeaDesc(e.target.value)}
              />
              
              {!scoreResult ? (
                <button 
                  className="w-full shadow-xl rounded-full font-extrabold text-sm px-10 py-4 text-white transition-all duration-300 cursor-pointer flex justify-center items-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', border: 'none', opacity: (isScoring || !ideaTitle || !ideaDesc) ? 0.5 : 1 }}
                  onClick={handleScoreIdea}
                  disabled={isScoring || !ideaTitle || !ideaDesc}
                >
                  {isScoring ? (
                    <><div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin"></div> AI Processing...</>
                  ) : (
                    <><BrainCircuit size={20}/> Evaluate Feasibility</>
                  )}
                </button>
              ) : (
                <div className="p-6 rounded-3xl flex flex-col gap-5 shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #d1fae5', backdropFilter: 'blur(12px)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold tracking-wider" style={{ color: '#64748b' }}>Predicted Impact</span>
                    <span className="text-base font-extrabold" style={{ color: '#059669' }}>{scoreResult.impact}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold tracking-wider" style={{ color: '#64748b' }}>Est. Feasibility</span>
                    <span className="text-base font-extrabold" style={{ color: '#2563eb' }}>{scoreResult.feasibility}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold tracking-wider" style={{ color: '#64748b' }}>Similar Past Ideas</span>
                    <span className="text-base font-extrabold" style={{ color: '#d97706' }}>{scoreResult.similar} found</span>
                  </div>
                  
                  <div className="font-bold p-4 rounded-2xl leading-relaxed" style={{ fontSize: '13px', color: '#475569', backgroundColor: 'rgba(209, 250, 229, 0.5)', border: '1px solid #d1fae5' }}>
                    Supervised classification model analyzing your text embeddings predicts a high success rate based on past implementations.
                  </div>

                  <button className="w-full shadow-lg rounded-full font-extrabold text-sm px-10 py-4 text-white transition-all duration-300 cursor-pointer" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }} onClick={() => { setScoreResult(null); setIdeaTitle(''); setIdeaDesc(''); }}>
                    Submit for Review
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Leaderboard & Communities */}
        <div className="col-span-2 flex flex-col gap-8">
          
          <Card className="p-6 flex flex-col gap-6 relative overflow-hidden shadow-2xl rounded-3xl transition-all duration-300" style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
            <div className="absolute rounded-full" style={{ top: 0, right: 0, width: '16rem', height: '16rem', backgroundColor: 'rgba(110, 231, 183, 0.1)', filter: 'blur(40px)' }}></div>
            
            <div className="relative z-10">
              <h3 className="font-extrabold text-base uppercase tracking-wide flex items-center gap-2" style={{ color: '#0f172a' }}>
                <div className="p-2 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)' }}><Rocket size={20} className="text-white"/></div> 
                Top Ranked Ideas Pipeline
              </h3>
              <p className="font-extrabold uppercase tracking-widest mt-2" style={{ fontSize: '11px', color: '#64748b', marginLeft: '3rem' }}>Ranked by ML Impact Score & Feasibility</p>
            </div>

            <div className="flex flex-col gap-5 relative z-10 mt-2">
              {mockTopIdeas.map((idea) => (
                <div key={idea.id} className="p-5 rounded-3xl flex items-center justify-between shadow-md transition-all duration-300 group cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shrink-0 shadow-lg" style={{ background: getAuthorGradient(idea.authorBg) }}>
                      {idea.authorInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-extrabold text-base transition-colors" style={{ color: '#0f172a' }}>{idea.title}</h4>
                        {idea.patentPending && (
                          <span className="uppercase font-extrabold flex items-center gap-1 shadow-sm px-2 py-1 rounded-lg" style={{ fontSize: '10px', color: '#b45309', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                            <Sparkles size={12}/> Patent Pending
                          </span>
                        )}
                      </div>
                      <p className="font-bold mb-3" style={{ fontSize: '13px', color: '#64748b' }}>{idea.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="uppercase font-extrabold px-3 py-1 rounded-lg text-white shadow-sm border-none" style={{ fontSize: '10px', background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' }}>Impact: {idea.impactScore}/100</span>
                        <span className="uppercase font-extrabold px-3 py-1 rounded-lg shadow-sm border-none text-white" style={{ fontSize: '10px', background: idea.feasibility === 'High' ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>Feasibility: {idea.feasibility}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className="px-3 py-1 rounded-xl uppercase font-extrabold tracking-widest shadow-sm border whitespace-nowrap" style={{ fontSize: '11px', backgroundColor: idea.status === 'Approved' ? '#ecfdf5' : '#f8fafc', color: idea.status === 'Approved' ? '#059669' : '#64748b', borderColor: idea.status === 'Approved' ? '#a7f3d0' : '#e2e8f0' }}>{idea.status}</span>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                      <ChevronRight size={20}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 flex flex-col gap-6 relative overflow-hidden shadow-2xl rounded-3xl transition-all duration-300" style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
            <div className="absolute rounded-full" style={{ bottom: 0, left: 0, width: '16rem', height: '16rem', backgroundColor: 'rgba(165, 180, 252, 0.1)', filter: 'blur(40px)' }}></div>
            
            <div className="relative z-10">
              <h3 className="font-extrabold text-base uppercase tracking-wide flex items-center gap-2" style={{ color: '#0f172a' }}>
                <div className="p-2 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)' }}><Network size={20} className="text-white"/></div> 
                Communities of Practice
              </h3>
              <p className="font-extrabold uppercase tracking-widest mt-2" style={{ fontSize: '11px', color: '#64748b', marginLeft: '3rem' }}>Knowledge sharing across the organization</p>
            </div>

            <div className="grid grid-cols-2 gap-6 relative z-10 mt-2">
              {mockCommunities.map((community) => (
                <div key={community.id} className="p-6 rounded-3xl flex flex-col gap-4 shadow-md transition-all duration-300" style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: getCommunityGradient(community.bgClass) }}>
                      {community.icon === 'TrendingUp' && <TrendingUp size={20} className="text-white"/>}
                      {community.icon === 'Share2' && <Share2 size={20} className="text-white"/>}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base" style={{ color: '#0f172a' }}>{community.name}</h4>
                      <p className="text-xs font-bold mt-1" style={{ color: '#64748b' }}>{community.members} Active Members</p>
                    </div>
                  </div>
                  
                  <button className="mt-2 w-full shadow-md rounded-full font-extrabold text-sm px-8 py-3 transition-all duration-300 border-none cursor-pointer whitespace-nowrap" style={{ 
                    backgroundColor: community.joined ? '#eef2ff' : '#f8fafc',
                    color: community.joined ? '#4f46e5' : '#334155',
                    border: `1px solid ${community.joined ? '#c7d2fe' : '#e2e8f0'}`
                  }}>
                    {community.joined ? 'Joined' : 'Join Community'}
                  </button>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};
