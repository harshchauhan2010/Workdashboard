# Module: Task Blockers

> File path: `src/modules/blockers/`

---

## 1. Purpose

The Blockers module manages the impediment and risk registry for tasks. When a developer reports a blocker, the DB trigger automatically marks the task as blocked and pauses any running stopwatch timer. The Manager uses the Blockers tab to track and resolve all open impediments.

---

## 2. Files

| File | Role |
|------|------|
| `blockers.controller.js` | HTTP handler: report, resolve, list blockers |
| `blockers.service.js` | Business logic: severity routing, resolution validation |
| `blockers.repository.js` | SQL queries on `workdash.task_blockers` |
| `blockers.validator.js` | Input validation |

---

## 3. Database Table

```sql
CREATE TABLE workdash.task_blockers (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id                UUID NOT NULL REFERENCES workdash.tasks(id) ON DELETE CASCADE,
  reported_by_user_id    UUID NOT NULL REFERENCES workdash.users(id) ON DELETE RESTRICT,
  category               workdash.blocker_category_type NOT NULL DEFAULT 'TECHNICAL_IMPEDIMENT',
  severity               workdash.blocker_severity_level NOT NULL DEFAULT 'CRITICAL_BLOCKER',
  reason                 TEXT NOT NULL,
  business_impact        TEXT NOT NULL,
  mitigation_action      TEXT,
  expected_resolution_date DATE,
  is_resolved            BOOLEAN NOT NULL DEFAULT false,
  resolved_at            TIMESTAMPTZ,
  resolved_by_user_id    UUID REFERENCES workdash.users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### ENUM Values

| Field | Valid Values |
|-------|-------------|
| `category` | `TECHNICAL_IMPEDIMENT`, `DEPENDENCY`, `REVIEW_BOTTLENECK`, `RESOURCE_CAPACITY`, `SCOPE_CREEP`, `INFRASTRUCTURE` |
| `severity` | `CRITICAL_BLOCKER`, `HIGH_DELIVERY_RISK` |

---

## 4. API Endpoints

### GET /api/blockers — List All Unresolved Blockers (Manager View)

**Response 200:**
```json
[
  {
    "id": "blocker-uuid",
    "task_id": "task-uuid",
    "task_title": "Build Payment Gateway",
    "squad_name": "Squad A (FinTech Core Platform)",
    "badge_code": "ALPHA",
    "reported_by_user_id": "user-uuid",
    "reporter_name": "Marcus Vance",
    "category": "TECHNICAL_IMPEDIMENT",
    "severity": "CRITICAL_BLOCKER",
    "reason": "API keys for Stripe production environment not provisioned",
    "business_impact": "Payment gateway integration blocked, sprint delivery at risk",
    "mitigation_action": "Raised with DevOps team, ETA 2 days",
    "expected_resolution_date": "2026-09-17",
    "is_resolved": false,
    "created_at": "2026-09-15T09:00:00Z"
  }
]
```

---

### GET /api/tasks/:taskId/blockers — List Blockers for a Task

**Response 200:** Array of blocker objects for the specified task

---

### POST /api/tasks/:taskId/blockers — Report a Blocker (Developer)

**Request body:**
```json
{
  "category": "TECHNICAL_IMPEDIMENT",
  "severity": "CRITICAL_BLOCKER",
  "reason": "API keys for Stripe production environment not provisioned",
  "business_impact": "Payment gateway integration blocked — sprint delivery at risk",
  "mitigation_action": "Raised ticket with DevOps team, awaiting keys",
  "expected_resolution_date": "2026-09-17"
}
```

**After INSERT, trigger fires:**
- `tasks.is_blocked = true` for the parent task
- `active_timers.is_running = false` for any running timer on this task

**Response 201:** Created blocker object

---

### PATCH /api/blockers/:blockerId/resolve — Resolve a Blocker (Manager)

**Request body:**
```json
{
  "mitigation_action": "Stripe API keys provisioned by DevOps team"
}
```

Sets `is_resolved = true`, `resolved_at = NOW()`, `resolved_by_user_id = manager_id`.

If no other unresolved blockers remain on the task, trigger sets `tasks.is_blocked = false`.

**Response 200:** Updated blocker object

---

## 5. Request / Response Flow

```
POST /api/tasks/:taskId/blockers (Developer reports blocker)
    ↓
proxy.js → verify session
    ↓
blockers.controller.js
  → auth() → get developer's userId
  → parse body
  → validateBlocker(body) — reason and business_impact are required
    ↓
blockers.service.js
  → verify task exists and is not completed
  → set reported_by_user_id = developer's DB user id
    ↓
blockers.repository.js
  → INSERT INTO task_blockers (task_id, reported_by_user_id, category, severity,
      reason, business_impact, mitigation_action, expected_resolution_date)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
    ↓
