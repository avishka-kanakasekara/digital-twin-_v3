import React, { useState, useEffect } from 'react';
import { MapPin, Briefcase, Activity, Clock, Edit, CheckCircle2, Shield, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/Tabs';
import '../../PersonalDashboard.css';

interface IdentityProfileProps {
  profile: any;
  onUpdate: (updates: any) => void;
  twinHealth?: number;
  gamification?: any;
}

export const IdentityProfile: React.FC<IdentityProfileProps> = ({ profile, onUpdate, twinHealth = 0, gamification = {} }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(profile);

  useEffect(() => {
    setEditForm(profile);
  }, [profile, isEditOpen]);

  const handleSave = () => {
    onUpdate(editForm);
    setIsEditOpen(false);
  };

  const calculatedHealth = twinHealth > 0 ? twinHealth : 94;
  const calculatedDepth = Math.round(gamification?.aiScore || twinHealth || 0) > 0 ? Math.round(gamification.aiScore || twinHealth || 0) : 92;
  const calculatedBenchmark = gamification?.impactRank && gamification.impactRank !== 'Unranked' ? gamification.impactRank : 'Top 12%';

  const stats = [
    { label: 'Twin Integrity', value: `${calculatedHealth}%`, icon: <Shield size={13} />, color: '#10b981' },
    { label: 'Profile Depth', value: `${calculatedDepth}%`, icon: <CheckCircle2 size={13} />, color: '#3b82f6' },
    { label: 'Talent Benchmark', value: calculatedBenchmark, icon: <Zap size={13} />, color: '#f59e0b' },
  ];

  return (
    <>
      {/* Executive Professional Profile Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs w-full">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full text-left">
          {/* Left: Avatar + Profile Details */}
          <div className="flex items-center gap-4 min-w-0 flex-1 text-left">
            {/* Executive Corporate Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs border-2 border-white">
                {profile.initials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" title="Active Digital Twin" />
            </div>

            {/* Profile Details */}
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <CheckCircle2 size={10} /> Enterprise Digital Twin Active
                </span>
                <span className="text-[10px] font-bold text-slate-400">ID: {profile.id || 'EMP-1042'}</span>
              </div>

              <h2 className="text-lg font-black text-slate-900 tracking-tight text-left">
                {profile.fullName}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5 text-left">
                {profile.headline || `${profile.role} • ${profile.department}`}
              </p>

              {/* Corporate Meta Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[
                  { icon: <Briefcase size={11} />, label: profile.role || 'Platform Architect' },
                  { icon: <Activity size={11} />, label: profile.department || 'Engineering & AI' },
                  { icon: <MapPin size={11} />, label: profile.location || 'Colombo, LK' },
                  { icon: <Clock size={11} />, label: profile.timezone || 'Asia/Colombo' },
                ].map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-600 text-[11px] font-bold"
                  >
                    <span className="text-blue-600">{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: 3 Metric Badges + Edit Button in One Clean Row */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 w-full xl:w-auto justify-between xl:justify-end">
            <div className="flex items-center gap-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-start min-w-[88px] text-left"
                >
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <span className="text-xs font-black text-slate-900 mt-0.5 flex items-center gap-1">
                    <span style={{ color: stat.color }}>{stat.icon}</span>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all hover:border-slate-300 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Edit size={12} />
              <span>Edit Blueprint</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden" style={{
          background: 'white',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          borderRadius: '24px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
          color: '#0f172a',
        }}>
          <DialogHeader className="p-6 pb-4" style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <DialogTitle className="text-xl font-black flex items-center gap-2" style={{ color: '#0f172a' }}>
              <Edit size={18} style={{ color: '#3b82f6' }} /> Edit Digital Identity
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3 p-1 rounded-xl" style={{
                background: 'rgba(241, 245, 249, 0.8)',
              }}>
                <TabsTrigger value="basic" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all" style={{ color: '#64748b' }}>Basic Info</TabsTrigger>
                <TabsTrigger value="professional" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all" style={{ color: '#64748b' }}>Professional</TabsTrigger>
                <TabsTrigger value="biography" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all" style={{ color: '#64748b' }}>Biography</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 min-h-[300px]">
              <TabsContent value="basic" className="space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', key: 'fullName', type: 'text' },
                    { label: 'Email', key: 'email', type: 'text' },
                    { label: 'Phone', key: 'phone', type: 'text' },
                    { label: 'Location', key: 'location', type: 'text' },
                  ].map(field => (
                    <div key={field.key} className="space-y-2">
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</label>
                      <input
                        type={field.type}
                        value={editForm[field.key] || ''}
                        onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl text-sm font-semibold outline-none transition-all"
                        style={{
                          background: 'rgba(248, 250, 252, 0.8)',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          color: '#0f172a',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="professional" className="space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Role', key: 'role' },
                    { label: 'Department', key: 'department' },
                  ].map(field => (
                    <div key={field.key} className="space-y-2">
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</label>
                      <input
                        type="text"
                        value={editForm[field.key] || ''}
                        onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl text-sm font-semibold outline-none transition-all"
                        style={{ background: 'rgba(248, 250, 252, 0.8)', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#0f172a' }}
                      />
                    </div>
                  ))}
                  <div className="col-span-2 space-y-2">
                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Professional Headline</label>
                    <input
                      type="text"
                      value={editForm.headline || ''}
                      onChange={e => setEditForm({ ...editForm, headline: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl text-sm font-semibold outline-none transition-all"
                      style={{ background: 'rgba(248, 250, 252, 0.8)', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#0f172a' }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="biography" className="m-0">
                <div className="space-y-2 h-full">
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Biography</label>
                  <textarea
                    value={editForm.biography || ''}
                    onChange={e => setEditForm({ ...editForm, biography: e.target.value })}
                    className="w-full h-48 p-4 rounded-xl text-sm font-semibold outline-none resize-none leading-relaxed transition-all"
                    style={{ background: 'rgba(248, 250, 252, 0.8)', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#0f172a' }}
                  />
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="p-4" style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <button
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(248, 250, 252, 0.8)', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#64748b', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: 'white', cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(59,130,246,0.25)',
                }}
              >
                <CheckCircle2 size={14} /> Save Changes
              </button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
