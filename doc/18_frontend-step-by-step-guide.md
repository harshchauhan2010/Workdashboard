# WorkDashboard — Frontend Vibe Coding Master Guide & Step-by-Step Execution Plan

> **Target Audience:** Vibe Coder / Product Builder  
> **Reference Prototype:** `Refference/index.html` · `Refference/styles.css` · `Refference/app.js` · `doc/17_mockup-ui.md`  
> **Backend State:** Fully completed REST API endpoints with Next.js App Router, Clerk Auth, and PostgreSQL.

---

## 🧭 1. The Vibe Coding Mental Model for Frontend

Building a large, enterprise-grade frontend with AI (Vibe Coding) is all about **modular step-by-step layering**. 

```
┌────────────────────────────────────────────────────────────────────────┐
│  LEVEL 4: Role Dashboards (Manager Hubs vs Developer Kanban/Workspace) │
├────────────────────────────────────────────────────────────────────────┤
│  LEVEL 3: Modals, Overlays & Command Palette (⌘K, Timer, Blocker, etc) │
├────────────────────────────────────────────────────────────────────────┤
│  LEVEL 2: Shared UI Widgets (Capacity Bars, KPI Cards, Status Badges)  │
├────────────────────────────────────────────────────────────────────────┤
│  LEVEL 1: App Shell & Global State (Navbar, Sidebar, AppContext, Toast)│
└────────────────────────────────────────────────────────────────────────┘
```

### The 3 Golden Rules of Frontend Vibe Coding:
1. **Never build the whole frontend in one prompt**: Large monolithic files become unmaintainable and buggy. Instead, build **one self-contained component/tab at a time**.
2. **Design First, Connect Second (or Mock First, Wire Second)**: Build the pixel-perfect UI component with visual dummy props first, verify it matches `Refference/index.html`, and then wire it to `api-client.js`.
3. **Keep Role Logic Clean**: The manager sees **macro team metrics & capacity controls**; the developer sees **micro personal execution & live timer kanban**. Use role-based component switching.

---

## 🏛️ 2. Architectural Blueprint: Manager vs. Developer Views

The application detects the user's role from `currentUser.system_role` (fetched from `/api/auth/me` via `AppContext`).

```
                              ┌───────────────────────────────┐
                              │     WorkDashboard Top Shell   │
                              │ [Logo] [Sprint Picker] [User] │
                              └───────────────┬───────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
     ┌─────────────────────────────┐                     ┌─────────────────────────────┐
     │      MANAGER DASHBOARD      │                     │     DEVELOPER DASHBOARD     │
     ├─────────────────────────────┤                     ├─────────────────────────────┤
     │ 📊 1. Capacity Heatmap      │                     │ 🎯 1. Overview & Load Bar   │
     │ 👥 2. Squads / Teams Hub    │                     │ 📋 2. Interactive Kanban    │
     │ 👤 3. Engineer 360° View    │                     │ ⏱️ 3. Live Stopwatch Tracker│
     │ 🚨 4. Blockers & Risks Hub  │                     │ 📈 4. Personal Analytics    │
     │ 📑 5. Task Templates Lib    │                     │ 📝 5. Work Logs & History   │
     │ 🏢 6. Client Projects Hub   │                     │ 🚨 6. Report Blocker Modal  │
     └─────────────────────────────┘                     └─────────────────────────────┘
```

---

## 🗂️ 3. Recommended Frontend Directory Structure

Create clean, modular directories under `src/components/`:

