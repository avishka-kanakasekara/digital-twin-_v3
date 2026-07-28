import React, { useState } from 'react';
import { Database, Link as LinkIcon, FileText, UploadCloud, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KnowledgeSourcesProps {
  sources: any[];
  onUpload: (name: string, type: string) => void;
}

export const KnowledgeSources: React.FC<KnowledgeSourcesProps> = ({ sources, onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<string | null>(null);

  const handleMockUpload = (type: string) => {
    setIsUploading(true);
    setUploadType(type);
    onUpload(`New ${type} Upload`, type);
    setTimeout(() => {
      setIsUploading(false);
      setUploadType(null);
    }, 1500);
  };

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
            <Database size={14} style={{ color: '#3b82f6' }} />
            Knowledge Base
          </h3>
          <p style={{ fontSize: '11px', color: '#475569' }}>Documents feeding your AI Twin</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleMockUpload('Integration')}
            disabled={isUploading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
              background: 'rgba(248, 250, 252, 0.8)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              color: '#64748b', cursor: 'pointer',
            }}
          >
            {isUploading && uploadType === 'Integration'
              ? <RefreshCw size={12} className="animate-spin" />
              : <LinkIcon size={12} />}
            Connect
          </button>
          <button
            onClick={() => handleMockUpload('Document')}
            disabled={isUploading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              border: 'none', color: 'white', cursor: 'pointer',
              boxShadow: '0 0 15px rgba(59,130,246,0.25)',
            }}
          >
            {isUploading && uploadType === 'Document'
              ? <RefreshCw size={12} className="animate-spin" />
              : <UploadCloud size={12} />}
            Upload
          </button>
        </div>
      </div>

      {/* Source List */}
      <div className="space-y-2">
        <AnimatePresence>
          {sources.map((source, idx) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                gap: '12px',
              }}
              className="hover:bg-white/[0.9] group/source"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: source.type === 'Integration' ? 'rgba(6,182,212,0.12)' : 'rgba(124,58,237,0.12)',
                  color: source.type === 'Integration' ? '#06b6d4' : '#7c3aed',
                  border: `1px solid ${source.type === 'Integration' ? 'rgba(6,182,212,0.25)' : 'rgba(124,58,237,0.25)'}`,
                }}>
                  {source.type === 'Integration' ? <LinkIcon size={15} /> : <FileText size={15} />}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {source.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: '#10b981',
                      display: 'flex', alignItems: 'center', gap: '3px',
                    }}>
                      <CheckCircle2 size={9} /> Active
                    </span>
                    <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>{source.lastUpdated}</span>
                  </div>
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
                  {source.skillsExtracted}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {source.confidence}% Conf.
                </div>
              </div>
              <ChevronRight size={14} style={{ color: '#475569', flexShrink: 0 }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
