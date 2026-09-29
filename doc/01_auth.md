# Module: Auth

> File path: `src/modules/auth/`
> API routes: `src/app/api/auth/me/route.js`
> Middleware: `src/proxy.js`

---

## 1. Purpose

The Auth module handles all Clerk-based authentication for WorkDashboard. It:
- Guards every route via `clerkMiddleware` in `proxy.js`
- Provides a `/api/auth/me` endpoint that returns the current logged-in user's DB profile
- Serves as the identity bridge between Clerk (external auth) and the `users` table (internal DB)

---

## 2. Files

| File | Role |
|------|------|
| `auth.controller.js` | Parses HTTP request, extracts Clerk userId, calls service, returns JSON |
| `auth.service.js` | Looks up the DB user row by `clerk_id`, handles "first login" upsert logic |
| `auth.repository.js` | Raw SQL: `SELECT * FROM users WHERE clerk_id = $1` |
| `auth.validator.js` | (empty — Clerk validates identity; no body params needed) |
| `src/proxy.js` | Global Clerk middleware — runs on every request |

---

## 3. Request / Response Flow

### GET /api/auth/me

```
Browser (authenticated session cookie)
    ↓
src/proxy.js (clerkMiddleware) → verifies session, attaches auth context
    ↓
src/app/api/auth/me/route.js
    ↓  calls
auth.controller.js → calls auth() from @clerk/nextjs/server → gets { userId }
    ↓  calls
auth.service.js → calls authRepository.findByClerkId(userId)
    ↓  calls
auth.repository.js → SELECT * FROM users WHERE clerk_id = $1
    ↓
Response JSON: { id, clerk_id, full_name, email, role_title, system_role, seniority, ... }
```

**Success 200:**
```json
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
  "skills": ["Node.js", "PostgreSQL"],
  "is_active": true
}
```

**Error 401 (not authenticated):**
```json
{ "error": "Unauthorized" }
```

**Error 404 (Clerk user has no DB row yet):**
```json
{ "error": "User not found in database" }
```

---

## 4. Middleware: proxy.js

```js
// src/proxy.js
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**What it does:**
- Runs on every page and API route EXCEPT static files
- Validates the Clerk session JWT on every request
- Routes without a valid session: Clerk redirects to `/sign-in`
- Routes with a valid session: request proceeds with `auth()` context available

---

## 5. Authentication in App Pages

```js
// src/app/page.js (Server Component)
import { auth, currentUser } from "@clerk/nextjs/server";

const { userId, redirectToSignIn } = await auth();
if (!userId) return redirectToSignIn();

const user = await currentUser(); // full Clerk user object
```

---

## 6. Clerk Session Lifecycle

```
1. User visits /sign-in
2. Clerk renders SignIn component
3. User submits credentials → Clerk validates
4. Clerk sets session cookie (__session)
5. Every subsequent request: clerkMiddleware reads cookie → verifies JWT
6. On sign-out: Clerk clears session → user is redirected to /sign-in
```

---

## 7. Role-Based Routing

After authentication, the system checks `users.system_role` from the DB:

| system_role | Routed To |
|-------------|-----------|
| `MANAGER` | Manager Command Center (Capacity Heatmap, Squads, Dev Hub, Blockers, Templates) |
| `DEVELOPER` | Personal Workspace (Overview, My Tasks Kanban, My Analytics, Work Logs, Stopwatch) |

---

## 8. Sign-In Page

```js
// src/app/sign-in/[[...sign-in]]/page.js
'use client'
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <SignIn />
    </main>
  );
}
```

The `[[...sign-in]]` catch-all segment handles all Clerk sign-in sub-routes (OAuth callbacks, MFA, etc.).

---

## 9. Root Layout (ClerkProvider)

```js
// src/app/layout.js
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

`ClerkProvider` must wrap the entire app to give all components access to Clerk context.

---

## 10. Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...   # Frontend (browser-visible)
CLERK_SECRET_KEY=sk_test_...                     # Backend-only (never expose)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

---

## 11. Database Link

The `clerk_id` column on the `users` table links Clerk identity to the internal user profile:

```sql
CREATE TABLE workdash.users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id   VARCHAR(255) NOT NULL UNIQUE,  -- e.g. "user_2abc123..."
  ...
);
CREATE INDEX idx_users_clerk_id ON workdash.users(clerk_id);
```

---

## 12. How to Implement auth.controller.js

```js
// src/modules/auth/auth.controller.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { findUserByClerkId } from "./auth.repository.js";

export async function getMeController(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await findUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("[auth/me]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## 13. How to Implement auth.repository.js

```js
// src/modules/auth/auth.repository.js
import pool from "@/lib/db";

export async function findUserByClerkId(clerkId) {
  const result = await pool.query(
    "SELECT * FROM users WHERE clerk_id = $1",
    [clerkId]
  );
  return result.rows[0] ?? null;
}
```

---

## 14. Testing

### Manual Tests (curl / Postman)

```bash
# Must be called with a valid Clerk session cookie
# In browser: navigate to http://localhost:3000/api/auth/me after sign-in

# Unauthenticated test (no cookie):
curl http://localhost:3000/api/auth/me
# Expected: 401 Unauthorized

# Health check (no auth needed):
curl http://localhost:3000/api/health
# Expected: 200 with DB status
```

### Unit Test Skeleton

```js
// auth.service.test.js
import { findUserByClerkId } from "./auth.repository.js";
import pool from "@/lib/db";

jest.mock("@/lib/db");

test("returns user when clerk_id matches", async () => {
  pool.query.mockResolvedValueOnce({
    rows: [{ id: "uuid-1", clerk_id: "user_abc", full_name: "Alex Chen" }]
  });
  const user = await findUserByClerkId("user_abc");
  expect(user.full_name).toBe("Alex Chen");
});

test("returns null when clerk_id not found", async () => {
  pool.query.mockResolvedValueOnce({ rows: [] });
  const user = await findUserByClerkId("user_nonexistent");
  expect(user).toBeNull();
});
```
