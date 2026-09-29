# WorkDashboard — Actual Database Schema

This document reflects the real data model used by the current WorkDashboard application in [app.js](app.js), [index.html](index.html), [styles.css](styles.css), and [postgresql.sql](postgresql.sql).

This is a single-company internal engineering operations platform. There are no external client records. All work is assigned directly to Squads (engineering pods), which own both engineers and tasks.

---

## 1. Design approach

The app is an engineering capacity planning and delivery intelligence dashboard. The database models the exact entities the dashboard currently manages and calculates:

- user profiles, system roles (`MANAGER`, `DEVELOPER`), and seniority levels
- operational planning calendar windows (`planning_periods`)
- engineering squads and squad allocations (`squads`, `squad_members`)
- tasks with workload types (`PRE_PLANNING`, `AD_HOC_EMERGENCY`, `RECURRING_ROUTINE`)
- task assignments with distribution modes (`SINGLE_DEVELOPER`, `MULTIPLE_DEVELOPERS`, `ENTIRE_TEAM`)
- timesheet work logs and live stopwatch sessions (`work_logs`, `active_timers`)
- critical delivery blockers and mitigation risk registry (`task_blockers`, `blocker_presets`)
- 1-click task blueprint library (`task_templates`)
- recurring routine schedules (`recurring_routines`)

This is a practical, production-grade schema modeled directly on the live dashboard codebase.

---

## 2. Custom Enumerations (ENUMs)

```sql
CREATE TYPE workdash.user_system_role AS ENUM (
  'MANAGER',
  'DEVELOPER'
);

CREATE TYPE workdash.seniority_level AS ENUM (
  'L1_JUNIOR',
  'L2_MID',
  'L3_SENIOR',
  'L4_STAFF',
  'L5_PRINCIPAL',
  'LEAD'
);

CREATE TYPE workdash.squad_health_status AS ENUM (
  'HEALTHY',
  'AT_RISK',
  'CRITICAL'
);

CREATE TYPE workdash.task_workload_type AS ENUM (
  'PRE_PLANNING',
  'AD_HOC_EMERGENCY',
  'RECURRING_ROUTINE'
);

CREATE TYPE workdash.task_workflow_status AS ENUM (
  'TO_DO',
  'IN_PROGRESS',
  'PENDING_REVIEW',
  'COMPLETED'
);

CREATE TYPE workdash.task_category_type AS ENUM (
  'DEVELOPMENT',
  'TESTING_QA',
  'BUG_FIX',
  'REPORTING',
  'UI_UX',
  'DEVOPS',
  'MEETING'
);

CREATE TYPE workdash.task_priority_level AS ENUM (
  'P1_HIGH',
  'P2_MEDIUM',
  'P3_LOW'
);

CREATE TYPE workdash.assignment_distribution_mode AS ENUM (
  'SINGLE_DEVELOPER',
  'MULTIPLE_DEVELOPERS',
  'ENTIRE_TEAM'
);

CREATE TYPE workdash.blocker_severity_level AS ENUM (
  'CRITICAL_BLOCKER',
  'HIGH_DELIVERY_RISK'
);

CREATE TYPE workdash.blocker_category_type AS ENUM (
  'TECHNICAL_IMPEDIMENT',
  'DEPENDENCY',
  'REVIEW_BOTTLENECK',
  'RESOURCE_CAPACITY',
  'SCOPE_CREEP',
  'INFRASTRUCTURE'
);

CREATE TYPE workdash.recurrence_freq AS ENUM (
  'DAILY',
  'WEEKLY',
  'MONTHLY'
);
```

---

## 3. Core tables

### 1. users

