-- ============================================================================
-- Migration 006: Create Work Logs and Active Timers Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS workdash.work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
    hours NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    notes TEXT NOT NULL,
    log_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_work_log_hours CHECK (hours > 0.0 AND hours <= 24.0)
);

CREATE INDEX IF NOT EXISTS idx_work_logs_task_id ON workdash.work_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_user_id ON workdash.work_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_timestamp ON workdash.work_logs(log_timestamp);

CREATE TABLE IF NOT EXISTS workdash.active_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
    seconds_elapsed INT NOT NULL DEFAULT 0,
    is_running BOOLEAN NOT NULL DEFAULT true,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_active_timer UNIQUE (user_id),
    CONSTRAINT chk_seconds_elapsed CHECK (seconds_elapsed >= 0)
);

CREATE INDEX IF NOT EXISTS idx_active_timers_user_id ON workdash.active_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_active_timers_task_id ON workdash.active_timers(task_id);
