import React from 'react';
import { Users, Lightbulb, PieChart, Target, ShieldAlert } from 'lucide-react';

interface CollaborationIntelligenceProps {
  intel: any;
  prediction: any;
}

export const CollaborationIntelligence: React.FC<CollaborationIntelligenceProps> = ({ intel, prediction }) => {
  const statRows = [
    {
      label: 'Availability', value: intel.stats.availability,
      color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)',
    },
    {
      label: 'Best Comms', value: intel.stats.bestCommunication,
      color: '#a78bfa', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)',
    },
    {
      label: 'Reputation', value: intel.stats.reputation,
      color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)',
    },
  ];

  const predBars = [
    { label: 'Skill Match', value: prediction.skillMatch, color: '#a78bfa', glow: 'rgba(124,58,237,0.4)' },
    { label: 'Domain Match', value: prediction.domainMatch, color: '#fbbf24', glow: 'rgba(245,158,11,0.4)' },
  ];

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
          {intel.questions.map((q: string, i: number) => (
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

      {/* Success Prediction */}
      <div style={{
        padding: '16px', borderRadius: '16px',
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
      }}>
        <h4 style={{
          fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '12px',
        }}>
          <PieChart size={11} style={{ color: '#a78bfa' }} /> Success Prediction
        </h4>

        <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
          Target Initiative
        </p>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {prediction.hypotheticalProject}
        </p>

        {/* Big probability circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(16,185,129,0.12)',
            border: '3px solid rgba(16,185,129,0.4)',
            boxShadow: '0 0 25px rgba(16,185,129,0.25)',
          }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
              {prediction.successProbability}%
            </span>
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>
              Probability
            </span>
          </div>
        </div>

        {/* Match bars */}
        <div className="space-y-3">
          {predBars.map((bar, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {bar.label}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: bar.color }}>{bar.value}%</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${bar.value}%`,
                  background: bar.color, borderRadius: '99px',
                  boxShadow: `0 0 8px ${bar.glow}`,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Risk / Contribution chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            padding: '10px 8px', borderRadius: '12px', textAlign: 'center',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <ShieldAlert size={15} style={{ color: '#10b981', margin: '0 auto 4px' }} />
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Risk Level</p>
            <p style={{ fontSize: '12px', fontWeight: 900, color: '#10b981' }}>{prediction.riskLevel}</p>
          </div>
          <div style={{
            padding: '10px 8px', borderRadius: '12px', textAlign: 'center',
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
          }}>
            <Target size={15} style={{ color: '#22d3ee', margin: '0 auto 4px' }} />
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Contribution</p>
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#22d3ee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {prediction.expectedContribution.split(' ')[0]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