```sql
CREATE TABLE workdash.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role_title VARCHAR(150) NOT NULL,
  system_role workdash.user_system_role NOT NULL DEFAULT 'DEVELOPER',
  seniority workdash.seniority_level NOT NULL DEFAULT 'L3_SENIOR',
  weekly_capacity_hours NUMERIC(4, 1) NOT NULL DEFAULT 40.0
    CHECK (weekly_capacity_hours >= 10.0 AND weekly_capacity_hours <= 80.0),
  recurring_overhead_hours NUMERIC(4, 1) NOT NULL DEFAULT 6.0
    CHECK (recurring_overhead_hours >= 0.0 AND recurring_overhead_hours <= 40.0),
  skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Field-by-field explanation:
- `id`: internal unique user UUID identifier.
- `clerk_id`: unique Clerk Auth user ID (e.g. `user_clerk_marcus_vance`) linking the managed authentication identity to this profile.
- `full_name`: display name of the manager or engineer (e.g. `Alex Chen`, `Marcus Vance`).
- `email`: verified company work email address.
- `role_title`: primary engineering title shown in badges (e.g. `Senior Backend Engineer`, `Tech Lead - Squad A`).
- `system_role`: access control level. `MANAGER` routes to the admin workspace with the full command center. `DEVELOPER` routes to the personal workspace with their own Kanban board and stopwatch.
- `seniority`: engineering seniority level used for capacity simulation (`L1_JUNIOR` through `L5_PRINCIPAL` or `LEAD`).
- `weekly_capacity_hours`: individual maximum weekly hours threshold. Standard full-time is 40.0h. Range is 10.0 to 80.0.
- `recurring_overhead_hours`: weekly fixed recurring overhead (standups, syncs) automatically deducted from available capacity.
- `skills`: PostgreSQL text array of technical skills used for smart assignment matching (e.g. `{Node.js, Go, PostgreSQL}`).
- `is_active`: soft-delete flag. Inactive users retain all historical logs and work entries.
- `created_at`: account creation timestamp.
- `updated_at`: account modification timestamp, kept current by trigger.

Login flow:
- Manager logs in → Clerk verifies identity → `system_role = MANAGER` → Manager Command Center (Capacity Heatmap, Squads Hub, Dev Hub, Blockers, Templates).
- Developer logs in → Clerk verifies identity → `system_role = DEVELOPER` → Personal Workspace (Overview, My Tasks Kanban, My Analytics, Work Logs, Stopwatch).
- The Manager creates new developer accounts from the dashboard UI (`#modal-create-developer`). Clerk sends the invite and manages the password.

Matches UI elements in [index.html](index.html): `#dev-workspace-name`, `#modal-create-developer`, `#drawer-dev-avatar`, and the Capacity Heatmap roster.

---

### 2. planning_periods

```sql
CREATE TABLE workdash.planning_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_planning_dates CHECK (end_date >= start_date)
);
```

Field-by-field explanation:
- `id`: unique planning period identifier.
- `name`: display label for the planning cycle window (e.g. `Planning Week · Sep 1–7, 2026`).
- `start_date`: starting calendar date of the operational period.
- `end_date`: ending calendar date. The `CHECK` constraint prevents end before start.
- `is_current`: boolean flag indicating the currently active operational window. Only one row should be `true` at a time.
- `created_at`: creation timestamp.

Matches UI header in [index.html](index.html): the planning period selector ribbon and quick date filters shown at the top of the Manager workspace.

---

### 3. squads

```sql
CREATE TABLE workdash.squads (
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
```

