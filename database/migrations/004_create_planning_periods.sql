-- ============================================================================
-- Migration 004: Create Planning Periods Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS workdash.planning_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_planning_period_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_planning_periods_dates ON workdash.planning_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_planning_periods_is_current ON workdash.planning_periods(is_current);