```
src/
├── app/
│   ├── layout.js              # Global font, metadata, Toast & AppProvider wrapper
│   ├── page.js                # Main dynamic switcher (renders Manager or Developer dashboard)
│   ├── globals.css            # Dark/light theme design system tokens & glassmorphism
│   └── (routes... /api, /sign-in, etc.)
├── context/
│   ├── AppContext.jsx         # User auth profile, current sprint/period, role flags
│   ├── TimerContext.jsx       # Running timer state, stopwatch tick, persist in localStorage
│   └── ToastContext.jsx       # Notifications & toast alerts
├── hooks/
│   ├── useCapacity.js         # Fetch & compute squad/engineer capacity metrics
│   ├── useTasks.js            # Fetch tasks, update kanban column, filter
│   ├── useBlockers.js         # Fetch active blockers, resolve blockers
│   └── useSquads.js           # Fetch squads, members, project codes
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx         # Logo, Sprint Selector, Role Badge, ⌘K trigger, User profile
│   │   ├── ManagerSidebar.jsx # Manager navigation & org capacity footer
│   │   ├── DeveloperSidebar.jsx # Developer navigation & personal load footer
│   │   └── CommandPalette.jsx # ⌘K instant search for tasks, engineers, squads
│   ├── shared/
│   │   ├── CapacityBar.jsx    # Stacked visual bar (Recurring + Planned + Ad-hoc + Free)
│   │   ├── StatusBadge.jsx    # Optimal (Green), Heavy (Amber), Overbooked (Red)
│   │   ├── PriorityPill.jsx   # P0 Urgent, P1 High, P2 Med, P3 Low
│   │   ├── BlockerBanner.jsx  # Glowing red/amber impediment banner
│   │   └── Modal.jsx          # Accessible glassmorphism modal dialog
│   ├── manager/
│   │   ├── CapacityHeatmap.jsx# 50+ developer grid with filters & utilization sort
│   │   ├── SquadsHub.jsx      # Squad cards with aggregates & lead badges
│   │   ├── Engineer360View.jsx# Deep dive drawer for individual engineer workload
│   │   ├── BlockerRegistry.jsx# Impediments table with 1-click Resolve modal
│   │   ├── TemplatesLibrary.jsx# Reusable blueprint cards with 1-click instantiate
│   │   └── ProjectsHub.jsx    # Client budget & burn rates
│   └── developer/
│       ├── DevOverview.jsx    # Top workload summary banner & today's priorities
│       ├── KanbanBoard.jsx    # 4 columns (TODO, IN_PROGRESS, IN_REVIEW, COMPLETED)
│       ├── TaskCard.jsx       # Card with timer trigger, blocker tag, move buttons
│       ├── BlockerModal.jsx   # Modal with presets (API Down, Missing Spec, etc.)
│       ├── DevAnalytics.jsx   # Weekly hours distribution chart & velocity
│       └── WorkLogHistory.jsx # Timesheets, logged sessions, edit hours
```

---

## 🚀 4. Phase-by-Phase Execution Plan

Follow these phases sequentially. Each phase is self-contained.

---

### 🎨 Phase 1: Design System & Application Shell
**Goal:** Create the core wrapper layout, navigation, and role-based shell switching.

1. **Step 1.1 — Theme & Typography Setup**:
   - Ensure `globals.css` includes the colors from `Refference/styles.css` (Background `#090d16` or sleek slate dark, cards with `backdrop-blur-md`, custom scrollbars, Inter and Sora fonts).
2. **Step 1.2 — Top Navbar Component (`src/components/layout/Navbar.jsx`)**:
   - WorkDashboard Logo with live pulse status.
   - **Sprint Selector Dropdown**: Connected to `AppContext` (`currentPeriod` / `allPeriods`).
   - **Global Search Button (⌘K)**.
   - **Role Badge**: Shows `MANAGER COMMAND CENTER` or `DEVELOPER WORKSPACE`.
   - **Clerk User Profile Dropdown**.
3. **Step 1.3 — Dynamic Sidebar (`ManagerSidebar.jsx` & `DeveloperSidebar.jsx`)**:
   - **Manager Sidebar**: Links to Capacity, Squads Hub, Engineer 360°, Blockers, Templates, Projects + Org Capacity footer gauge.
   - **Developer Sidebar**: Links to Overview, My Tasks, Analytics, Work Logs + Personal weekly load footer gauge.
4. **Step 1.4 — Main Dashboard Page Router (`src/app/page.js`)**:
   - Replace the current test screen in `src/app/page.js`.
   - Load `AppContext`:
     - If loading: Render high-end skeleton loader.
     - If `currentUser.system_role === 'MANAGER'`: Render `<ManagerDashboard />`.
     - If `currentUser.system_role === 'DEVELOPER'`: Render `<DeveloperDashboard />`.

---

### 🧩 Phase 2: Core Shared UI Widgets
**Goal:** Build the reusable building blocks used across both Manager and Developer screens.

1. **Step 2.1 — Multi-Segment Capacity Bar (`src/components/shared/CapacityBar.jsx`)**:
   - Visualizes 4 slices: `Recurring Hours` (Slate), `Planned Tasks` (Blue), `Ad-Hoc / Emergency` (Amber), `Free Buffer` (Green / Dark).
   - Shows total hours (e.g. `38.5h / 40.0h`) and percentage (`96.2%`).
2. **Step 2.2 — Status Badges & Priority Pills (`src/components/shared/StatusBadge.jsx`)**:
   - Utilization Badges: `UNDERLOADED` (<70%), `OPTIMAL` (70-90%), `HEAVY` (90-100%), `OVERBOOKED` (>100%).
   - Priority Pills: `P0 - CRITICAL`, `P1 - HIGH`, `P2 - MEDIUM`, `P3 - LOW`.
