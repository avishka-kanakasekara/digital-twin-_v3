import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UploadCloud, CheckCircle2, XCircle, RefreshCw, Trash2,
  ChevronDown, ChevronUp, AlertTriangle, Sparkles,
  Shield, Clock, FilePlus, History,
} from 'lucide-react';
import { knowledgeAPI } from '../../../../lib/api';
import type { KnowledgeSource, KnowledgeChangeEvent } from '../../../../lib/api';
import { useEmployee } from '../../../../contexts/EmployeeContext';

// ── Types ─────────────────────────────────────────────────────

interface KnowledgeSourcesProps {
  sources: any[];
  onUpload: (name: string, type: string) => void;
  onPipelineComplete?: () => void;
}

type UploadState = 'idle' | 'uploading' | 'queued' | 'failed';

interface LocalUpload {
  file: File;
  state: UploadState;
  error?: string;
  progress: number;
}

// ── Constants ─────────────────────────────────────────────────

const ACCEPTED_FORMATS = '.pdf,.docx,.txt,.md,.json,.csv';
const MAX_SIZE_MB = 50;
const POLL_INTERVAL_MS = 3000;

const PIPELINE_STAGES = [
  'UPLOADED', 'VALIDATING', 'STORED', 'EXTRACTING',
  'CLASSIFYING', 'ANALYZING', 'RECONCILING', 'UPDATING', 'COMPLETED',
];

const STAGE_LABELS: Record<string, string> = {
  UPLOADED: 'Uploaded',
  VALIDATING: 'Validating',
  STORED: 'Secured',
  EXTRACTING: 'Extracting Text',
  CLASSIFYING: 'Classifying',
  ANALYZING: 'AI Analysis',
  RECONCILING: 'Reconciling',
  UPDATING: 'Updating Twin',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  CV: 'CV / Resume',
  LINKEDIN_PROFILE: 'LinkedIn Profile',
  PROJECT_DOCUMENT: 'Project Document',
  CERTIFICATE: 'Certificate',
  PORTFOLIO: 'Portfolio',
  EDUCATION_DOCUMENT: 'Education Document',
  OTHER_PROFESSIONAL: 'Professional Document',
  UNKNOWN: 'Document',
};

const SOURCE_TYPE_ICONS: Record<string, string> = {
  CV: '📄', LINKEDIN_PROFILE: '💼', PROJECT_DOCUMENT: '🗂️',
  CERTIFICATE: '🏆', PORTFOLIO: '🎨', EDUCATION_DOCUMENT: '🎓',
  OTHER_PROFESSIONAL: '📋', UNKNOWN: '📁',
};

// ── Helpers ───────────────────────────────────────────────────

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getStageIndex(stage: string): number {
  const idx = PIPELINE_STAGES.indexOf(stage);
  return idx >= 0 ? idx : 0;
}

function isProcessing(status: string): boolean {
  return !['COMPLETED', 'FAILED'].includes(status);
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 90) return { label: 'Very High', color: '#10b981' };
  if (confidence >= 75) return { label: 'High', color: '#3b82f6' };
  if (confidence >= 50) return { label: 'Medium', color: '#f59e0b' };
  return { label: 'Low', color: '#ef4444' };
}

// ── Main Component ────────────────────────────────────────────

