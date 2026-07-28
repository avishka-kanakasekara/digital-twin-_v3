import React from 'react';
import { Sparkles, ArrowRight, BookOpen, Users, Briefcase } from 'lucide-react';

interface AIRecommendationsProps {
  recommendations: any[];
}

const TYPE_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Certification: {
    icon: <BookOpen size={15} />,
    color: '#22d3ee',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.25)',
  },
  Leadership: {
    icon: <Users size={15} />,
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
  },
  Project: {
    icon: <Briefcase size={15} />,
    color: '#a78bfa',
    bg: 'rgba(124,58,237,0.12)',
    border: 'rgba(124,58,237,0.25)',
  },
};

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ recommendations }) => {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      padding: '1.5rem',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <h3 style={{
        fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: '#94a3b8',
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '16px',
      }}>
        <Sparkles size={14} style={{ color: '#a78bfa' }} />
        Intelligent Recommendations
      </h3>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const style = TYPE_STYLES[rec.type] || {
            icon: <Sparkles size={15} />, color: '#94a3b8',
            bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)',
          };

          return (
            <div
              key={rec.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              className="hover:bg-white/[0.06] group/rec"
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: style.bg,
                border: `1px solid ${style.border}`,
                color: style.color,
              }}>
                {style.icon}
              </div>

              <div style={{ flex: 1 }}>
                <span style={{
                  display: 'inline-block',
                  marginBottom: '6px',
                  padding: '2px 8px', borderRadius: '99px',
                  fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: style.bg, color: style.color,
                  border: `1px solid ${style.border}`,
                }}>
                  {rec.type}
                </span>
                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.55, fontWeight: 500 }}>
                  {rec.text}
                </p>
              </div>

              <ArrowRight
                size={13}
                style={{ color: '#475569', flexShrink: 0, marginTop: '11px', transition: 'all 0.2s' }}
                className="group-hover/rec:text-white group-hover/rec:translate-x-0.5"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