3. **Step 2.3 — Blocker Alert Pill & Banner (`src/components/shared/BlockerBanner.jsx`)**:
   - Visual alert badge with pulsating indicator for blocked tasks.

---

### 💻 Phase 3: Developer Dashboard (The Developer Workspace)
**Goal:** Enable engineers to manage daily sprint tasks, track live time with stopwatch, report blockers, and view weekly bandwidth.

1. **Step 3.1 — Workload Banner (`src/components/developer/DevOverview.jsx`)**:
   - Banner displaying:
     - Total Weekly Capacity: `40.0 hrs`
     - Recurring Commitments: `5.5 hrs` (Standups, Syncs)
     - Assigned Sprint Work: `24.0 hrs`
     - Available Buffer: `10.5 hrs free`
   - Active running stopwatch widget if a timer is active.
2. **Step 3.2 — Interactive Kanban Board (`src/components/developer/KanbanBoard.jsx`)**:
   - 4 Columns: `TODO` · `IN_PROGRESS` · `IN_REVIEW` · `COMPLETED`.
   - Fetch developer's tasks from `/api/tasks?assignee_id=${currentUser.id}&planning_period_id=${currentPeriod.id}`.
   - Task Card displays: Title, category pill, squad tag, estimated vs logged hours, priority.
   - Quick Actions:
     - **Start / Stop Timer**: Connects to `TimerContext`.
     - **Report Blocker**: Opens Blocker Modal.
     - **Move Status**: Dropdown or 1-click arrow to advance to next column.
3. **Step 3.3 — Live Stopwatch Widget & Log Hours Modal**:
   - When a developer clicks "Start Timer" on a task:
     - Timer starts in `TimerContext` (persists on page refresh).
     - Global navbar/card indicates active timing.
   - When stopping: Modal appears asking to verify logged duration, add notes, and save via `POST /api/work-logs`.
4. **Step 3.4 — Blocker Reporting Modal (`src/components/developer/BlockerModal.jsx`)**:
   - Fetch presets from `/api/blocker-presets` (e.g., "Waiting on Backend API", "Figma Design Incomplete", "3rd Party Outage").
   - Form inputs: Severity (`CRITICAL`, `MAJOR`, `MINOR`), Description, Impact.
   - Submits `POST /api/blockers` and automatically marks task `is_blocked = true`.
5. **Step 3.5 — Work Logs & Deadlines History (`src/components/developer/WorkLogHistory.jsx`)**:
   - Table of all work logs for the current sprint.
   - Ability to manually add past hours or edit log descriptions.

---

### 👔 Phase 4: Manager Command Center
**Goal:** Give managers full visibility over all 50 developers, 6 squads, capacity bottlenecks, blockers, and sprint templates.

1. **Step 4.1 — Capacity Heatmap (`src/components/manager/CapacityHeatmap.jsx`)**:
   - Fetch capacity data from `/api/capacity?planning_period_id=${currentPeriod.id}`.
   - Grid of Developer Cards:
     - Developer Avatar, Name, Role title.
     - Stacked Capacity Progress Bar.
     - Status badge (`OPTIMAL`, `OVERBOOKED`, etc.).
     - Filter toolbar: Filter by Squad (Squad A–F), Search by name, Filter by Overbooked/Underloaded.
     - Click developer card -> Opens **Engineer 360° Drawer**.
2. **Step 4.2 — Teams & Squads Hub (`src/components/manager/SquadsHub.jsx`)**:
   - 6 Squad Pod Cards (Alpha, Beta, Gamma, Delta, Echo, Foxtrot).
   - Shows: Total engineers assigned, focus domain, aggregate sprint capacity (e.g. `142h / 160h`), active blockers counter.
   - Roster list with Lead indicators.
   - "Create Squad" or "Reassign Member" actions.
3. **Step 4.3 — Active Blockers & Risks Registry (`src/components/manager/BlockerRegistry.jsx`)**:
   - Table of all active blockers fetched from `/api/blockers?status=ACTIVE`.
   - Ranked by severity (`CRITICAL BLOCKER` on top).
   - Displays: Task title, blocked engineer, squad, created timestamp, business impact.
   - Manager Action: **"Resolve Blocker"** button -> calls `PATCH /api/blockers/:id/resolve` with resolution notes.
