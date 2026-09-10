import React, { useEffect, useState } from 'react';
import { Sparkles, Target, Zap, Clock, BrainCircuit, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { gamificationAPI } from '../../lib/api';
import { useEmployee } from '../../contexts/EmployeeContext';
import { Card } from '../../components/Card';
import './GamificationHub.css'; // Reuse existing styles where possible, extend below

interface RecommendationProps {
  onOpenChallenge: (id: string) => void;
}

export const GamificationRecommendations: React.FC<RecommendationProps> = ({ onOpenChallenge }) => {
  const { currentEmployee } = useEmployee();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentEmployee) return;
    setLoading(true);
    gamificationAPI.getRecommendations(currentEmployee.id)
      .then(setData)
      .catch(err => setError(err?.message || 'Failed to load recommendations'))
      .finally(() => setLoading(false));
  }, [currentEmployee]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={32} /></div>;
  if (error) return <div className="p-4 bg-danger/10 text-danger rounded-xl border border-danger/20 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>;
  if (!data || !data.recommendations?.length) return <div className="p-8 text-center text-tertiary">No recommendations right now. Check back later!</div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* AI Coach Insight */}
      <Card glass className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-main)] border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="p-5 flex gap-4 items-start relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-primary mb-1 flex items-center gap-1">
              <Sparkles size={14} className="text-purple-500" /> AI Coach Insight
            </h3>
            <p className="text-sm text-secondary leading-relaxed">{data.coach_insight}</p>
          </div>
        </div>
      </Card>

      {/* Recommended Challenges Grid */}
      <div>
        <h3 className="text-base font-extrabold text-primary mb-4">Recommended for You</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.recommendations.map((rec: any) => (
            <div 
              key={rec.challenge_id} 
              className="group relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col"
              onClick={() => onOpenChallenge(rec.challenge_id)}
            >
              {/* Relevance Score Badge */}
              <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                <Target size={10} /> {rec.relevance_score} Match
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{rec.bonus_badge || '🎯'}</div>
                <div>
                  <h4 className="text-sm font-bold text-primary leading-tight group-hover:text-primary transition-colors line-clamp-2">{rec.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-secondary">{rec.difficulty}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-secondary">{rec.category}</span>
                    {rec.estimated_minutes && <span className="text-[10px] font-medium text-tertiary flex items-center gap-0.5"><Clock size={10} /> {rec.estimated_minutes}m</span>}
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-secondary line-clamp-2 mb-4 flex-1">{rec.description}</p>
              
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 mb-4">
                <p className="text-[11px] font-medium text-primary flex items-start gap-1.5 leading-tight">
                  <Sparkles size={12} className="shrink-0 mt-0.5 text-purple-500" /> {rec.why_recommended}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] mt-auto">
                <div className="flex items-center gap-1 text-sm font-extrabold text-success">
                  <Zap size={14} className="fill-current" /> +{rec.xp_reward} XP
                </div>
                <div className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Start <ArrowRight size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
