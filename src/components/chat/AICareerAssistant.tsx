import React, { useState } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { useEmployee } from '../../contexts/EmployeeContext';
import { employeeAPI } from '../../lib/api';

interface AICareerAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  twinMemory: any[];
}

export const AICareerAssistant: React.FC<AICareerAssistantProps> = ({ isOpen, onClose }) => {
  const { currentEmployee } = useEmployee();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string; sources?: string[] }[]>([
    { role: 'assistant', content: 'Hi! I am your personal AI Twin Assistant. I have access to your skills, projects, and uploaded documents. Ask me anything about your career, experience, or for help with professional content.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!chatInput.trim() || !currentEmployee) return;
    
    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoading(true);
    
    try {
      const response = await employeeAPI.sendAIChatMessage(
        currentEmployee.id,
        userMessage,
        messages
      );
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.response,
        sources: response.sources,
      }]);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Generate a professional bio",
    "What are my strongest skills?",
    "Summarize my completed projects",
    "Suggest my next career move"
  ];

  const handleSuggestion = (text: string) => {
    setChatInput(text);
    handleSend();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[500px] h-[600px] flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200/80 m-4">
        
        {/* Header - Solid and Clean */}
        <div className="flex items-center bg-white border-b border-slate-200/80 z-10" style={{ padding: '16px 20px', gap: '16px' }}>
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm" style={{ width: '42px', height: '42px', borderRadius: '50%', fontSize: '15px' }}>
            <Bot size={18} />
          </div>
          <div className="flex flex-col flex-1">
            <h4 className="font-bold text-slate-900 leading-tight" style={{ fontSize: '15px' }}>AI Twin Assistant</h4>
            <p className="font-bold text-slate-500 uppercase tracking-widest" style={{ fontSize: '10px', marginTop: '2px' }}>
              {currentEmployee?.full_name || 'Employee'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors p-2 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50" style={{ scrollbarWidth: 'none', gap: '20px', padding: '20px' }}>
          {messages.length === 1 && (
            <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none', gap: '8px', paddingBottom: '4px' }}>
              {suggestions.map(s => (
                <button 
                  key={s} 
                  onClick={() => handleSuggestion(s)}
                  className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 shrink-0 transition-all flex items-center shadow-sm"
                  style={{ padding: '6px 14px', borderRadius: '8px', gap: '6px' }}
                >
                  <Sparkles size={10} className="text-blue-400" />
                  {s}
                </button>
              ))}
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end animate-slide-up`} style={{ gap: '12px', animationDelay: `${Math.min(idx * 50, 200)}ms` }}>
              
              {msg.role === 'assistant' && (
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-sm" style={{ width: '28px', height: '28px', borderRadius: '50%', marginBottom: '4px' }}>
                  <Bot size={14}/>
                </div>
              )}
              
              <div className={`max-w-[85%] text-[13px] leading-relaxed shadow-sm font-medium ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-white text-slate-700 border border-slate-200/80'
              }`} style={{ 
                padding: '12px 16px', 
                borderRadius: '16px', 
                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px'
              }}>
                {msg.content.split('\n').map((line: string, i: number) => (
                  <React.Fragment key={i}>
                    {line.startsWith('> ') ? (
                      <div className="pl-2 border-l-2 border-blue-200 text-slate-500 italic my-1 text-xs">{line.replace('> ', '')}</div>
                    ) : (
                      <span dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')}}></span>
                    )}
                    {i < msg.content.split('\n').length - 1 && <br/>}
                  </React.Fragment>
                ))}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60">
                    <span className="text-xs text-slate-400 font-medium">Sources: </span>
                    {msg.sources.map((source, idx) => (
                      <span key={idx} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium ml-1">
                        {source}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start items-end animate-fade-in" style={{ gap: '12px' }}>
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-sm" style={{ width: '28px', height: '28px', borderRadius: '50%', marginBottom: '4px' }}>
                <Bot size={14}/>
              </div>
              <div className="bg-white border border-slate-200/80 flex items-center shadow-sm" style={{ padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px', height: '40px', gap: '6px' }}>
                <span className="bg-slate-400 animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                <span className="bg-slate-400 animate-bounce [animation-delay:0.2s]" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                <span className="bg-slate-400 animate-bounce [animation-delay:0.4s]" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex flex-col bg-white z-10 border-t border-slate-200/80" style={{ padding: '16px 20px' }}>
          <div className="flex items-center relative" style={{ gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Ask your digital twin..." 
              className="w-full text-sm text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-100/80 placeholder-slate-400 transition-all"
              style={{ 
                height: '44px', 
                borderRadius: '999px', 
                border: '1px solid rgba(226, 232, 240, 0.8)', 
                paddingLeft: '20px', 
                paddingRight: '48px' 
              }}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!chatInput.trim() || isLoading}
              className={`absolute flex items-center justify-center transition-all duration-200 ${
                chatInput.trim() && !isLoading
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transform hover:scale-105 active:scale-95'
                  : 'bg-transparent text-slate-400 cursor-not-allowed'
              }`}
              style={{ right: '6px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%' }}
            >
              <Send size={14} style={{ marginLeft: chatInput.trim() && !isLoading ? '-2px' : '0' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

