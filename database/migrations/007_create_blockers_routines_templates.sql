-- ============================================================================
-- Migration 007: Create Blockers, Blocker Presets, Task Templates, and Recurring Routines
-- ============================================================================

CREATE TABLE IF NOT EXISTS workdash.blocker_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_slug VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(150) NOT NULL,
    category workdash.blocker_category_type NOT NULL DEFAULT 'CROSS_SQUAD',
    severity workdash.blocker_severity_level NOT NULL DEFAULT 'HIGH',
    description_template TEXT NOT NULL,
    impact_template TEXT NOT NULL,
    mitigation_template TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workdash.task_blockers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
    reported_by_user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE RESTRICT,
    category workdash.blocker_category_type NOT NULL DEFAULT 'CROSS_SQUAD',
    severity workdash.blocker_severity_level NOT NULL DEFAULT 'HIGH',
    reason TEXT NOT NULL,
    business_impact TEXT NOT NULL,
    mitigation_action TEXT,
    expected_resolution_date DATE,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by_user_id UUID REFERENCES workdash.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_blockers_task_id ON workdash.task_blockers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_blockers_is_resolved ON workdash.task_blockers(is_resolved);
CREATE INDEX IF NOT EXISTS idx_task_blockers_severity ON workdash.task_blockers(severity);

CREATE TABLE IF NOT EXISTS workdash.task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    default_task_title VARCHAR(255) NOT NULL,
    category workdash.task_category_type NOT NULL DEFAULT 'FEATURE',
    task_type workdash.task_workload_type NOT NULL DEFAULT 'PLANNED',
    recurrence_frequency workdash.recurrence_freq,
    default_estimated_hours NUMERIC(6, 2) NOT NULL DEFAULT 4.00,
    default_priority workdash.task_priority_level NOT NULL DEFAULT 'P2_MEDIUM',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_by_user_id UUID REFERENCES workdash.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_templates_category ON workdash.task_templates(category);

CREATE TABLE IF NOT EXISTS workdash.recurring_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
    squad_id UUID REFERENCES workdash.squads(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    frequency workdash.recurrence_freq NOT NULL DEFAULT 'DAILY',
    schedule_label VARCHAR(100) NOT NULL,
    allocated_hours NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_routine_allocated_hours CHECK (allocated_hours >= 0.0)
);

CREATE INDEX IF NOT EXISTS idx_recurring_routines_user_id ON workdash.recurring_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_routines_squad_id ON workdash.recurring_routines(squad_id);
