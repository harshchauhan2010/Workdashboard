-- ============================================================================
-- Migration 002: Create Users Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS workdash.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_title VARCHAR(150) NOT NULL DEFAULT 'Software Engineer',
    system_role workdash.user_system_role NOT NULL DEFAULT 'DEVELOPER',
    seniority workdash.seniority_level NOT NULL DEFAULT 'L3_SENIOR',
    weekly_capacity_hours NUMERIC(4, 1) NOT NULL DEFAULT 40.0,
    recurring_overhead_hours NUMERIC(4, 1) NOT NULL DEFAULT 6.0,
    skills TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_weekly_capacity CHECK (weekly_capacity_hours >= 10.0 AND weekly_capacity_hours <= 80.0),
    CONSTRAINT chk_recurring_overhead CHECK (recurring_overhead_hours >= 0.0 AND recurring_overhead_hours <= 40.0)
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON workdash.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON workdash.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_is_active ON workdash.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_system_role ON workdash.users(system_role);
