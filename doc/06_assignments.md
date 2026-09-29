# Module: Task Assignments

> File path: `src/modules/assignments/`

---

## 1. Purpose

The Assignments module links developers to tasks with specific hour budgets and distribution modes. It powers the Task Assignment Modal (Single / Multi / Team split toggle) and feeds the capacity heatmap calculations.

---

## 2. Files

| File | Role |
|------|------|
| `assignments.controller.js` | HTTP handler for assigning/unassigning developers |
| `assignments.service.js` | Logic: hours split calculation, mode validation |
| `assignments.repository.js` | SQL queries on `workdash.task_assignments` |
| `assignments.validator.js` | Input validation |

---

## 3. Database Table

```sql
CREATE TABLE workdash.task_assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
  assigned_hours NUMERIC(5,2) NOT NULL CHECK (assigned_hours > 0.00),
  split_mode     workdash.assignment_distribution_mode NOT NULL DEFAULT 'SINGLE_DEVELOPER',
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_task_assignment UNIQUE (task_id, user_id)
);
```

### Split Modes

| split_mode | Description |
|-----------|-------------|
| `SINGLE_DEVELOPER` | One developer owns all hours. Standard individual assignment. |
| `MULTIPLE_DEVELOPERS` | 2–4 developers split hours. Used for paired programming or parallel sub-tasks. |
| `ENTIRE_TEAM` | All squad members receive a portion. Used for ceremonies or all-hands deliverables. |

---

## 4. API Endpoints

### GET /api/tasks/:taskId/assignments — List Assignments for a Task

**Response 200:**
```json
[
  {
    "id": "assignment-uuid",
    "task_id": "task-uuid",
    "user_id": "user-uuid",
    "full_name": "Alex Chen",
    "assigned_hours": 8.0,
    "split_mode": "SINGLE_DEVELOPER",
    "assigned_at": "2026-09-01T09:00:00Z"
  }
]
```

---

### POST /api/tasks/:taskId/assignments — Assign Developer(s) to Task

**Single developer:**
```json
{
  "assignments": [
    { "user_id": "user-uuid", "assigned_hours": 16.0 }
  ],
  "split_mode": "SINGLE_DEVELOPER"
}
```

**Multiple developers:**
```json
{
  "assignments": [
    { "user_id": "user-uuid-1", "assigned_hours": 8.0 },
    { "user_id": "user-uuid-2", "assigned_hours": 8.0 }
  ],
  "split_mode": "MULTIPLE_DEVELOPERS"
}
```

**Entire team:**
```json
{
  "split_mode": "ENTIRE_TEAM",
  "assigned_hours_per_person": 4.0
}
```
Service auto-fetches all squad members and creates one assignment per member.

**Response 201:**
```json
[
  { "id": "...", "user_id": "...", "assigned_hours": 8.0, "split_mode": "MULTIPLE_DEVELOPERS" }
]
```

---

### DELETE /api/assignments/:assignmentId — Remove Assignment

**Response 200:** `{ "message": "Assignment removed" }`

---

## 5. Request / Response Flow

```
POST /api/tasks/:taskId/assignments
    ↓
proxy.js → verify session
    ↓
assignments.controller.js
  → parse split_mode and assignments array
  → validateAssignment(body)
    ↓
assignments.service.js
  → verify task exists
  → if ENTIRE_TEAM: fetch all squad members, build assignments array
  → for each assignment: check user is squad member
    ↓
assignments.repository.js
  → for each developer:
    INSERT INTO task_assignments (task_id, user_id, assigned_hours, split_mode)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (task_id, user_id) DO UPDATE SET assigned_hours = EXCLUDED.assigned_hours
    RETURNING *
    ↓
Response 201 with array of created assignments
```

---

## 6. Repository SQL Queries

```js
// Get assignments for a task with user details
async function findByTaskId(taskId) {
  const result = await pool.query(
    `SELECT ta.*, u.full_name, u.email, u.seniority
     FROM task_assignments ta
     JOIN users u ON u.id = ta.user_id
     WHERE ta.task_id = $1
     ORDER BY ta.assigned_at`,
    [taskId]
  );
  return result.rows;
}

// Create single assignment
async function createAssignment(taskId, userId, hours, splitMode) {
  const result = await pool.query(
    `INSERT INTO task_assignments (task_id, user_id, assigned_hours, split_mode)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (task_id, user_id)
       DO UPDATE SET assigned_hours = EXCLUDED.assigned_hours
     RETURNING *`,
    [taskId, userId, hours, splitMode]
  );
  return result.rows[0];
}

// Delete assignment
async function deleteAssignment(assignmentId) {
  const result = await pool.query(
    "DELETE FROM task_assignments WHERE id = $1 RETURNING *",
    [assignmentId]
  );
  return result.rows[0];
}

// Get all assignments for a user (capacity calculation input)
async function findByUserId(userId) {
  const result = await pool.query(
    `SELECT ta.*, t.task_type, t.status, t.title
     FROM task_assignments ta
     JOIN tasks t ON t.id = ta.task_id
     WHERE ta.user_id = $1
       AND t.status != 'COMPLETED'`,
    [userId]
  );
  return result.rows;
}
```

---

## 7. Business Rules

1. **UNIQUE(task_id, user_id)** — one developer can only appear once per task.
2. **ENTIRE_TEAM** — service auto-fetches all current squad members (left_at IS NULL).
3. **assigned_hours** — must be > 0. Capacity engine uses this for all load calculations.
4. **ON CONFLICT DO UPDATE** — re-assigning with different hours is allowed (updates existing row).
5. **Cascade on delete** — if task or user is deleted, assignment records are auto-removed.

---

## 8. Indexes

```sql
CREATE INDEX idx_task_assignments_user_task ON workdash.task_assignments(user_id, task_id);
CREATE INDEX idx_task_assignments_task ON workdash.task_assignments(task_id);
```

---

## 9. Testing

```bash
# Assign single developer
curl -X POST http://localhost:3000/api/tasks/TASK_UUID/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "assignments": [{"user_id": "USER_UUID", "assigned_hours": 16}],
    "split_mode": "SINGLE_DEVELOPER"
  }'

# Assign multiple developers
curl -X POST http://localhost:3000/api/tasks/TASK_UUID/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "assignments": [
      {"user_id": "USER_1_UUID", "assigned_hours": 8},
      {"user_id": "USER_2_UUID", "assigned_hours": 8}
    ],
    "split_mode": "MULTIPLE_DEVELOPERS"
  }'

# View assignments
psql workdashboard -c "
  SELECT ta.assigned_hours, ta.split_mode, u.full_name
  FROM workdash.task_assignments ta
  JOIN workdash.users u ON u.id = ta.user_id
  WHERE ta.task_id = 'TASK_UUID';
"
```
