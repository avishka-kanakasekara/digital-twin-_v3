import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/Tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface PersonalAnalyticsProps {
  analytics: any;
}

const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(15,23,42,0.96)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  fontSize: '12px',
  fontWeight: 700,
};

export const PersonalAnalytics: React.FC<PersonalAnalyticsProps> = ({ analytics }) => {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '24px',
      padding: '1.75rem',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 style={{
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#94a3b8',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
          }}>
            <BarChart3 size={14} style={{ color: '#a78bfa' }} /> Twin Analytics
          </h3>
          <p style={{ fontSize: '11px', color: '#475569' }}>Growth trends over time</p>
        </div>
      </div>

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
            <AreaChart data={analytics.productivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#a78bfa', fontWeight: 900 }}
                labelStyle={{ color: '#e2e8f0' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
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
            height: '280px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '16px',
            borderRadius: '16px',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.skillGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#e2e8f0', fontWeight: 700, marginBottom: '4px' }}
                itemStyle={{ fontWeight: 700 }}
                cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
              />
              <Line type="monotone" dataKey="ai" name="AI Skills" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#0f172a', stroke: '#22d3ee' }} activeDot={{ r: 6, fill: '#22d3ee', stroke: '#0f172a' }} />
              <Line type="monotone" dataKey="cloud" name="Cloud Architecture" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#0f172a', stroke: '#a78bfa' }} activeDot={{ r: 6, fill: '#a78bfa', stroke: '#0f172a' }} />
              <Line type="monotone" dataKey="leadership" name="Leadership" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#0f172a', stroke: '#fbbf24' }} activeDot={{ r: 6, fill: '#fbbf24', stroke: '#0f172a' }} />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};