Field-by-field explanation:
- `id`: unique squad identifier.
- `name`: full squad display name shown on cards (e.g. `Squad A (FinTech Core Platform)`, `Squad F (Machine Learning & AI)`).
- `badge_code`: uppercase short project badge rendered in task pills and squad cards (`ALPHA`, `BETA`, `GAMMA`, `DELTA`, `ECHO`, `PROJECT`).
- `focus_domain`: engineering specialty description shown in the squad card subtitle (e.g. `Alpha FinTech Platform · High-Throughput APIs`).
- `lead_user_id`: foreign key to `users(id)` for the designated Tech Lead. `ON DELETE RESTRICT` prevents deleting a user who is still leading a squad.
- `budget_hours`: total sprint budget allocated to this squad in hours.
- `spent_hours`: total hours consumed by squad tasks in this cycle.
- `health`: delivery risk status (`HEALTHY`, `AT_RISK`, `CRITICAL`).
- `is_active`: soft-delete flag. When a squad is retired or dissolved, set `is_active = false` instead of deleting the row. All linked tasks, members, work logs, and blockers remain fully intact for historical reporting. Never issue a `DELETE` on a squad row.
- `created_at`: creation timestamp.
- `updated_at`: last modification timestamp, kept current by trigger.

The 6 squads currently in the system:

| Squad | badge_code | Tech Lead | focus_domain |
|---|---|---|---|
| Squad A (FinTech Core Platform) | `ALPHA` | David Miller | Alpha FinTech Platform · High-Throughput APIs |
| Squad B (E-Commerce Web Portal) | `BETA` | Sarah Jenkins | Beta E-Commerce Portal · Next.js & Design System |
| Squad C (Mobile POS & iOS/Android) | `GAMMA` | Robert Chang | Gamma POS Suite · Native iOS/Android POS Engine |
| Squad D (Cloud Infra & SRE) | `DELTA` | Elena Rostova | Delta Cloud & SRE · Kubernetes & Multi-Cloud |
| Squad E (Security & QA Automation) | `ECHO` | Marcus Brody | Echo SecOps & QA · SOC2 Compliance & Load Testing |
| Squad F (Machine Learning & AI) | `PROJECT` | Chiranshi Thummar | Squad F Machine Learning · LLM Pipelines & Vision Models |

Matches UI elements in [index.html](index.html): Teams & Squads Hub (`#tab-content-squads_hub`), Sidebar Squad Pods list, and Project Team filter pills.

Matches UI elements in [index.html](index.html): Teams & Squads Hub (`#tab-content-squads_hub`), Sidebar Squad Pods list, and Project Team filter pills.

---

### 4. squad_members

```sql
CREATE TABLE workdash.squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES workdash.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
  allocation_percentage NUMERIC(3, 0) NOT NULL DEFAULT 100
    CHECK (allocation_percentage >= 10 AND allocation_percentage <= 100),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMPTZ,
  CONSTRAINT uq_squad_user UNIQUE (squad_id, user_id)
);
```

Field-by-field explanation:
- `id`: unique membership record identifier.
- `squad_id`: foreign key to `squads(id)`. `ON DELETE CASCADE` removes the membership record when the squad is hard-deleted (safety net only — squads should be soft-deleted via `is_active = false`).
- `user_id`: foreign key to `users(id)`. `ON DELETE CASCADE` removes the membership record when the user is hard-deleted (safety net only — users should be soft-deleted via `is_active = false`).
- `allocation_percentage`: the percentage of the engineer's 40h weekly capacity dedicated to this squad. Valid range is 10% to 100%.
- `joined_at`: timestamp when the engineer was rostered into the squad.
- `left_at`: timestamp when the engineer left the squad. `NULL` means the engineer is **currently active** in the squad. When an engineer is removed from a squad, set `left_at = NOW()` instead of deleting the row — this preserves the full membership history.

The `UNIQUE (squad_id, user_id)` constraint prevents an engineer from appearing twice in the same squad. The `ON DELETE CASCADE` rules are safety nets only — the application should always use soft-delete (`is_active = false` for users/squads, `left_at = NOW()` for memberships) to preserve all historical data.

---

### 5. tasks

```sql
CREATE TABLE workdash.tasks (
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
```

