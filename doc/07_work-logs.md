# Module: Work Logs

> File path: `src/modules/work-logs/`

---

## 1. Purpose

The Work Logs module records all actual time worked by developers on tasks. Each entry is a timesheet record with hours and progress notes. The DB trigger `trg_sync_task_logged_hours` automatically updates `tasks.logged_hours` after every insert/update/delete.

---

## 2. Files

| File | Role |
|------|------|
| `workLogs.controller.js` | HTTP handler: log time, list logs, delete log |
| `workLogs.service.js` | Business logic: hours validation, ownership check |
| `workLogs.repository.js` | SQL queries on `workdash.work_logs` |
| `workLogs.validator.js` | Input validation |

---

## 3. Database Table

```sql
CREATE TABLE workdash.work_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
  hours          NUMERIC(4,2) NOT NULL DEFAULT 1.00
                   CHECK (hours > 0.00 AND hours <= 24.00),
  notes          TEXT NOT NULL,
  log_timestamp  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**KEY RULE:** After every INSERT/UPDATE/DELETE on `work_logs`, the trigger `trg_sync_task_logged_hours` recalculates `tasks.logged_hours = SUM(work_logs.hours)` for that task. **Never manually update `tasks.logged_hours`.**

---

## 4. API Endpoints

### GET /api/tasks/:taskId/work-logs — List Logs for a Task

**Response 200:**
```json
[
  {
    "id": "log-uuid",
    "task_id": "task-uuid",
    "user_id": "user-uuid",
    "full_name": "Marcus Vance",
    "hours": 2.5,
    "notes": "Completed JWT refresh logic, added unit tests",
    "log_timestamp": "2026-09-15T14:30:00Z"
  }
]
```

---

### GET /api/users/:userId/work-logs — List All Logs for a Developer

**Query params:**
- `from_date` — start date filter (ISO 8601)
- `to_date` — end date filter

**Response 200:** Array of log entries with task title included

---

### POST /api/tasks/:taskId/work-logs — Log Time

**Request body:**
```json
{
  "hours": 2.5,
  "notes": "Implemented authentication middleware and added tests"
}
```

**Response 201:**
```json
{
  "id": "new-log-uuid",
  "task_id": "task-uuid",
  "user_id": "user-uuid",
  "hours": 2.5,
  "notes": "Implemented authentication middleware and added tests",
  "log_timestamp": "2026-09-15T14:30:00Z"
}
```

**Validation errors 400:**
```json
{ "error": "hours must be between 0.01 and 24.00" }
{ "error": "notes is required" }
```

**After this insert, the DB trigger fires:**
```sql
-- trg_sync_task_logged_hours executes:
UPDATE workdash.tasks
SET logged_hours = (
  SELECT COALESCE(SUM(hours), 0)
  FROM workdash.work_logs
  WHERE task_id = NEW.task_id
)
WHERE id = NEW.task_id;
```

---

### DELETE /api/work-logs/:logId — Delete a Log Entry

Can only delete own log entries (ownership check in service layer).

**Response 200:** `{ "message": "Work log deleted" }`

After delete, trigger recalculates `tasks.logged_hours` automatically.

---

## 5. Request / Response Flow

```
POST /api/tasks/:taskId/work-logs
    ↓
proxy.js → verify session
    ↓
workLogs.controller.js
  → auth() → get userId
  → parse { hours, notes }
  → validateWorkLog({ hours, notes })
    ↓
workLogs.service.js
  → verify task exists (not completed/deleted)
  → verify user is assigned to task
  → check hours is within 0.01–24.00
    ↓
