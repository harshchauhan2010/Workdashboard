# Module: Tasks

> File path: `src/modules/tasks/`

---

## 1. Purpose

The Tasks module is the core work unit of WorkDashboard. Tasks represent everything a squad is working on — planned sprint work, urgent fixes, and recurring routines. Tasks drive the Kanban board (developer view), the Task Matrix (manager view), and the capacity engine.

---

## 2. Files

| File | Role |
|------|------|
| `tasks.controller.js` | HTTP handler for CRUD + status transitions |
| `tasks.service.js` | Business logic: workload classification, status transitions, trigger awareness |
| `tasks.repository.js` | SQL queries on `workdash.tasks` |
| `tasks.validator.js` | Input validation for task create/update |

---

## 3. Database Table

```sql
CREATE TABLE workdash.tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  squad_id            UUID NOT NULL REFERENCES workdash.squads(id) ON DELETE CASCADE,
  task_type           workdash.task_workload_type NOT NULL DEFAULT 'PRE_PLANNING',
  category            workdash.task_category_type NOT NULL DEFAULT 'DEVELOPMENT',
  priority            workdash.task_priority_level NOT NULL DEFAULT 'P2_MEDIUM',
  status              workdash.task_workflow_status NOT NULL DEFAULT 'IN_PROGRESS',
  estimated_hours     NUMERIC(5,2) NOT NULL DEFAULT 4.00 CHECK (estimated_hours > 0.00),
  logged_hours        NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (logged_hours >= 0.00),
  recurrence_frequency workdash.recurrence_freq,
  assigned_by_user_id UUID NOT NULL REFERENCES workdash.users(id) ON DELETE RESTRICT,
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date            TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  is_blocked          BOOLEAN NOT NULL DEFAULT false,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### ENUM Values

| Field | Valid Values |
|-------|-------------|
| `task_type` | `PRE_PLANNING`, `AD_HOC_EMERGENCY`, `RECURRING_ROUTINE` |
| `category` | `DEVELOPMENT`, `TESTING_QA`, `BUG_FIX`, `REPORTING`, `UI_UX`, `DEVOPS`, `MEETING` |
| `priority` | `P1_HIGH`, `P2_MEDIUM`, `P3_LOW` |
| `status` | `TO_DO`, `IN_PROGRESS`, `PENDING_REVIEW`, `COMPLETED` |
| `recurrence_frequency` | `DAILY`, `WEEKLY`, `MONTHLY` (null for one-time tasks) |

---

## 4. API Endpoints

### GET /api/tasks — List Tasks

**Query params:**
- `squad_id` — filter by squad
- `status` — filter by status (TO_DO, IN_PROGRESS, PENDING_REVIEW, COMPLETED)
- `task_type` — filter by type
- `assigned_user_id` — filter by assigned developer
- `is_blocked` — filter blocked tasks only

**Response 200:**
```json
[
  {
    "id": "task-uuid",
    "title": "Build Payment Gateway Integration",
    "description": "Integrate Stripe API for subscription billing",
    "squad_id": "squad-uuid",
    "task_type": "PRE_PLANNING",
    "category": "DEVELOPMENT",
    "priority": "P1_HIGH",
    "status": "IN_PROGRESS",
    "estimated_hours": 16.00,
    "logged_hours": 4.50,
    "recurrence_frequency": null,
    "assigned_by_user_id": "manager-uuid",
    "assigned_at": "2026-09-01T09:00:00Z",
    "due_date": "2026-09-20T00:00:00Z",
    "completed_at": null,
    "is_blocked": false,
    "updated_at": "2026-09-15T10:00:00Z"
  }
]
```

---

### GET /api/tasks/:id — Get Task with Assignments

**Response 200:** Task object + `assignments` array + `blockers` array

---

### POST /api/tasks — Create Task (Manager Only)

**Request body:**
```json
{
  "title": "Fix Authentication Bug",
  "description": "JWT token not refreshing on Safari",
  "squad_id": "squad-uuid",
  "task_type": "AD_HOC_EMERGENCY",
  "category": "BUG_FIX",
  "priority": "P1_HIGH",
  "estimated_hours": 4.0,
  "due_date": "2026-09-16T17:00:00Z"
}
```

**IMPORTANT:** If `task_type = "RECURRING_ROUTINE"`, then `recurrence_frequency` is REQUIRED (`DAILY`, `WEEKLY`, or `MONTHLY`).

**Response 201:** Created task object

---

### PATCH /api/tasks/:id — Update Task

**Status transitions (4-stage Kanban):**
```
TO_DO → IN_PROGRESS → PENDING_REVIEW → COMPLETED
```

When status is set to `COMPLETED`:
- Trigger `trg_handle_task_completion` fires automatically
- `completed_at` is set to NOW()
- Active timer for this task is DELETED (developer's stopwatch stops)
- `logged_hours` is NOT manually updated — always comes from work_logs trigger

---

### DELETE /api/tasks/:id — Delete Task

Hard deletes the task. Cascades to: task_assignments, work_logs, task_blockers, active_timers.

**Use with caution** — prefer status = COMPLETED for finished work.

---

## 5. Request / Response Flow

```
POST /api/tasks (Manager creates task)
    ↓
proxy.js → verify session
    ↓