Field-by-field explanation:
- `id`: unique task UUID.
- `title`: task name displayed on the Kanban board and task matrix.
- `description`: optional full requirement or specification text.
- `squad_id`: foreign key to `squads(id)`. Every task belongs to one squad. `ON DELETE CASCADE` removes tasks when their squad is deleted.
- `task_type`: workload classification that drives the capacity engine. Three valid values:
  - `PRE_PLANNING` — planned sprint work, counted toward total load in the Capacity Heatmap.
  - `AD_HOC_EMERGENCY` — urgent fix, counted separately as overload risk.
  - `RECURRING_ROUTINE` — standing routine (standup, review), covered by `recurring_overhead_hours`. **Selecting this value in the Pre-Flight modal reveals the recurrence frequency dropdown (Daily / Weekly / Monthly).** The frontend must use the exact value `RECURRING_ROUTINE` — not `RECURRING` — to trigger this behaviour.
- `category`: functional area tag (`DEVELOPMENT`, `BUG_FIX`, `TESTING_QA`, `DEVOPS`, `REPORTING`, `UI_UX`, `MEETING`).
- `priority`: delivery priority level (`P1_HIGH`, `P2_MEDIUM`, `P3_LOW`).
- `status`: the 4-stage Kanban workflow (`TO_DO` → `IN_PROGRESS` → `PENDING_REVIEW` → `COMPLETED`).
- `estimated_hours`: budgeted estimate in decimal hours. Must be greater than 0.
- `logged_hours`: total actual time recorded. **Do not update this directly.** It is automatically recalculated from `work_logs` by the `trg_sync_task_logged_hours` trigger on every log insert, update, or delete.
- `recurrence_frequency`: cadence for recurring tasks (`DAILY`, `WEEKLY`, `MONTHLY`). Null for one-time tasks.
- `assigned_by_user_id`: foreign key to the Manager or Tech Lead who dispatched the task. `ON DELETE RESTRICT` prevents deleting the assigning user while tasks exist.
- `assigned_at`: timestamp of task assignment and dispatch.
- `due_date`: target completion deadline displayed on task cards.
- `completed_at`: automatically set by `trg_handle_task_completion` when `status` changes to `COMPLETED`. Cleared when status reverts.
- `is_blocked`: automatically set to `true` by `trg_sync_task_blocker_state` when at least one unresolved blocker exists on this task.
- `updated_at`: last modified timestamp, kept current by trigger.

Matches UI elements in [index.html](index.html): Developer Kanban Board (`#dev-kanban-board`), Manager Task Matrix table, Task Assignment Modal (`#modal-assign`), and Date & Schedule Dispatcher.

---

### 6. task_assignments

```sql
CREATE TABLE workdash.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
  assigned_hours NUMERIC(5, 2) NOT NULL CHECK (assigned_hours > 0.00),
  split_mode workdash.assignment_distribution_mode NOT NULL DEFAULT 'SINGLE_DEVELOPER',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_task_assignment UNIQUE (task_id, user_id)
);
```

Field-by-field explanation:
- `id`: unique assignment record identifier.
- `task_id`: foreign key to `tasks(id)`. Cascades on delete.
- `user_id`: foreign key to `users(id)`. Cascades on delete.
- `assigned_hours`: decimal hours budgeted for this specific developer on this specific task.
- `split_mode`: controls how the task hours were distributed across developers.
  - `SINGLE_DEVELOPER`: one developer owns all hours. Standard individual task assignment.
  - `MULTIPLE_DEVELOPERS`: task split between 2 to 4 developers, each with their own `assigned_hours`. Used for paired programming or parallel sub-tasks.
  - `ENTIRE_TEAM`: every member of the squad receives a portion. Used for sprint ceremonies or all-hands deliverables.
- `assigned_at`: timestamp when this assignment was created.

The `UNIQUE (task_id, user_id)` constraint prevents the same developer being assigned to the same task twice. Both foreign keys cascade on delete to keep assignment records clean.

Matches UI elements in [index.html](index.html): Task Assignment Modal (`#modal-assign`) with the Single / Multi / Team split toggle.

---

