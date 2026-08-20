import React from 'react';
import { BarChart3, TrendingUp, Brain, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/Tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PersonalAnalyticsProps {
  analytics: any;
  personalAnalyticsAI: any;
}

const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid rgba(226,232,240,0.9)',
  background: '#ffffff',
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  fontSize: '12px',
  fontWeight: 700,
};

export const PersonalAnalytics: React.FC<PersonalAnalyticsProps> = ({ analytics, personalAnalyticsAI }) => {
  const aiData = personalAnalyticsAI;
  const loading = !aiData && !analytics;

  const productivityData = aiData?.productivity_trends?.map((t: any) => ({
    day: t.period,
    score: t.score,
  })) || analytics?.productivity || [];

  const insights = aiData?.insights || [];
  const recommendations = Array.isArray(aiData?.recommendations) ? aiData.recommendations : [];
  const overallScore = aiData?.overall_score || analytics?.overall_score || 0;

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const getImpactBorder = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'productivity': return <TrendingUp size={14} />;
      case 'skills': return <Brain size={14} />;
      case 'projects': return <CheckCircle size={14} />;
      default: return <Sparkles size={14} />;
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '1.75rem',
        backdropFilter: 'blur(20px)',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" size={32} style={{ color: '#a78bfa' }} />
          <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Generating AI Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.9)',
      border: '1px solid rgba(226, 232, 240, 0.9)',
      borderRadius: '24px',
      padding: '1.75rem',
    }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 style={{
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#94a3b8',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
          }}>
            <BarChart3 size={14} style={{ color: '#a78bfa' }} /> AI-Powered Analytics
          </h3>
          <p style={{ fontSize: '11px', color: '#475569' }}>Real insights from your documents, projects & skills</p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          padding: '8px 16px',
          borderRadius: '12px',
          color: 'white',
          fontWeight: 800,
          fontSize: '14px',
        }}>
          {overallScore}/100
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mb-6">
          <h4 style={{
            fontSize: '12px', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: '#0f172a', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '24px', height: '24px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={12} style={{ color: 'white' }} />
            </div>
            AI-Generated Insights
          </h4>
          <div className="flex flex-col gap-4">
            {insights.map((insight: any, idx: number) => (
              <div
                key={idx}
                style={{
                  background: '#f8fafc',
                  border: `2px solid ${getImpactBorder(insight.impact)}`,
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: '12px',
                  background: getImpactColor(insight.impact),
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {getCategoryIcon(insight.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span style={{
                      fontSize: '14px', fontWeight: 900, color: '#1e293b',
                      letterSpacing: '-0.02em',
                    }}>
                      {insight.title}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                      padding: '4px 12px', borderRadius: '20px',
                      color: 'white',
                      background: getImpactColor(insight.impact),
                    }}>
                      {insight.impact} Impact
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, fontWeight: 500 }}>
                    {insight.description}
                  </p>
                  {insight.actionable && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <CheckCircle size={14} style={{ color: '#10b981' }} />
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                        Actionable Insight
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h4 style={{
            fontSize: '12px', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: '#0f172a', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '24px', height: '24px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={12} style={{ color: 'white' }} />
            </div>
            AI Recommendations
          </h4>
          <div className="flex flex-col gap-3">
            {recommendations.map((rec: string, idx: number) => (
              <div
                key={idx}
                style={{
                  background: '#f8fafc',
                  border: '2px solid #10b981',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '8px',
                  background: '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CheckCircle size={16} />
                </div>
                <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600, lineHeight: 1.5 }}>
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="productivity" className="w-full">
        <TabsList
          className="grid w-full grid-cols-2 mb-5 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <TabsTrigger
            value="productivity"
            className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all"
            style={{ color: '#94a3b8' }}
          >
            Productivity
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all"
            style={{ color: '#94a3b8' }}
          >
            Skill Evolution
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="productivity"
          className="m-0 rounded-xl"
          style={{
            height: '280px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '16px',
            borderRadius: '16px',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={productivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#7c3aed', fontWeight: 900 }}
                labelStyle={{ color: '#0f172a' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#a78bfa"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#prodGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent
          value="skills"
          className="m-0"
          style={{
            height: 'auto',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '20px',
            borderRadius: '16px',
          }}
        >
          <div className="flex flex-col gap-4">
            {aiData?.skill_growth?.map((skill: any, idx: number) => {
              const currentPct = skill.current_level <= 10 ? skill.current_level * 10 : skill.current_level;
              const targetPct = skill.target_level <= 10 ? skill.target_level * 10 : skill.target_level;
              return (
              <div
                key={skill.skill_name}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '48px', height: '48px',
                      borderRadius: '12px',
                      background: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'][idx % 6],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ffffff', fontWeight: 800, fontSize: '14px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}>
                      {skill.skill_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b', display: 'block', letterSpacing: '-0.02em' }}>
                        {skill.skill_name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                        {skill.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{
                      fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                      padding: '6px 12px', borderRadius: '16px',
                      color: '#ffffff',
                      background: skill.trajectory === 'Rising' ? '#10b981' : skill.trajectory === 'Declining' ? '#ef4444' : '#64748b',
                    }}>
                      {skill.trajectory}
                    </span>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>
                      {currentPct}%
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div style={{
                    height: '16px',
                    background: '#e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '2px solid #cbd5e1',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: '#1e293b',
                      left: `${targetPct}%`,
                      zIndex: 2,
                    }} />
                    <div style={{
                      height: '100%',
                      width: `${currentPct}%`,
                      background: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'][idx % 6],
                      borderRadius: '8px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                      Target: <span style={{ color: '#1e293b', fontWeight: 800 }}>{targetPct}%</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                      Growth: <span style={{ color: skill.growth_rate > 0 ? '#10b981' : '#ef4444', fontWeight: 800 }}>{skill.growth_rate > 0 ? '+' : ''}{skill.growth_rate}%</span>
                    </div>
                  </div>
                  {skill.recent_projects && skill.recent_projects.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      Used in: <span style={{ color: '#1e293b' }}>{skill.recent_projects.slice(0, 2).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
