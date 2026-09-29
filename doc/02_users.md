# Module: Users

> File path: `src/modules/users/`
> API routes: `src/app/api/users/route.js`

---

## 1. Purpose

The Users module manages the internal engineer and manager profiles stored in `workdash.users`. It:
- Lists all active users (for manager views, assignment pickers, team rosters)
- Provides individual user profiles
- Manages role, seniority, skills, and capacity settings
- Links Clerk identity (clerk_id) to internal DB profiles

---

## 2. Files

| File | Role |
|------|------|
| `users.controller.js` | HTTP handler: list, get, create, update users |
| `users.service.js` | Business logic: role validation, capacity defaults, skill normalization |
| `users.repository.js` | SQL queries on `workdash.users` table |
| `users.validator.js` | Input validation for create/update requests |

---

## 3. Database Table

```sql
CREATE TABLE workdash.users (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id               VARCHAR(255) NOT NULL UNIQUE,
  full_name              VARCHAR(150) NOT NULL,
  email                  VARCHAR(255) NOT NULL UNIQUE,
  role_title             VARCHAR(150) NOT NULL,
  system_role            workdash.user_system_role NOT NULL DEFAULT 'DEVELOPER',
  seniority              workdash.seniority_level NOT NULL DEFAULT 'L3_SENIOR',
  weekly_capacity_hours  NUMERIC(4,1) NOT NULL DEFAULT 40.0
                           CHECK (weekly_capacity_hours >= 10.0 AND weekly_capacity_hours <= 80.0),
  recurring_overhead_hours NUMERIC(4,1) NOT NULL DEFAULT 6.0
                           CHECK (recurring_overhead_hours >= 0.0 AND recurring_overhead_hours <= 40.0),
  skills                 TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### ENUM Values

| Field | Valid Values |
|-------|-------------|
| `system_role` | `MANAGER`, `DEVELOPER` |
| `seniority` | `L1_JUNIOR`, `L2_MID`, `L3_SENIOR`, `L4_STAFF`, `L5_PRINCIPAL`, `LEAD` |

---

## 4. API Endpoints

### GET /api/users — List All Active Users

**Request:**
```
GET /api/users
Authorization: Clerk session cookie (required)
```

**Response 200:**
```json
[
  {
    "id": "uuid",
    "clerk_id": "user_2abc...",
    "full_name": "Alex Chen",
    "email": "alex@company.com",
    "role_title": "Senior Backend Engineer",
    "system_role": "MANAGER",
    "seniority": "L4_STAFF",
    "weekly_capacity_hours": 40.0,
    "recurring_overhead_hours": 6.0,
    "skills": ["Node.js", "PostgreSQL", "Go"],
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-09-15T00:00:00Z"
  }
]
```

---

### GET /api/users/:id — Get User by ID

**Response 200:** Single user object (same shape as above)
**Response 404:** `{ "error": "User not found" }`

---

### POST /api/users — Create User (Manager Only)

**Request body:**
```json
{
  "clerk_id": "user_2new...",
  "full_name": "Marcus Vance",
  "email": "marcus@company.com",
  "role_title": "Backend Engineer",
  "system_role": "DEVELOPER",
  "seniority": "L2_MID",
  "weekly_capacity_hours": 40.0,
  "recurring_overhead_hours": 5.0,
  "skills": ["Python", "Django"]
}
```

**Response 201:**
```json
{
  "id": "new-uuid",
  "full_name": "Marcus Vance",
  ...
}
```

**Validation errors 400:**
```json
{ "error": "email is required" }
{ "error": "system_role must be MANAGER or DEVELOPER" }
{ "error": "weekly_capacity_hours must be between 10 and 80" }
```

---

### PATCH /api/users/:id — Update User

**Allowed fields:** `full_name`, `role_title`, `system_role`, `seniority`, `weekly_capacity_hours`, `recurring_overhead_hours`, `skills`, `is_active`

**Response 200:** Updated user object

---

## 5. Request / Response Flow

```
Client Request: GET /api/users
    ↓
src/proxy.js (clerkMiddleware) → verify session
    ↓
src/app/api/users/route.js
    ↓  calls
users.controller.js → auth() check → extract params
    ↓  calls
users.service.js → apply defaults, normalize skills array
    ↓  calls
users.repository.js → SELECT * FROM users WHERE is_active = true ORDER BY full_name
    ↓