### 7. work_logs

```sql
CREATE TABLE workdash.work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
  hours NUMERIC(4, 2) NOT NULL DEFAULT 1.00
    CHECK (hours > 0.00 AND hours <= 24.00),
  notes TEXT NOT NULL,
  log_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Field-by-field explanation:
- `id`: unique log entry identifier.
- `task_id`: foreign key to `tasks(id)`. Cascades on delete.
- `user_id`: foreign key to `users(id)`. Cascades on delete.
- `hours`: decimal hours worked in this session. Must be between 0.01 and 24.00.
- `notes`: description of what was done during this work session.
- `log_timestamp`: the timestamp when the work was performed and recorded.

After every INSERT, UPDATE, or DELETE on this table the `trg_sync_task_logged_hours` trigger fires and recalculates `tasks.logged_hours` as the SUM of all `work_logs.hours` for that task. Never update `tasks.logged_hours` directly.

Matches UI elements in [index.html](index.html): Work Logs tab (`#dev-section-logs`) and the Log Time button in the developer workspace.

---

### 8. task_blockers

```sql
CREATE TABLE workdash.task_blockers (
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
```

Field-by-field explanation:
- `id`: unique blocker record identifier.
- `task_id`: foreign key to the task being blocked. Cascades on delete.
- `reported_by_user_id`: foreign key to the user who raised the blocker. `ON DELETE RESTRICT` prevents deleting the reporter while unresolved blockers exist.
- `category`: root cause classification (`TECHNICAL_IMPEDIMENT`, `DEPENDENCY`, `REVIEW_BOTTLENECK`, `RESOURCE_CAPACITY`, `SCOPE_CREEP`, `INFRASTRUCTURE`).
- `severity`: impact level. `CRITICAL_BLOCKER` means delivery is halted. `HIGH_DELIVERY_RISK` means delivery is at risk but not yet stopped.
- `reason`: detailed description of what exactly is blocking progress.
- `business_impact`: the delivery consequence if this blocker is not resolved.
- `mitigation_action`: the planned remediation step taken or planned. Optional initially, expected to be filled before resolution.
- `expected_resolution_date`: target date for the blocker to be cleared.
- `is_resolved`: when set to `true`, the `trg_sync_task_blocker_state` trigger checks whether any other unresolved blockers remain on the task and updates `tasks.is_blocked` accordingly.
- `resolved_at`: timestamp when the blocker was marked resolved.
- `resolved_by_user_id`: user who resolved the blocker. `ON DELETE SET NULL` preserves the record if that user is later deleted.
- `created_at`: timestamp when the blocker was first reported.
- `updated_at`: last modification timestamp.

When a blocker is inserted or updated the `trg_sync_task_blocker_state` trigger fires and sets `tasks.is_blocked = true`. It also sets `active_timers.is_running = false` for any live timer on that task so the developer cannot continue logging time while blocked.

Matches UI elements in [index.html](index.html): Blockers tab (`#tab-content-blockers`), Developer Blocker Report Modal (`#modal-report-blocker`), and the Blocked badge shown on Kanban task cards.

---

### 9. task_templates

