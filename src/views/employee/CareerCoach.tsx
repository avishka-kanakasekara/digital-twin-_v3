import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { 
  TrendingUp, BookOpen, Crosshair, Edit, Flag, CheckCircle, 
  ArrowRight, Sparkles, Send, MessageSquare, 
  Briefcase, GraduationCap, Zap, ChevronRight, BarChart
} from 'lucide-react';
import { careerAPI } from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';
import './CareerCoach.css';

interface CareerAnalysis {
  readiness_score: number;
  strengths: { title: string; description: string }[];
  opportunities: { title: string; description: string }[];
  skill_gaps: any[];
  roadmap_steps: any[];
  recommendations: any[];
  market_trends: any[];
  narrative: string;
}

export const CareerCoach: React.FC = () => {
  const { currentEmployee } = useEmployee();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  
  // Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ 
    target_role: 'Senior Software Engineer', 
    timeline: '12-18 Months', 
    focus_area: 'Engineering' 
  });
  
  // Chat
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial Data Load
  useEffect(() => {
    if (!currentEmployee) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const goalData = await careerAPI.getGoal(currentEmployee.id);
        if (goalData) {
          setGoalForm({
            target_role: goalData.target_role,
            timeline: goalData.timeline || '12-18 Months',
            focus_area: goalData.focus_area || 'Engineering',
          });
        }
        
        const analysisData = await careerAPI.getAnalysis(currentEmployee.id);
        setAnalysis(analysisData);
        
        setChatHistory([{
          role: 'assistant',
          content: `Hello ${currentEmployee.full_name.split(' ')[0]}. I have analyzed your skills and projects. Your personalized transition roadmap for **${goalData?.target_role || 'Senior Engineer'}** is ready. How can I assist you today?`
        }]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load career data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentEmployee]);
  
  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSaveGoal = async () => {
    if (!currentEmployee) return;
    setLoading(true);
    setIsGoalModalOpen(false);
    
    try {
      await careerAPI.setGoal(currentEmployee.id, {
        target_role: goalForm.target_role,
        timeline: goalForm.timeline,
        focus_area: goalForm.focus_area,
        target_industry: goalForm.focus_area,
        is_active: true,
      });
      
      const newAnalysis = await careerAPI.getAnalysis(currentEmployee.id);
      setAnalysis(newAnalysis);
      
      setChatHistory([{
        role: 'assistant',
        content: `I've updated your goal to **${goalForm.target_role}** and recalculated your readiness and roadmap. What steps would you like to discuss?`
      }]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !currentEmployee) return;
    
    const userMsg = chatMessage.trim();
    setChatMessage('');
    
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(newHistory);
    setIsChatting(true);
    
    try {
      const resp = await careerAPI.chat(currentEmployee.id, userMsg, newHistory.slice(0, -1));
      setChatHistory([...newHistory, { role: 'assistant', content: resp.response }]);
    } catch (error) {
      setChatHistory([...newHistory, { role: 'assistant', content: 'An error occurred. Please try again.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Analyzing career profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="bg-red-50 text-red-600 border border-red-200 px-6 py-4 rounded-lg font-medium shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Career Coach
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-indigo-200 flex items-center gap-1">
                <Sparkles size={12}/> AI Powered
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Data-driven pathway to your next career milestone.</p>
          </div>
          <Button variant="outline" onClick={() => setIsGoalModalOpen(true)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
            <Edit size={16} className="mr-2"/> Edit Goal
          </Button>
        </div>

        {/* Hero Goal Banner */}
        <Card className="p-0 overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col md:flex-row">
          <div className="p-8 flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{goalForm.target_role}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-6">
              <span className="flex items-center gap-1.5 font-medium"><Briefcase size={16} className="text-slate-400"/> {goalForm.focus_area}</span>
              <span className="flex items-center gap-1.5 font-medium"><Flag size={16} className="text-slate-400"/> {goalForm.timeline}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 border-l-4 border-l-indigo-500">
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis?.narrative}
              </p>
            </div>
          </div>
          <div className="bg-indigo-50 w-full md:w-80 flex flex-col items-center justify-center p-8 border-t md:border-t-0 md:border-l border-slate-200 shrink-0">
             <div className="relative flex items-center justify-center w-32 h-32 mb-3">
                <svg viewBox="0 0 36 36" className="w-32 h-32 transform -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e2e8f0" strokeWidth="2.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#4f46e5" strokeWidth="2.5"
                    strokeDasharray={`${analysis?.readiness_score}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold text-slate-900">{analysis?.readiness_score}<span className="text-lg text-slate-500">%</span></span>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Readiness Score</span>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* AI Generated Roadmap */}
            <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600"/> Development Roadmap
                </h3>
              </div>
              
              <div className="relative pl-6 before:absolute before:inset-0 before:ml-8 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                {analysis?.roadmap_steps.map((step, idx) => (
                  <div key={idx} className="relative flex items-start justify-normal mb-8 last:mb-0">
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 border-white shrink-0 shadow-sm z-10 mt-1 ml-[0.35rem] ${
                      step.status === 'achieved' ? 'bg-emerald-500' : 
                      step.status === 'in_progress' ? 'bg-indigo-600' : 
                      step.status === 'goal' ? 'bg-slate-800' : 'bg-slate-300'
                    }`}>
                      {step.status === 'achieved' ? <CheckCircle size={10} className="text-white"/> : 
                       step.status === 'goal' ? <Flag size={10} className="text-white"/> : 
                       <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </div>
                    
                    <div className="ml-6 w-full">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h4 className={`font-bold text-base ${step.status === 'in_progress' ? 'text-indigo-700' : 'text-slate-900'}`}>{step.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                          step.status === 'achieved' ? 'bg-emerald-100 text-emerald-700' : 
                          step.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {step.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommended Learning Path */}
            <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                 <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <GraduationCap size={20} className="text-indigo-600"/> Recommended Learning Paths
                  </h3>
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50 font-medium">
                    View Catalog <ChevronRight size={16} />
                  </Button>
               </div>
               
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {analysis?.recommendations.slice(0, 4).map((path, index) => (
                  <div key={path.id} className="relative rounded-xl p-5 flex gap-4 border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all group">
                    {path.is_top_match && <div className="absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl bg-indigo-600">Top Match</div>}
                    
                    <div className="w-12 h-12 rounded-lg flex shrink-0 items-center justify-center bg-slate-50 border border-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <BookOpen size={20}/>
                    </div>
                    
                    <div className="flex flex-col flex-1">
                      <h5 className="font-bold text-sm text-slate-900 mb-1 leading-snug pr-8">{path.title}</h5>
                      <p className="text-xs text-slate-500 font-medium mb-3">{path.provider} • {path.duration}</p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-1 rounded text-emerald-700 bg-emerald-50 border border-emerald-100">Impact: {path.readiness_impact}</span>
                        <div className="text-xs font-bold text-indigo-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Enroll <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar Right Column */}
          <div className="lg:col-span-1 flex flex-col gap-8 h-full">
            
            {/* Skill Gap Radar */}
            <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 mb-4">
                <BarChart size={18} className="text-indigo-600"/> Skill Gap Analysis
              </h3>
              
              <div className="w-full relative min-h-[260px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analysis?.skill_gaps.map(g => ({
                    subject: g.skill,
                    Current: g.current_level,
                    Target: g.target_level,
                    fullMark: 10,
                  }))}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar name="Target" dataKey="Target" stroke="#cbd5e1" strokeWidth={1} fill="#f1f5f9" fillOpacity={0.5} strokeDasharray="3 3" />
                    <Radar name="Current" dataKey="Current" stroke="#4f46e5" strokeWidth={2} fill="#4f46e5" fillOpacity={0.2} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ fontWeight: '600', fontSize: '12px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex gap-6 justify-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-indigo-500"></div><span className="text-xs font-medium text-slate-600">Current</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm border border-dashed border-slate-400 bg-slate-100"></div><span className="text-xs font-medium text-slate-600">Target</span></div>
              </div>
            </Card>

            {/* AI Chat Assistant */}
            <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl min-h-[400px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                    <MessageSquare size={14} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Career Advisor</h3>
                    <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-3 text-sm rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-a:text-indigo-600">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-3 border-t border-slate-100 bg-white">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    placeholder="Message advisor..."
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                    disabled={isChatting}
                  />
                  <button 
                    type="submit"
                    disabled={!chatMessage.trim() || isChatting}
                    className="absolute right-1.5 w-7 h-7 flex items-center justify-center rounded-md bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                  >
                    <Send size={12} />
                  </button>
                </form>
              </div>
            </Card>

          </div>
        </div>
      </div>

      {/* Goal Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Edit Career Goal">
        <div className="flex flex-col gap-4 p-1">
          <p className="text-sm text-slate-500 mb-2">Update your target role to generate a new personalized roadmap.</p>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Target Role</label>
            <input
              type="text"
              value={goalForm.target_role}
              onChange={e => setGoalForm(f => ({ ...f, target_role: e.target.value }))}
              placeholder="e.g. Principal Engineer"
              className="h-10 px-3 rounded-lg w-full text-sm outline-none border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Timeline</label>
            <select
              value={goalForm.timeline}
              onChange={e => setGoalForm(f => ({ ...f, timeline: e.target.value }))}
              className="h-10 px-3 rounded-lg w-full text-sm outline-none border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option>6-12 Months</option>
              <option>12-18 Months</option>
              <option>2+ Years</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Target Domain</label>
            <input
              type="text"
              value={goalForm.focus_area}
              onChange={e => setGoalForm(f => ({ ...f, focus_area: e.target.value }))}
              placeholder="e.g. Architecture"
              className="h-10 px-3 rounded-lg w-full text-sm outline-none border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setIsGoalModalOpen(false)} className="rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200">Cancel</Button>
            <Button variant="primary" onClick={handleSaveGoal} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 border-none text-white">Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
