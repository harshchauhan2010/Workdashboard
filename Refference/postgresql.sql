-- =============================================================================
-- WorkDashboard — Production PostgreSQL Database Schema & Seed Script
-- Enterprise Operations, Engineering Capacity & Delivery Intelligence Platform
-- Architecture: Single-Company Internal Engineering Operations with Clerk Auth
-- Target Engine: PostgreSQL 15+ / 16
-- Model: 12 Clean Core Tables (Pure Squad-Driven Architecture, No Client Dependencies)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS & SCHEMAS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE SCHEMA IF NOT EXISTS workdash;
SET search_path TO workdash, public;

-- -----------------------------------------------------------------------------
-- 2. CUSTOM ENUMERATED TYPES (ENUMs)
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE workdash.user_system_role AS ENUM (
        'MANAGER',
        'DEVELOPER'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.seniority_level AS ENUM (
        'L1_JUNIOR',
        'L2_MID',
        'L3_SENIOR',
        'L4_STAFF',
        'L5_PRINCIPAL',
        'LEAD'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.squad_health_status AS ENUM (
        'HEALTHY',
        'AT_RISK',
        'CRITICAL'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.task_workload_type AS ENUM (
        'PRE_PLANNING',
        'AD_HOC_EMERGENCY',
        'RECURRING_ROUTINE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.task_category_type AS ENUM (
        'DEVELOPMENT',
        'TESTING_QA',
        'BUG_FIX',
        'REPORTING',
        'UI_UX',
        'DEVOPS',
        'MEETING'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.task_workflow_status AS ENUM (
        'TO_DO',
        'IN_PROGRESS',
        'PENDING_REVIEW',
        'COMPLETED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.task_priority_level AS ENUM (
        'P1_HIGH',
        'P2_MEDIUM',
        'P3_LOW'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.recurrence_freq AS ENUM (
        'DAILY',
        'WEEKLY',
        'MONTHLY'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.blocker_category_type AS ENUM (
        'TECHNICAL_IMPEDIMENT',
        'DEPENDENCY',
        'REVIEW_BOTTLENECK',
        'RESOURCE_CAPACITY',
        'SCOPE_CREEP',
        'INFRASTRUCTURE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.blocker_severity_level AS ENUM (
        'CRITICAL_BLOCKER',
        'HIGH_DELIVERY_RISK'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workdash.assignment_distribution_mode AS ENUM (
        'SINGLE_DEVELOPER',
        'MULTIPLE_DEVELOPERS',
        'ENTIRE_TEAM'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- -----------------------------------------------------------------------------
-- 3. TABLES DEFINITION (12 STREAMLINED CORE TABLES)
-- -----------------------------------------------------------------------------

-- 3.1 Planning Operational Periods (Pre-Plan Cycles)
CREATE TABLE IF NOT EXISTS workdash.planning_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_planning_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE workdash.planning_periods IS 'Operational planning calendar cycles for capacity scheduling.';
CREATE INDEX IF NOT EXISTS idx_planning_periods_current ON workdash.planning_periods(is_current);

-- 3.2 Users & Developers (Linked to Clerk Auth via clerk_id)
CREATE TABLE IF NOT EXISTS workdash.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role_title VARCHAR(150) NOT NULL,
    system_role workdash.user_system_role NOT NULL DEFAULT 'DEVELOPER',
    seniority workdash.seniority_level NOT NULL DEFAULT 'L3_SENIOR',
    weekly_capacity_hours NUMERIC(4, 1) NOT NULL DEFAULT 40.0 CHECK (weekly_capacity_hours >= 10.0 AND weekly_capacity_hours <= 80.0),
    recurring_overhead_hours NUMERIC(4, 1) NOT NULL DEFAULT 6.0 CHECK (recurring_overhead_hours >= 0.0 AND recurring_overhead_hours <= 40.0),
    skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workdash.users IS 'Company employees (engineers, tech leads, managers) linked to Clerk authentication.';
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON workdash.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON workdash.users(system_role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_skills_gin ON workdash.users USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON workdash.users(LOWER(email));

-- 3.3 Squads / Engineering Pods (Project Teams)
CREATE TABLE IF NOT EXISTS workdash.squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    badge_code VARCHAR(32) NOT NULL DEFAULT 'PROJECT',
    focus_domain VARCHAR(255) NOT NULL,
    lead_user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE RESTRICT,
    budget_hours NUMERIC(6, 1) NOT NULL DEFAULT 320.0 CHECK (budget_hours >= 0.0),
    spent_hours NUMERIC(6, 1) NOT NULL DEFAULT 0.0 CHECK (spent_hours >= 0.0),
    health workdash.squad_health_status NOT NULL DEFAULT 'HEALTHY',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workdash.squads IS 'Internal cross-functional engineering pods with designated Tech Leads and sprint capacity limits. Soft-deleted via is_active = false — never hard DELETE a squad row.';
CREATE INDEX IF NOT EXISTS idx_squads_lead_user ON workdash.squads(lead_user_id);
CREATE INDEX IF NOT EXISTS idx_squads_badge_code ON workdash.squads(badge_code);
CREATE INDEX IF NOT EXISTS idx_squads_active ON workdash.squads(is_active) WHERE is_active = true;

-- 3.4 Squad Members Junction Table
CREATE TABLE IF NOT EXISTS workdash.squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES workdash.squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
    allocation_percentage NUMERIC(3, 0) NOT NULL DEFAULT 100 CHECK (allocation_percentage >= 10 AND allocation_percentage <= 100),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMPTZ,
    CONSTRAINT uq_squad_user UNIQUE (squad_id, user_id)
);

COMMENT ON TABLE workdash.squad_members IS 'Membership and percentage capacity allocation of engineers inside squads. left_at = NULL means still active; set left_at = NOW() when engineer leaves the squad.';
CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON workdash.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON workdash.squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_active ON workdash.squad_members(squad_id) WHERE left_at IS NULL;

-- 3.5 Tasks (Pre-Planning, Ad-Hoc Emergency, Routine Overhead)
CREATE TABLE IF NOT EXISTS workdash.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    squad_id UUID NOT NULL REFERENCES workdash.squads(id) ON DELETE CASCADE,
    task_type workdash.task_workload_type NOT NULL DEFAULT 'PRE_PLANNING',
    category workdash.task_category_type NOT NULL DEFAULT 'DEVELOPMENT',
    priority workdash.task_priority_level NOT NULL DEFAULT 'P2_MEDIUM',
    status workdash.task_workflow_status NOT NULL DEFAULT 'IN_PROGRESS',
    estimated_hours NUMERIC(5, 2) NOT NULL DEFAULT 4.00 CHECK (estimated_hours > 0.00),
    logged_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (logged_hours >= 0.00),
    recurrence_frequency workdash.recurrence_freq,
    assigned_by_user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workdash.tasks IS 'Central deliverables registry assigned to squads and individual engineers.';
CREATE INDEX IF NOT EXISTS idx_tasks_squad_status ON workdash.tasks(squad_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_type_status ON workdash.tasks(task_type, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON workdash.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_at ON workdash.tasks(assigned_at);
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON workdash.tasks USING gin (title gin_trgm_ops);

-- 3.6 Task Assignments (Supports Single Dev, Multi-Dev Pods, & Team Delegation)
CREATE TABLE IF NOT EXISTS workdash.task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
    assigned_hours NUMERIC(5, 2) NOT NULL CHECK (assigned_hours > 0.00),
    split_mode workdash.assignment_distribution_mode NOT NULL DEFAULT 'SINGLE_DEVELOPER',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_task_assignment UNIQUE (task_id, user_id)
);

COMMENT ON TABLE workdash.task_assignments IS 'Engineer capacity workload allocation per task with distribution modes.';
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_task ON workdash.task_assignments(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON workdash.task_assignments(task_id);

-- 3.7 Timesheet Work Logs
CREATE TABLE IF NOT EXISTS workdash.work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
    hours NUMERIC(4, 2) NOT NULL DEFAULT 1.00 CHECK (hours > 0.00 AND hours <= 24.00),
    notes TEXT NOT NULL,
    log_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workdash.work_logs IS 'Actual time logs recorded by engineers against assigned tasks.';
CREATE INDEX IF NOT EXISTS idx_work_logs_user_date ON workdash.work_logs(user_id, log_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_work_logs_task ON workdash.work_logs(task_id);

-- 3.8 Task Blockers & Delivery Risk Registry
CREATE TABLE IF NOT EXISTS workdash.task_blockers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
    reported_by_user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE RESTRICT,
    category workdash.blocker_category_type NOT NULL DEFAULT 'TECHNICAL_IMPEDIMENT',
    severity workdash.blocker_severity_level NOT NULL DEFAULT 'CRITICAL_BLOCKER',
    reason TEXT NOT NULL,
    business_impact TEXT NOT NULL,
    mitigation_action TEXT,
    expected_resolution_date DATE,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by_user_id UUID REFERENCES workdash.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workdash.task_blockers IS 'Blocker incident registry tracking delivery impediments, severity, and mitigation plans.';
CREATE INDEX IF NOT EXISTS idx_task_blockers_task ON workdash.task_blockers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_blockers_active ON workdash.task_blockers(is_resolved, severity) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_task_blockers_reason_trgm ON workdash.task_blockers USING gin (reason gin_trgm_ops);

-- 3.9 Task Blueprint Templates
CREATE TABLE IF NOT EXISTS workdash.task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    default_task_title VARCHAR(255) NOT NULL,
    category workdash.task_category_type NOT NULL DEFAULT 'DEVELOPMENT',
    task_type workdash.task_workload_type NOT NULL DEFAULT 'PRE_PLANNING',
    recurrence_frequency workdash.recurrence_freq,
    default_estimated_hours NUMERIC(4, 2) NOT NULL DEFAULT 4.00 CHECK (default_estimated_hours > 0.00),
    default_priority workdash.task_priority_level NOT NULL DEFAULT 'P2_MEDIUM',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_by_user_id UUID REFERENCES workdash.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workdash.task_templates IS 'Operations blueprint library for 1-click standard task creation.';

-- 3.10 Blocker Presets
CREATE TABLE IF NOT EXISTS workdash.blocker_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_slug VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    category workdash.blocker_category_type NOT NULL DEFAULT 'TECHNICAL_IMPEDIMENT',
    severity workdash.blocker_severity_level NOT NULL DEFAULT 'CRITICAL_BLOCKER',
    description_template TEXT NOT NULL,
    impact_template TEXT NOT NULL,
    mitigation_template TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workdash.blocker_presets IS '1-click quick presets for reporting standardized impediments and mitigations.';

-- 3.11 Real-time Active Timers (1 active per developer)
CREATE TABLE IF NOT EXISTS workdash.active_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES workdash.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
    seconds_elapsed INTEGER NOT NULL DEFAULT 0 CHECK (seconds_elapsed >= 0),
    is_running BOOLEAN NOT NULL DEFAULT true,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workdash.active_timers IS 'Active stopwatch timers operated by developers in their workspace.';

-- 3.12 Recurring Routines
CREATE TABLE IF NOT EXISTS workdash.recurring_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
    squad_id UUID REFERENCES workdash.squads(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    frequency workdash.recurrence_freq NOT NULL DEFAULT 'DAILY',
    schedule_label VARCHAR(100) NOT NULL,
    allocated_hours NUMERIC(4, 2) NOT NULL DEFAULT 2.50 CHECK (allocated_hours > 0.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workdash.recurring_routines IS 'Routine commitments (standups, reviews, mentoring) scheduled on recurring cadences.';

-- -----------------------------------------------------------------------------
-- 4. PERFORMANCE & SEARCH INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON workdash.users USING gin (full_name gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 5. AUTOMATED INTEGRITY TRIGGERS & FUNCTIONS
-- -----------------------------------------------------------------------------

-- 5.1 Updated At Auto-Maintenance Function
CREATE OR REPLACE FUNCTION workdash.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
BEFORE UPDATE ON workdash.users
FOR EACH ROW EXECUTE FUNCTION workdash.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_squads_updated_at
BEFORE UPDATE ON workdash.squads
FOR EACH ROW EXECUTE FUNCTION workdash.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON workdash.tasks
FOR EACH ROW EXECUTE FUNCTION workdash.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_task_blockers_updated_at
BEFORE UPDATE ON workdash.task_blockers
FOR EACH ROW EXECUTE FUNCTION workdash.fn_set_updated_at();

-- 5.2 Work Logs Hours Rollup Trigger on Tasks
CREATE OR REPLACE FUNCTION workdash.fn_sync_task_logged_hours()
RETURNS TRIGGER AS $$
DECLARE
    target_task_id UUID;
    total_logged NUMERIC(5, 2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_task_id := OLD.task_id;
    ELSE
        target_task_id := NEW.task_id;
    END IF;

    SELECT COALESCE(SUM(hours), 0.00) INTO total_logged
    FROM workdash.work_logs
    WHERE task_id = target_task_id;

    UPDATE workdash.tasks
    SET logged_hours = total_logged,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = target_task_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_task_logged_hours
AFTER INSERT OR UPDATE OR DELETE ON workdash.work_logs
FOR EACH ROW EXECUTE FUNCTION workdash.fn_sync_task_logged_hours();

-- 5.3 Blocker Propagation & Timer Auto-Pause Trigger
CREATE OR REPLACE FUNCTION workdash.fn_sync_task_blocker_state()
RETURNS TRIGGER AS $$
DECLARE
    target_task_id UUID;
    active_blocker_count INT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_task_id := OLD.task_id;
    ELSE
        target_task_id := NEW.task_id;
    END IF;

    SELECT COUNT(*) INTO active_blocker_count
    FROM workdash.task_blockers
    WHERE task_id = target_task_id AND is_resolved = false;

    IF active_blocker_count > 0 THEN
        UPDATE workdash.tasks
        SET is_blocked = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = target_task_id;

        -- Auto-pause any active timer on this blocked task
        UPDATE workdash.active_timers
        SET is_running = false
        WHERE task_id = target_task_id;
    ELSE
        UPDATE workdash.tasks
        SET is_blocked = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = target_task_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_task_blocker_state
AFTER INSERT OR UPDATE OR DELETE ON workdash.task_blockers
FOR EACH ROW EXECUTE FUNCTION workdash.fn_sync_task_blocker_state();

-- 5.4 Task Completion Timestamp & Timer Teardown Trigger
CREATE OR REPLACE FUNCTION workdash.fn_handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := CURRENT_TIMESTAMP;
        END IF;
        -- If completed, automatically match logged hours if estimate was unlogged
        IF NEW.logged_hours < NEW.estimated_hours THEN
            NEW.logged_hours := NEW.estimated_hours;
        END IF;
        -- Teardown active timer if running
        DELETE FROM workdash.active_timers WHERE task_id = NEW.id;
    ELSIF NEW.status != 'COMPLETED' AND OLD.status = 'COMPLETED' THEN
        NEW.completed_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_handle_task_completion
BEFORE UPDATE ON workdash.tasks
FOR EACH ROW EXECUTE FUNCTION workdash.fn_handle_task_completion();

-- -----------------------------------------------------------------------------
-- 6. BUSINESS VIEWS & CAPACITY ANALYTICS
-- -----------------------------------------------------------------------------

-- 6.1 Comprehensive Developer Capacity Summary View
CREATE OR REPLACE VIEW workdash.v_developer_capacity_summary AS
SELECT
    u.id AS user_id,
    u.clerk_id,
    u.full_name,
    u.email,
    u.role_title,
    u.seniority,
    u.weekly_capacity_hours,
    u.recurring_overhead_hours,
    sm.squad_id,
    sq.name AS squad_name,
    sq.badge_code AS squad_badge_code,
    
    -- Capacity breakdowns
    COALESCE(u.recurring_overhead_hours, 6.0) AS recurring_hours,
    COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) AS pre_planning_hours,
    COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) AS adhoc_hours,
    COALESCE(SUM(CASE WHEN t.status = 'PENDING_REVIEW' THEN ta.assigned_hours ELSE 0 END), 0.0) AS pending_hours,
    
    -- Total load
    (
        COALESCE(u.recurring_overhead_hours, 6.0) +
        COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
        COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
    ) AS total_load_hours,
    
    -- Computed utilization metrics
    ROUND(
        (
            (
                COALESCE(u.recurring_overhead_hours, 6.0) +
                COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
                COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
            ) / u.weekly_capacity_hours
        ) * 100, 1
    ) AS utilization_pct,
    
    GREATEST(0.0, u.weekly_capacity_hours - (
        COALESCE(u.recurring_overhead_hours, 6.0) +
        COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
        COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
    )) AS available_buffer_hours,

    GREATEST(0.0, (
        COALESCE(u.recurring_overhead_hours, 6.0) +
        COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
        COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
    ) - u.weekly_capacity_hours) AS overage_hours,

    (
        (
            COALESCE(u.recurring_overhead_hours, 6.0) +
            COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
            COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
        ) > u.weekly_capacity_hours
    ) AS is_overallocated

FROM workdash.users u
LEFT JOIN workdash.squad_members sm ON sm.user_id = u.id
LEFT JOIN workdash.squads sq ON sq.id = sm.squad_id
LEFT JOIN workdash.task_assignments ta ON ta.user_id = u.id
LEFT JOIN workdash.tasks t ON t.id = ta.task_id
WHERE u.is_active = true
GROUP BY u.id, u.clerk_id, u.full_name, u.email, u.role_title, u.seniority, u.weekly_capacity_hours, u.recurring_overhead_hours, sm.squad_id, sq.name, sq.badge_code;

-- 6.2 Squad Operations & Burn Summary View (Powers Teams & Squads Hub)
CREATE OR REPLACE VIEW workdash.v_squad_capacity_summary AS
SELECT
    s.id AS squad_id,
    s.name AS squad_name,
    s.badge_code,
    s.focus_domain,
    s.health,
    u_lead.id AS tech_lead_id,
    u_lead.full_name AS tech_lead_name,
    u_lead.email AS tech_lead_email,
    s.budget_hours,
    s.spent_hours,
    COUNT(DISTINCT sm.user_id) AS total_engineers,
    COUNT(DISTINCT sm.user_id) * 40.0 AS total_capacity_hours,
    COALESCE(SUM(v_dev.total_load_hours), 0.0) AS allocated_load_hours,
    CASE 
        WHEN (COUNT(DISTINCT sm.user_id) * 40.0) > 0 THEN
            ROUND((COALESCE(SUM(v_dev.total_load_hours), 0.0) / (COUNT(DISTINCT sm.user_id) * 40.0)) * 100, 1)
        ELSE 0.0
    END AS squad_utilization_pct,
    COUNT(DISTINCT CASE WHEN v_dev.is_overallocated THEN v_dev.user_id END) AS overbooked_engineers_count,
    COUNT(DISTINCT t.id) AS active_tasks_count,
    COUNT(DISTINCT CASE WHEN t.is_blocked THEN t.id END) AS blocked_tasks_count
FROM workdash.squads s
JOIN workdash.users u_lead ON u_lead.id = s.lead_user_id
LEFT JOIN workdash.squad_members sm ON sm.squad_id = s.id
LEFT JOIN workdash.v_developer_capacity_summary v_dev ON v_dev.user_id = sm.user_id
LEFT JOIN workdash.tasks t ON t.squad_id = s.id AND t.status != 'COMPLETED'
GROUP BY s.id, s.name, s.badge_code, s.focus_domain, s.health, u_lead.id, u_lead.full_name, u_lead.email, s.budget_hours, s.spent_hours;

-- 6.3 Active Blocker Registry View
CREATE OR REPLACE VIEW workdash.v_active_blockers_registry AS
SELECT
    b.id AS blocker_id,
    b.category,
    b.severity,
    b.reason,
    b.business_impact,
    b.mitigation_action,
    b.expected_resolution_date,
    b.created_at AS reported_at,
    t.id AS task_id,
    t.title AS task_title,
    t.estimated_hours,
    t.logged_hours,
    t.due_date,
    u_rep.full_name AS reported_by_name,
    u_ass.id AS assigned_user_id,
    u_ass.full_name AS assigned_user_name,
    u_ass.role_title AS assigned_user_role,
    sq.id AS squad_id,
    sq.name AS squad_name,
    sq.badge_code AS project_code
FROM workdash.task_blockers b
JOIN workdash.tasks t ON t.id = b.task_id
JOIN workdash.users u_rep ON u_rep.id = b.reported_by_user_id
LEFT JOIN workdash.task_assignments ta ON ta.task_id = t.id
LEFT JOIN workdash.users u_ass ON u_ass.id = ta.user_id
LEFT JOIN workdash.squads sq ON sq.id = t.squad_id
WHERE b.is_resolved = false
ORDER BY (b.severity = 'CRITICAL_BLOCKER') DESC, b.created_at DESC;

-- -- -----------------------------------------------------------------------------
-- -- 7. SEED REFERENCE DATA (SAMPLE INITIALIZATION)
-- -- -----------------------------------------------------------------------------

-- -- 7.1 Planning Period
-- INSERT INTO workdash.planning_periods (id, name, start_date, end_date, is_current)
-- VALUES ('00000000-0000-0000-0000-000000000002', 'Planning Week · Sep 1–7, 2026', '2026-09-01', '2026-09-07', true)
-- ON CONFLICT DO NOTHING;

-- -- 7.2 Users (with Clerk IDs)
-- INSERT INTO workdash.users (id, clerk_id, full_name, email, role_title, system_role, seniority, weekly_capacity_hours, recurring_overhead_hours, skills) VALUES
-- ('20000000-0000-0000-0000-000000000001', 'user_clerk_marcus_vance', 'Marcus Vance', 'marcus.vance@workdash.internal', 'Engineering Manager', 'MANAGER', 'LEAD', 40.0, 8.0, ARRAY['Agile', 'Scrum', 'Capacity Planning', 'Delivery Management']),
-- ('20000000-0000-0000-0000-000000000002', 'user_clerk_david_miller', 'David Miller', 'david.m@workdash.internal', 'Tech Lead - Squad A', 'DEVELOPER', 'LEAD', 40.0, 8.0, ARRAY['Go', 'Node.js', 'PostgreSQL', 'Microservices']),
-- ('20000000-0000-0000-0000-000000000003', 'user_clerk_sarah_jenkins', 'Sarah Jenkins', 'sarah.j@workdash.internal', 'Tech Lead - Squad B', 'DEVELOPER', 'LEAD', 40.0, 8.0, ARRAY['React', 'TypeScript', 'Next.js', 'Architecture']),
-- ('20000000-0000-0000-0000-000000000004', 'user_clerk_robert_chang', 'Robert Chang', 'robert.c@workdash.internal', 'Tech Lead - Squad C', 'DEVELOPER', 'LEAD', 40.0, 8.0, ARRAY['iOS', 'Android', 'Flutter', 'Swift', 'Kotlin']),
-- ('20000000-0000-0000-0000-000000000005', 'user_clerk_elena_rostova', 'Elena Rostova', 'elena.r@workdash.internal', 'Tech Lead - Squad D', 'DEVELOPER', 'LEAD', 40.0, 8.0, ARRAY['Kubernetes', 'AWS', 'Terraform', 'Observability']),
-- ('20000000-0000-0000-0000-000000000006', 'user_clerk_marcus_brody', 'Marcus Brody', 'marcus.b@workdash.internal', 'Tech Lead - Squad E', 'DEVELOPER', 'LEAD', 40.0, 8.0, ARRAY['Playwright', 'k6', 'SecOps', 'SOC2']),
-- ('20000000-0000-0000-0000-000000000007', 'user_clerk_chiranshi_thummar', 'Chiranshi Thummar', 'chiranshi.t@workdash.internal', 'Tech Lead - Squad F', 'DEVELOPER', 'LEAD', 40.0, 8.0, ARRAY['Python', 'PyTorch', 'LLMs', 'MLOps', 'FastAPI']),
-- ('20000000-0000-0000-0000-000000000012', 'user_clerk_alex_chen', 'Alex Chen', 'alex.chen@workdash.internal', 'Senior Backend Engineer', 'DEVELOPER', 'L3_SENIOR', 40.0, 8.0, ARRAY['Node.js', 'Go', 'PostgreSQL', 'Redis', 'OAuth2', 'JWT'])
-- ON CONFLICT (email) DO NOTHING;

-- -- 7.3 Squads (6 Core Engineering Pods Matching Dashboard Hub)
-- INSERT INTO workdash.squads (id, name, badge_code, focus_domain, lead_user_id, budget_hours, spent_hours, health) VALUES
-- ('30000000-0000-0000-0000-000000000001', 'Squad A (FinTech Core Platform)',        'ALPHA',   'Alpha FinTech Platform · High-Throughput APIs',               '20000000-0000-0000-0000-000000000002', 320.0, 280.0, 'HEALTHY'),
-- ('30000000-0000-0000-0000-000000000002', 'Squad B (E-Commerce Web Portal)',        'BETA',    'Beta E-Commerce Portal · Next.js & Design System',            '20000000-0000-0000-0000-000000000003', 400.0, 310.0, 'HEALTHY'),
-- ('30000000-0000-0000-0000-000000000003', 'Squad C (Mobile POS & iOS/Android)',     'GAMMA',   'Gamma POS Suite · Native iOS/Android POS Engine',             '20000000-0000-0000-0000-000000000004', 250.0, 190.0, 'HEALTHY'),
-- ('30000000-0000-0000-0000-000000000004', 'Squad D (Cloud Infra & SRE)',            'DELTA',   'Delta Cloud & SRE · Kubernetes & Multi-Cloud Autoscaling',    '20000000-0000-0000-0000-000000000005', 500.0, 420.0, 'HEALTHY'),
-- ('30000000-0000-0000-0000-000000000005', 'Squad E (Security & QA Automation)',     'ECHO',    'Echo SecOps & QA · SOC2 Compliance & Load Testing',           '20000000-0000-0000-0000-000000000006', 300.0, 210.0, 'HEALTHY'),
-- ('30000000-0000-0000-0000-000000000006', 'Squad F (Machine Learning & AI)',        'PROJECT', 'Squad F Machine Learning · LLM Pipelines & Vision Models',    '20000000-0000-0000-0000-000000000007', 350.0, 120.0, 'HEALTHY')
-- ON CONFLICT (id) DO NOTHING;

-- -- 7.4 Squad Members
-- INSERT INTO workdash.squad_members (squad_id, user_id, allocation_percentage) VALUES
-- ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', 100)
-- ON CONFLICT (squad_id, user_id) DO NOTHING;

-- -- 7.5 Task Templates
-- INSERT INTO workdash.task_templates (name, default_task_title, category, task_type, default_estimated_hours, default_priority, is_system) VALUES
-- ('Feature delivery', '[FEAT] Implement API Gateway & Auth Endpoint', 'DEVELOPMENT', 'PRE_PLANNING', 6.00, 'P2_MEDIUM', true),
-- ('Production bug fix', '[FIX] Resolve Production Session Timeout & Cache Invalidation', 'BUG_FIX', 'AD_HOC_EMERGENCY', 2.50, 'P1_HIGH', true),
-- ('Quality assurance', '[QA] End-to-End Regression & Sandbox Verification', 'TESTING_QA', 'PRE_PLANNING', 4.00, 'P2_MEDIUM', true),
-- ('Routine reporting', '[REPORT] Weekly Squad Milestone & Capacity Health Report', 'REPORTING', 'RECURRING_ROUTINE', 2.00, 'P2_MEDIUM', true),
-- ('Platform operations', '[OPS] Database Index Optimization & Replica Sync Check', 'DEVOPS', 'RECURRING_ROUTINE', 3.00, 'P2_MEDIUM', true);

-- -- 7.6 Blocker Presets
-- INSERT INTO workdash.blocker_presets (key_slug, label, category, severity, description_template, impact_template, mitigation_template) VALUES
-- ('api_keys', 'API Keys', 'DEPENDENCY', 'CRITICAL_BLOCKER', 'Awaiting production API keys and OAuth2 client credentials for internal service integration.', 'QA paused; payment checkout integration delayed by 24h.', 'Engineering Manager escalated with platform security team for expedited key provisioning.'),
-- ('db_lag', 'Database Lag', 'TECHNICAL_IMPEDIMENT', 'CRITICAL_BLOCKER', 'Staging DB replica snapshot sync lag causing migration script timeout and integrity check failure.', 'Database partitioning delayed; blocks staging environment cutover.', 'DBA scheduled maintenance window for replica synchronization.'),
-- ('pr_review', 'PR Review', 'REVIEW_BOTTLENECK', 'HIGH_DELIVERY_RISK', 'Pending secondary security architecture review and Tech Lead approval before merging to staging.', 'Merge delayed by 1 sprint day; testing blocked.', 'Tech Lead notified to prioritize architectural review today.'),
-- ('cicd_failure', 'CI/CD Fail', 'INFRASTRUCTURE', 'CRITICAL_BLOCKER', 'Runner out-of-memory error during Docker container build in GitHub Actions deployment pipeline.', 'Automatic staging deployments halted; manual hotfix deploy required.', 'DevOps upgraded GitHub Action runner memory limit from 4GB to 8GB.'),
-- ('outage_3rdparty', '3rd-Party Outage', 'TECHNICAL_IMPEDIMENT', 'CRITICAL_BLOCKER', 'External SMS OTP verification provider reporting widespread downtime and 503 Service Unavailable errors.', 'User registration and 2FA login verification flows completely halted.', 'Switched to fallback email OTP authentication sandbox until provider resolves incident.')
-- ON CONFLICT (key_slug) DO NOTHING;

-- -- 7.7 Sample Tasks for Alex Chen (Squad A)
-- INSERT INTO workdash.tasks (id, title, squad_id, task_type, category, priority, status, estimated_hours, logged_hours, assigned_by_user_id, assigned_at, due_date, completed_at, is_blocked) VALUES
-- ('40000000-0000-0000-0000-000000000109', 'Health Check & Prometheus Metrics Endpoint', '30000000-0000-0000-0000-000000000001', 'PRE_PLANNING', 'DEVOPS', 'P2_MEDIUM', 'COMPLETED', 4.00, 4.00, '20000000-0000-0000-0000-000000000001', '2026-09-02 10:00:00+00', '2026-09-02 18:00:00+00', '2026-09-02 16:30:00+00', false),
-- ('40000000-0000-0000-0000-000000000101', 'Initial API Gateway Setup & Routing Middleware', '30000000-0000-0000-0000-000000000001', 'PRE_PLANNING', 'DEVELOPMENT', 'P1_HIGH', 'COMPLETED', 6.00, 6.00, '20000000-0000-0000-0000-000000000001', '2026-09-01 09:00:00+00', '2026-09-01 17:00:00+00', '2026-09-01 17:00:00+00', false),
-- ('40000000-0000-0000-0000-000000000102', 'User Auth Middleware & Clerk Webhook Handler', '30000000-0000-0000-0000-000000000001', 'PRE_PLANNING', 'DEVELOPMENT', 'P1_HIGH', 'IN_PROGRESS', 12.00, 14.50, '20000000-0000-0000-0000-000000000001', '2026-09-01 09:15:00+00', '2026-09-05 18:00:00+00', null, true),
-- ('40000000-0000-0000-0000-000000000108', 'Hotfix: Auth Token Refresh Memory Leak', '30000000-0000-0000-0000-000000000001', 'AD_HOC_EMERGENCY', 'BUG_FIX', 'P1_HIGH', 'IN_PROGRESS', 6.00, 8.50, '20000000-0000-0000-0000-000000000001', '2026-09-01 09:00:00+00', '2026-09-01 17:00:00+00', null, true),
-- ('40000000-0000-0000-0000-000000000103', 'Database Partitioning & Migration Script', '30000000-0000-0000-0000-000000000001', 'PRE_PLANNING', 'DEVOPS', 'P2_MEDIUM', 'TO_DO', 8.00, 0.00, '20000000-0000-0000-0000-000000000002', '2026-08-31 11:00:00+00', '2026-09-01 18:00:00+00', null, true)
-- ON CONFLICT (id) DO NOTHING;

-- -- 7.8 Task Assignments for Alex Chen
-- INSERT INTO workdash.task_assignments (task_id, user_id, assigned_hours, split_mode) VALUES
-- ('40000000-0000-0000-0000-000000000109', '20000000-0000-0000-0000-000000000012', 4.00, 'SINGLE_DEVELOPER'),
-- ('40000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000012', 6.00, 'SINGLE_DEVELOPER'),
-- ('40000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000012', 12.00, 'SINGLE_DEVELOPER'),
-- ('40000000-0000-0000-0000-000000000108', '20000000-0000-0000-0000-000000000012', 6.00, 'SINGLE_DEVELOPER'),
-- ('40000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000012', 8.00, 'SINGLE_DEVELOPER')
-- ON CONFLICT (task_id, user_id) DO NOTHING;

-- -- 7.9 Timesheet Work Logs for Alex Chen
-- INSERT INTO workdash.work_logs (task_id, user_id, hours, notes, log_timestamp) VALUES
-- ('40000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000012', 4.50, 'Configured Clerk JWT verification middleware and user profile synchronization webhook.', '2026-09-02 09:30:00+00'),
-- ('40000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000012', 10.00, 'Built backend role-based access control guards using Clerk session claims.', '2026-09-01 14:00:00+00'),
-- ('40000000-0000-0000-0000-000000000109', '20000000-0000-0000-0000-000000000012', 4.00, 'Configured Prometheus /metrics endpoint and Kubernetes liveness/readiness probes.', '2026-09-02 16:30:00+00'),
-- ('40000000-0000-0000-0000-000000000108', '20000000-0000-0000-0000-000000000012', 4.00, 'Identified unclosed WebSocket listener during token refresh loop and applied cleanup hook.', '2026-09-01 16:15:00+00'),
-- ('40000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000012', 6.00, 'Configured Express gateway router, CORS policies, rate limiting, and automated unit tests.', '2026-09-01 17:00:00+00');

-- -- 7.10 Active Blockers
-- INSERT INTO workdash.task_blockers (task_id, reported_by_user_id, category, severity, reason, business_impact, mitigation_action, expected_resolution_date, is_resolved) VALUES
-- ('40000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000012', 'RESOURCE_CAPACITY', 'CRITICAL_BLOCKER', 'Mid-sprint scope expansion requiring additional webhook audit logging; awaiting key approval.', '+2.5h budget overrun; blocks staging security audit and staging deploy.', 'Manager Marcus Vance escalated with internal platform leads for fast-track review.', '2026-09-05', false),
-- ('40000000-0000-0000-0000-000000000108', '20000000-0000-0000-0000-000000000012', 'TECHNICAL_IMPEDIMENT', 'CRITICAL_BLOCKER', 'Token refresh loop had an unclosed circular WebSocket listener in external auth library; required custom teardown handlers.', 'Missed Sep 1 deadline; potential memory leak under high concurrency.', 'Pairing with SRE lead Elena Rostova on socket teardown analysis.', '2026-09-03', false),
-- ('40000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000012', 'REVIEW_BOTTLENECK', 'CRITICAL_BLOCKER', 'Staging database replica snapshot failed integrity validation on Aug 31; migration script was delayed.', 'Migration script delayed by 2 days; blocks staging environment cutover.', 'David Miller scheduled schema & index review for Thursday 2:00 PM.', '2026-09-04', false);

-- -- 7.11 Active Timer for Alex Chen
-- INSERT INTO workdash.active_timers (user_id, task_id, seconds_elapsed, is_running, started_at)
-- VALUES ('20000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000102', 5078, true, CURRENT_TIMESTAMP - INTERVAL '1 hour 24 minutes 38 seconds')
-- ON CONFLICT (user_id) DO NOTHING;

-- -- 7.12 Recurring Routines for Alex Chen
-- INSERT INTO workdash.recurring_routines (user_id, squad_id, title, frequency, schedule_label, allocated_hours) VALUES
-- ('20000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000001', 'Daily Standup & Squad Sync', 'DAILY', 'Every day · 9:30 AM', 2.50),
-- ('20000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000001', 'PR Reviews & Mentoring Devs', 'DAILY', 'Every afternoon · 4:00 PM', 3.50),
-- ('20000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000001', 'Weekly Sprint Planning & Grooming', 'WEEKLY', 'Mondays · 11:00 AM', 1.00),
-- ('20000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000001', 'Engineering All-Hands Meeting', 'MONTHLY', '1st Monday of month', 2.00);