```sql
CREATE TABLE workdash.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  default_task_title VARCHAR(255) NOT NULL,
  category workdash.task_category_type NOT NULL DEFAULT 'DEVELOPMENT',
  task_type workdash.task_workload_type NOT NULL DEFAULT 'PRE_PLANNING',
  recurrence_frequency workdash.recurrence_freq,
  default_estimated_hours NUMERIC(4, 2) NOT NULL DEFAULT 4.00
    CHECK (default_estimated_hours > 0.00),
  default_priority workdash.task_priority_level NOT NULL DEFAULT 'P2_MEDIUM',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id UUID REFERENCES workdash.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Field-by-field explanation:
- `id`: unique template identifier.
- `name`: human-readable template label shown in the template picker (e.g. `Feature delivery`, `Production bug fix`, `Quality assurance`).
- `default_task_title`: pre-filled title that populates the task creation form when this template is selected.
- `category`: default category applied when creating a task from this template.
- `task_type`: default workload type applied when creating a task from this template.
- `recurrence_frequency`: optional cadence if the template produces a recurring task.
- `default_estimated_hours`: pre-filled hours estimate.
- `default_priority`: default priority applied to the created task.
- `is_system`: when `true`, this is a built-in system template that cannot be deleted from the UI.
- `created_by_user_id`: the manager who created a custom template. `ON DELETE SET NULL` preserves the template if the creator leaves.
- `created_at`: creation timestamp.
- `updated_at`: last modified timestamp.

Current built-in system templates: `feature`, `bugfix`, `qa`, `reporting`, `devops`.

Matches UI elements in [index.html](index.html): Task Templates library tab (`#tab-content-templates`) and the 1-click Quick Blueprint cards.

---

### 10. blocker_presets

```sql
CREATE TABLE workdash.blocker_presets (
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
```

Field-by-field explanation:
- `id`: unique preset identifier.
- `key_slug`: unique code key (e.g. `api_keys`, `db_lag`, `pr_review`, `cicd_failure`, `outage_3rdparty`).
- `label`: short button chip label shown in the blocker modal (e.g. `API Keys`, `Database Lag`).
- `category`: pre-filled blocker category applied when the chip is selected.
- `severity`: pre-filled severity level applied when the chip is selected.
- `description_template`: full text that populates the `reason` field when this preset is selected.
- `impact_template`: text that populates the `business_impact` field.
- `mitigation_template`: text that populates the `mitigation_action` field.
- `created_at`: creation timestamp.

When a developer clicks a quick chip in the blocker report modal, all three template fields are copied into the form inputs so the developer only needs to review and adjust rather than type from scratch.

Matches UI elements in [index.html](index.html): 1-click quick preset chips inside `#modal-report-blocker`.

---

### 11. active_timers

```sql
CREATE TABLE workdash.active_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES workdash.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
  seconds_elapsed INTEGER NOT NULL DEFAULT 0 CHECK (seconds_elapsed >= 0),
  is_running BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Field-by-field explanation:
- `id`: unique timer session identifier.
- `user_id`: foreign key to the developer running the timer. The `UNIQUE` constraint on this column enforces the rule that each developer can have at most one active timer at a time. `ON DELETE CASCADE` removes the timer if the user is deleted.
- `task_id`: foreign key to the task being timed. `ON DELETE CASCADE` removes the timer if the task is deleted.
- `seconds_elapsed`: total accumulated seconds tracked by the stopwatch.
- `is_running`: `true` means the timer is actively counting. `false` means it is paused. The `trg_sync_task_blocker_state` trigger automatically sets this to `false` when a blocker is reported on the active task.
- `started_at`: timestamp when the current timer session began.

When a task is marked `COMPLETED` the `trg_handle_task_completion` trigger deletes the corresponding active timer row entirely.

Matches UI elements in [index.html](index.html): Developer Workspace stopwatch display (`#dev-timer-display`) and the Start / Pause / Log & Stop buttons.

---

### 12. recurring_routines

