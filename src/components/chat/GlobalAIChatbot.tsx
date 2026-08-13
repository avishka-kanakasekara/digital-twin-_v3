import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, MessageCircle, Minimize2, Maximize2, Zap, Brain } from 'lucide-react';
import { useEmployee } from '../../contexts/EmployeeContext';
import { employeeAPI } from '../../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: Date;
}

export const GlobalAIChatbot: React.FC = () => {
  const { currentEmployee } = useEmployee();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hey there! 👋 I\'m your AI Twin Assistant — powered by your skills, projects, and uploaded documents. Ask me anything about your career or let me help craft professional content!',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Stop pulse after first open
  useEffect(() => {
    if (isOpen) setShowPulse(false);
  }, [isOpen]);

  const handleSend = async () => {
    if (!chatInput.trim() || !currentEmployee) return;

    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const response = await employeeAPI.sendAIChatMessage(
        currentEmployee.id,
        userMessage,
        messages.map(m => ({ role: m.role, content: m.content }))
      );
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Oops! Something went wrong. Please try again in a moment. 🔄',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (text: string) => {
    setChatInput(text);
    setTimeout(() => {
      if (text.trim() && currentEmployee) {
        setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
        setChatInput('');
        setIsLoading(true);

        employeeAPI.sendAIChatMessage(
          currentEmployee.id,
          text,
          messages.map(m => ({ role: m.role, content: m.content }))
        ).then(response => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response.response,
            sources: response.sources,
            timestamp: new Date(),
          }]);
        }).catch(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Oops! Something went wrong. Please try again. 🔄',
            timestamp: new Date(),
          }]);
        }).finally(() => {
          setIsLoading(false);
        });
      }
    }, 0);
  };

  const suggestions = [
    { icon: <Sparkles size={12} />, text: "Generate a professional bio", color: '#f59e0b' },
    { icon: <Zap size={12} />, text: "What are my strongest skills?", color: '#10b981' },
    { icon: <Brain size={12} />, text: "Suggest my next career move", color: '#8b5cf6' },
    { icon: <MessageCircle size={12} />, text: "Summarize my projects", color: '#3b82f6' },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const chatWidth = isExpanded ? '520px' : '420px';
  const chatHeight = isExpanded ? '680px' : '560px';

  return (
    <>
      {/* ===== FLOATING ACTION BUTTON ===== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        className="global-chat-fab"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 9999,
          width: isButtonHovered ? '64px' : '60px',
          height: isButtonHovered ? '64px' : '60px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen
            ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a855f7 100%)',
          boxShadow: isButtonHovered
            ? '0 0 0 4px rgba(139, 92, 246, 0.2), 0 8px 32px rgba(139, 92, 246, 0.45), 0 4px 12px rgba(0,0,0,0.15)'
            : '0 4px 20px rgba(139, 92, 246, 0.35), 0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isButtonHovered ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        {/* Pulse rings */}
        {showPulse && !isOpen && (
          <>
            <span style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: '2px solid rgba(139, 92, 246, 0.4)',
              animation: 'chatPulseRing 2s ease-out infinite',
            }} />
            <span style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
              border: '2px solid rgba(139, 92, 246, 0.2)',
              animation: 'chatPulseRing 2s ease-out infinite 0.5s',
            }} />
          </>
        )}

        <div style={{
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {isOpen ? (
            <X size={24} color="white" strokeWidth={2.5} />
          ) : (
            <Bot size={26} color="white" strokeWidth={2} />
          )}
        </div>

        {/* Notification badge */}
        {!isOpen && showPulse && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            border: '2px solid white',
            animation: 'chatBadgeBounce 2s ease-in-out infinite',
          }} />
        )}
      </button>

      {/* ===== CHAT WINDOW ===== */}
      {isOpen && (
        <div
          className="global-chat-window"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '28px',
            zIndex: 9998,
            width: chatWidth,
            maxWidth: 'calc(100vw - 56px)',
            height: chatHeight,
            maxHeight: 'calc(100vh - 140px)',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'chatWindowSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1)',
            transition: 'width 0.3s ease, height 0.3s ease',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a855f7 70%, #c084fc 100%)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Animated gradient overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
              animation: 'chatShimmer 3s ease-in-out infinite',
              pointerEvents: 'none',
            }} />

            {/* Avatar */}
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0,
            }}>
              <Bot size={22} color="white" strokeWidth={2} />
              {/* Active indicator */}
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #6366f1',
                animation: 'chatStatusPulse 2s ease-in-out infinite',
              }} />
            </div>

            {/* Title */}
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <h4 style={{
                color: 'white',
                fontWeight: 700,
                fontSize: '15px',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                margin: 0,
              }}>
                AI Twin Assistant
              </h4>
              <p style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: '11px',
                fontWeight: 600,
                marginTop: '2px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                {currentEmployee?.full_name || 'Your Digital Twin'} • Online
              </p>
            </div>

            {/* Header actions */}
            <div style={{ display: 'flex', gap: '4px', position: 'relative', zIndex: 1 }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: 'white',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
                }}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: 'white',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* ── Messages Area ── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(139,92,246,0.2) transparent',
          }}>
            {/* Welcome card for first message */}
            {messages.length === 1 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.06) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '4px',
              }}>
                <p style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6366f1',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Sparkles size={14} />
                  Quick Actions
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestion(s.text)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '12px',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        background: 'white',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${s.color}10`;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = `${s.color}40`;
                        (e.currentTarget as HTMLButtonElement).style.color = s.color;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 12px ${s.color}20`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'white';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(226, 232, 240, 0.8)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#475569';
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                      }}
                    >
                      <span style={{ color: s.color, display: 'flex' }}>{s.icon}</span>
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '10px',
                  animation: `chatMessageSlideIn 0.3s ease forwards`,
                  animationDelay: `${Math.min(idx * 60, 200)}ms`,
                  opacity: 0,
                }}
              >
                {/* AI Avatar */}
                {msg.role === 'assistant' && (
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginBottom: '4px',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                  }}>
                    <Bot size={16} color="white" strokeWidth={2.5} />
                  </div>
                )}

                {/* Message bubble */}
                <div style={{
                  maxWidth: '80%',
                  position: 'relative',
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '18px',
                    borderBottomLeftRadius: msg.role === 'assistant' ? '6px' : '18px',
                    borderBottomRightRadius: msg.role === 'user' ? '6px' : '18px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    fontWeight: 500,
                    ...(msg.role === 'user'
                      ? {
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                          color: 'white',
                          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                        }
                      : {
                          background: 'white',
                          color: '#334155',
                          border: '1px solid rgba(226, 232, 240, 0.6)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }
                    ),
                  }}>
                    {msg.content.split('\n').map((line: string, i: number) => (
                      <React.Fragment key={i}>
                        {line.startsWith('> ') ? (
                          <div style={{
                            paddingLeft: '10px',
                            borderLeft: '3px solid rgba(99, 102, 241, 0.3)',
                            color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : '#94a3b8',
                            fontStyle: 'italic',
                            margin: '4px 0',
                            fontSize: '12px',
                          }}>
                            {line.replace('> ', '')}
                          </div>
                        ) : (
                          <span dangerouslySetInnerHTML={{
                            __html: line.replace(
                              /\*\*(.*?)\*\*/g,
                              `<strong style="font-weight:700;color:${msg.role === 'user' ? '#ffffff' : '#1e293b'}"}>$1</strong>`
                            )
                          }} />
                        )}
                        {i < msg.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(226, 232, 240, 0.5)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sources:</span>
                        {msg.sources.map((source, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))',
                              color: '#6366f1',
                              fontSize: '10px',
                              fontWeight: 600,
                              border: '1px solid rgba(99, 102, 241, 0.15)',
                            }}
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    fontWeight: 500,
                    marginTop: '4px',
                    display: 'block',
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    paddingLeft: msg.role === 'assistant' ? '4px' : '0',
                    paddingRight: msg.role === 'user' ? '4px' : '0',
                  }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '10px',
                animation: 'chatMessageSlideIn 0.3s ease forwards',
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                }}>
                  <Bot size={16} color="white" strokeWidth={2.5} />
                </div>
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(226, 232, 240, 0.6)',
                  borderRadius: '18px',
                  borderBottomLeftRadius: '6px',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    animation: 'chatTypingDot 1.4s ease-in-out infinite',
                  }} />
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
                    animation: 'chatTypingDot 1.4s ease-in-out 0.2s infinite',
                  }} />
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a855f7, #e879f9)',
                    animation: 'chatTypingDot 1.4s ease-in-out 0.4s infinite',
                  }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div style={{
            padding: '16px 20px',
            background: 'white',
            borderTop: '1px solid rgba(226, 232, 240, 0.5)',
          }}>
            {/* Powered by line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginBottom: '10px',
            }}>
              <Sparkles size={10} style={{ color: '#c084fc' }} />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>
                Powered by your Digital Twin knowledge base
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              borderRadius: '16px',
              padding: '4px 4px 4px 18px',
              border: '1px solid rgba(226, 232, 240, 0.6)',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1), 0 2px 8px rgba(0,0,0,0.02)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask your digital twin..."
                aria-label="Chat message input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1e293b',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!chatInput.trim() || isLoading}
                aria-label="Send message"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: chatInput.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  flexShrink: 0,
                  ...(chatInput.trim() && !isLoading
                    ? {
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: 'white',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                        transform: 'scale(1)',
                      }
                    : {
                        background: 'transparent',
                        color: '#cbd5e1',
                        boxShadow: 'none',
                        transform: 'scale(0.9)',
                      }
                  ),
                }}
                onMouseEnter={e => {
                  if (chatInput.trim() && !isLoading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.45)';
                  }
                }}
                onMouseLeave={e => {
                  if (chatInput.trim() && !isLoading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.35)';
                  }
                }}
              >
                <Send size={16} style={{ marginLeft: '-1px' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== KEYFRAME ANIMATIONS ===== */}
      <style>{`
        @keyframes chatWindowSlideUp {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes chatMessageSlideIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes chatTypingDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }

        @keyframes chatPulseRing {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        @keyframes chatBadgeBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @keyframes chatShimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes chatStatusPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
        }

        .global-chat-window::-webkit-scrollbar {
          width: 4px;
        }
        .global-chat-window::-webkit-scrollbar-track {
          background: transparent;
        }
        .global-chat-window::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.2);
          border-radius: 4px;
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          .global-chat-window {
            right: 12px !important;
            left: 12px !important;
            bottom: 84px !important;
            width: auto !important;
            max-width: none !important;
            height: calc(100vh - 120px) !important;
            max-height: none !important;
            border-radius: 20px !important;
          }
          .global-chat-fab {
            bottom: 16px !important;
            right: 16px !important;
          }
        }
      `}</style>
    </>
  );
};
