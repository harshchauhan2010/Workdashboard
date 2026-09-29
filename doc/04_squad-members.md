# Module: Squad Members

> File path: `src/modules/squad-members/`

---

## 1. Purpose

The Squad Members module manages which developers belong to which squads and at what allocation percentage. It is the junction between `users` and `squads`, enabling multi-squad capacity calculations.

---

## 2. Files

| File | Role |
|------|------|
| `squadMembers.controller.js` | HTTP handler: add/remove/list squad members |
| `squadMembers.service.js` | Business logic: allocation validation, soft removal |
| `squadMembers.repository.js` | SQL queries on `workdash.squad_members` |

---

## 3. Database Table

```sql
CREATE TABLE workdash.squad_members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id              UUID NOT NULL REFERENCES workdash.squads(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES workdash.users(id) ON DELETE CASCADE,
  allocation_percentage NUMERIC(3,0) NOT NULL DEFAULT 100
                          CHECK (allocation_percentage >= 10 AND allocation_percentage <= 100),
  joined_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at               TIMESTAMPTZ,
  CONSTRAINT uq_squad_user UNIQUE (squad_id, user_id)
);
```

**Key rule:** `left_at IS NULL` = **currently active** in squad. `left_at = NOW()` = **removed** (history preserved).

---

## 4. API Endpoints

### GET /api/squads/:squadId/members — List Current Members

**Response 200:**
```json
[
  {
    "id": "member-uuid",
    "squad_id": "squad-uuid",
    "user_id": "user-uuid",
    "full_name": "Alex Chen",
    "email": "alex@company.com",
    "seniority": "L4_STAFF",
    "role_title": "Tech Lead",
    "allocation_percentage": 100,
    "joined_at": "2026-01-01T00:00:00Z",
    "left_at": null
  }
]
```

---

### POST /api/squads/:squadId/members — Add Member to Squad

**Request body:**
```json
{
  "user_id": "user-uuid",
  "allocation_percentage": 80
}
```

**Response 201:**
```json
{
  "id": "new-member-uuid",
  "squad_id": "squad-uuid",
  "user_id": "user-uuid",
  "allocation_percentage": 80,
  "joined_at": "2026-09-15T10:00:00Z",
  "left_at": null
}
```

**Error 409:** `{ "error": "User is already a member of this squad" }`
**Error 400:** `{ "error": "allocation_percentage must be between 10 and 100" }`

---

### PATCH /api/squad-members/:memberId — Update Allocation

**Request body:** `{ "allocation_percentage": 50 }`
**Response 200:** Updated member object

---

### DELETE /api/squad-members/:memberId — Remove Member (Soft)

Sets `left_at = NOW()`. Preserves history.

**Response 200:** `{ "message": "Member removed from squad", "left_at": "2026-09-15T..." }`

---

## 5. Request / Response Flow

```
POST /api/squads/:squadId/members
    ↓
proxy.js → verify Clerk session
    ↓
squadMembers.controller.js → parse { user_id, allocation_percentage }
    ↓
squadMembers.service.js → check user is active, not already in squad
    ↓
squadMembers.repository.js
  → INSERT INTO squad_members (squad_id, user_id, allocation_percentage)
    VALUES ($1, $2, $3)
    ON CONFLICT (squad_id, user_id) DO NOTHING
    RETURNING *
    ↓
Response 201
```

---

## 6. Repository SQL Queries

```js
// List current (active) members of a squad
async function findActiveBySquadId(squadId) {
  const result = await pool.query(
    `SELECT sm.*, u.full_name, u.email, u.seniority, u.role_title
     FROM squad_members sm
     JOIN users u ON u.id = sm.user_id
     WHERE sm.squad_id = $1 AND sm.left_at IS NULL
     ORDER BY sm.joined_at ASC`,
    [squadId]
  );
  return result.rows;
}

// Add member to squad
async function addMember(squadId, userId, allocationPct) {
  const result = await pool.query(
    `INSERT INTO squad_members (squad_id, user_id, allocation_percentage)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [squadId, userId, allocationPct]
  );
  return result.rows[0];
}

// Soft remove (set left_at)
async function removeMember(memberId) {
  const result = await pool.query(
    `UPDATE squad_members SET left_at = NOW()
     WHERE id = $1 AND left_at IS NULL
     RETURNING *`,
    [memberId]
  );
  return result.rows[0];
}

// Get all squads a user currently belongs to
async function findSquadsByUserId(userId) {
  const result = await pool.query(
    `SELECT sm.*, s.name as squad_name, s.badge_code
     FROM squad_members sm
     JOIN squads s ON s.id = sm.squad_id
     WHERE sm.user_id = $1 AND sm.left_at IS NULL`,
    [userId]
  );
  return result.rows;
}
```

---

## 7. Business Rules

1. **UNIQUE(squad_id, user_id)** — a developer cannot be in the same squad twice.
2. **Soft removal** — always set `left_at = NOW()`, never DELETE the row.
3. **allocation_percentage** — valid range: 10–100. Affects capacity calculation.
4. **A user can be in multiple squads** — total allocation can exceed 100% (triggers overallocation warning).
5. **ON DELETE CASCADE** — if a squad or user is hard-deleted (emergency only), membership rows are cleaned up automatically.

---

## 8. Indexes

```sql
CREATE INDEX idx_squad_members_squad ON workdash.squad_members(squad_id);
CREATE INDEX idx_squad_members_user ON workdash.squad_members(user_id);
```

---

## 9. Testing

```bash
# Add member to Squad A
curl -X POST http://localhost:3000/api/squads/SQUAD_UUID/members \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_UUID", "allocation_percentage": 100}'

# List squad members
curl http://localhost:3000/api/squads/SQUAD_UUID/members

# Remove member
curl -X DELETE http://localhost:3000/api/squad-members/MEMBER_UUID

# Check DB
psql workdashboard -c "
  SELECT u.full_name, sm.allocation_percentage, sm.left_at
  FROM workdash.squad_members sm
  JOIN workdash.users u ON u.id = sm.user_id
  WHERE sm.squad_id = 'SQUAD_UUID';
"
```
