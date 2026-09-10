-- OPTIONAL: dedicated peer_recommendations table
-- Default runtime stores peer recommendations in `recognitions`
-- (type = 'peer_recommendation') so no migration is required.
--
-- If you create this table, also set in backend .env:
--   PEER_REC_USE_DEDICATED_TABLE=1

CREATE TABLE IF NOT EXISTS peer_recommendations (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    from_employee_id  TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    to_employee_id    TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    category          TEXT NOT NULL DEFAULT 'general',
    skill             TEXT,
    message           TEXT NOT NULL,
    rating            INTEGER DEFAULT 5 CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    created_at        TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT peer_rec_no_self CHECK (from_employee_id <> to_employee_id),
    CONSTRAINT peer_rec_message_len CHECK (char_length(trim(message)) >= 10)
);

CREATE INDEX IF NOT EXISTS idx_peer_rec_to
    ON peer_recommendations(to_employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_peer_rec_from
    ON peer_recommendations(from_employee_id, created_at DESC);

ALTER TABLE peer_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for service_role" ON peer_recommendations;
CREATE POLICY "Allow all for service_role" ON peer_recommendations
    FOR ALL USING (true) WITH CHECK (true);
