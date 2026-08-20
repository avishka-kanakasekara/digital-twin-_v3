import React from 'react';
import { Sparkles, BookOpen, Users, Briefcase } from 'lucide-react';

interface AIRecommendationsProps {
  recommendations: any[];
}

const TYPE_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Certification: {
    icon: <BookOpen size={15} />,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    border: 'rgba(14,165,233,0.25)',
  },
  Leadership: {
    icon: <Users size={15} />,
    color: '#d97706',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
  },
  Project: {
    icon: <Briefcase size={15} />,
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.12)',
    border: 'rgba(37,99,235,0.25)',
  },
};

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ recommendations }) => {
  if (!recommendations?.length) {
    return <div className="pd-empty">No recommendations yet. Keep updating your twin to unlock suggestions.</div>;
  }

  return (
    <div className="pd-rec-list">
      {recommendations.map((rec) => {
        const style = TYPE_STYLES[rec.type] || {
          icon: <Sparkles size={15} />,
          color: '#64748b',
          bg: 'rgba(248,250,252,0.95)',
          border: 'rgba(226,232,240,0.85)',
        };

        return (
          <div key={rec.id || rec.text} className="pd-rec-item">
            <div
              className="pd-rec-item__icon"
              style={{ background: style.bg, borderColor: style.border, color: style.color }}
            >
              {style.icon}
            </div>
            <div className="flex-1 min-w-0">
              {rec.type ? (
                <span
                  className="pd-rec-item__type"
                  style={{ background: style.bg, color: style.color, borderColor: style.border }}
                >
                  {rec.type}
                </span>
              ) : null}
              <p className="pd-rec-item__text">{rec.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
