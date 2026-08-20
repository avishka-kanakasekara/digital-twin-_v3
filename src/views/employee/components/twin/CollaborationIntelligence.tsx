import React from 'react';
import { Users, Lightbulb } from 'lucide-react';

interface CollaborationIntelligenceProps {
  intel: any;
}

export const CollaborationIntelligence: React.FC<CollaborationIntelligenceProps> = ({ intel }) => {
  const stats = intel?.stats || {};
  const statRows = [
    {
      label: 'Availability', value: stats.availability || 'Not set',
      color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)',
    },
    {
      label: 'Best Comms', value: stats.bestCommunication || 'Async',
      color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)',
    },
    {
      label: 'Reputation', value: stats.reputation || 'Building',
      color: '#d97706', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)',
    },
  ];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.9)',
      border: '1px solid rgba(226, 232, 240, 0.9)',
      borderRadius: '20px',
      padding: '1.5rem',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <h3 style={{
        fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: '#94a3b8',
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '4px',
      }}>
        <Users size={14} style={{ color: '#22d3ee' }} /> Collaboration Intel
      </h3>
      <p style={{ fontSize: '11px', color: '#475569', marginBottom: '18px' }}>
        How your AI Twin represents you to the org
      </p>

      {/* Twin Status */}
      <div style={{
        padding: '14px', borderRadius: '14px', marginBottom: '14px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h4 style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '10px' }}>
          Twin Status
        </h4>
        <div className="space-y-2">
          {statRows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
              <span style={{
                padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 800,
                background: row.bg, color: row.color, border: `1px solid ${row.border}`,
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Colleague Queries */}
      <div style={{ marginBottom: '14px' }}>
        <h4 style={{
          fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px',
        }}>
          <Lightbulb size={11} style={{ color: '#fbbf24' }} /> Colleague Queries
        </h4>
        <div className="space-y-2">
          {(intel?.questions || []).map((q: string, i: number) => (
            <div key={i} style={{
              fontSize: '11px', color: '#94a3b8',
              padding: '10px 12px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: '6px', lineHeight: 1.4,
            }}>
              <span style={{ color: '#22d3ee', fontWeight: 800, flexShrink: 0 }}>Q:</span>
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
