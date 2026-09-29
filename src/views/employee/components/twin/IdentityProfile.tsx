import React, { useState, useEffect } from 'react';
import { MapPin, Briefcase, Activity, Clock, Edit, CheckCircle2, Sparkles, Shield, Zap } from 'lucide-react';
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

  const stats = [
    { label: 'Twin Health', value: `${twinHealth}%`, icon: <Shield size={14} />, color: '#10b981' },
    { label: 'Profile', value: `${Math.round(gamification.aiScore || twinHealth || 0)}%`, icon: <Sparkles size={14} />, color: '#3b82f6' },
    { label: 'Impact Rank', value: gamification.impactRank || 'Unranked', icon: <Zap size={14} />, color: '#f59e0b' },
  ];

  return (
    <>
      <div className="pd-hero">
        <div className="pd-hero__glow pd-hero__glow--tr" />
        <div className="pd-hero__glow pd-hero__glow--bl" />
        <div className="pd-hero__inner">
          <div className="pd-avatar">
            <div className="pd-avatar__ring" />
            <div className="pd-avatar__core">{profile.initials}</div>
            <div className="pd-avatar__live" />
          </div>

          <div className="pd-hero__main">
            <span className="pd-hero__kicker"><Sparkles size={12} /> Live digital twin</span>
            <h2 className="pd-hero__name">{profile.fullName}</h2>
            <p className="pd-hero__headline">{profile.headline}</p>
            <div className="pd-meta-row">
              {[
                { icon: <Briefcase size={12} />, label: profile.role },
                { icon: <Activity size={12} />, label: profile.department },
                { icon: <MapPin size={12} />, label: profile.location },
                { icon: <Clock size={12} />, label: profile.timezone },
              ].map((item, i) => (
                <span key={i} className="pd-meta-chip">
                  {item.icon} {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
            <div className="pd-stat-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="pd-stat">
                  <div className="pd-stat__icon" style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
                  <div>
                    <p className="pd-stat__label">{stat.label}</p>
                    <p className="pd-stat__value">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setIsEditOpen(true)} className="pd-edit-btn">
              <Edit size={13} /> Edit profile
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
