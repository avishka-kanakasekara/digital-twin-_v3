import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

interface AIReadinessProps {
  data: any;
}

export const AIReadiness: React.FC<AIReadinessProps> = ({ data }) => {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.8)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      borderRadius: '20px',
      padding: '1.5rem',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 style={{
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#64748b',
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '4px',
          }}>
            <Brain size={14} style={{ color: '#3b82f6' }} />
            AI Readiness Score
          </h3>
          <p style={{ fontSize: '11px', color: '#475569' }}>Maturity across 8 AI dimensions</p>
        </div>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(59,130,246,0.25)',
        }}>
          <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
            {data.overallScore}
          </span>
        </div>
      </div>

      {/* Radar Chart */}
      <div style={{ height: '220px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.breakdown}>
            <PolarGrid stroke="rgba(226, 232, 240, 0.8)" strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <defs>
              <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <Radar
              name="Readiness"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#readinessGrad)"
              fillOpacity={1}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                background: 'white',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                fontSize: '12px',
                fontWeight: 700,
              }}
              itemStyle={{ color: '#3b82f6' }}
              labelStyle={{ color: '#0f172a' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insight Box */}
      <div style={{
        marginTop: '12px',
        padding: '14px',
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: '14px',
      }}>
        <h4 style={{
          fontSize: '9px', fontWeight: 800, color: '#3b82f6',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px',
        }}>
          <Sparkles size={11} /> AI Insight
        </h4>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
          {data.recommendation.action}
        </p>
        <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
          {data.recommendation.message}
        </p>
        <div style={{
          marginTop: '10px', display: 'inline-block',
          padding: '3px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700,
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.25)',
          color: '#10b981',
        }}>
          Impact: {data.recommendation.impact}
        </div>
      </div>
    </div>
  );
};
