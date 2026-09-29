# WorkDashboard — Complete Database Architecture & Reference

> **Database:** `workdashboard` · **Schema:** `workdash` · **PostgreSQL 15+**

---

## 1. Schema Overview & Design Philosophy

WorkDashboard uses a dedicated schema named `workdash`. The database is engineered for:
1. **Strong Data Integrity**: Strict foreign keys, checks, and cascade deletions.
2. **Automated Business Logic**: 4 triggers manage calculated fields (`logged_hours`, `is_blocked`, `completed_at`, `updated_at`).
3. **High-Performance Analytics**: 3 pre-computed business views calculate real-time capacity and blocker stats without complex nested application queries.

---

## 2. Enums Defined

```sql
-- System Roles
CREATE TYPE workdash.user_system_role AS ENUM ('MANAGER', 'DEVELOPER');

-- User & Squad Statuses
CREATE TYPE workdash.user_status_type AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE workdash.squad_status_type AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE workdash.squad_role_type AS ENUM ('LEAD', 'MEMBER');

-- Task Classifications
CREATE TYPE workdash.task_workload_type AS ENUM ('PRE_PLANNING', 'AD_HOC_EMERGENCY');
CREATE TYPE workdash.task_category_type AS ENUM (
  'DEVELOPMENT', 'BUG_FIX', 'INFRASTRUCTURE', 'TESTING_QA',
  'DOCUMENTATION', 'CODE_REVIEW', 'MEETING', 'OTHER'
);
CREATE TYPE workdash.task_status_type AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED');
CREATE TYPE workdash.task_priority_level AS ENUM ('P0_URGENT', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW');
CREATE TYPE workdash.assignment_split_type AS ENUM ('SINGLE', 'EQUAL_SPLIT', 'CUSTOM_SPLIT');

-- Blocker Classifications
CREATE TYPE workdash.blocker_category_type AS ENUM (
  'TECHNICAL_IMPEDIMENT', 'DEPENDENCY_WAITING', 'EXTERNAL_VENDOR',
  'REQUIREMENTS_UNCLEAR', 'INFRASTRUCTURE_OUTAGE', 'CODE_REVIEW_DELAY', 'OTHER'
);
CREATE TYPE workdash.blocker_severity_level AS ENUM ('CRITICAL_BLOCKER', 'MAJOR_IMPEDIMENT', 'MINOR_DELAY');
CREATE TYPE workdash.blocker_status_type AS ENUM ('ACTIVE_BLOCKED', 'RESOLVED');

-- Recurring Frequency
CREATE TYPE workdash.recurrence_freq AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
```

---

## 3. Entity-Relationship Model (12 Core Tables)

```
                       ┌──────────────────────┐
                       │   planning_periods   │
                       └──────────┬───────────┘
                                  │ 1:N
 ┌──────────────┐ 1:N  ┌──────────▼───────────┐ 1:N  ┌──────────────┐
 │    squads    ├──────►        tasks         ◄──────┤task_templates│
 └──────┬───────┘      └───────┬──────┬───────┘      └──────────────┘
        │ 1:N                  │ 1:N  │ 1:N
 ┌──────▼───────┐              │      │       ┌──────────────┐
 │squad_members │              │      └───────►task_blockers ◄──┐
 └──────▲───────┘              │              └──────────────┘  │ (presets)
        │ 1:N                  │ 1:N           ┌────────────────┴┐
 ┌──────┴───────┐ 1:N  ┌───────▼────────┐      │ blocker_presets │
 │    users     ├──────►task_assignments│      └─────────────────┘
 └──────┬──┬────┘      └────────────────┘
        │  │ 1:N
        │  └───────────► active_timers (1:1 per user)
        │ 1:N
        ├──────────────► work_logs (1:N per user & task)
        │ 1:N
        └──────────────► recurring_routines (1:N per user)
```

---

## 4. Tables Summary Reference

| # | Table Name | Key Purpose | Triggers Attached |
|---|------------|-------------|-------------------|
| 1 | `users` | User accounts, Clerk sync, roles, capacity & overhead hours | `trg_users_updated_at` |
| 2 | `planning_periods` | Calendar windows (Sprints) for scheduling | None |
| 3 | `squads` | Engineering pods/teams (Alpha to Foxtrot) | `trg_squads_updated_at` |
| 4 | `squad_members` | Developer squad assignments and allocation % | None |
| 5 | `tasks` | Kanban task items, workload type, state, logged hours | `trg_tasks_updated_at`, `trg_handle_task_completion` |
| 6 | `task_assignments`| Many-to-many task assignees with hour splits | None |
| 7 | `work_logs` | Actual timesheet logs recorded against tasks | `trg_sync_task_logged_hours` |
| 8 | `task_blockers` | Unresolved and resolved impediments | `trg_task_blockers_updated_at`, `trg_sync_task_blocker_state` |
| 9 | `task_templates` | 1-click reusable task blueprints library | None |
| 10 | `blocker_presets` | Standardized blocker chip templates | None |
| 11 | `active_timers` | Real-time stopwatch per developer (UNIQUE per user) | None |
| 12 | `recurring_routines`| Fixed recurring commitments (standups, reviews) | None |

---

## 5. Automated Triggers & Functions

### 5.1 Trigger: `trg_sync_task_logged_hours`
- **Table**: `workdash.work_logs`
- **When**: `AFTER INSERT OR UPDATE OR DELETE`
- **Logic**: Automatically recalculates `tasks.logged_hours` = `SUM(work_logs.hours)` for the associated task.

### 5.2 Trigger: `trg_sync_task_blocker_state`
- **Table**: `workdash.task_blockers`
- **When**: `AFTER INSERT OR UPDATE OR DELETE`
- **Logic**: 
  - If task has $\ge 1$ active blocker (`ACTIVE_BLOCKED`), sets `tasks.is_blocked = true`.
  - Automatically pauses any live timer on that task (`active_timers.is_running = false`).
  - When all blockers are resolved, resets `tasks.is_blocked = false`.

### 5.3 Trigger: `trg_handle_task_completion`
- **Table**: `workdash.tasks`
- **When**: `BEFORE UPDATE`
- **Logic**:
  - When status transitions to `COMPLETED`:
    - Sets `completed_at = CURRENT_TIMESTAMP`.
    - If `logged_hours == 0`, auto-populates `logged_hours = estimated_hours`.
    - Deletes any `active_timers` row running on that task.
  - When moved back out of `COMPLETED`, clears `completed_at = NULL`.

### 5.4 Trigger: `trg_*_updated_at`
- Automatically updates `updated_at = CURRENT_TIMESTAMP` on row modification.

---

## 6. Business Views

1. **`v_developer_capacity_summary`**:
   - Calculates developer workload, pre-planning, ad-hoc, total load, utilization %, and overage hours.
2. **`v_squad_capacity_summary`**:
   - Calculates squad-level aggregate capacity, utilization %, overbooked engineer headcounts, and active/blocked task counts.
3. **`v_active_blockers_registry`**:
   - All active blockers enriched with task titles, squad badges, and reporter info, ordered by urgency (`CRITICAL_BLOCKER` first).

---

## 7. Migration Script (`migrate.js`)

To execute database schema migration:

```bash
# Run migration against database specified in .env.local
node migrate.js
```

The script runs in an isolated transaction:
1. Connects using `DATABASE_URL`.
2. Creates `workdash` schema.
3. Sets `search_path TO workdash`.
4. Runs `Refference/postgresql.sql`.
5. Verifies tables and views creation.
