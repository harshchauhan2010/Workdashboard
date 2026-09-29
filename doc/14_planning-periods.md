# Module: Planning Periods (Sprint Cycles)

> File path: `src/modules/planning-periods/`

---

## 1. Purpose

The Planning Periods module manages operational engineering cycles (e.g. 2-week Sprints or Monthly Cycles). Every task and capacity allocation is planned within the context of a planning period. Exactly **one** planning period is flagged as active (`is_current = true`) at any given time.

---

## 2. Layered Architecture & Files

```
API Routes (src/app/api/planning-periods/...)
        ↓
Controller (src/modules/planning-periods/planningPeriods.controller.js)
        ↓
Service    (src/modules/planning-periods/planningPeriods.service.js)
        ↓
Repository (src/modules/planning-periods/planningPeriods.repository.js)
        ↓
Database   (workdash.planning_periods)
```

| File | Role |
|------|------|
| `planningPeriods.controller.js` | HTTP endpoint handler for calendar cycles |
| `planningPeriods.service.js` | Ensures single current cycle constraint & date integrity |
| `planningPeriods.repository.js` | PostgreSQL operations on `workdash.planning_periods` |

---

## 3. Database Schema

```sql
CREATE TABLE workdash.planning_periods (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_period_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_planning_periods_current ON workdash.planning_periods(is_current);
CREATE UNIQUE INDEX idx_single_current_period ON workdash.planning_periods(is_current) WHERE is_current = true;
```

---

## 4. API Specifications

### 4.1 GET /api/planning-periods — List All Periods

**Response 200 OK:**
```json
[
  {
    "id": "period-uuid-1",
    "name": "Sprint 42 · Sep 1 - Sep 14",
    "start_date": "2026-09-01",
    "end_date": "2026-09-14",
    "is_current": true,
    "created_at": "2026-08-25T00:00:00Z"
  },
  {
    "id": "period-uuid-2",
    "name": "Sprint 43 · Sep 15 - Sep 28",
    "start_date": "2026-09-15",
    "end_date": "2026-09-28",
    "is_current": false,
    "created_at": "2026-08-25T00:00:00Z"
  }
]
```

---

### 4.2 GET /api/planning-periods/current — Get Active Period

**Response 200 OK:**
```json
{
  "id": "period-uuid-1",
  "name": "Sprint 42 · Sep 1 - Sep 14",
  "start_date": "2026-09-01",
  "end_date": "2026-09-14",
  "is_current": true
}
```

---

### 4.3 POST /api/planning-periods — Create Period (Manager Only)

**Request Body:**
```json
{
  "name": "Sprint 44 · Sep 29 - Oct 12",
  "start_date": "2026-09-29",
  "end_date": "2026-10-12",
  "is_current": false
}
```

**Response 201 Created:**
```json
{
  "id": "period-uuid-3",
  "name": "Sprint 44 · Sep 29 - Oct 12",
  "start_date": "2026-09-29",
  "end_date": "2026-10-12",
  "is_current": false,
  "created_at": "2026-09-15T11:45:00Z"
}
```

---

### 4.4 PATCH /api/planning-periods/:id/set-current — Switch Active Sprint

De-flags current period and flags target period as `is_current = true`.

**Response 200 OK:**
```json
{
  "message": "Current planning period updated",
  "active_period_id": "period-uuid-2"
}
```

---

## 5. Repository Layer

```javascript
// src/modules/planning-periods/planningPeriods.repository.js
import { pool } from '@/lib/db';

export async function findAllPeriods() {
  const res = await pool.query('SELECT * FROM planning_periods ORDER BY start_date DESC');
  return res.rows;
}

export async function findCurrentPeriod() {
  const res = await pool.query('SELECT * FROM planning_periods WHERE is_current = true LIMIT 1');
  return res.rows[0] || null;
}

export async function createPeriod({ name, startDate, endDate, isCurrent = false }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (isCurrent) {
      await client.query('UPDATE planning_periods SET is_current = false WHERE is_current = true');
    }
    const res = await client.query(
      `INSERT INTO planning_periods (name, start_date, end_date, is_current)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, startDate, endDate, isCurrent]
    );
    await client.query('COMMIT');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function setCurrentPeriod(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE planning_periods SET is_current = false WHERE is_current = true');
    const res = await client.query(
      'UPDATE planning_periods SET is_current = true WHERE id = $1 RETURNING *',
      [id]
    );
    await client.query('COMMIT');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

---

## 6. Testing

```bash
# 1. Fetch current sprint
curl http://localhost:3000/api/planning-periods/current

# 2. List all sprints
curl http://localhost:3000/api/planning-periods

# 3. Switch active sprint
curl -X PATCH http://localhost:3000/api/planning-periods/PERIOD_UUID/set-current
```
