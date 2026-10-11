-- Quorail single-organization pilot schema. All money stored in integer cents.
CREATE TABLE IF NOT EXISTS treasury_settings (
 id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
 reserve_cents BIGINT NOT NULL DEFAULT 180000 CHECK (reserve_cents >= 0),
 horizon_days INTEGER NOT NULL DEFAULT 14 CHECK (horizon_days BETWEEN 1 AND 90),
 autonomous_limit_cents BIGINT NOT NULL DEFAULT 50000,
 single_limit_cents BIGINT NOT NULL DEFAULT 200000,
 daily_limit_cents BIGINT NOT NULL DEFAULT 400000
);
CREATE TABLE IF NOT EXISTS obligations (
 id UUID PRIMARY KEY,
 title VARCHAR(120) NOT NULL,
 counterparty VARCHAR(90) NOT NULL,
 recipient VARCHAR(42) NOT NULL,
 amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
 due_date DATE NOT NULL,
 priority VARCHAR(12) NOT NULL CHECK (priority IN ('critical','high','normal')),
 category VARCHAR(60) NOT NULL,
 status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','held')),
 tx_hash VARCHAR(66),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS decisions (
 id UUID PRIMARY KEY,
 obligation_id UUID NOT NULL REFERENCES obligations(id),
 obligation_title VARCHAR(120) NOT NULL,
 action VARCHAR(12) NOT NULL CHECK (action IN ('pay','hold','escalate')),
 reason TEXT NOT NULL,
 alternatives JSONB NOT NULL,
 confidence REAL NOT NULL,
 source VARCHAR(12) NOT NULL CHECK (source IN ('claude','rules','demo')),
 snapshot JSONB NOT NULL,
 status VARCHAR(12) NOT NULL CHECK (status IN ('proposed','executing','executed','failed','held','escalated')),
 tx_hash VARCHAR(66),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS decisions_obligation_status ON decisions(obligation_id,status);
CREATE TABLE IF NOT EXISTS audit_events (
 id BIGSERIAL PRIMARY KEY,
 kind VARCHAR(60) NOT NULL,
 message TEXT NOT NULL,
 payload JSONB NOT NULL,
 prev_hash VARCHAR(80) NOT NULL,
 entry_hash VARCHAR(80) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO treasury_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