workLogs.repository.js
  → INSERT INTO work_logs (task_id, user_id, hours, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    ↓
[DB TRIGGER fires]
  trg_sync_task_logged_hours
  → UPDATE tasks SET logged_hours = SUM(work_logs.hours)
    WHERE tasks.id = task_id
    ↓
Response 201 with new log entry
```

---

## 6. Repository SQL Queries

```js
// List logs for a task (newest first)
async function findByTaskId(taskId) {
  const result = await pool.query(
    `SELECT wl.*, u.full_name
     FROM work_logs wl
     JOIN users u ON u.id = wl.user_id
     WHERE wl.task_id = $1
     ORDER BY wl.log_timestamp DESC`,
    [taskId]
  );
  return result.rows;
}

// List logs for a developer (with date range)
async function findByUserId(userId, fromDate, toDate) {
  const result = await pool.query(
    `SELECT wl.*, t.title as task_title, t.squad_id
     FROM work_logs wl
     JOIN tasks t ON t.id = wl.task_id
     WHERE wl.user_id = $1
       AND wl.log_timestamp >= $2
       AND wl.log_timestamp <= $3
     ORDER BY wl.log_timestamp DESC`,
    [userId, fromDate, toDate]
  );
  return result.rows;
}

// Create work log
async function createLog(taskId, userId, hours, notes) {
  const result = await pool.query(
    `INSERT INTO work_logs (task_id, user_id, hours, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [taskId, userId, hours, notes]
  );
  return result.rows[0];
}

// Delete log (with ownership check)
async function deleteLog(logId, userId) {
  const result = await pool.query(
    "DELETE FROM work_logs WHERE id = $1 AND user_id = $2 RETURNING *",
    [logId, userId]
  );
  return result.rows[0]; // null if not found or wrong user
}
```

---

## 7. Business Rules

1. **Notes are required** — developers must explain what they worked on.
2. **Hours: 0.01–24.00** — cannot log more than 24 hours in a single entry.
3. **Ownership** — developers can only delete their own log entries. Managers can delete any.
4. **logged_hours is trigger-managed** — never update `tasks.logged_hours` directly.
5. **Cascade on delete** — if the task is deleted, all its work logs are deleted.
6. **Log & Stop from timer** — when a developer stops the stopwatch, the app creates a work log for the elapsed seconds converted to hours.

---

## 8. Indexes

```sql
CREATE INDEX idx_work_logs_user_date ON workdash.work_logs(user_id, log_timestamp DESC);
CREATE INDEX idx_work_logs_task ON workdash.work_logs(task_id);
```

---

## 9. Testing

```bash
# Log 2.5 hours of work
curl -X POST http://localhost:3000/api/tasks/TASK_UUID/work-logs \
  -H "Content-Type: application/json" \
  -d '{"hours": 2.5, "notes": "Implemented auth middleware"}'

# Verify logged_hours updated on task
psql workdashboard -c "
  SELECT id, title, logged_hours, estimated_hours
  FROM workdash.tasks
  WHERE id = 'TASK_UUID';
"

# List logs for a user
curl "http://localhost:3000/api/users/USER_UUID/work-logs?from_date=2026-09-01&to_date=2026-09-15"

# Delete a log entry
curl -X DELETE http://localhost:3000/api/work-logs/LOG_UUID

# Verify trigger re-ran (logged_hours decreased)
psql workdashboard -c "SELECT logged_hours FROM workdash.tasks WHERE id = 'TASK_UUID';"
```

### Unit Test Skeleton

```js
test("createLog fires trigger and updates task logged_hours", async () => {
  // Arrange: mock pool.query for insert + trigger verification query
  pool.query
    .mockResolvedValueOnce({ rows: [{ id: "log-1", hours: 2.5 }] }) // INSERT
    .mockResolvedValueOnce({ rows: [{ logged_hours: "2.50" }] });    // SELECT to verify

  const log = await createLog("task-1", "user-1", 2.5, "Test notes");
  expect(log.hours).toBe(2.5);
  // In integration test: verify tasks.logged_hours = 2.5
});

test("deleteLog returns null when user is not owner", async () => {
  pool.query.mockResolvedValueOnce({ rows: [] }); // No row returned = not owner
  const result = await deleteLog("log-1", "wrong-user-id");
  expect(result).toBeNull();
});
```
