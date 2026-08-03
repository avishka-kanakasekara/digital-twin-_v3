import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { TrendingUp, BookOpen, Crosshair, Edit, Flag, CheckCircle, PlayCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { careerAPI, learningAPI } from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';

export const CareerCoach: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [careerGoal, setCareerGoal] = useState({
    target_role: 'Cloud Architect',
    timeline: '12-18 Months',
    focus_area: 'Tech / Cloud',
    readiness_score: 65,
  });
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [skillGaps, setSkillGaps] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);

  useEffect(() => {
    if (!currentEmployee) return;

    const loadFromAPI = async () => {
      try {
        const goalData = await careerAPI.getGoal(currentEmployee.id);
        setCareerGoal({
          target_role: goalData.target_role,
          timeline: goalData.timeline,
          focus_area: goalData.focus_area,
          readiness_score: goalData.readiness_score,
        });
        console.log('✅ Loaded career goal from API');
      } catch (error) {
        console.log('⚠️ API not available, using mock data');
      }

      try {
        const roadmapData = await careerAPI.getRoadmap(currentEmployee.id);
        setRoadmap(roadmapData || []);
      } catch (error) {
        console.log('⚠️ Roadmap API not available');
        setRoadmap([
          { id: 1, title: 'Senior Cloud', status: 'completed', step_order: 1 },
          { id: 2, title: 'Lead Projects', status: 'in_progress', step_order: 2 },
          { id: 3, title: 'System Design', status: 'upcoming', step_order: 3 },
          { id: 4, title: 'Cloud Architect', status: 'upcoming', step_order: 4 },
        ]);
      }

      try {
        const skillData = await learningAPI.getSkillGaps(currentEmployee.id);
        setSkillGaps(skillData?.gaps || []);
      } catch (error) {
        console.log('⚠️ Skill gaps API not available');
        setSkillGaps([
          { skill: 'AWS EKS Architecture', level: 40, status: 'Need Advanced' },
          { skill: 'Enterprise System Design', level: 60, status: 'Need Expert' },
          { skill: 'Infrastructure as Code (Terraform)', level: 100, status: 'Met (Advanced)' },
        ]);
      }

      try {
        const pathsData = await learningAPI.getPaths(currentEmployee.id);
        setLearningPaths(pathsData || []);
      } catch (error) {
        console.log('⚠️ Learning paths API not available');
        setLearningPaths([
          { id: 1, title: 'Advanced EKS Architecture', provider: 'Coursera', hours: 12, readiness_impact: 15 },
          { id: 2, title: 'Enterprise System Design', provider: 'Internal Academy', hours: 8, readiness_impact: 20 },
        ]);
      }

      try {
        const marketResp = await careerAPI.getMarketTrends();
        setMarketData(marketResp || []);
      } catch (error) {
        console.log('⚠️ Market trends API not available');
        setMarketData([
          { skill: 'Kubernetes', category: 'Platform Eng.', trend: '+14%', color: '#059669' },
          { skill: 'GenAI Architecture', category: 'Data / Cloud Eng.', trend: '+45%', color: '#059669' },
          { skill: 'React & Next.js', category: 'Frontend', trend: 'Stable', color: '#64748b' },
        ]);
      }
    };
    loadFromAPI();
  }, [currentEmployee]);

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
                    <h3 className="font-extrabold text-2xl" style={{ color: '#0f172a' }}>{careerGoal.target_role}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-[76px]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Timeline</p>
                    <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{careerGoal.timeline}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Focus</p>
                    <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{careerGoal.focus_area}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Readiness</p>
                    <p className="text-sm font-bold" style={{ color: '#10b981' }}>{careerGoal.readiness_score}%</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsGoalModalOpen(true)} className="font-bold px-5 py-2.5 rounded-xl shadow-sm" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#3b82f6' }}>
                <Edit size={14} className="mr-2"/> Edit Goal
              </Button>
            </div>
            
            {/* Career Roadmap */}
            <div className="relative z-10 mt-8">
              <h4 className="text-sm font-extrabold mb-6 flex items-center gap-2 uppercase tracking-wide" style={{ color: '#0f172a' }}><Flag size={18}/> Career Roadmap</h4>
              <div className="relative">
                {/* Progress line */}
                <div className="absolute top-8 left-8 right-8 h-1 rounded-full" style={{ background: 'rgba(226, 232, 240, 0.8)' }}></div>
                <div className="absolute top-8 left-8 h-1 rounded-full" style={{ width: '50%', background: 'linear-gradient(to right, #10b981, #3b82f6)' }}></div>
                
                <div className="flex items-start justify-between relative">
                  {roadmap.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center gap-3" style={{ width: '80px' }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-4" style={{ 
                        background: step.status === 'completed' ? '#10b981' : step.status === 'in_progress' ? '#f59e0b' : step.title === careerGoal.target_role ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(255,255,255,0.9)',
                        borderColor: 'rgba(255,255,255,0.9)',
                        color: step.status === 'upcoming' && step.title !== careerGoal.target_role ? '#94a3b8' : 'white'
                      }}>
                        {step.status === 'completed' ? <CheckCircle size={28}/> : step.title === careerGoal.target_role ? <Crosshair size={28}/> : <span className="font-bold text-xl">{index + 1}</span>}
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold block" style={{ color: step.status === 'upcoming' && step.title !== careerGoal.target_role ? '#64748b' : '#0f172a' }}>{step.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ 
                          color: step.status === 'completed' ? '#059669' : step.status === 'in_progress' ? '#b45309' : '#94a3b8',
                          background: step.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : step.status === 'in_progress' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(248, 250, 252, 0.8)'
                        }}>{step.status === 'completed' ? 'Achieved' : step.status === 'in_progress' ? 'In Progress' : step.title === careerGoal.target_role ? 'Goal' : 'Upcoming'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skill Gap Analysis */}
            <div className="mt-4 relative z-10">
              <h4 className="text-sm font-extrabold mb-4 flex items-center gap-2 uppercase tracking-wide" style={{ color: '#0f172a' }}>Skill Readiness Analysis</h4>
              <div className="flex flex-col gap-4 w-full p-5 rounded-2xl shadow-sm" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                {skillGaps.map((gap, index) => (
                  <div key={index} className="w-full">
                    <div className="flex items-center w-full mb-2">
                      <span className="font-bold text-sm flex-1" style={{ color: '#0f172a' }}>{gap.skill}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md" style={{ 
                        color: gap.level >= 100 ? '#059669' : gap.level >= 60 ? '#b45309' : '#dc2626',
                        background: gap.level >= 100 ? 'rgba(16, 185, 129, 0.12)' : gap.level >= 60 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        border: gap.level >= 100 ? '1px solid rgba(16, 185, 129, 0.25)' : gap.level >= 60 ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
                      }}>{gap.status}</span>
                    </div>
                    <div className="w-full rounded-full h-2 shadow-inner overflow-hidden" style={{ background: 'rgba(226, 232, 240, 0.8)' }}>
                      <div className="h-full rounded-full transition-all" style={{ 
                        width: `${gap.level}%`, 
                        background: gap.level >= 100 ? 'linear-gradient(to right, #10b981, #059669)' : gap.level >= 60 ? 'linear-gradient(to right, #f59e0b, #f97316)' : 'linear-gradient(to right, #ef4444, #dc2626)'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h4 className="text-sm font-extrabold flex items-center gap-2 uppercase tracking-wide mt-2 relative z-10" style={{ color: '#0f172a' }}>AI Recommended Learning Path</h4>
            <div className="grid grid-cols-2 gap-5 relative z-10">
              {learningPaths.map((path, index) => (
                <div key={path.id} className={`relative rounded-2xl p-6 flex flex-col gap-3 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm group overflow-hidden ${index === 0 ? '' : ''}`} style={{ border: '1px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255,255,255,0.9)' }}>
                  {index === 0 && <div className="absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 shadow-sm rounded-bl-xl" style={{ background: '#f59e0b' }}>Top Match</div>}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                    <BookOpen size={20}/>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-base mb-1" style={{ color: '#0f172a' }}>{path.title}</h5>
                    <p className="text-xs font-semibold" style={{ color: '#64748b' }}>{path.provider} • {path.hours} hours</p>
                  </div>
                  <p className="text-xs leading-relaxed mb-4 mt-1 font-medium" style={{ color: '#475569' }}>Directly closes your skill gap. Recommended for your career progression.</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ color: '#b45309', background: 'rgba(245, 158, 11, 0.12)' }}>+{path.readiness_impact}% Readiness</span>
                    <div className="flex items-center text-xs font-bold group-hover:translate-x-1 transition-transform" style={{ color: '#3b82f6' }}>
                      <PlayCircle size={14} className="mr-1"/> Start Course
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="col-span-1 flex flex-col p-6 shadow-md overflow-hidden relative h-fit" style={{ border: '1px solid rgba(16, 185, 129, 0.25)', background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.05), rgba(255,255,255,0.8))' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl" style={{ background: 'rgba(16, 185, 129, 0.1)' }}></div>
          <h3 className="font-extrabold text-xl mb-1 flex items-center gap-2" style={{ color: '#0f172a' }}><TrendingUp size={22} style={{ color: '#10b981' }}/> Market Demand Digest</h3>
          <p className="text-xs mb-6 font-medium" style={{ color: '#475569' }}>Real-time skills demand trajectory in your industry (Tech).</p>
          
          <div className="space-y-4 flex-1 relative" style={{ zIndex: 10 }}>
            {marketData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl backdrop-blur-sm shadow-sm hover:border-success/30 transition-colors" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{item.skill}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{item.category}</span>
                </div>
                <span className="text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center" style={{ 
                  color: item.color,
                  background: item.color === '#059669' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(248, 250, 252, 0.8)',
                  border: item.color === '#059669' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(226, 232, 240, 0.8)'
                }}>
                  {item.trend.startsWith('+') ? <TrendingUp size={12} className="mr-1"/> : <ArrowRight size={12} className="mr-1"/>} {item.trend}
                </span>
              </div>
            ))}
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
