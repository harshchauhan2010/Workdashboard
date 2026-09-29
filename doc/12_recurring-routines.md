# Module: Recurring Routines

> File path: `src/modules/recurring-routines/`

---

## 1. Purpose

The Recurring Routines module manages scheduled, non-project overhead commitments for developers (such as Daily Standups, Architecture Reviews, Sprint Retrospectives, and Mentoring). These routines ensure that developer available working capacity is accurately adjusted before sprint task allocation occurs.

---

## 2. Layered Architecture & Files

```
API Routes (src/app/api/recurring-routines/...)
        ↓
Controller (src/modules/recurring-routines/recurringRoutines.controller.js)
        ↓
Service    (src/modules/recurring-routines/recurringRoutines.service.js)
        ↓
Repository (src/modules/recurring-routines/recurringRoutines.repository.js)
        ↓
Database   (workdash.recurring_routines)
```

| File | Role |
|------|------|
| `recurringRoutines.controller.js` | Parses HTTP requests, user authentication, and response marshaling |
| `recurringRoutines.service.js` | Business logic: calculates total recurring overhead for developer |
| `recurringRoutines.repository.js` | SQL queries against `workdash.recurring_routines` |

---

## 3. Database Schema

```sql
CREATE TABLE workdash.recurring_routines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
  squad_id        UUID REFERENCES workdash.squads(id) ON DELETE SET NULL,
  title           VARCHAR(255) NOT NULL,
  frequency       workdash.recurrence_freq NOT NULL DEFAULT 'DAILY',
  schedule_label  VARCHAR(100) NOT NULL,
  allocated_hours NUMERIC(4, 2) NOT NULL DEFAULT 2.50 CHECK (allocated_hours > 0.00),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recurring_routines_user ON workdash.recurring_routines(user_id);
CREATE INDEX idx_recurring_routines_squad ON workdash.recurring_routines(squad_id);
```

### Relationship with Developer Capacity
- Recurring routines represent guaranteed commitments.
- In `v_developer_capacity_summary`, the developer's `recurring_hours` reduces their `available_buffer_hours`:
  $$\text{available\_buffer\_hours} = \max(0, \text{weekly\_capacity\_hours} - (\text{recurring\_hours} + \text{pre\_planning\_hours} + \text{adhoc\_hours}))$$

---

## 4. API Endpoints

### 4.1 GET /api/recurring-routines/me — Current User's Recurring Routines

Fetches all recurring routines assigned to the authenticated developer.

**Response 200 OK:**
```json
[
  {
    "id": "routine-uuid-1",
    "user_id": "dev-uuid-1",
    "squad_id": "squad-alpha-uuid",
    "squad_name": "Squad Alpha",
    "title": "Daily Standup & Squad Sync",
    "frequency": "DAILY",
    "schedule_label": "Every day · 9:30 AM",
    "allocated_hours": 2.50,
    "created_at": "2026-09-01T00:00:00Z"
  },
  {
    "id": "routine-uuid-2",
    "user_id": "dev-uuid-1",
    "squad_id": "squad-alpha-uuid",
    "squad_name": "Squad Alpha",
    "title": "PR Reviews & Tech Mentoring",
    "frequency": "WEEKLY",
    "schedule_label": "Tue, Thu · 2:00 PM",
    "allocated_hours": 3.00,
    "created_at": "2026-09-01T00:00:00Z"
  }
]
```

---

### 4.2 GET /api/recurring-routines?userId=:id — List by User (Manager/Admin)

**Response 200 OK:** Returns array of routines for the specified developer.

---

### 4.3 POST /api/recurring-routines — Create Routine

**Request Body:**
```json
{
  "user_id": "dev-uuid-1",
  "squad_id": "squad-alpha-uuid",
  "title": "Architecture Guild Weekly",
  "frequency": "WEEKLY",
  "schedule_label": "Fridays · 3:00 PM",
  "allocated_hours": 1.50
}
```

**Response 201 Created:**
```json
{
  "id": "routine-uuid-new",
  "user_id": "dev-uuid-1",
  "squad_id": "squad-alpha-uuid",
  "title": "Architecture Guild Weekly",
  "frequency": "WEEKLY",
  "schedule_label": "Fridays · 3:00 PM",
  "allocated_hours": 1.50,
  "created_at": "2026-09-15T11:30:00Z"
}
```

---

### 4.4 DELETE /api/recurring-routines/:id — Remove Routine

**Response 200 OK:**
```json
{
  "message": "Recurring routine removed",
  "deleted_id": "routine-uuid-1"
}
```

---

## 5. Repository SQL Implementation

```javascript
// src/modules/recurring-routines/recurringRoutines.repository.js
import { pool } from '@/lib/db';

export async function findRoutinesByUserId(userId) {
  const res = await pool.query(
    `SELECT r.*, s.name as squad_name, s.badge_code as squad_badge
     FROM recurring_routines r
     LEFT JOIN squads s ON s.id = r.squad_id
     WHERE r.user_id = $1
     ORDER BY r.created_at ASC`,
    [userId]
  );
  return res.rows;
}

export async function createRoutine({ userId, squadId, title, frequency, scheduleLabel, allocatedHours }) {
  const res = await pool.query(
    `INSERT INTO recurring_routines (user_id, squad_id, title, frequency, schedule_label, allocated_hours)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, squadId, title, frequency, scheduleLabel, allocatedHours]
  );
  return res.rows[0];
}

export async function deleteRoutine(id) {
  const res = await pool.query('DELETE FROM recurring_routines WHERE id = $1 RETURNING *', [id]);
  return res.rows[0];
}
```

---

## 6. Testing

```bash
# 1. Get current developer routines
curl http://localhost:3000/api/recurring-routines/me

# 2. Add routine
curl -X POST http://localhost:3000/api/recurring-routines \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_UUID",
    "squad_id": "SQUAD_UUID",
    "title": "Sprint Retrospective",
    "frequency": "WEEKLY",
    "schedule_label": "Every Alternate Friday",
    "allocated_hours": 2.0
  }'

# 3. Check DB records
psql workdashboard -c "SELECT * FROM workdash.recurring_routines WHERE user_id = 'USER_UUID';"
```
