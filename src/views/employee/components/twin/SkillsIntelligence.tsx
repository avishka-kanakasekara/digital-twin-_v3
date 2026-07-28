import React, { useState } from 'react';
import { Network, Search, ShieldCheck, Sparkles, Cpu, Award, Zap, Flame, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SkillsIntelligenceProps {
  skillsData: any;
}

export const SkillsIntelligence: React.FC<SkillsIntelligenceProps> = ({ skillsData }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const allSkills = Object.values(skillsData).flat() as any[];
  const categories = ['All', ...Object.keys(skillsData)];

  const filteredSkills = allSkills.filter((s: any) =>
    (selectedCategory === 'All' || s.category === selectedCategory) &&
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSkills = allSkills.length;
  const expertCount = allSkills.filter((s: any) => s.proficiency >= 90).length;
  const avgProficiency = Math.round(allSkills.reduce((acc: number, s: any) => acc + s.proficiency, 0) / (totalSkills || 1));

  // Light-theme category card styles — clean on white glass
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'AI & ML':
        return {
          cardBg: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(99,102,241,0.04) 100%)',
          borderColor: 'rgba(124,58,237,0.25)',
          glowShadow: '0 8px 20px -5px rgba(124,58,237,0.1)',
          badgeBg: 'rgba(124,58,237,0.12)',
          badgeText: '#7c3aed',
          progressBar: 'linear-gradient(90deg, #7c3aed 0%, #9333ea 50%, #ec4899 100%)',
          progressGlow: '0 0 8px rgba(124,58,237,0.3)',
          accentColor: '#7c3aed',
          titleColor: '#0f172a',
        };
      case 'Engineering':
        return {
          cardBg: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(14,165,233,0.04) 100%)',
          borderColor: 'rgba(6,182,212,0.2)',
          glowShadow: '0 8px 20px -5px rgba(6,182,212,0.1)',
          badgeBg: 'rgba(6,182,212,0.12)',
          badgeText: '#06b6d4',
          progressBar: 'linear-gradient(90deg, #06b6d4 0%, #2563eb 100%)',
          progressGlow: '0 0 8px rgba(6,182,212,0.3)',
          accentColor: '#06b6d4',
          titleColor: '#0f172a',
        };
      case 'Product':
        return {
          cardBg: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.04) 100%)',
          borderColor: 'rgba(16,185,129,0.2)',
          glowShadow: '0 8px 20px -5px rgba(16,185,129,0.1)',
          badgeBg: 'rgba(16,185,129,0.12)',
          badgeText: '#10b981',
          progressBar: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          progressGlow: '0 0 8px rgba(16,185,129,0.3)',
          accentColor: '#10b981',
          titleColor: '#0f172a',
        };
      case 'Leadership':
        return {
          cardBg: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.04) 100%)',
          borderColor: 'rgba(245,158,11,0.2)',
          glowShadow: '0 8px 20px -5px rgba(245,158,11,0.1)',
          badgeBg: 'rgba(245,158,11,0.12)',
          badgeText: '#f59e0b',
          progressBar: 'linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)',
          progressGlow: '0 0 8px rgba(245,158,11,0.3)',
          accentColor: '#f59e0b',
          titleColor: '#0f172a',
        };
      default:
        return {
          cardBg: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(236,72,153,0.04) 100%)',
          borderColor: 'rgba(168,85,247,0.2)',
          glowShadow: '0 8px 20px -5px rgba(168,85,247,0.1)',
          badgeBg: 'rgba(168,85,247,0.12)',
          badgeText: '#a855f7',
          progressBar: 'linear-gradient(90deg, #a855f7 0%, #d946ef 100%)',
          progressGlow: '0 0 8px rgba(168,85,247,0.3)',
          accentColor: '#a855f7',
          titleColor: '#0f172a',
        };
    }
  };

  return (
    <div
      className="rounded-3xl relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.8)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        padding: '1.75rem',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Ambient Orbs */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(30px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(30px)',
      }} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-7 relative z-10">
        <div className="flex items-center gap-4">
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #d946ef 100%)',
            boxShadow: '0 0 20px rgba(59,130,246,0.25)',
          }}>
            <Network size={22} style={{ color: 'white' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Skill DNA Matrix
              </h3>
              <span style={{
                padding: '2px 10px', borderRadius: '99px', fontSize: '9px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                color: 'white',
              }}>
                AI Verified
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Real-time neural competency mapping & expert proficiencies
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Quick Stats */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '10px 16px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
              <Cpu size={14} style={{ color: '#7c3aed' }} /> {totalSkills} <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b' }}>Skills</span>
            </span>
            <div style={{ width: '1px', height: '16px', background: 'rgba(226, 232, 240, 0.8)' }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
              <Award size={14} style={{ color: '#f59e0b' }} /> {expertCount} <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b' }}>Experts</span>
            </span>
            <div style={{ width: '1px', height: '16px', background: 'rgba(226, 232, 240, 0.8)' }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
              <Zap size={14} style={{ color: '#10b981' }} /> {avgProficiency}% <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b' }}>Avg</span>
            </span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
            <Search size={14} style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: '#7c3aed',
            }} />
            <input
              type="text"
              placeholder="Search Skill DNA..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', height: '38px',
                paddingLeft: '36px', paddingRight: searchQuery ? '36px' : '12px',
                borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(248, 250, 252, 0.8)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                color: '#0f172a', outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                  width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#94a3b8',
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-6 relative z-10">
        {categories.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 16px', borderRadius: '99px', fontSize: '11px', fontWeight: 800,
                background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(255,255,255,0.7)',
                color: isActive ? 'white' : '#64748b',
                border: isActive ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: isActive ? '0 0 15px rgba(59,130,246,0.25)' : 'none',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              {cat === 'All' && <Sparkles size={12} style={{ color: isActive ? '#fde68a' : '#64748b' }} />}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Skill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <AnimatePresence>
          {filteredSkills.map((skill, index) => {
            const style = getCategoryStyles(skill.category);
            const isExpert = skill.proficiency >= 90;
            return (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                className="relative overflow-hidden"
                style={{
                  padding: '18px 18px 16px',
                  borderRadius: '18px',
                  background: style.cardBg,
                  border: `1px solid ${style.borderColor}`,
                  boxShadow: style.glowShadow,
                  transition: 'all 0.2s',
                }}
              >
                {/* Top gradient accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: style.progressBar,
                }} />

                {/* Skill Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: style.titleColor }}>
                      {skill.name}
                    </h4>
                    {skill.verified && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '3px',
                        padding: '2px 7px', borderRadius: '99px', fontSize: '9px', fontWeight: 700,
                        background: 'rgba(16,185,129,0.15)', color: '#34d399',
                        border: '1px solid rgba(16,185,129,0.25)',
                      }}>
                        <ShieldCheck size={9} /> Verified
                      </span>
                    )}
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    background: isExpert ? 'linear-gradient(90deg, #f59e0b, #ea580c)' : style.badgeBg,
                    color: isExpert ? 'white' : style.badgeText,
                    border: isExpert ? 'none' : `1px solid ${style.borderColor}`,
                    boxShadow: isExpert ? '0 0 10px rgba(245,158,11,0.4)' : 'none',
                  }}>
                    {isExpert ? '★ Expert' : skill.proficiency >= 70 ? 'Advanced' : 'Intermediate'}
                  </span>
                </div>

                {/* Category + Experience */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    background: style.badgeBg, color: style.badgeText,
                    border: `1px solid ${style.borderColor}`,
                  }}>
                    {skill.category}
                  </span>
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                    • {skill.experience} Yrs Exp.
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ paddingTop: '12px', borderTop: `1px solid ${style.borderColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: style.accentColor, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Flame size={13} style={{ color: style.accentColor }} />
                      {skill.proficiency}% Mastery
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, color: '#64748b',
                      padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(248, 250, 252, 0.8)', border: '1px solid rgba(226, 232, 240, 0.8)',
                    }}>
                      Lv {Math.ceil(skill.proficiency / 20)}/5
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(226, 232, 240, 0.8)', borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.proficiency}%` }}
                      transition={{ duration: 1, delay: 0.1 + index * 0.05, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: '99px',
                        background: style.progressBar,
                        boxShadow: style.progressGlow,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredSkills.length === 0 && (
            <div
              className="col-span-full py-16 text-center"
              style={{
                color: '#64748b', fontSize: '13px', fontWeight: 600,
                background: 'rgba(248, 250, 252, 0.8)',
                border: '1px dashed rgba(226, 232, 240, 0.8)',
                borderRadius: '16px',
              }}
            >
              No skills found matching "{searchQuery}".
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
