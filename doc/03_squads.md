# Module: Squads

> File path: `src/modules/squads/`

---

## 1. Purpose

The Squads module manages the 6 core engineering pods (Squad A through F). Each squad owns tasks, budget hours, and developers. The module powers the Squads Hub cards, sidebar squad pods list, and the squad detail drawer in the Manager Command Center.

---

## 2. Files

| File | Role |
|------|------|
| `squads.controller.js` | HTTP handler for CRUD operations on squads |
| `squads.service.js` | Business logic: health calculation, budget tracking |
| `squads.repository.js` | SQL queries on `workdash.squads` |
| `squads.validator.js` | Input validation for create/update requests |

---

## 3. Database Table

```sql
CREATE TABLE workdash.squads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150) NOT NULL,
  badge_code    VARCHAR(32) NOT NULL DEFAULT 'PROJECT',
  focus_domain  VARCHAR(255) NOT NULL,
  lead_user_id  UUID NOT NULL REFERENCES workdash.users(id) ON DELETE RESTRICT,
  budget_hours  NUMERIC(6,1) NOT NULL DEFAULT 320.0 CHECK (budget_hours >= 0.0),
  spent_hours   NUMERIC(6,1) NOT NULL DEFAULT 0.0 CHECK (spent_hours >= 0.0),
  health        workdash.squad_health_status NOT NULL DEFAULT 'HEALTHY',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### ENUM Values

| Field | Valid Values |
|-------|-------------|
| `health` | `HEALTHY`, `AT_RISK`, `CRITICAL` |

---

## 4. The 6 Squads (Seed Data)

| Squad | badge_code | Tech Lead | Focus Domain |
|-------|-----------|-----------|--------------|
| Squad A (FinTech Core Platform) | `ALPHA` | David Miller | Alpha FinTech Platform · High-Throughput APIs |
| Squad B (E-Commerce Web Portal) | `BETA` | Sarah Jenkins | Beta E-Commerce Portal · Next.js & Design System |
| Squad C (Mobile POS & iOS/Android) | `GAMMA` | Robert Chang | Gamma POS Suite · Native iOS/Android POS Engine |
| Squad D (Cloud Infra & SRE) | `DELTA` | Elena Rostova | Delta Cloud & SRE · Kubernetes & Multi-Cloud |
| Squad E (Security & QA Automation) | `ECHO` | Marcus Brody | Echo SecOps & QA · SOC2 Compliance & Load Testing |
| Squad F (Machine Learning & AI) | `PROJECT` | Chiranshi Thummar | Squad F Machine Learning · LLM Pipelines & Vision Models |

---

## 5. API Endpoints

### GET /api/squads — List All Active Squads

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Squad A (FinTech Core Platform)",
    "badge_code": "ALPHA",
    "focus_domain": "Alpha FinTech Platform · High-Throughput APIs",
    "lead_user_id": "user-uuid",
    "budget_hours": 320.0,
    "spent_hours": 147.5,
    "health": "HEALTHY",
    "is_active": true
  }
]
```

---

### GET /api/squads/:id — Get Squad with Members

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Squad A (FinTech Core Platform)",
  "badge_code": "ALPHA",
  "focus_domain": "...",
  "lead_user_id": "uuid",
  "budget_hours": 320.0,
  "spent_hours": 147.5,
  "health": "HEALTHY",
  "members": [
    { "user_id": "uuid", "full_name": "Alex Chen", "allocation_percentage": 100 }
  ],
  "active_tasks_count": 8,
  "blocked_tasks_count": 1
}
```

---

### POST /api/squads — Create Squad (Manager Only)

**Request body:**
```json
{
  "name": "Squad G (Data Engineering)",
  "badge_code": "GAMMA2",
  "focus_domain": "Data Pipeline & Lakehouse Architecture",
  "lead_user_id": "user-uuid",
  "budget_hours": 280.0
}
```

**Response 201:** Created squad object

---

### PATCH /api/squads/:id — Update Squad

**Allowed fields:** `name`, `badge_code`, `focus_domain`, `lead_user_id`, `budget_hours`, `health`

---

### DELETE /api/squads/:id — Soft Delete Squad

Sets `is_active = false`. NEVER hard deletes — all historical data preserved.

**Response 200:** `{ "message": "Squad deactivated successfully" }`

---

## 6. Request / Response Flow

```
Client: GET /api/squads
    ↓
proxy.js → verify Clerk session
    ↓
src/app/api/squads/route.js
    ↓
squads.controller.js → check role (MANAGER required for write ops)
    ↓
squads.service.js → enrich with member counts, task counts
    ↓
squads.repository.js → SELECT * FROM squads WHERE is_active = true
    ↓
Response JSON
```

---

## 7. Repository SQL Queries

```js
// Get all active squads
async function findAllActive() {
  const result = await pool.query(
    `SELECT s.*, u.full_name as lead_name
     FROM squads s
     JOIN users u ON u.id = s.lead_user_id
     WHERE s.is_active = true
     ORDER BY s.name`
  );
  return result.rows;
}

// Get squad with member count and task counts
async function findByIdWithDetails(squadId) {
  const squadResult = await pool.query(
    "SELECT * FROM squads WHERE id = $1", [squadId]
  );
  const membersResult = await pool.query(
    `SELECT sm.*, u.full_name, u.email, u.seniority
     FROM squad_members sm
     JOIN users u ON u.id = sm.user_id
     WHERE sm.squad_id = $1 AND sm.left_at IS NULL`, [squadId]
  );
  return { ...squadResult.rows[0], members: membersResult.rows };
}

// Soft delete
async function deactivateSquad(id) {
  const result = await pool.query(
    "UPDATE squads SET is_active = false WHERE id = $1 RETURNING *", [id]
  );
  return result.rows[0];
}
```

---

## 8. Business Rules

1. **Soft delete only** — never DELETE a squad row. Set `is_active = false`.
2. **lead_user_id is RESTRICT** — cannot delete a user who is still leading a squad.
3. **badge_code is used as project prefix** on task cards and blocker registry labels.
4. **budget_hours vs spent_hours** — spent_hours is updated automatically as tasks are logged and completed.
5. **Health status** — `HEALTHY` (< 80% utilized), `AT_RISK` (80–100%), `CRITICAL` (> 100%).
6. **MANAGER role** required for all write operations (create, update, delete).

---

## 9. Indexes

```sql
CREATE INDEX idx_squads_lead_user ON workdash.squads(lead_user_id);
CREATE INDEX idx_squads_badge_code ON workdash.squads(badge_code);
```

---

## 10. Testing

### Manual Tests

```bash
# List squads
curl http://localhost:3000/api/squads

# Create squad
curl -X POST http://localhost:3000/api/squads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Squad G (Data Engineering)",
    "badge_code": "GAMMA2",
    "focus_domain": "Data Pipeline",
    "lead_user_id": "VALID_USER_UUID",
    "budget_hours": 280
  }'

# Deactivate squad
curl -X DELETE http://localhost:3000/api/squads/SQUAD_UUID

# Check in DB
psql workdashboard -c "SELECT id, name, health, is_active FROM workdash.squads;"
```

### Unit Test Skeleton

```js
test("deactivateSquad sets is_active to false", async () => {
  pool.query.mockResolvedValueOnce({
    rows: [{ id: "squad-1", name: "Squad A", is_active: false }]
  });
  const result = await deactivateSquad("squad-1");
  expect(result.is_active).toBe(false);
});

test("createSquad fails without lead_user_id", async () => {
  await expect(createSquad({ name: "New Squad", badge_code: "NEW" }))
    .rejects.toThrow("lead_user_id is required");
});
```