Response: JSON array of user objects
```

---

## 6. Repository SQL Queries

```js
// Get all active users
async function findAllActive() {
  const result = await pool.query(
    "SELECT * FROM users WHERE is_active = true ORDER BY full_name ASC"
  );
  return result.rows;
}

// Get user by ID
async function findById(id) {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] ?? null;
}

// Get user by clerk_id
async function findByClerkId(clerkId) {
  const result = await pool.query(
    "SELECT * FROM users WHERE clerk_id = $1",
    [clerkId]
  );
  return result.rows[0] ?? null;
}

// Create user
async function createUser(data) {
  const result = await pool.query(
    `INSERT INTO users (clerk_id, full_name, email, role_title, system_role,
      seniority, weekly_capacity_hours, recurring_overhead_hours, skills)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [data.clerk_id, data.full_name, data.email, data.role_title,
     data.system_role, data.seniority, data.weekly_capacity_hours,
     data.recurring_overhead_hours, data.skills]
  );
  return result.rows[0];
}

// Soft delete (deactivate)
async function deactivateUser(id) {
  const result = await pool.query(
    "UPDATE users SET is_active = false WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
}
```

---

## 7. Validation Rules

| Field | Rule |
|-------|------|
| `clerk_id` | Required, string, must be unique |
| `full_name` | Required, max 150 chars |
| `email` | Required, valid email format, unique |
| `role_title` | Required, max 150 chars |
| `system_role` | Must be `MANAGER` or `DEVELOPER` |
| `seniority` | Must be one of 6 valid levels |
| `weekly_capacity_hours` | Number between 10.0 and 80.0 |
| `recurring_overhead_hours` | Number between 0.0 and 40.0 |
| `skills` | Array of strings (empty array is valid) |

---

## 8. Business Rules

1. **Never hard-delete users** — always set `is_active = false`. This preserves historical work logs, assignments, and blocker records.
2. **Manager creates developer accounts** — via the Create Developer modal in the UI. Clerk sends an invite email.
3. **system_role controls routing** — MANAGER → command center, DEVELOPER → personal workspace.
4. **Skills array** — used for smart assignment matching in the assignment picker.
5. **recurring_overhead_hours** — automatically deducted from developer's available weekly capacity in the capacity engine.

---

## 9. Indexes

```sql
CREATE INDEX idx_users_clerk_id ON workdash.users(clerk_id);
CREATE INDEX idx_users_role_active ON workdash.users(system_role) WHERE is_active = true;
CREATE INDEX idx_users_skills_gin ON workdash.users USING GIN(skills);
CREATE INDEX idx_users_email_lower ON workdash.users(LOWER(email));
CREATE INDEX idx_users_name_trgm ON workdash.users USING gin (full_name gin_trgm_ops);
```

---

## 10. How to Implement users.controller.js

```js
// src/modules/users/users.controller.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import * as usersService from "./users.service.js";
import { validateCreateUser } from "./users.validator.js";

export async function listUsersController() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await usersService.getAllActiveUsers();
    return NextResponse.json(users);
  } catch (err) {
    console.error("[users/list]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function createUserController(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validationError = validateCreateUser(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const user = await usersService.createUser(body);
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 11. Testing

### Manual Tests

```bash
# List all users (needs auth — run in browser or with cookie)
curl http://localhost:3000/api/users

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "clerk_id": "user_test123",
    "full_name": "Test Dev",
    "email": "test@company.com",
    "role_title": "Junior Developer",
    "system_role": "DEVELOPER",
    "seniority": "L1_JUNIOR",
    "weekly_capacity_hours": 40,
    "recurring_overhead_hours": 4,
    "skills": ["JavaScript"]
  }'

# Check DB directly
psql workdashboard -c "SELECT id, full_name, system_role, is_active FROM workdash.users;"
```

### Unit Test Skeleton

```js
// users.service.test.js
import * as usersRepo from "./users.repository.js";
import { getAllActiveUsers, createUser } from "./users.service.js";

jest.mock("./users.repository.js");

test("getAllActiveUsers returns list", async () => {
  usersRepo.findAllActive.mockResolvedValueOnce([
    { id: "1", full_name: "Alex Chen", system_role: "MANAGER" }
  ]);
  const users = await getAllActiveUsers();
  expect(users).toHaveLength(1);
});

test("createUser rejects invalid capacity", async () => {
  await expect(createUser({ weekly_capacity_hours: 5 }))
    .rejects.toThrow("weekly_capacity_hours must be between 10 and 80");
});
```
