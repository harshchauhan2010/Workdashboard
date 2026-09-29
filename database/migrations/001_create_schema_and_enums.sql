-- ============================================================================
-- Migration 001: Create Schema and Custom ENUM Types
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS workdash;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Domain ENUMs
DO $$ BEGIN
    CREATE TYPE workdash.user_system_role AS ENUM ('MANAGER', 'DEVELOPER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.seniority_level AS ENUM (
        'L1_JUNIOR',
        'L2_MID',
        'L3_SENIOR',
        'L4_STAFF',
        'L5_PRINCIPAL',
        'LEAD'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.squad_health_status AS ENUM ('HEALTHY', 'AT_RISK', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.task_workload_type AS ENUM ('PLANNED', 'UNPLANNED', 'MAINTENANCE', 'BUG');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.task_workflow_status AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.task_category_type AS ENUM (
        'FEATURE',
        'MAINTENANCE',
        'ONBOARDING',
        'SUPPORT',
        'INCIDENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.task_priority_level AS ENUM ('P0_URGENT', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.assignment_distribution_mode AS ENUM ('EQUAL_SPLIT', 'CUSTOM_HOURS', 'PRIMARY_SUPPORT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.blocker_severity_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.blocker_category_type AS ENUM (
        'CROSS_SQUAD',
        'EXTERNAL_VENDOR',
        'ACCESS_PERMISSIONS',
        'TECHNICAL_DEBT',
        'SPEC_AMBIGUITY',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.recurrence_freq AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.timer_action_type AS ENUM ('START', 'PAUSE', 'RESUME', 'STOP', 'DISCARD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workdash.capacity_load_band AS ENUM (
        'OPTIMAL_LOAD',
        'BALANCED',
        'NEAR_CAPACITY',
        'OVER_ALLOCATED',
        'BURNOUT_RISK'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
