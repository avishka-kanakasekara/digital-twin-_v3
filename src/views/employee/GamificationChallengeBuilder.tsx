import React, { useState } from 'react';
import { gamificationAPI } from '../../lib/api';
import { Button } from '../../components/Button';
import { Loader2, Sparkles, AlertCircle, Wand2, ArrowRight } from 'lucide-react';
import './GamificationHub.css';

interface GamificationChallengeBuilderProps {
  onChallengeGenerated: (challengeData: any) => void;
  onCancel: () => void;
}

export const GamificationChallengeBuilder: React.FC<GamificationChallengeBuilderProps> = ({ onChallengeGenerated, onCancel }) => {
  const [goal, setGoal] = useState('');
  const [targetSkill, setTargetSkill] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [duration, setDuration] = useState('30 min');
  const [style, setStyle] = useState('Practical task');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      setError('Please provide a goal or objective.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await gamificationAPI.generateChallenge({
        goal,
        target_skill: targetSkill,
        difficulty,
        duration,
        style
      });
      onChallengeGenerated(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-2 text-center items-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center mb-2 shadow-lg">
          <Wand2 size={24} />
        </div>
        <h2 className="text-xl font-extrabold text-primary">AI Challenge Builder</h2>
        <p className="text-sm text-secondary max-w-md">Describe what you want the employee to learn or accomplish, and AI will generate a complete, structured challenge with steps and rubrics.</p>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col gap-5 bg-[var(--bg-main)] p-5 rounded-2xl border border-[var(--border-subtle)]">
        {error && (
          <div className="p-3 bg-danger/10 text-danger border border-danger/20 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Learning Goal / Topic *</label>
          <textarea 
            required 
            rows={2} 
            className="w-full input-field resize-none" 
            value={goal} 
            onChange={e => setGoal(e.target.value)} 
            placeholder="e.g. Master conflict resolution in cross-functional teams..." 
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Target Skill (Optional)</label>
            <input 
              type="text" 
              className="w-full input-field" 
              value={targetSkill} 
              onChange={e => setTargetSkill(e.target.value)} 
              placeholder="e.g. Communication" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Difficulty</label>
            <select className="w-full input-field" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Estimated Duration</label>
            <select className="w-full input-field" value={duration} onChange={e => setDuration(e.target.value)}>
              <option value="15 min">15 minutes (Quick exercise)</option>
              <option value="30 min">30 minutes (Standard)</option>
              <option value="1 hour">1 hour (Deep dive)</option>
              <option value="Multi-day">Multi-day (Project)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Challenge Style</label>
            <select className="w-full input-field" value={style} onChange={e => setStyle(e.target.value)}>
              <option value="Practical task">Practical Task</option>
              <option value="Case study">Case Study</option>
              <option value="Code debugging">Code Debugging</option>
              <option value="Roleplay scenario">Roleplay Scenario</option>
              <option value="Research & present">Research & Present</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading || !goal.trim()} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0">
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating Magic...</>
            ) : (
              <><Sparkles size={16} /> Generate Challenge</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
