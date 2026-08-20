import React from 'react';
import { Lightbulb } from 'lucide-react';

interface CollaborationIntelligenceProps {
  intel: any;
}

export const CollaborationIntelligence: React.FC<CollaborationIntelligenceProps> = ({ intel }) => {
  const stats = intel?.stats || {};
  const rows = [
    {
      label: 'Availability',
      value: stats.availability || 'Not set',
      color: '#059669',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.25)',
    },
    {
      label: 'Best communication',
      value: stats.bestCommunication || 'Async',
      color: '#2563eb',
      bg: 'rgba(37,99,235,0.12)',
      border: 'rgba(37,99,235,0.25)',
    },
    {
      label: 'Reputation',
      value: stats.reputation || 'Building',
      color: '#d97706',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.25)',
    },
  ];

  const questions = intel?.questions || [];

  return (
    <div>
      <div className="pd-collab-rows">
        {rows.map((row) => (
          <div key={row.label} className="pd-collab-row">
            <span className="pd-collab-row__label">{row.label}</span>
            <span
              className="pd-collab-row__value"
              style={{ background: row.bg, color: row.color, borderColor: row.border }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <>
          <p className="pd-section__sub mb-2 flex items-center gap-1.5">
            <Lightbulb size={12} className="text-warning" /> Colleague queries your twin can answer
          </p>
          <div className="pd-qa-list">
            {questions.map((q: string, i: number) => (
              <div key={i} className="pd-qa-item">
                <span className="pd-qa-item__q">Q</span>
                <span>{q}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