4. **Step 4.4 — Task Templates Library (`src/components/manager/TemplatesLibrary.jsx`)**:
   - Fetch blueprints from `/api/task-templates`.
   - Cards grouped by category: `DEVELOPMENT`, `BUG_FIX`, `INFRASTRUCTURE`, `TESTING_QA`.
   - **1-Click "Instantiate to Sprint"**: Creates task with pre-filled title, hours estimate, and assigns to selected engineer.
   - "New Template" modal to create reusable org blueprints.
5. **Step 4.5 — Engineer 360° View & Schedule Search**:
   - Deep inspection of a single engineer:
     - All assigned tasks.
     - Recurring weekly routines (Daily standup, PR reviews).
     - Historical work logs and capacity timeline.
     - Rebalance work / adjust weekly capacity hours.

---

### ⚡ Phase 5: Overlays, Quick Actions & Command Palette (⌘K)
**Goal:** Enhance workflow speed with global shortcuts and unified search.

1. **Step 5.1 — Command Palette (⌘K / Ctrl+K)**:
   - Instant search modal across all developers, squads, and tasks.
   - Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`).
2. **Step 5.2 — Create Task Modal**:
   - Global modal accessible from navbar or floating "+" button to quickly assign a task to any squad or developer.

---

## 🤖 5. Vibe Coding Prompt Playbook (Copy-Paste Prompts for AI)

When you are ready to build each step, you can give me these exact prompt instructions:

### Prompt for Phase 1 (Layout & Shell):
> *"Let's build Phase 1: The App Shell. Create the Top Navbar, Manager Sidebar, and Developer Sidebar matching the dark glassmorphism design in `Refference/index.html`. Connect the Top Navbar to `AppContext` for the Sprint Selector and user role badge. In `src/app/page.js`, conditionally render the Manager or Developer dashboard based on `currentUser.system_role`."*

### Prompt for Phase 2 (Shared Widgets):
> *"Let's build Phase 2: Shared UI Widgets. Create `CapacityBar.jsx` (with multi-segment recurring, planned, ad-hoc, free hours), `StatusBadge.jsx` (underloaded, optimal, overbooked), and `PriorityPill.jsx` (P0 to P3). Make sure styling matches `Refference/styles.css`."*

### Prompt for Phase 3 (Developer Kanban & Timer):
> *"Let's build Phase 3: The Developer Dashboard. Create `KanbanBoard.jsx` with 4 columns (TODO, IN_PROGRESS, IN_REVIEW, COMPLETED) fetched from `/api/tasks`. Add task cards with priority badges, estimated vs logged hours, timer start/stop button connected to `TimerContext`, and a Blocker Reporting Modal using `/api/blocker-presets`."*

### Prompt for Phase 4 (Manager Capacity Heatmap & Squads):
> *"Let's build Phase 4: Manager Capacity Heatmap & Squads Hub. Create `CapacityHeatmap.jsx` fetching from `/api/capacity` with search, squad filtering, and utilization color coding. Create `SquadsHub.jsx` showing the 6 squad cards with aggregated capacity and active blockers count."*

---

## 📋 6. Summary Checklist

| Phase | Component | Backend API Connected | Status |
|---|---|---|---|
| **1. Shell** | Navbar + Sprint Selector | `GET /api/planning-periods`, `GET /api/auth/me` | 🟡 Ready to start |
| **1. Shell** | Dynamic Sidebar & Page Router | `AppContext (system_role)` | 🟡 Ready to start |
| **2. Widgets** | CapacityBar & Badges | Reusable component logic | 🟡 Ready to start |
| **3. Developer** | Workload Banner & Kanban Board | `GET /api/tasks`, `PATCH /api/tasks/:id` | 🟡 Ready to start |
| **3. Developer** | Stopwatch Timer & Work Logger | `TimerContext`, `POST /api/work-logs` | 🟡 Ready to start |
| **3. Developer** | Blocker Modal & Presets | `GET /api/blocker-presets`, `POST /api/blockers` | 🟡 Ready to start |
| **4. Manager** | Capacity Heatmap Grid | `GET /api/capacity` | 🟡 Ready to start |
| **4. Manager** | Squads Hub & Pod Cards | `GET /api/squads`, `GET /api/squad-members` | 🟡 Ready to start |
| **4. Manager** | Blocker Registry & Resolver | `GET /api/blockers`, `PATCH /api/blockers/:id/resolve` | 🟡 Ready to start |
| **4. Manager** | Templates Library & Quick Creator | `GET /api/task-templates`, `POST /api/tasks` | 🟡 Ready to start |
| **5. Overlays** | Command Palette (⌘K) & Search | Global index / search | 🟡 Ready to start |

---
*Created for WorkDashboard Engineering Team.*
