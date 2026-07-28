import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, Minimize2 } from 'lucide-react';

interface AICareerAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  twinMemory: any[];
}

export const AICareerAssistant: React.FC<AICareerAssistantProps> = ({ isOpen, onClose }) => {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: 'ai', text: 'Hi Alex! I am your personal AI Twin representation. Ask me to generate your bio, evaluate your projects, or simulate answers to manager questions.' }
  ]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const text = chatInput;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    
    setTimeout(() => {
      let reply = 'Based on your latest synced GitHub repos and EKS Architecture completion, your profile is highly optimized for Cloud Architecture roles.';
      if (text.toLowerCase().includes('bio')) {
        reply = 'Here is a drafted bio:\n\n> "Alex is a Senior Cloud Engineer with extensive experience in AWS and Azure, currently leading major migration initiatives and focusing on AI integration."';
      } else if (text.toLowerCase().includes('recommend')) {
        reply = 'I would highly recommend Alex for the upcoming Data Platform migration. His **85% skill match** and recent **Terraform** experience make him a perfect fit.';
      }
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    }, 1000);
  };

  const suggestedPrompts = [
    "Generate a professional bio",
    "Predict success for a GenAI project",
    "Summarize my career achievements",
    "Suggest my next certification"
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-end bg-slate-900/20 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:w-[450px] h-[80vh] sm:h-[600px] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200/80 m-0 sm:m-4">
        
        {/* HEADER */}
        <div className="h-14 border-b border-slate-200/80 flex items-center justify-between px-4 shrink-0 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">AI Twin Assistant</h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <Minimize2 size={16} />
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col h-full bg-slate-50/80 overflow-hidden">

          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            <div className="flex flex-col gap-4">
              {messages.length === 1 && (
                <div className="grid grid-cols-1 gap-2 w-full mb-4">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { setChatInput(prompt); handleSend(); }}
                      className="text-left px-4 py-3 rounded-lg bg-white/80 border border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group flex items-center gap-3"
                    >
                      <Sparkles size={14} className="text-blue-400 group-hover:text-blue-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{prompt}</span>
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Bot size={14} />
                    </div>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white/95 rounded-2xl rounded-tr-sm' 
                      : 'bg-white/80 text-slate-700 rounded-2xl rounded-tl-sm border border-slate-200/80 shadow-sm'
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line.startsWith('> ') ? (
                          <div className="pl-2 border-l-2 border-blue-200 text-slate-500 italic my-1 text-xs">{line.replace('> ', '')}</div>
                        ) : (
                          <span dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')}}></span>
                        )}
                        {i < msg.text.split('\n').length - 1 && <br/>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 shrink-0 bg-white/90 backdrop-blur-sm border-t border-slate-200/80">
            <div className="relative flex items-center gap-2">
              <input 
                type="text"
                placeholder="Ask your digital twin..." 
                className="flex-1 h-10 bg-slate-100/80 rounded-lg pl-3 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder-slate-400 border border-slate-200/80"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={!chatInput.trim()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 shrink-0 ${
                  chatInput.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