```sql
CREATE TABLE workdash.recurring_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES workdash.squads(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  frequency workdash.recurrence_freq NOT NULL DEFAULT 'DAILY',
  schedule_label VARCHAR(100) NOT NULL,
  allocated_hours NUMERIC(4, 2) NOT NULL DEFAULT 2.50 CHECK (allocated_hours > 0.00),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Field-by-field explanation:
- `id`: unique routine record identifier.
- `user_id`: foreign key to the developer who owns this routine. `ON DELETE CASCADE` removes routines when the user is deleted.
- `squad_id`: optional foreign key to the squad context for this routine. `ON DELETE SET NULL` keeps the routine if the squad is later removed.
- `title`: description of the routine commitment (e.g. `Daily Standup & Squad Sync`, `PR Reviews & Mentoring Devs`).
- `frequency`: how often this commitment repeats (`DAILY`, `WEEKLY`, `MONTHLY`).
- `schedule_label`: display string shown in the UI (e.g. `Every day · 9:30 AM`, `Mondays · 11:00 AM`).
- `allocated_hours`: decimal hours deducted from the developer's weekly available capacity per cycle.
- `created_at`: creation timestamp.

Matches UI elements in [index.html](index.html): Recurring Overhead cards on the Developer Overview section.

---

## 4. Business Views

### v_developer_capacity_summary

One row per active developer. Drives the Capacity Heatmap and the developer detail drawer.

Key computed columns:
- `recurring_hours`: the value of `users.recurring_overhead_hours` for this developer.
- `pre_planning_hours`: sum of `task_assignments.assigned_hours` where `task_type = 'PRE_PLANNING'` and `status != 'COMPLETED'`.
- `adhoc_hours`: sum of `task_assignments.assigned_hours` where `task_type = 'AD_HOC_EMERGENCY'` and `status != 'COMPLETED'`.
- `total_load_hours`: recurring + pre_planning + adhoc.
- `utilization_pct`: `(total_load_hours / weekly_capacity_hours) * 100`, rounded to 1 decimal.
- `available_buffer_hours`: `MAX(0, weekly_capacity_hours - total_load_hours)`.
- `overage_hours`: `MAX(0, total_load_hours - weekly_capacity_hours)`.
- `is_overallocated`: `true` when `total_load_hours > weekly_capacity_hours`.

### v_squad_capacity_summary

One row per squad. Drives the Teams & Squads Hub cards and the Squad detail drawer.

Key computed columns: `total_engineers`, `total_capacity_hours`, `allocated_load_hours`, `squad_utilization_pct`, `overbooked_engineers_count`, `active_tasks_count`, `blocked_tasks_count`.

Also exposes `badge_code` and `focus_domain` directly for rendering squad cards without additional joins.

### v_active_blockers_registry

All unresolved blockers with full task, assigned engineer, and squad context. Drives the Blockers tab. Ordered by severity (`CRITICAL_BLOCKER` first) then by `created_at` descending. The `project_code` column comes from `squads.badge_code` directly — no client table involved.

---

## 5. Automated triggers

```sql
-- Keeps tasks.logged_hours in sync with work_logs
CREATE OR REPLACE TRIGGER trg_sync_task_logged_hours
AFTER INSERT OR UPDATE OR DELETE ON workdash.work_logs
FOR EACH ROW EXECUTE FUNCTION workdash.fn_sync_task_logged_hours();

-- Sets tasks.is_blocked and pauses active timers when a blocker is inserted
CREATE OR REPLACE TRIGGER trg_sync_task_blocker_state
AFTER INSERT OR UPDATE OR DELETE ON workdash.task_blockers
FOR EACH ROW EXECUTE FUNCTION workdash.fn_sync_task_blocker_state();

-- Sets completed_at, fills logged_hours, deletes active timer on task completion
CREATE OR REPLACE TRIGGER trg_handle_task_completion
BEFORE UPDATE ON workdash.tasks
FOR EACH ROW EXECUTE FUNCTION workdash.fn_handle_task_completion();