[DB TRIGGER fires: trg_sync_task_blocker_state]
  → UPDATE tasks SET is_blocked = true WHERE id = task_id
  → UPDATE active_timers SET is_running = false WHERE task_id = task_id
    ↓
Response 201
```

---

## 6. Repository SQL Queries

```js
// List all unresolved blockers with context (for manager view)
async function findAllUnresolved() {
  const result = await pool.query(
    `SELECT
       tb.*,
       t.title as task_title,
       s.name as squad_name,
       s.badge_code,
       u.full_name as reporter_name
     FROM task_blockers tb
     JOIN tasks t ON t.id = tb.task_id
     JOIN squads s ON s.id = t.squad_id
     JOIN users u ON u.id = tb.reported_by_user_id
     WHERE tb.is_resolved = false
     ORDER BY
       CASE tb.severity WHEN 'CRITICAL_BLOCKER' THEN 1 ELSE 2 END,
       tb.created_at DESC`
  );
  return result.rows;
}

// Report blocker
async function createBlocker(data) {
  const result = await pool.query(
    `INSERT INTO task_blockers
       (task_id, reported_by_user_id, category, severity, reason,
        business_impact, mitigation_action, expected_resolution_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [data.task_id, data.reported_by_user_id, data.category, data.severity,
     data.reason, data.business_impact, data.mitigation_action || null,
     data.expected_resolution_date || null]
  );
  return result.rows[0];
}

// Resolve blocker
async function resolveBlocker(blockerId, resolvedByUserId, mitigationAction) {
  const result = await pool.query(
    `UPDATE task_blockers
     SET is_resolved = true,
         resolved_at = NOW(),
         resolved_by_user_id = $2,
         mitigation_action = COALESCE($3, mitigation_action)
     WHERE id = $1
     RETURNING *`,
    [blockerId, resolvedByUserId, mitigationAction || null]
  );
  return result.rows[0];
}
```

---

## 7. Trigger Behavior

### trg_sync_task_blocker_state
Fires AFTER INSERT or UPDATE on `task_blockers`.

**On INSERT (new blocker):**
```sql
UPDATE tasks SET is_blocked = true WHERE id = NEW.task_id;
UPDATE active_timers SET is_running = false WHERE task_id = NEW.task_id;
```

**On UPDATE (resolving a blocker):**
```sql
-- Check if any other unresolved blockers remain
IF NOT EXISTS (
  SELECT 1 FROM task_blockers
  WHERE task_id = NEW.task_id AND is_resolved = false
) THEN
  UPDATE tasks SET is_blocked = false WHERE id = NEW.task_id;
END IF;
```

---

## 8. Business Rules

1. **reason and business_impact are required** — developers must document what is blocked and why it matters.
2. **CRITICAL_BLOCKER** — delivery is fully halted. Active timer paused automatically.
3. **HIGH_DELIVERY_RISK** — delivery is at risk but not fully stopped.
4. **Managers resolve blockers** — developers report them; managers clear them.
5. **Blocker presets** — quick chips pre-fill the reason/impact/mitigation fields (see 09_blocker-presets.md).
6. **reporter ON DELETE RESTRICT** — cannot delete a user while they have unresolved blockers.
7. **resolved_by ON DELETE SET NULL** — if resolver user is deleted, blocker record is preserved.

---

## 9. Indexes

```sql
CREATE INDEX idx_task_blockers_task ON workdash.task_blockers(task_id);
CREATE INDEX idx_task_blockers_active ON workdash.task_blockers(is_resolved, severity)
  WHERE is_resolved = false;
CREATE INDEX idx_task_blockers_reason_trgm ON workdash.task_blockers
  USING gin (reason gin_trgm_ops);
```

---

## 10. Testing

```bash
# Report a blocker
curl -X POST http://localhost:3000/api/tasks/TASK_UUID/blockers \
  -H "Content-Type: application/json" \
  -d '{
    "category": "TECHNICAL_IMPEDIMENT",
    "severity": "CRITICAL_BLOCKER",
    "reason": "Stripe API keys not provisioned",
    "business_impact": "Payment sprint delivery blocked"
  }'

# Verify task is now blocked and timer paused
psql workdashboard -c "SELECT is_blocked FROM workdash.tasks WHERE id = 'TASK_UUID';"
psql workdashboard -c "SELECT is_running FROM workdash.active_timers WHERE task_id = 'TASK_UUID';"

# List unresolved blockers
curl http://localhost:3000/api/blockers

# Resolve a blocker
curl -X PATCH http://localhost:3000/api/blockers/BLOCKER_UUID/resolve \
  -H "Content-Type: application/json" \
  -d '{"mitigation_action": "Keys provisioned by DevOps"}'

# Verify task is unblocked
psql workdashboard -c "SELECT is_blocked, is_resolved FROM workdash.task_blockers WHERE id = 'BLOCKER_UUID';"
```
