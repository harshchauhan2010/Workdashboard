# WorkDashboard — Comprehensive Testing Guide

> Practical verification guide covering all API endpoints, database triggers, views, and end-to-end operational flows.

---

## 1. Prerequisites

Ensure the application is running and the database is migrated:

```bash
# 1. Start database migration
node migrate.js

# 2. Run Next.js local server
npm run dev
# Server running at http://localhost:3000
```

---

## 2. API Health & Diagnostic Tests

```bash
# Check database connection pool & schema health
curl -i http://localhost:3000/api/health
```
**Expected Response:** `HTTP/1.1 200 OK` with `{ "status": "ok", "database": "connected", "schema": "workdash" }`

---

## 3. Module-by-Module API Test Suite

### 3.1 Auth & Users Module
```bash
# 1. Get authenticated user profile
curl -H "Authorization: Bearer <CLERK_TOKEN>" http://localhost:3000/api/auth/me

# 2. List all active users
curl http://localhost:3000/api/users

# 3. Filter users by role
curl "http://localhost:3000/api/users?role=DEVELOPER"

# 4. Update developer capacity hours
curl -X PATCH http://localhost:3000/api/users/USER_UUID \
  -H "Content-Type: application/json" \
  -d '{"weekly_capacity_hours": 35.0, "recurring_overhead_hours": 4.0}'
```

---

### 3.2 Squads & Squad Members Module
```bash
# 1. List all squads with metrics
curl http://localhost:3000/api/squads

# 2. Get specific squad details and roster
curl http://localhost:3000/api/squads/SQUAD_UUID

# 3. Assign developer to a squad
curl -X POST http://localhost:3000/api/squad-members \
  -H "Content-Type: application/json" \
  -d '{
    "squad_id": "SQUAD_UUID",
    "user_id": "USER_UUID",
    "role_in_squad": "MEMBER",
    "allocation_percentage": 100
  }'
```

---

### 3.3 Tasks & Task Assignments Module
```bash
# 1. Create a planned task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "squad_id": "SQUAD_UUID",
    "planning_period_id": "PERIOD_UUID",
    "title": "Implement PostgreSQL Connection Pool",
    "category": "INFRASTRUCTURE",
    "task_type": "PRE_PLANNING",
    "estimated_hours": 8.0,
    "priority": "P1_HIGH",
    "assignments": [
      { "user_id": "USER_UUID", "assigned_hours": 8.0 }
    ]
  }'

# 2. Filter tasks by squad and status
curl "http://localhost:3000/api/tasks?squad_id=SQUAD_UUID&status=IN_PROGRESS"

# 3. Update task status to IN_PROGRESS
curl -X PATCH http://localhost:3000/api/tasks/TASK_UUID \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'
```

---

### 3.4 Active Timers & Work Logs Module
```bash
# 1. Start live timer on task
curl -X POST http://localhost:3000/api/timers/start \
  -H "Content-Type: application/json" \
  -d '{"task_id": "TASK_UUID"}'

# 2. Check current timer state
curl http://localhost:3000/api/timers/me

# 3. Pause timer
curl -X PATCH http://localhost:3000/api/timers/pause \
  -H "Content-Type: application/json" \
  -d '{"seconds_elapsed": 1800}'

# 4. Resume timer
curl -X PATCH http://localhost:3000/api/timers/resume

# 5. Log & Stop timer (converts to work log)
curl -X POST http://localhost:3000/api/timers/stop \
  -H "Content-Type: application/json" \
  -d '{
    "seconds_elapsed": 7200,
    "notes": "Completed initial module testing"
  }'
```

---

### 3.5 Blockers & Blocker Presets Module
```bash
# 1. Fetch 1-click blocker preset chips
curl http://localhost:3000/api/blocker-presets

# 2. Report a blocker on a task
curl -X POST http://localhost:3000/api/blockers \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "TASK_UUID",
    "category": "TECHNICAL_IMPEDIMENT",
    "severity": "CRITICAL_BLOCKER",
    "reason": "Missing staging database credentials",
    "business_impact": "Cannot run integration tests",
    "mitigation_action": "Request access from DevOps"
  }'

# 3. Verify task is blocked & timer is auto-paused
curl http://localhost:3000/api/tasks/TASK_UUID
# Should return "is_blocked": true

# 4. Resolve blocker
curl -X PATCH http://localhost:3000/api/blockers/BLOCKER_UUID/resolve \
  -H "Content-Type: application/json" \
  -d '{"resolution_notes": "Credentials granted by DevOps"}'
```

---

### 3.6 Capacity & Planning Periods
```bash
# 1. Get developer capacity heatmap data
curl http://localhost:3000/api/capacity/developers

# 2. Get squad-level rollups
curl http://localhost:3000/api/capacity/squads

# 3. Get active planning period
curl http://localhost:3000/api/planning-periods/current
```

---

## 4. End-to-End Workflow Verification Scenario

Follow this scenario in sequence to test system integration:

```
Step 1: Create Task (estimated 6.0h)
  → Verify: Task created, assignments recorded.
  → Capacity Check: Developer's pre_planning_hours increased by 6.0h.

Step 2: Developer starts timer
  → POST /api/timers/start
  → Verify: active_timers row created, is_running = true.

Step 3: Developer reports a blocker
  → POST /api/blockers
  → Trigger Verification:
      - tasks.is_blocked becomes TRUE.
      - active_timers.is_running becomes FALSE (timer paused).

Step 4: Resolve the blocker
  → PATCH /api/blockers/:id/resolve
  → Trigger Verification:
      - tasks.is_blocked becomes FALSE.

Step 5: Log & Stop Timer (2.5h worked)
  → POST /api/timers/stop with seconds_elapsed = 9000
  → Trigger Verification:
      - work_logs row inserted (2.5h).
      - tasks.logged_hours updated to 2.50.
      - active_timers row deleted.

Step 6: Mark Task Completed
  → PATCH /api/tasks/:id with status = "COMPLETED"
  → Trigger Verification:
      - tasks.completed_at set to CURRENT_TIMESTAMP.
      - Developer's pre_planning_hours drops back to 0.0h in capacity view.
```

---

## 5. Direct Database SQL Verification Queries

```sql
-- 1. Check logged hours sync
SELECT id, title, estimated_hours, logged_hours, is_blocked, status 
FROM workdash.tasks;

-- 2. Verify active blocker registry
SELECT * FROM workdash.v_active_blockers_registry;

-- 3. Verify real-time capacity calculations
SELECT developer_name, weekly_capacity_hours, total_load_hours, utilization_pct, is_overallocated 
FROM workdash.v_developer_capacity_summary;

-- 4. Check squad summary rollup
SELECT squad_name, total_engineers, squad_utilization_pct, overbooked_engineers_count 
FROM workdash.v_squad_capacity_summary;
```
