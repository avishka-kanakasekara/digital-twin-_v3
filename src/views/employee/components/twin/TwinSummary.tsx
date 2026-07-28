import React from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface TwinSummaryProps {
  summary: any;
}

export const TwinSummary: React.FC<TwinSummaryProps> = ({ summary }) => {
  const bars = [
    { label: 'AI Confidence', value: summary.aiConfidence, icon: <ShieldCheck size={12} />, color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
    { label: 'Completeness', value: summary.profileCompleteness, icon: <Zap size={12} />, color: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
  ];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.8)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      borderRadius: '20px',
      padding: '1.5rem',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 style={{
          fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: '#64748b',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Sparkles size={14} style={{ color: '#3b82f6' }} />
          Digital Twin Status
        </h3>
        <span style={{
          padding: '3px 10px', borderRadius: '99px', fontSize: '10px',
          fontWeight: 700, color: '#34d399',
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.3)',
        }}>
          {summary.knowledgeFreshness}
        </span>
      </div>

      {/* Summary Quote */}
      <div style={{
        padding: '14px 16px',
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderLeft: '3px solid #3b82f6',
        borderRadius: '12px',
        marginBottom: '16px',
      }}>
        <p style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', lineHeight: 1.6 }}>
          "{summary.summaryText}"
        </p>
      </div>

      {/* Metric Bars */}
      <div className="space-y-4">
        {bars.map((bar, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <span style={{
                fontSize: '10px', fontWeight: 700, color: '#475569',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <span style={{ color: bar.color }}>{bar.icon}</span>
                {bar.label}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{bar.value}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(226, 232, 240, 0.8)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${bar.value}%`,
                background: `linear-gradient(90deg, ${bar.color} 0%, ${bar.color}aa 100%)`,
                borderRadius: '99px',
                boxShadow: `0 0 8px ${bar.glow}`,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
