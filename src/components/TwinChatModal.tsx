import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Send, Bot, Sparkles } from 'lucide-react';

interface TwinChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  employeeRole: string;
}

export const TwinChatModal: React.FC<TwinChatModalProps> = ({ isOpen, onClose, employeeName, employeeRole }) => {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        { 
          role: 'ai', 
          text: `Hello! I am the AI Twin representation of ${employeeName} (${employeeRole}). I am synchronized with their project logs, skills inventory, and public CV. How can I help you today?` 
        }
      ]);
    }
  }, [isOpen, employeeName, employeeRole]);

  const triggerReply = (queryText: string) => {
    setIsTyping(true);

    setTimeout(() => {
      let reply = `As the AI replica of ${employeeName}, I am currently working on cloud infrastructure and core systems. Let me know if you need specific details about my availability or past deliverables.`;
      
      const q = queryText.toLowerCase();
      if (employeeName.includes('Sarah')) {
        if (q.includes('project') || q.includes('work') || q.includes('doing')) {
          reply = "I'm currently leading the UX redesign for the Internal Dashboard, refining user journeys and prototyping in Figma.";
        } else if (q.includes('burnout') || q.includes('stress') || q.includes('risk') || q.includes('bottleneck')) {
          reply = "My current workload is quite high due to conflicting project deadlines on Q3 deliverables. I've logged high overtime recently, but I am working with management on a 1:1 check-in to balance it.";
        } else if (q.includes('skill') || q.includes('expert') || q.includes('technical')) {
          reply = "My primary skills are Figma, User Research, Prototyping, and Wireframing. I have about 6 years of experience in product design.";
        }
      } else if (employeeName.includes('David')) {
        if (q.includes('project') || q.includes('work') || q.includes('doing')) {
          reply = "I am focusing on the Node.js backend API and database performance optimizations for our primary systems.";
        } else if (q.includes('burnout') || q.includes('stress') || q.includes('risk') || q.includes('bottleneck')) {
          reply = "I have been managing critical architecture migrations which required weekend deployments. I'm feeling a bit overloaded, and we are scheduling interventions to help delegate backend tasks.";
        } else if (q.includes('skill') || q.includes('expert') || q.includes('technical')) {
          reply = "I specialize in backend engineering, specifically Node.js, PostgreSQL database architecture, Redis caching, and GraphQL endpoints.";
        }
      } else if (employeeName.includes('Michael')) {
        if (q.includes('project') || q.includes('work') || q.includes('doing')) {
          reply = "I am mapping out the product roadmap for our upcoming releases and aligning the cloud migration targets with engineering leads.";
        } else if (q.includes('skill') || q.includes('expert') || q.includes('technical')) {
          reply = "I specialize in Agile product management, roadmapping, Jira backlog grooming, and data analytics.";
        }
      } else if (employeeName.includes('Elena')) {
        if (q.includes('project') || q.includes('work') || q.includes('doing')) {
          reply = "I am managing the enterprise client pipeline and sales targets for our Q3 launch.";
        } else if (q.includes('skill') || q.includes('expert') || q.includes('technical')) {
          reply = "My expertise lies in B2B enterprise sales, customer relationship management (CRM), contract negotiations, and strategic account management.";
        }
      }

      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    triggerReply(userMsg);
  };

  const handleSuggestion = (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    triggerReply(text);
  };

  const suggestions = [
    "What projects are you on?",
    "What are your core technical skills?",
    "Identify current bottlenecks.",
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chat with ${employeeName}'s AI Twin`}>
      <div className="flex flex-col h-[500px] w-full border border-[var(--border-subtle)] rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
        
        {/* Header - Solid and Clean */}
        <div className="flex items-center bg-white border-b border-[var(--border-subtle)] z-10" style={{ padding: '16px 20px', gap: '16px' }}>
          <div className="bg-primary flex items-center justify-center text-white font-bold shrink-0 shadow-sm" style={{ width: '42px', height: '42px', borderRadius: '50%', fontSize: '15px' }}>
            {employeeName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <h4 className="font-bold text-primary leading-tight" style={{ fontSize: '15px' }}>{employeeName}</h4>
            <p className="font-bold text-secondary uppercase tracking-widest" style={{ fontSize: '10px', marginTop: '2px' }}>{employeeRole}</p>
          </div>
          <div className="ml-auto flex items-center bg-success-light border text-success font-bold shadow-sm" style={{ gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '10px', borderColor: 'rgba(16,185,129,0.2)' }}>
            <Sparkles size={10} className="text-success" />
            Twin Active
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-[var(--bg-main)]" style={{ scrollbarWidth: 'none', gap: '20px', padding: '20px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end animate-slide-up`} style={{ gap: '12px', animationDelay: `${Math.min(idx * 50, 200)}ms` }}>
              
              {msg.role === 'ai' && (
                <div className="bg-white flex items-center justify-center text-primary shrink-0 shadow-sm border border-[var(--border-subtle)]" style={{ width: '28px', height: '28px', borderRadius: '50%', marginBottom: '4px' }}>
                  <Bot size={14}/>
                </div>
              )}
              
              <div className={`max-w-[85%] text-[13px] leading-relaxed shadow-sm font-medium ${
                msg.role === 'user' 
                  ? 'bg-primary text-white' 
                  : 'bg-white text-primary border border-[var(--border-subtle)]'
              }`} style={{ 
                padding: '12px 16px', 
                borderRadius: '16px', 
                borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start items-end animate-fade-in" style={{ gap: '12px' }}>
              <div className="bg-white flex items-center justify-center text-primary shrink-0 shadow-sm border border-[var(--border-subtle)]" style={{ width: '28px', height: '28px', borderRadius: '50%', marginBottom: '4px' }}>
                <Bot size={14}/>
              </div>
              <div className="bg-white border border-[var(--border-subtle)] flex items-center shadow-sm" style={{ padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px', height: '40px', gap: '6px' }}>
                <span className="bg-secondary animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                <span className="bg-secondary animate-bounce [animation-delay:0.2s]" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                <span className="bg-secondary animate-bounce [animation-delay:0.4s]" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions & Input Area */}
        <div className="flex flex-col bg-white z-10 border-t border-[var(--border-subtle)]" style={{ padding: '16px 20px', gap: '12px' }}>
          
          <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none', gap: '8px', paddingBottom: '4px' }}>
            {suggestions.map(s => (
              <button 
                key={s} 
                onClick={() => handleSuggestion(s)}
                className="text-[11px] font-medium text-secondary bg-white border border-[var(--border-subtle)] hover:bg-[var(--bg-main)] hover:text-primary shrink-0 transition-all flex items-center shadow-sm"
                style={{ padding: '6px 14px', borderRadius: '8px', gap: '6px' }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center relative" style={{ gap: '8px' }}>
            <input 
              type="text" 
              placeholder={`Message ${employeeName}'s AI Twin...`} 
              className="w-full text-sm text-primary focus:outline-none focus:border-primary bg-[var(--bg-main)] placeholder-tertiary transition-all"
              style={{ 
                height: '44px', 
                borderRadius: '999px', 
                border: '1px solid var(--border-subtle)', 
                paddingLeft: '20px', 
                paddingRight: '48px' 
              }}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!chatInput.trim()}
              className={`absolute flex items-center justify-center transition-all duration-200 ${
                chatInput.trim()
                  ? 'bg-primary text-white hover:bg-primary-hover shadow-sm transform hover:scale-105 active:scale-95'
                  : 'bg-transparent text-tertiary cursor-not-allowed'
              }`}
              style={{ right: '6px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%' }}
            >
              <Send size={14} style={{ marginLeft: chatInput.trim() ? '-2px' : '0' }} />
            </button>
          </div>
          
        </div>
      </div>
    </Modal>
  );
};