-- Keeps updated_at current across all tables that have the column
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
```

---

## 6. Recommended minimal production schema

The complete backend data model consists of these structured tables:

1. `users` — Clerk Auth bridge and engineer profiles
2. `planning_periods` — Operational planning calendar cycles
3. `squads` — 6 dedicated engineering pods (Squads A through F)
4. `squad_members` — Engineer-to-squad allocation junction
5. `tasks` — Pre-planning, ad-hoc emergency, and routine deliverables
6. `task_assignments` — Single, multi-developer, and team assignment splits
7. `work_logs` — Timesheet entries and progress notes
8. `task_blockers` — Impediment, risk, and mitigation log registry
9. `task_templates` — Standardized 1-click task blueprints
10. `blocker_presets` — 1-click impediment quick chips and pre-filled text
11. `active_timers` — Real-time active work timer sessions
12. `recurring_routines` — Scheduled daily and weekly meeting commitments

---

## 7. Final note

The platform is built around squads, not clients. Tasks belong to squads. Squads own engineers. Engineers own timers and work logs. There is no client table, no billing table, and no SLA tracking. The `badge_code` field on squads (`ALPHA`, `BETA`, `GAMMA`, `DELTA`, `ECHO`, `PROJECT`) replaces what would have been a client code, so all task badges and blocker registry labels resolve directly from the squad record with no extra join.

---

## 8. Indexes and uniqueness

```sql
-- Authentication and user queries
CREATE INDEX idx_users_clerk_id ON workdash.users(clerk_id);
CREATE INDEX idx_users_role_active ON workdash.users(system_role) WHERE is_active = true;
CREATE INDEX idx_users_skills_gin ON workdash.users USING GIN(skills);
CREATE INDEX idx_users_email_lower ON workdash.users(LOWER(email));

-- Squad routing
CREATE INDEX idx_squads_lead_user ON workdash.squads(lead_user_id);
CREATE INDEX idx_squads_badge_code ON workdash.squads(badge_code);
CREATE INDEX idx_squad_members_squad ON workdash.squad_members(squad_id);
CREATE INDEX idx_squad_members_user ON workdash.squad_members(user_id);

-- Task assignments and capacity calculations
CREATE INDEX idx_task_assignments_user_task ON workdash.task_assignments(user_id, task_id);
CREATE INDEX idx_task_assignments_task ON workdash.task_assignments(task_id);
CREATE INDEX idx_tasks_squad_status ON workdash.tasks(squad_id, status);
CREATE INDEX idx_tasks_type_status ON workdash.tasks(task_type, status);
CREATE INDEX idx_tasks_due_date ON workdash.tasks(due_date);
CREATE INDEX idx_tasks_assigned_at ON workdash.tasks(assigned_at);

-- Blocker registry lookups
CREATE INDEX idx_task_blockers_task ON workdash.task_blockers(task_id);
CREATE INDEX idx_task_blockers_active ON workdash.task_blockers(is_resolved, severity)
  WHERE is_resolved = false;

-- Timesheet stream
CREATE INDEX idx_work_logs_user_date ON workdash.work_logs(user_id, log_timestamp DESC);
CREATE INDEX idx_work_logs_task ON workdash.work_logs(task_id);

-- Full-text fuzzy search (pg_trgm extension)
CREATE INDEX idx_tasks_title_trgm ON workdash.tasks USING gin (title gin_trgm_ops);
CREATE INDEX idx_users_name_trgm ON workdash.users USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_task_blockers_reason_trgm ON workdash.task_blockers USING gin (reason gin_trgm_ops);
```

---

## 9. Capacity engine formulas

```
Recurring Overhead  = users.recurring_overhead_hours
Pre-Planning Hours  = SUM(assigned_hours) WHERE task_type = 'PRE_PLANNING' AND status != 'COMPLETED'
Ad-Hoc Hours        = SUM(assigned_hours) WHERE task_type = 'AD_HOC_EMERGENCY' AND status != 'COMPLETED'

Total Allocated Load = Recurring Overhead + Pre-Planning Hours + Ad-Hoc Hours

Utilization %       = (Total Allocated Load / weekly_capacity_hours) × 100
Available Buffer    = MAX(0, weekly_capacity_hours − Total Allocated Load)
Overbooked Overtime = MAX(0, Total Allocated Load − weekly_capacity_hours)
Is Overallocated    = Total Allocated Load > weekly_capacity_hours
```
