# Module: Active Timers (Stopwatch)

> File path: `src/modules/timers/`

---

## 1. Purpose

The Timers module manages the live stopwatch feature in the Developer Workspace. Each developer can have at most ONE active timer at a time (enforced by UNIQUE on user_id). The stopwatch tracks elapsed seconds, which are converted to hours when the developer logs and stops the timer.

---

## 2. Files

| File | Role |
|------|------|
| `timers.controller.js` | HTTP handler: start, pause, resume, stop timer |
| `timers.service.js` | Business logic: single-timer enforcement, seconds-to-hours conversion |
| `timers.repository.js` | SQL queries on `workdash.active_timers` |

---

## 3. Database Table

```sql
CREATE TABLE workdash.active_timers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES workdash.users(id) ON DELETE CASCADE,
  task_id          UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
  seconds_elapsed  INTEGER NOT NULL DEFAULT 0 CHECK (seconds_elapsed >= 0),
  is_running       BOOLEAN NOT NULL DEFAULT true,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**KEY CONSTRAINTS:**
- `UNIQUE ON user_id` — each developer can have only ONE active timer.
- `is_running = false` — timer is PAUSED (record still exists).
- Row DELETED — timer is stopped (happens on task completion or "Log & Stop").

---

## 4. API Endpoints

### GET /api/timers/me — Get Current Developer's Timer

**Response 200 (timer active):**
```json
{
  "id": "timer-uuid",
  "user_id": "user-uuid",
  "task_id": "task-uuid",
  "task_title": "Build Payment Gateway",
  "seconds_elapsed": 3752,
  "is_running": true,
  "started_at": "2026-09-15T10:00:00Z"
}
```

**Response 200 (no timer):**
```json
{ "timer": null }
```

---

### POST /api/timers/start — Start Timer on a Task

**Request body:**
```json
{ "task_id": "task-uuid" }
```

**Error 409:** `{ "error": "You already have an active timer on task: Build Payment Gateway. Stop it first." }`
**Error 403:** `{ "error": "Task is blocked — cannot start timer on a blocked task" }`

**Response 201:**
```json
{
  "id": "timer-uuid",
  "user_id": "user-uuid",
  "task_id": "task-uuid",
  "seconds_elapsed": 0,
  "is_running": true,
  "started_at": "2026-09-15T14:00:00Z"
}
```

---

### PATCH /api/timers/pause — Pause Running Timer

Updates `seconds_elapsed` and sets `is_running = false`.

**Request body:** `{ "seconds_elapsed": 3752 }` (client sends current elapsed seconds)

**Response 200:** Updated timer object with `is_running: false`

---

### PATCH /api/timers/resume — Resume Paused Timer

Sets `is_running = true`.

**Response 200:** Updated timer object with `is_running: true`

---

### POST /api/timers/stop — Log & Stop Timer

Converts elapsed seconds to hours, creates a work log, deletes the timer.

**Request body:**
```json
{
  "seconds_elapsed": 9000,
  "notes": "Completed authentication middleware implementation"
}
```

**Process:**
1. Convert: `hours = seconds_elapsed / 3600 = 2.5`
2. Create work log: `INSERT INTO work_logs (task_id, user_id, hours, notes) VALUES (...)`
3. Delete timer: `DELETE FROM active_timers WHERE user_id = $1`
4. DB trigger fires: `tasks.logged_hours` updated automatically

**Response 200:**
```json
{
  "message": "Timer stopped and work logged",
  "work_log": {
    "id": "log-uuid",
    "hours": 2.5,
    "notes": "Completed authentication middleware implementation"
  }
}
```

---

## 5. Request / Response Flow

```
POST /api/timers/start
    ↓
proxy.js → verify session
    ↓
timers.controller.js → auth() → get userId → parse { task_id }
    ↓
timers.service.js
  → check: does user already have a timer? (findByUserId)
    → if yes: 409 error
  → check: is task blocked?
    → if yes: 403 error
  → check: is developer assigned to this task?
    → if no: 403 error
    ↓
timers.repository.js
  → INSERT INTO active_timers (user_id, task_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *
    ↓
Response 201
```

---

## 6. Repository SQL Queries

```js
// Get current timer for a user
async function findByUserId(userId) {
  const result = await pool.query(
    `SELECT at.*, t.title as task_title, t.is_blocked
     FROM active_timers at
     JOIN tasks t ON t.id = at.task_id
     WHERE at.user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

// Start timer
async function startTimer(userId, taskId) {
  const result = await pool.query(
    `INSERT INTO active_timers (user_id, task_id)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, taskId]
  );
  return result.rows[0];
}

// Update seconds_elapsed + is_running
async function updateTimer(userId, secondsElapsed, isRunning) {
  const result = await pool.query(
    `UPDATE active_timers
     SET seconds_elapsed = $2, is_running = $3
     WHERE user_id = $1
     RETURNING *`,
    [userId, secondsElapsed, isRunning]
  );
  return result.rows[0];
}

// Delete timer (stop)
async function deleteTimer(userId) {
  const result = await pool.query(
    "DELETE FROM active_timers WHERE user_id = $1 RETURNING *",
    [userId]
  );
  return result.rows[0];
}
```

---

## 7. Trigger Interactions

| Trigger | Effect on Timer |
|---------|----------------|
| `trg_sync_task_blocker_state` (blocker reported) | Sets `active_timers.is_running = false` for timers on the blocked task |
| `trg_handle_task_completion` (task COMPLETED) | DELETES the active timer row |

**These are automatic DB-level effects. The frontend should poll GET /api/timers/me to detect these changes.**

---

## 8. Business Rules

1. **One timer per developer** — enforced by UNIQUE(user_id). Starting a new timer requires stopping the existing one.
2. **Blocked tasks** — cannot start a timer on a task where `is_blocked = true`.
3. **Seconds storage** — the frontend is responsible for incrementing the timer display. The backend stores the accumulated `seconds_elapsed`.
4. **Log & Stop** — minimum loggable time is 1 second (rounds to 0.00 hours if < 18 seconds, but the app should handle this gracefully).
5. **Timer persists across page reloads** — the DB row acts as the source of truth; the frontend reads `seconds_elapsed` on mount to resume the display.

---

## 9. Testing

```bash
# Start a timer
curl -X POST http://localhost:3000/api/timers/start \
  -H "Content-Type: application/json" \
  -d '{"task_id": "TASK_UUID"}'

# Check timer state
curl http://localhost:3000/api/timers/me

# Pause timer
curl -X PATCH http://localhost:3000/api/timers/pause \
  -H "Content-Type: application/json" \
  -d '{"seconds_elapsed": 1800}'

# Resume timer
curl -X PATCH http://localhost:3000/api/timers/resume

# Log & Stop
curl -X POST http://localhost:3000/api/timers/stop \
  -H "Content-Type: application/json" \
  -d '{"seconds_elapsed": 9000, "notes": "Completed auth middleware"}'

# Verify timer deleted and work log created
psql workdashboard -c "SELECT * FROM workdash.active_timers WHERE user_id = 'USER_UUID';"
psql workdashboard -c "SELECT hours, notes FROM workdash.work_logs ORDER BY log_timestamp DESC LIMIT 1;"
```
