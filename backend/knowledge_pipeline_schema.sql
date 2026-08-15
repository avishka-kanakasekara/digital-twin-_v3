-- ════════════════════════════════════════════════════════════════
-- Knowledge Intelligence Pipeline — Schema Migration
-- Run this in Supabase SQL Editor AFTER the base schema.
-- ════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. Extend knowledge_sources with pipeline columns
-- ──────────────────────────────────────────────────────────────
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'UNKNOWN';
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'UPLOADED';
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS processing_stage TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS analysis_result JSONB;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS extraction_version TEXT DEFAULT '1.0';
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS analysis_version TEXT DEFAULT '1.0';
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS error_code TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Index for duplicate detection
CREATE INDEX IF NOT EXISTS idx_ks_content_hash ON knowledge_sources(content_hash);
CREATE INDEX IF NOT EXISTS idx_ks_status ON knowledge_sources(status);


-- ──────────────────────────────────────────────────────────────
-- 2. Extracted Facts — every fact has evidence + provenance
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_extracted_facts (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id         TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    source_id           TEXT NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,

    fact_type           TEXT NOT NULL,   -- skill, project, experience, education, certification, achievement
    fact_key            TEXT NOT NULL,   -- normalized identifier (e.g. "Python", "AWS Solutions Architect")
    fact_value          JSONB NOT NULL,  -- structured fact data

    -- Evidence
    evidence_text       TEXT,
    evidence_page       INTEGER,
    original_value      TEXT,           -- raw value before normalization
    canonical_value     TEXT,           -- normalized value

    -- Scoring
    confidence          NUMERIC(4,2) DEFAULT 0,
    source_reliability  NUMERIC(4,2) DEFAULT 0.7,

    -- Metadata
    extraction_version  TEXT DEFAULT '1.0',
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kef_employee ON knowledge_extracted_facts(employee_id);
CREATE INDEX IF NOT EXISTS idx_kef_source ON knowledge_extracted_facts(source_id);
CREATE INDEX IF NOT EXISTS idx_kef_type ON knowledge_extracted_facts(fact_type);


-- ──────────────────────────────────────────────────────────────
-- 3. Knowledge Update Events — full audit trail
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_update_events (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    source_id       TEXT REFERENCES knowledge_sources(id) ON DELETE SET NULL,

    operation       TEXT NOT NULL,      -- ADD, UPDATE, CONFIRM, SKIP, CONFLICT
    entity_type     TEXT NOT NULL,      -- skill, project, certification, experience, education
    entity_key      TEXT NOT NULL,      -- e.g. "Python", "Cloud Migration Phase 2"

    old_value       JSONB,
    new_value       JSONB,

    confidence      NUMERIC(4,2),
    reason          TEXT,
    evidence_text   TEXT,

    requires_approval   BOOLEAN DEFAULT false,
    approval_status     TEXT DEFAULT 'auto_approved',  -- auto_approved, pending, approved, rejected

    model_name      TEXT,
    model_version   TEXT,
    prompt_version  TEXT DEFAULT '1.0',

    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kue_employee ON knowledge_update_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_kue_source ON knowledge_update_events(source_id);
CREATE INDEX IF NOT EXISTS idx_kue_created ON knowledge_update_events(created_at);


-- ──────────────────────────────────────────────────────────────
-- 4. RLS Policies for new tables
-- ──────────────────────────────────────────────────────────────
ALTER TABLE knowledge_extracted_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_update_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service_role" ON knowledge_extracted_facts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON knowledge_update_events FOR ALL USING (true) WITH CHECK (true);


-- ✅ Knowledge Pipeline schema migration complete!
