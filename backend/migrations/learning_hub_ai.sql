-- Learning Hub AI rebuild — chat history + feed cache
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS learning_chat_messages (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_chat_employee
    ON learning_chat_messages(employee_id, created_at DESC);

CREATE TABLE IF NOT EXISTS learning_feed_cache (
    employee_id TEXT PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
    payload     JSONB NOT NULL DEFAULT '[]'::jsonb,
    input_hash  TEXT,
    generated_at TIMESTAMPTZ DEFAULT now()
);

-- Optional: store structured course links on paths (AI generation)
ALTER TABLE learning_paths
    ADD COLUMN IF NOT EXISTS course_ids JSONB DEFAULT '[]'::jsonb;

ALTER TABLE learning_paths
    ADD COLUMN IF NOT EXISTS ai_rationale TEXT;