export const KnowledgeSources: React.FC<KnowledgeSourcesProps> = ({ sources: propSources, onUpload, onPipelineComplete }) => {
  const { currentEmployee } = useEmployee();
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [localUploads, setLocalUploads] = useState<LocalUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<string, KnowledgeChangeEvent[]>>({});
  const [loadingChanges, setLoadingChanges] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track which source IDs were previously processing so we can detect the COMPLETED transition
  const processingIdsRef = useRef<Set<string>>(new Set());

  // Load sources from backend
  const loadSources = useCallback(async () => {
    if (!currentEmployee) return;
    try {
      const data = await knowledgeAPI.list(currentEmployee.id);

      // Detect COMPLETED transition: any source that was processing and is now COMPLETED
      const justCompleted = data.filter(
        s => s.status === 'COMPLETED' && processingIdsRef.current.has(s.id)
      );

      if (justCompleted.length > 0) {
        // Remove from tracking set
        justCompleted.forEach(s => processingIdsRef.current.delete(s.id));
        // Notify parent to refresh skills, projects, certifications
        onPipelineComplete?.();
      }

      // Track currently processing sources
      data.filter(s => isProcessing(s.status)).forEach(s => processingIdsRef.current.add(s.id));

      setSources(data);
    } catch {
      // Backend not available — fall back to prop sources
      if (propSources?.length) {
        setSources(propSources as KnowledgeSource[]);
      }
    }
  }, [currentEmployee, propSources, onPipelineComplete]);

  // Initial load
  useEffect(() => {
    loadSources();
  }, [loadSources]);

  // Poll while any source is processing
  useEffect(() => {
    const hasProcessing = sources.some(s => isProcessing(s.status));
    if (hasProcessing) {
      pollTimerRef.current = setInterval(loadSources, POLL_INTERVAL_MS);
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [sources, loadSources]);

  // ── File Upload ──────────────────────────────────────────────

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!currentEmployee) return;
    const fileArr = Array.from(files);

    for (const file of fileArr) {
      // Client-side validation
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setLocalUploads(prev => [...prev, {
          file,
          state: 'failed',
          error: `File exceeds the ${MAX_SIZE_MB}MB limit.`,
          progress: 0,
        }]);
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!['pdf', 'docx', 'txt', 'md', 'json', 'csv'].includes(ext)) {
        setLocalUploads(prev => [...prev, {
          file,
          state: 'failed',
          error: `Unsupported format: .${ext}`,
          progress: 0,
        }]);
        continue;
      }

      // Add to local upload list as uploading
      setLocalUploads(prev => [...prev, { file, state: 'uploading', progress: 30 }]);

      try {
        await knowledgeAPI.upload(currentEmployee.id, file);
        // Mark as queued — pipeline now running in background
        setLocalUploads(prev =>
          prev.map(u => u.file === file ? { ...u, state: 'queued', progress: 100 } : u)
        );
        // Notify legacy hook
        onUpload(file.name, 'Document');
        // Refresh list to pick up new source
        setTimeout(loadSources, 1000);
      } catch (err: any) {
        setLocalUploads(prev =>
          prev.map(u => u.file === file
            ? { ...u, state: 'failed', error: err.message || 'Upload failed', progress: 0 }
            : u)
        );
      }
    }
  }, [currentEmployee, onUpload, loadSources]);

  // Drag & drop
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  // ── Actions ──────────────────────────────────────────────────

  const handleReprocess = async (sourceId: string) => {
    if (!currentEmployee) return;
    try {
      await knowledgeAPI.reprocess(currentEmployee.id, sourceId);
      await loadSources();
    } catch {
      // silent
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!currentEmployee) return;
    try {
      await knowledgeAPI.deleteSource(currentEmployee.id, sourceId);
      setSources(prev => prev.filter(s => s.id !== sourceId));
      if (expandedId === sourceId) setExpandedId(null);
    } catch {
      // silent
    } finally {
      setDeleteConfirm(null);
    }
  };

  const loadChanges = async (sourceId: string) => {
    if (!currentEmployee || changes[sourceId]) return;
    setLoadingChanges(sourceId);
    try {
      const data = await knowledgeAPI.getChanges(currentEmployee.id, sourceId);
      setChanges(prev => ({ ...prev, [sourceId]: data }));
    } catch {
      setChanges(prev => ({ ...prev, [sourceId]: [] }));
    } finally {
      setLoadingChanges(null);
    }
  };

  const toggleExpand = (sourceId: string) => {
    if (expandedId === sourceId) {
      setExpandedId(null);
    } else {
      setExpandedId(sourceId);
      loadChanges(sourceId);
    }
  };

  // ── Render ───────────────────────────────────────────────────

  const hasBackend = currentEmployee != null;
  const processingCount = sources.filter(s => isProcessing(s.status)).length;

  return (
    <div className="overflow-hidden">
      {processingCount > 0 && (
        <div className="flex justify-end mb-3">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '8px',
            background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
            fontSize: '10px', fontWeight: 700, color: '#2563eb',
          }}>
            <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
            {processingCount} processing
          </span>
        </div>
      )}

      {/* ── Drop Zone ───────────────────────────────────── */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? '#3b82f6' : 'rgba(148,163,184,0.4)'}`,
            borderRadius: '14px',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? 'rgba(59,130,246,0.04)' : 'rgba(248,250,252,0.8)',
            transition: 'all 0.2s',
            marginBottom: '1rem',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            multiple
            style={{ display: 'none' }}
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
          <UploadCloud size={28} style={{ color: isDragging ? '#3b82f6' : '#94a3b8', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', fontWeight: 700, color: isDragging ? '#3b82f6' : '#475569', marginBottom: '4px' }}>
            {isDragging ? 'Drop files here' : 'Drop files or click to upload'}
          </p>
          <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
            PDF • DOCX • TXT • MD • JSON • CSV — Max {MAX_SIZE_MB}MB
          </p>
          {!hasBackend && (
            <p style={{
              fontSize: '10px', marginTop: '8px', color: '#f59e0b', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}>
              <AlertTriangle size={10} /> Backend offline — connect the API server to enable real processing
            </p>
          )}
        </div>

        {/* ── Local Upload Queue ──────────────────────────── */}
        {localUploads.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            {localUploads.map((u, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: '10px', marginBottom: '4px',
                background: u.state === 'failed' ? 'rgba(239,68,68,0.06)' :
                  u.state === 'queued' ? 'rgba(16,185,129,0.06)' : 'rgba(59,130,246,0.06)',
                border: `1px solid ${u.state === 'failed' ? 'rgba(239,68,68,0.2)' :
                  u.state === 'queued' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
              }}>
                {u.state === 'uploading' && <RefreshCw size={13} style={{ color: '#3b82f6', flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
                {u.state === 'queued' && <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />}
                {u.state === 'failed' && <XCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.file.name}
                  </p>
                  {u.state === 'failed' && (
                    <p style={{ fontSize: '10px', color: '#ef4444' }}>{u.error}</p>
                  )}
                  {u.state === 'queued' && (
                    <p style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>Queued for AI processing</p>
                  )}
                  {u.state === 'uploading' && (
                    <p style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600 }}>Uploading…</p>
                  )}
                </div>
                <button
                  onClick={() => setLocalUploads(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', flexShrink: 0 }}
                >
                  <XCircle size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

      {/* ── Source List ─────────────────────────────────────── */}
      <div>
        {sources.length === 0 && localUploads.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <FilePlus size={32} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>No documents uploaded yet</p>
            <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
              Upload a CV, certificate, or project document to start building your intelligence profile
            </p>
          </div>
        )}

        <div className="space-y-3">
          {sources.map(source => (
            <SourceCard
              key={source.id}
              source={source}
              expanded={expandedId === source.id}
              onToggle={() => toggleExpand(source.id)}
              onReprocess={() => handleReprocess(source.id)}
              onDelete={() => setDeleteConfirm(source.id)}
              deleteConfirm={deleteConfirm === source.id}
              onDeleteConfirm={() => handleDelete(source.id)}
              onDeleteCancel={() => setDeleteConfirm(null)}
              changes={changes[source.id]}
              loadingChanges={loadingChanges === source.id}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
      `}</style>
    </div>
  );
};

// ── Source Card ───────────────────────────────────────────────

interface SourceCardProps {
  source: KnowledgeSource;
  expanded: boolean;
  onToggle: () => void;
  onReprocess: () => void;
  onDelete: () => void;
  deleteConfirm: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  changes?: KnowledgeChangeEvent[];
  loadingChanges: boolean;
}

const SourceCard: React.FC<SourceCardProps> = ({
  source, expanded, onToggle, onReprocess, onDelete,
  deleteConfirm, onDeleteConfirm, onDeleteCancel, changes, loadingChanges,
}) => {
  const status = source.status;
  const isFailed = status === 'FAILED';
  const isDone = status === 'COMPLETED';
  const isPending = isProcessing(status);
  const sourceType = source.source_type || 'UNKNOWN';
  const confidence = getConfidenceLabel(source.confidence);

  const cardBorder = isFailed ? 'rgba(239,68,68,0.25)' :
    isDone ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)';

  const cardBg = isFailed ? 'rgba(239,68,68,0.02)' :
    isDone ? 'rgba(16,185,129,0.02)' : 'rgba(59,130,246,0.02)';

  return (
    <div style={{
      border: `1px solid ${cardBorder}`,
      borderRadius: '14px',
      background: cardBg,
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      {/* Card Header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Icon */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
          background: isFailed ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
          border: `1px solid ${isFailed ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.15)'}`,
        }}>
          {SOURCE_TYPE_ICONS[sourceType] || '📁'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
            {source.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(100,116,139,0.1)', padding: '2px 7px', borderRadius: '6px' }}>
              {SOURCE_TYPE_LABELS[sourceType] || 'Document'}
            </span>
            {source.file_size && (
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{formatFileSize(source.file_size)}</span>
            )}
            {source.processed_at && (
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={9} />{formatDate(source.processed_at)}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {isFailed ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>
              <XCircle size={12} /> Failed
            </span>
          ) : isDone ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#10b981' }}>
              <CheckCircle2 size={12} /> Processed
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#3b82f6' }}>
              <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
              {STAGE_LABELS[status] || status}
            </span>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={onToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', flexShrink: 0 }}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Processing Bar */}
      {isPending && (
        <PipelineProgressBar currentStage={status} />
      )}

      {/* Stats (completed) */}
      {isDone && (source.skills_extracted > 0 || source.projects_found > 0) && (
        <div style={{
          display: 'flex', gap: '16px', padding: '8px 14px 10px',
          borderTop: '1px solid rgba(226,232,240,0.5)',
        }}>
          {source.skills_extracted > 0 && (
            <Stat icon="🧠" value={source.skills_extracted} label="skills" />
          )}
          {source.projects_found > 0 && (
            <Stat icon="🗂️" value={source.projects_found} label="projects" />
          )}
          {source.confidence > 0 && (
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, color: confidence.color,
                background: `${confidence.color}15`, padding: '2px 8px', borderRadius: '20px',
              }}>
                {confidence.label} Confidence ({source.confidence}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {isFailed && source.error_message && (
        <div style={{
          margin: '0 14px 12px',
          padding: '8px 12px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: '8px',
        }}>
          <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
            {source.error_message}
          </p>
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <SourceDetails
          source={source}
          changes={changes}
          loadingChanges={loadingChanges}
          onReprocess={onReprocess}
          deleteConfirm={deleteConfirm}
          onDelete={onDelete}
          onDeleteConfirm={onDeleteConfirm}
          onDeleteCancel={onDeleteCancel}
        />
      )}
    </div>
  );
};

// ── Pipeline Progress Bar ─────────────────────────────────────

const PipelineProgressBar: React.FC<{ currentStage: string }> = ({ currentStage }) => {
  const currentIdx = getStageIndex(currentStage);
  const totalStages = PIPELINE_STAGES.length - 1; // exclude COMPLETED

  return (
    <div style={{ padding: '6px 14px 10px', borderTop: '1px solid rgba(226,232,240,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
        {PIPELINE_STAGES.slice(0, -1).map((stage, i) => (
          <React.Fragment key={stage}>
            <span style={{
              fontSize: '9px', fontWeight: 700,
              color: i < currentIdx ? '#10b981' : i === currentIdx ? '#3b82f6' : '#cbd5e1',
              letterSpacing: '0.03em',
            }}>
              {i < currentIdx ? '✓' : ''}{STAGE_LABELS[stage]}
            </span>
            {i < PIPELINE_STAGES.length - 2 && (
              <span style={{ color: '#e2e8f0', fontSize: '9px' }}>›</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div style={{ height: '4px', background: 'rgba(226,232,240,0.6)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.round((currentIdx / totalStages) * 100)}%`,
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          borderRadius: '2px',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
};

// ── Source Details (expanded) ─────────────────────────────────

interface SourceDetailsProps {
  source: KnowledgeSource;
  changes?: KnowledgeChangeEvent[];
  loadingChanges: boolean;
  onReprocess: () => void;
  deleteConfirm: boolean;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

const SourceDetails: React.FC<SourceDetailsProps> = ({
  source, changes, loadingChanges, onReprocess,
  deleteConfirm, onDelete, onDeleteConfirm, onDeleteCancel,
}) => {
  const status = source.status;
  const isFailed = status === 'FAILED';
  const isDone = status === 'COMPLETED';

  return (
    <div style={{
      borderTop: '1px solid rgba(226,232,240,0.5)',
      padding: '12px 14px',
      background: 'rgba(248,250,252,0.5)',
    }}>
      {/* Analysis Summary */}
      {isDone && source.analysis_result && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={11} style={{ color: '#8b5cf6' }} /> Intelligence Extracted
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(source.analysis_result.skills_count ?? 0) > 0 && (
              <AnalysisBadge icon="🧠" count={source.analysis_result.skills_count!} label="Skills" />
            )}
            {(source.analysis_result.projects_count ?? 0) > 0 && (
              <AnalysisBadge icon="🗂️" count={source.analysis_result.projects_count!} label="Projects" />
            )}
            {(source.analysis_result.certifications_count ?? 0) > 0 && (
              <AnalysisBadge icon="🏆" count={source.analysis_result.certifications_count!} label="Certs" />
            )}
            {(source.analysis_result.experience_count ?? 0) > 0 && (
              <AnalysisBadge icon="💼" count={source.analysis_result.experience_count!} label="Roles" />
            )}
            {(source.analysis_result.education_count ?? 0) > 0 && (
              <AnalysisBadge icon="🎓" count={source.analysis_result.education_count!} label="Education" />
            )}
          </div>
        </div>
      )}

      {/* Change Audit */}
      {isDone && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={11} style={{ color: '#3b82f6' }} /> Change History
          </p>
          {loadingChanges ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px' }}>
              <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Loading changes…
            </div>
          ) : changes && changes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              {changes.map(change => (
                <ChangeRow key={change.id} change={change} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>No changes recorded for this document.</p>
          )}
        </div>
      )}

      {/* Security note */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 10px', borderRadius: '8px',
        background: 'rgba(59,130,246,0.05)',
        border: '1px solid rgba(59,130,246,0.1)',
        marginBottom: '12px',
      }}>
        <Shield size={11} style={{ color: '#3b82f6', flexShrink: 0 }} />
        <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
          Document processed server-side. Content never exposed client-side.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(isFailed || isDone) && (
          <button
            onClick={onReprocess}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              color: '#3b82f6', cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} /> Reprocess
          </button>
        )}

        {!deleteConfirm ? (
          <button
            onClick={onDelete}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              color: '#ef4444', cursor: 'pointer',
            }}
          >
            <Trash2 size={12} /> Delete
          </button>
        ) : (
          <>
            <button
              onClick={onDeleteConfirm}
              style={{
                padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer',
              }}
            >
              Confirm Delete
            </button>
            <button
              onClick={onDeleteCancel}
              style={{
                padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)',
                color: '#64748b', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────

const Stat: React.FC<{ icon: string; value: number; label: string }> = ({ icon, value, label }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569', fontWeight: 600 }}>
    <span>{icon}</span>
    <strong style={{ color: '#0f172a' }}>{value}</strong> {label}
  </span>
);

const AnalysisBadge: React.FC<{ icon: string; count: number; label: string }> = ({ icon, count, label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
    background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#7c3aed',
  }}>
    {icon} {count} {label}
  </span>
);

const ChangeRow: React.FC<{ change: KnowledgeChangeEvent }> = ({ change }) => {
  const opColors: Record<string, string> = {
    ADD: '#10b981', UPDATE: '#3b82f6', CONFIRM: '#64748b',
    CONFLICT: '#f59e0b', SKIP: '#94a3b8',
  };
  const color = opColors[change.operation] || '#64748b';
  const icon = change.operation === 'ADD' ? '+' :
    change.operation === 'UPDATE' ? '↑' :
    change.operation === 'CONFIRM' ? '✓' :
    change.operation === 'CONFLICT' ? '⚠' : '–';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '8px',
      padding: '5px 8px', borderRadius: '6px',
      background: 'rgba(255,255,255,0.7)',
      border: '1px solid rgba(226,232,240,0.6)',
    }}>
      <span style={{
        fontSize: '9px', fontWeight: 900, color,
        background: `${color}15`, padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
      }}>
        {icon} {change.operation}
      </span>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {change.entity_type}: {change.entity_key}
        </p>
        {change.reason && (
          <p style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{change.reason}</p>
        )}
        {change.confidence !== undefined && (
          <p style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>
            Confidence: {Math.round(change.confidence * 100)}%
            {change.requires_approval && ' · Requires Review'}
          </p>
        )}
      </div>
    </div>
  );
};
