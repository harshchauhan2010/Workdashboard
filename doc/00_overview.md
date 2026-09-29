# WorkDashboard — Project Overview & Architecture

> **Internal Engineering Operations Platform**
> Stack: **Next.js 16 (App Router)** · **Clerk Auth** · **PostgreSQL 15+** (schema `workdash`) · **React 19**

---

## 1. What Is This Project?

WorkDashboard is a single-company internal engineering operations platform. It gives:

- **Managers** — a Command Center: capacity heatmap, squads hub, developer hub, blocker registry, task templates.
- **Developers** — a Personal Workspace: Kanban board, my analytics, work logs, live stopwatch timer.

There are **no external clients**, **no billing**, and **no SLA tracking**. All work is owned by **Squads** (engineering pods A–F).

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.3.5 |
| Language | JavaScript (ES Modules) | — |
| Authentication | Clerk | ^7.9.2 |
| Database | PostgreSQL | 15+ |
| DB Client | node-postgres (pg) | ^8.23.0 |
| Webhook Verification | svix | ^2.5.0 |
| Styling | Tailwind CSS v4 | ^4 |
| React | React + React DOM | 19.2.8 |

---

## 3. Project Directory Structure

```
d:/p1_workdashboard/
├── src/
│   ├── app/                        ← Next.js App Router pages & API routes
│   │   ├── layout.js               ← Root layout (ClerkProvider wraps all)
│   │   ├── page.js                 ← Home page (protected, shows Clerk user)
│   │   ├── globals.css             ← Global styles
│   │   ├── sign-in/[[...sign-in]]/ ← Clerk sign-in page
│   │   ├── sign-up/[[...sign-up]]/ ← Clerk sign-up page
│   │   └── api/
│   │       ├── health/route.js     ← GET /api/health (DB diagnostic)
│   │       ├── auth/me/route.js    ← GET /api/auth/me (current user)
│   │       └── users/route.js      ← GET /api/users (user list)
│   ├── lib/
│   │   └── db.js                   ← PostgreSQL connection pool (global singleton)
│   ├── modules/                    ← Business logic — layered architecture
│   │   ├── auth/                   ← Auth module
│   │   ├── users/                  ← Users module
│   │   ├── squads/                 ← Squads module
│   │   ├── squad-members/          ← Squad membership module
│   │   ├── tasks/                  ← Tasks module
│   │   ├── assignments/            ← Task assignments module
│   │   ├── work-logs/              ← Work log/timesheet module
│   │   ├── blockers/               ← Task blockers module
│   │   ├── blocker-presets/        ← Blocker preset chips module
│   │   ├── timers/                 ← Active timer/stopwatch module
│   │   ├── task-templates/         ← Task blueprint templates module
│   │   ├── recurring-routines/     ← Recurring schedule module
│   │   ├── capacity/               ← Capacity engine module
│   │   └── planning-periods/       ← Planning calendar module
│   ├── middleware/                 ← (reserved — currently empty)
│   ├── constant/                   ← (reserved — currently empty)
│   └── proxy.js                    ← Clerk middleware (auth guard on all routes)
├── Refference/
│   ├── database.md                 ← Full DB schema reference
│   ├── postgresql.sql              ← Full SQL DDL + seed script
│   ├── index.html                  ← Reference UI prototype
│   ├── app.js                      ← Reference app logic
│   ├── styles.css                  ← Reference styles
│   └── Workdashboard.png           ← UI mockup screenshot
├── migrate.js                      ← Migration runner (node migrate.js)
├── .env.local                      ← Environment variables
├── next.config.mjs                 ← Next.js config (React Compiler enabled)
└── doc/                            ← THIS DOCUMENTATION FOLDER
```

---

## 4. Layered Architecture (Per Module)

Every module follows a strict 4-layer pattern:

```
API Route (src/app/api/.../route.js)
        ↓  calls
Controller  (modules/xxx/xxx.controller.js)  ← HTTP parsing, response formatting
        ↓  calls
Service     (modules/xxx/xxx.service.js)     ← Business logic, validation orchestration
        ↓  calls
Repository  (modules/xxx/xxx.repository.js)  ← Raw SQL queries via pool
        ↓  uses
db.js (src/lib/db.js)                        ← PostgreSQL connection pool
```

Validators (xxx.validator.js) are used by Controllers before calling Services.

---

## 5. Authentication Flow Summary

```
Browser → /sign-in → Clerk UI → Clerk verifies credentials
      → Clerk session cookie set
      → Next.js middleware (proxy.js) checks session on every request
      → Protected page: auth() called server-side → redirects if no userId
      → API routes: auth() extracts userId → clerk_id used to look up DB user row
```

Role routing:
- system_role = MANAGER → Manager Command Center
- system_role = DEVELOPER → Personal Developer Workspace

---

## 6. Database Summary

- Schema: workdash (search_path forced on every connection)
- Database: workdashboard (PostgreSQL, local port 5432)
- 12 Core Tables: users, planning_periods, squads, squad_members, tasks,
  task_assignments, work_logs, task_blockers, task_templates, blocker_presets,
  active_timers, recurring_routines
- 3 Views: v_developer_capacity_summary, v_squad_capacity_summary, v_active_blockers_registry
- 4 Triggers: auto-sync logged_hours, is_blocked, completed_at, updated_at

---

## 7. Documentation Index

| File | Module |
|------|--------|
| 01_auth.md | Auth (Clerk integration) |
| 02_users.md | Users (profiles, role routing) |
| 03_squads.md | Squads (engineering pods) |
| 04_squad-members.md | Squad Members (allocations) |
| 05_tasks.md | Tasks (Kanban, workload types) |
| 06_assignments.md | Task Assignments (split modes) |
| 07_work-logs.md | Work Logs (timesheets) |
| 08_blockers.md | Task Blockers (impediment registry) |
| 09_blocker-presets.md | Blocker Presets (quick chips) |
| 10_timers.md | Active Timers (stopwatch) |
| 11_task-templates.md | Task Templates (blueprints) |
| 12_recurring-routines.md | Recurring Routines (overhead) |
| 13_capacity.md | Capacity Engine (heatmap math) |
| 14_planning-periods.md | Planning Periods (calendar cycles) |
| 15_database.md | Full Database Schema and Triggers |
| 16_testing.md | Testing Guide (all modules) |
| 17_mockup-ui.md | UI Mockup and Screen Reference |

---

## 8. Environment Variables Required

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/workdashboard
```

---

## 9. Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up .env.local (see above)

# 3. Create DB and run schema
node migrate.js

# 4. Start dev server
npm run dev

# 5. Verify DB connection
open http://localhost:3000/api/health
```