tasks.controller.js
  → auth() → get manager userId
  → parse body
  → validateCreateTask(body)
    ↓
tasks.service.js
  → verify squad exists and is active
  → if task_type = RECURRING_ROUTINE, require recurrence_frequency
  → set assigned_by_user_id = manager's DB user id
    ↓
tasks.repository.js
  → INSERT INTO tasks (...) VALUES (...) RETURNING *
    ↓
Response 201 with created task
```

---

## 6. Kanban Status Flow (Developer View)

```
[TO_DO] → Developer picks up task → [IN_PROGRESS]
[IN_PROGRESS] → Developer submits for review → [PENDING_REVIEW]
[PENDING_REVIEW] → Manager/Lead approves → [COMPLETED]

Any status → Blocker reported → is_blocked = true (task highlighted in red)
COMPLETED → trg_handle_task_completion fires → active_timer deleted, completed_at set
```

---

## 7. Task Type Explanation

| task_type | Description | Capacity Impact |
|-----------|-------------|-----------------|
| `PRE_PLANNING` | Planned sprint work | Counted in Pre-Planning Hours |
| `AD_HOC_EMERGENCY` | Urgent unplanned fix | Counted separately as Ad-Hoc Hours (overload risk) |
| `RECURRING_ROUTINE` | Standing meeting/review | Covered by `recurring_overhead_hours` on user profile |

---

## 8. Repository SQL Queries

```js
// List tasks by squad
async function findBySquadId(squadId, filters = {}) {
  let query = `SELECT * FROM tasks WHERE squad_id = $1`;
  const params = [squadId];
  if (filters.status) {
    params.push(filters.status);
    query += ` AND status = $${params.length}`;
  }
  if (filters.is_blocked === true) {
    query += ` AND is_blocked = true`;
  }
  query += ` ORDER BY priority ASC, assigned_at DESC`;
  const result = await pool.query(query, params);
  return result.rows;
}

// Create task
async function createTask(data) {
  const result = await pool.query(
    `INSERT INTO tasks
       (title, description, squad_id, task_type, category, priority,
        estimated_hours, recurrence_frequency, assigned_by_user_id, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [data.title, data.description, data.squad_id, data.task_type,
     data.category, data.priority, data.estimated_hours,
     data.recurrence_frequency || null,
     data.assigned_by_user_id, data.due_date || null]
  );
  return result.rows[0];
}

// Update status
async function updateStatus(taskId, newStatus) {
  const result = await pool.query(
    "UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *",
    [newStatus, taskId]
  );
  return result.rows[0];
}
```

---

## 9. Automated Triggers on tasks

| Trigger | When | Effect |
|---------|------|--------|
| `trg_tasks_updated_at` | BEFORE UPDATE | Sets `updated_at = NOW()` |
| `trg_handle_task_completion` | BEFORE UPDATE (when status→COMPLETED) | Sets `completed_at`, deletes active_timer |
| `trg_sync_task_logged_hours` | AFTER INSERT/UPDATE/DELETE on work_logs | Recalculates `logged_hours` from SUM(work_logs.hours) |
| `trg_sync_task_blocker_state` | AFTER INSERT/UPDATE on task_blockers | Sets `is_blocked = true`, pauses active_timer |

**CRITICAL:** Never manually update `logged_hours` or `is_blocked` — they are exclusively managed by DB triggers.

---

## 10. Validation Rules

| Field | Rule |
|-------|------|
| `title` | Required, max 255 chars |
| `squad_id` | Required, must be valid active squad UUID |
| `task_type` | Required, one of 3 valid types |
| `category` | Required, one of 7 valid categories |
| `priority` | Required, one of P1/P2/P3 |
| `estimated_hours` | Required, must be > 0 |
| `recurrence_frequency` | Required ONLY when task_type = RECURRING_ROUTINE |
| `assigned_by_user_id` | Set from auth context (manager's clerk_id lookup), not from request body |

---

## 11. Indexes

```sql
CREATE INDEX idx_tasks_squad_status ON workdash.tasks(squad_id, status);
CREATE INDEX idx_tasks_type_status ON workdash.tasks(task_type, status);
CREATE INDEX idx_tasks_due_date ON workdash.tasks(due_date);
CREATE INDEX idx_tasks_assigned_at ON workdash.tasks(assigned_at);
CREATE INDEX idx_tasks_title_trgm ON workdash.tasks USING gin (title gin_trgm_ops);
```

---

## 12. Testing

```bash
# Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Payment Gateway",
    "squad_id": "SQUAD_UUID",
    "task_type": "PRE_PLANNING",
    "category": "DEVELOPMENT",
    "priority": "P1_HIGH",
    "estimated_hours": 16
  }'

# List tasks for a squad
curl "http://localhost:3000/api/tasks?squad_id=SQUAD_UUID&status=IN_PROGRESS"

# Mark task completed
curl -X PATCH http://localhost:3000/api/tasks/TASK_UUID \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# Verify trigger fired (completed_at and timer removed)
psql workdashboard -c "
  SELECT id, status, completed_at, is_blocked, logged_hours
  FROM workdash.tasks
  WHERE id = 'TASK_UUID';
"
psql workdashboard -c "
  SELECT * FROM workdash.active_timers WHERE task_id = 'TASK_UUID';
"
# Should return 0 rows (timer deleted by trigger)
```
