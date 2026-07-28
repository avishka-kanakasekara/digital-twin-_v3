import React, { useState } from 'react';
import { MapPin, Briefcase, Activity, Clock, Edit, CheckCircle2, Sparkles, Shield, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/Tabs';

interface IdentityProfileProps {
  profile: any;
  onUpdate: (updates: any) => void;
  twinHealth: number;
}

export const IdentityProfile: React.FC<IdentityProfileProps> = ({ profile, onUpdate, twinHealth }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(profile);

  const handleSave = () => {
    onUpdate(editForm);
    setIsEditOpen(false);
  };

  const stats = [
    { label: 'Twin Health', value: `${twinHealth}%`, icon: <Shield size={14} />, color: '#10b981' },
    { label: 'AI Score', value: '92/100', icon: <Sparkles size={14} />, color: '#3b82f6' },
    { label: 'Impact Rank', value: 'Top 5%', icon: <Zap size={14} />, color: '#f59e0b' },
  ];

  return (
    <>
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(255,255,255,0.9) 40%, rgba(139,92,246,0.06) 100%)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          borderRadius: '24px',
          padding: '2rem 2.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 0 40px rgba(59,130,246,0.08)',
        }}
      >
        {/* Background Glow Accents */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '200px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">

          {/* Avatar */}
          <div className="relative shrink-0">
            {/* Glow Ring */}
            <div style={{
              position: 'absolute', inset: '-4px', borderRadius: '28px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #10b981 100%)',
              padding: '3px',
              filter: 'blur(0px)',
              boxShadow: '0 0 25px rgba(59,130,246,0.2)',
            }} />
            <div style={{
              position: 'relative',
              width: '100px', height: '100px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              border: '3px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 900, color: 'white',
              boxShadow: '0 8px 30px rgba(59,130,246,0.2)',
            }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '21px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 100%)',
              }} />
              <span style={{ position: 'relative', zIndex: 1 }}>{profile.initials}</span>
            </div>
            {/* Online Indicator */}
            <div style={{
              position: 'absolute', bottom: '-4px', right: '-4px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#10b981',
              border: '3px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 10px rgba(16,185,129,0.4)',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'white', animation: 'pulse 2s infinite',
              }} />
            </div>
          </div>

          {/* Identity Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span style={{
                padding: '2px 10px', borderRadius: '99px', fontSize: '10px',
                fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#3b82f6',
              }}>
                ✦ Verified Digital Twin
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              background: 'linear-gradient(90deg, #0f172a 0%, #334155 60%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: '8px',
            }}>
              {profile.fullName}
            </h2>

            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginBottom: '16px', maxWidth: '480px' }}>
              {profile.headline}
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { icon: <Briefcase size={12} />, label: profile.role },
                { icon: <Activity size={12} />, label: profile.department },
                { icon: <MapPin size={12} />, label: profile.location },
                { icon: <Clock size={12} />, label: profile.timezone },
              ].map((item, i) => (
                <span key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  color: '#475569',
                }}>
                  <span style={{ color: '#3b82f6' }}>{item.icon}</span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Stats + Actions */}
          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
            {/* Stat Pills */}
            <div className="flex md:flex-col gap-3">
              {stats.map((stat, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '14px', flex: 1,
                  background: 'rgba(255,255,255,0.7)',
                  border: `1px solid ${stat.color}40`,
                  boxShadow: `0 0 15px ${stat.color}20`,
                }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: `${stat.color}20`, color: stat.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {stat.label}
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center justify-center gap-2 w-full"
              style={{
                padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                color: '#64748b', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Edit size={13} />
              Edit Profile
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
