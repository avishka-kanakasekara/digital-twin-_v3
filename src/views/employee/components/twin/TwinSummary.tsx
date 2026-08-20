import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

interface TwinSummaryProps {
  summary: any;
}

export const TwinSummary: React.FC<TwinSummaryProps> = ({ summary }) => {
  if (!summary) {
    return <div className="pd-empty">Twin status will appear once your profile loads.</div>;
  }

  const aiConfidence = summary.aiConfidence ?? summary.ai_confidence ?? 0;
  const completeness = summary.profileCompleteness ?? summary.profile_completeness ?? 0;
  const freshness = summary.knowledgeFreshness ?? summary.knowledge_freshness ?? 'Unknown';
  const health = summary.twinHealth ?? summary.twin_health ?? Math.round(aiConfidence);
  const text = summary.summaryText ?? summary.summary_text ?? '';

  const metrics = [
    { label: 'Twin health', value: `${health}%` },
    { label: 'AI confidence', value: `${aiConfidence}%` },
    { label: 'Completeness', value: `${completeness}%` },
    { label: 'Freshness', value: freshness },
  ];

  const bars = [
    { label: 'AI confidence', value: aiConfidence, icon: <ShieldCheck size={13} />, color: '#10b981' },
    { label: 'Profile completeness', value: completeness, icon: <Zap size={13} />, color: '#0ea5e9' },
  ];

  return (
    <div>
      <div className="pd-metric-cards">
        {metrics.map((m) => (
          <div key={m.label} className="pd-metric-card">
            <p className="pd-metric-card__label">{m.label}</p>
            <p className="pd-metric-card__value">{m.value}</p>
          </div>
        ))}
      </div>

      {text ? (
        <div className="pd-quote">
          <p>&ldquo;{text}&rdquo;</p>
        </div>
      ) : null}

      <div className="pd-progress-list">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="pd-progress-row__head">
              <span className="pd-progress-row__label">
                <span style={{ color: bar.color }}>{bar.icon}</span>
                {bar.label}
              </span>
              <span className="pd-progress-row__value">{bar.value}%</span>
            </div>
            <div className="pd-progress-track">
              <div
                className="pd-progress-fill"
                style={{
                  width: `${Math.min(100, Number(bar.value) || 0)}%`,
                  background: `linear-gradient(90deg, ${bar.color}, ${bar.color}aa)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
