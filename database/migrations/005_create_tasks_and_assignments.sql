-- ============================================================================
-- Migration 005: Create Tasks and Task Assignments Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS workdash.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    squad_id UUID NOT NULL REFERENCES workdash.squads(id) ON DELETE CASCADE,
    task_type workdash.task_workload_type NOT NULL DEFAULT 'PLANNED',
    category workdash.task_category_type NOT NULL DEFAULT 'FEATURE',
    priority workdash.task_priority_level NOT NULL DEFAULT 'P2_MEDIUM',
    status workdash.task_workflow_status NOT NULL DEFAULT 'TODO',
    estimated_hours NUMERIC(6, 2) NOT NULL DEFAULT 4.00,
    logged_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    recurrence_frequency workdash.recurrence_freq,
    assigned_by_user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_task_estimated_hours CHECK (estimated_hours >= 0.0),
    CONSTRAINT chk_task_logged_hours CHECK (logged_hours >= 0.0)
);

CREATE INDEX IF NOT EXISTS idx_tasks_squad_id ON workdash.tasks(squad_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON workdash.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON workdash.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_is_blocked ON workdash.tasks(is_blocked);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON workdash.tasks(due_date);

CREATE TABLE IF NOT EXISTS workdash.task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
    assigned_hours NUMERIC(6, 2) NOT NULL,
    split_mode workdash.assignment_distribution_mode NOT NULL DEFAULT 'EQUAL_SPLIT',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_task_assignment UNIQUE (task_id, user_id),
    CONSTRAINT chk_assigned_hours CHECK (assigned_hours >= 0.0)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON workdash.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON workdash.task_assignments(user_id);
