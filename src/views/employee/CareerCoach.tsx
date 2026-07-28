import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Crosshair, BookOpen, ArrowRight, TrendingUp, Edit3, PlayCircle, ExternalLink, Milestone, CheckCircle2, ChevronRight } from 'lucide-react';
import { Modal } from '../../components/Modal';

export const CareerCoach: React.FC = () => {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  return (
    <div className="flex flex-col gap-6 pb-8" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 30%, #f1f5f9 60%, #f8fafc 100%)', minHeight: '100vh', padding: '2rem' }}>
      <div>
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: '#0f172a' }}>AI Career Coach</h1>
        <p className="text-sm font-medium" style={{ color: '#475569' }}>Employee Digital Twin • Personalized learning paths and readiness tracking mapped to market trends.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <Card className="glass p-8 flex flex-col gap-8 relative overflow-hidden group" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226, 232, 240, 0.8)', backdropFilter: 'blur(20px)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-colors" style={{ background: 'rgba(59, 130, 246, 0.08)' }}></div>
            
            <div className="flex justify-between items-start pb-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
                    <Crosshair size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: '#64748b' }}>Current Target Goal</p>
                    <h3 className="font-extrabold text-2xl" style={{ color: '#0f172a' }}>Cloud Architect</h3>
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-[76px]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Timeline</p>
                    <p className="text-sm font-bold" style={{ color: '#0f172a' }}>12-18 Months</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Focus</p>
                    <p className="text-sm font-bold" style={{ color: '#0f172a' }}>Tech / Cloud</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Readiness</p>
                    <p className="text-sm font-bold" style={{ color: '#10b981' }}>65%</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsGoalModalOpen(true)} className="font-bold px-5 py-2.5 rounded-xl shadow-sm" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#3b82f6' }}>
                <Edit3 size={14} className="mr-2"/> Edit Goal
              </Button>
            </div>
            
            {/* Career Roadmap */}
            <div className="relative z-10 mt-8">
              <h4 className="text-sm font-extrabold mb-6 flex items-center gap-2 uppercase tracking-wide" style={{ color: '#0f172a' }}><Milestone size={18}/> Career Roadmap</h4>
              <div className="relative">
                {/* Progress line */}
                <div className="absolute top-8 left-8 right-8 h-1 rounded-full" style={{ background: 'rgba(226, 232, 240, 0.8)' }}></div>
                <div className="absolute top-8 left-8 h-1 rounded-full" style={{ width: '50%', background: 'linear-gradient(to right, #10b981, #3b82f6)' }}></div>
                
                <div className="flex items-start justify-between relative">
                  
                  <div className="flex flex-col items-center gap-3" style={{ width: '80px' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg border-4" style={{ background: '#10b981', borderColor: 'rgba(255,255,255,0.9)' }}>
                      <CheckCircle2 size={28}/>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold block" style={{ color: '#0f172a' }}>Senior Cloud</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ color: '#059669', background: 'rgba(16, 185, 129, 0.12)' }}>Achieved</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3" style={{ width: '80px' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg border-4" style={{ background: '#f59e0b', borderColor: 'rgba(255,255,255,0.9)' }}>
                      <span className="font-bold text-xl">2</span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold block" style={{ color: '#0f172a' }}>Lead Projects</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ color: '#b45309', background: 'rgba(245, 158, 11, 0.12)' }}>In Progress</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3" style={{ width: '80px' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-4" style={{ background: 'rgba(255,255,255,0.9)', borderColor: 'rgba(226, 232, 240, 0.8)', color: '#94a3b8' }}>
                      <span className="font-bold text-xl">3</span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold block" style={{ color: '#64748b' }}>System Design</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ color: '#94a3b8', background: 'rgba(248, 250, 252, 0.8)' }}>Upcoming</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3" style={{ width: '80px' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg border-4" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderColor: 'rgba(255,255,255,0.9)' }}>
                      <Crosshair size={28}/>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-extrabold block" style={{ color: '#0f172a' }}>Cloud Architect</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.12)' }}>Goal</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Skill Gap Analysis */}
            <div className="mt-4 relative z-10">
              <h4 className="text-sm font-extrabold mb-4 flex items-center gap-2 uppercase tracking-wide" style={{ color: '#0f172a' }}>Skill Readiness Analysis</h4>
              <div className="flex flex-col gap-4 w-full p-5 rounded-2xl shadow-sm" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <div className="w-full">
                  <div className="flex items-center w-full mb-2">
                    <span className="font-bold text-sm flex-1" style={{ color: '#0f172a' }}>AWS EKS Architecture</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md" style={{ color: '#b45309', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>Need Advanced</span>
                  </div>
                  <div className="w-full rounded-full h-2 shadow-inner overflow-hidden" style={{ background: 'rgba(226, 232, 240, 0.8)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: '40%', background: 'linear-gradient(to right, #f59e0b, #f97316)' }}></div>
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center w-full mb-2">
                    <span className="font-bold text-sm flex-1" style={{ color: '#0f172a' }}>Enterprise System Design</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md" style={{ color: '#dc2626', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>Need Expert</span>
                  </div>
                  <div className="w-full rounded-full h-2 shadow-inner overflow-hidden" style={{ background: 'rgba(226, 232, 240, 0.8)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: '60%', background: 'linear-gradient(to right, #ef4444, #dc2626)' }}></div>
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center w-full mb-2">
                    <span className="font-bold text-sm flex-1" style={{ color: '#0f172a' }}>Infrastructure as Code (Terraform)</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md" style={{ color: '#059669', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>Met (Advanced)</span>
                  </div>
                  <div className="w-full rounded-full h-2 shadow-inner overflow-hidden" style={{ background: 'rgba(226, 232, 240, 0.8)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: '100%', background: 'linear-gradient(to right, #10b981, #059669)' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-extrabold flex items-center gap-2 uppercase tracking-wide mt-2 relative z-10" style={{ color: '#0f172a' }}>AI Recommended Learning Path</h4>
            <div className="grid grid-cols-2 gap-5 relative z-10">
              <div className="relative rounded-2xl p-6 flex flex-col gap-3 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm group overflow-hidden" style={{ border: '1px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255,255,255,0.9)' }}>
                <div className="absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 shadow-sm rounded-bl-xl" style={{ background: '#f59e0b' }}>Top Match</div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                  <BookOpen size={20}/>
                </div>
                <div>
                  <h5 className="font-extrabold text-base mb-1" style={{ color: '#0f172a' }}>Advanced EKS Architecture</h5>
                  <p className="text-xs font-semibold" style={{ color: '#64748b' }}>Coursera • 12 hours</p>
                </div>
                <p className="text-xs leading-relaxed mb-4 mt-1 font-medium" style={{ color: '#475569' }}>Directly closes your AWS EKS skill gap. 85% of Cloud Architects at the company have completed this.</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ color: '#b45309', background: 'rgba(245, 158, 11, 0.12)' }}>+15% Readiness</span>
                  <div className="flex items-center text-xs font-bold group-hover:translate-x-1 transition-transform" style={{ color: '#3b82f6' }}>
                    <PlayCircle size={14} className="mr-1"/> Start Course
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 flex flex-col gap-3 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm group overflow-hidden" style={{ border: '1px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255,255,255,0.9)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }}>
                  <BookOpen size={20}/>
                </div>
                <div>
                  <h5 className="font-extrabold text-base mb-1" style={{ color: '#0f172a' }}>Enterprise System Design</h5>
                  <p className="text-xs font-semibold" style={{ color: '#64748b' }}>Internal Academy • 8 hours</p>
                </div>
                <p className="text-xs leading-relaxed mb-4 mt-1 font-medium" style={{ color: '#475569' }}>Required knowledge for Architect transitions internally. Covers high-availability microservices.</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ color: '#0891b2', background: 'rgba(6, 182, 212, 0.12)' }}>+20% Readiness</span>
                  <div className="flex items-center text-xs font-bold group-hover:translate-x-1 transition-transform" style={{ color: '#06b6d4' }}>
                    View Details <ChevronRight size={14} className="ml-1"/>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="col-span-1 flex flex-col p-6 shadow-md overflow-hidden relative h-fit" style={{ border: '1px solid rgba(16, 185, 129, 0.25)', background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.05), rgba(255,255,255,0.8))' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl" style={{ background: 'rgba(16, 185, 129, 0.1)' }}></div>
          <h3 className="font-extrabold text-xl mb-1 flex items-center gap-2" style={{ color: '#0f172a' }}><TrendingUp size={22} style={{ color: '#10b981' }}/> Market Demand Digest</h3>
          <p className="text-xs mb-6 font-medium" style={{ color: '#475569' }}>Real-time skills demand trajectory in your industry (Tech).</p>
          
          <div className="space-y-4 flex-1 relative" style={{ zIndex: 10 }}>
            <div className="flex items-center justify-between p-4 rounded-xl backdrop-blur-sm shadow-sm hover:border-success/30 transition-colors" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold" style={{ color: '#0f172a' }}>Kubernetes</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Platform Eng.</span>
              </div>
              <span className="text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center" style={{ color: '#059669', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)' }}><TrendingUp size={12} className="mr-1"/> +14%</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl backdrop-blur-sm shadow-sm hover:border-success/30 transition-colors" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold" style={{ color: '#0f172a' }}>GenAI Architecture</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Data / Cloud Eng.</span>
              </div>
              <span className="text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center" style={{ color: '#059669', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)' }}><TrendingUp size={12} className="mr-1"/> +45%</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl backdrop-blur-sm shadow-sm hover:border-secondary/30 transition-colors" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold" style={{ color: '#0f172a' }}>React & Next.js</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Frontend</span>
              </div>
              <span className="text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center" style={{ color: '#64748b', background: 'rgba(248, 250, 252, 0.8)', border: '1px solid rgba(226, 232, 240, 0.8)' }}><ArrowRight size={12} className="mr-1"/> Stable</span>
            </div>
          </div>
          
          <Button variant="primary" className="w-full mt-8 text-xs font-bold rounded-xl shadow-md py-3 flex items-center justify-center gap-2 border-none" style={{ background: 'linear-gradient(to right, #059669, #10b981)' }}>
            View Full Market Report <ExternalLink size={14}/>
          </Button>
        </Card>
      </div>

      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Set Career Goal">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium" style={{ color: '#475569' }}>Define your next career milestone so the AI can map your learning path and calculate your readiness score.</p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Target Role</label>
            <select className="h-10 px-3 rounded-xl w-full text-sm font-semibold outline-none shadow-sm appearance-none cursor-pointer" style={{ border: '1px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255,255,255,0.9)' }}>
              <option>Cloud Architect</option>
              <option>Engineering Manager</option>
              <option>Principal Engineer</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Timeline</label>
              <select className="h-10 px-3 rounded-xl w-full text-sm font-semibold outline-none shadow-sm appearance-none cursor-pointer" style={{ border: '1px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255,255,255,0.9)' }}>
                <option>12-18 Months</option>
                <option>6-12 Months</option>
                <option>2+ Years</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Target Industry</label>
              <select className="h-10 px-3 rounded-xl w-full text-sm font-semibold outline-none shadow-sm appearance-none cursor-pointer" style={{ border: '1px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255,255,255,0.9)' }}>
                <option>Tech / Cloud</option>
                <option>FinTech</option>
                <option>HealthTech</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Focus Areas (Optional)</label>
            <input type="text" className="h-10 px-3 rounded-xl w-full text-sm font-semibold outline-none shadow-sm" style={{ border: '1px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255,255,255,0.9)' }} placeholder="e.g. Serverless, Team Leadership" />
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-5" style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <Button variant="ghost" onClick={() => setIsGoalModalOpen(false)} className="rounded-xl font-bold" style={{ background: 'rgba(248, 250, 252, 0.8)' }}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsGoalModalOpen(false)} className="rounded-xl shadow-md font-bold px-6">Update Goal</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
