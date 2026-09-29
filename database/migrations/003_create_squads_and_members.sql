-- ============================================================================
-- Migration 003: Create Squads and Squad Members Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS workdash.squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    lead_user_id UUID REFERENCES workdash.users(id) ON DELETE RESTRICT,
    health_status workdash.squad_health_status NOT NULL DEFAULT 'HEALTHY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_squads_lead_user_id ON workdash.squads(lead_user_id);
CREATE INDEX IF NOT EXISTS idx_squads_health_status ON workdash.squads(health_status);

CREATE TABLE IF NOT EXISTS workdash.squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES workdash.squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
    allocation_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    CONSTRAINT uq_squad_active_member UNIQUE (squad_id, user_id),
    CONSTRAINT chk_member_allocation CHECK (allocation_pct > 0.0 AND allocation_pct <= 100.0)
);

CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON workdash.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON workdash.squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_active ON workdash.squad_members(squad_id, user_id) WHERE left_at IS NULL;
