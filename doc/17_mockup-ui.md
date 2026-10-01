# WorkDashboard — UI Mockup & Screen Component Reference

> **Reference Prototype:** `Refference/index.html` · `Refference/styles.css` · `Refference/app.js` · `Refference/Workdashboard.png`

---

## 1. UI Design System & Aesthetic Tokens

WorkDashboard is designed with a sleek, modern, enterprise dark theme featuring glassmorphism, glowing status badges, and responsive widgets.

### 1.1 Color Palette & Tokens

| Token | Hex / Style | Purpose |
|-------|-------------|---------|
| Background Base | `#090d16` | Main application backdrop |
| Card / Panel Glass | `rgba(17, 24, 39, 0.7)` with `backdrop-blur-md` | Container panels, modals, drawers |
| Primary Accent | `#3b82f6` (Blue / Indigo) | Action buttons, active tabs |
| Optimal Status | `#10b981` (Emerald / Green) | Utilization 0–70%, Resolved blockers |
| High Load Status | `#f59e0b` (Amber / Yellow) | Utilization 71–90%, Major impediments |
| Danger / Overbooked | `#f43f5e` (Rose / Red) | Utilization > 100%, Critical blockers |
| Typography | `Inter, -apple-system, sans-serif` | Clean, high-density legibility |

---

## 2. Screen Architecture & Role Views (Auth & Database-Driven)

```
                        ┌───────────────────────────────┐
                        │   WorkDashboard Top Navbar    │
                        │ [Logo] [Sprint Picker] [User] │
                        └───────────────┬───────────────┘
                                        │ (Auto-routed by db user.system_role)
             ┌──────────────────────────┴──────────────────────────┐
             ▼ (If system_role === 'MANAGER')                      ▼ (If system_role === 'DEVELOPER')
┌─────────────────────────┐                             ┌─────────────────────────┐
│ Manager Command Center  │                             │   Developer Workspace   │
├─────────────────────────┤                             ├─────────────────────────┤
│ • Capacity Heatmap      │                             │ • Personal Workload Bar │
│ • Squads & Teams Hub    │                             │ • Interactive Kanban    │
│ • Blocker Registry      │                             │ • Live Stopwatch Widget │
│ • Task Templates Lib    │                             │ • Blocker Report Modal  │
│ • Sprint Planning View  │                             │ • Timesheets & Work Logs│
└─────────────────────────┘                             └─────────────────────────┘
```

---

## 3. Manager Command Center Screens

### 3.1 Capacity Heatmap View (`#tab-content-capacity`)
- **Visual Structure**: Grid of developer capacity cards organized by Squad or sorted by utilization %.
- **Developer Card Elements**:
  - Avatar, Name, Role title.
  - Weekly Capacity gauge (e.g. `38.5h / 40.0h`).
  - Stacked Progress Bar: Recurring (Slate) + Pre-Planning (Blue) + Ad-Hoc (Amber).
  - Status Badge: `UNDERLOADED` (Green), `OPTIMAL` (Cyan), `HEAVY` (Amber), `OVERBOOKED` (Red).
  - Quick action: Click to open Developer Profile Drawer with task breakdown.

### 3.2 Squads Hub View (`#tab-content-squads`)
- **Squad Cards**: 6 Pods (Alpha through Foxtrot).
- **Metrics on Card**: Total engineers, focus domain badge, aggregate capacity (e.g., `142h / 160h`), active blockers counter.
- **Roster List**: Avatars of assigned developers with Lead indicator.

### 3.3 Active Blockers Registry View (`#tab-content-blockers`)
- **Impediments Table / List**:
  - Severity badge: `CRITICAL BLOCKER`, `MAJOR IMPEDIMENT`, `MINOR DELAY`.
  - Task Title & Squad Code (e.g. `[ALPHA] Payment Gateway Timeout`).
  - Blocked Engineer & timestamp.
  - Business impact & mitigation notes.
  - Manager Action button: "Resolve Blocker" modal.

### 3.4 Task Templates Library (`#tab-content-templates`)
- **Blueprint Cards**: Categorized by `DEVELOPMENT`, `BUG_FIX`, `INFRASTRUCTURE`, `TESTING_QA`.
- **1-Click Quick Instantiate**: Creates task pre-filled with hours estimate, title format, and priority.
- **Manager Actions**: "New Template Blueprint" button to add custom templates.

---

## 4. Developer Workspace Screens

### 4.1 Personal Workload Summary (`#dev-capacity-summary`)
- Top metric banner showing developer's current sprint status:
  - Weekly Capacity: `40.0 hrs`
  - Recurring Commitments: `5.5 hrs` (Standups, Reviews)
  - Assigned Planned Work: `24.0 hrs`
  - Emergency / Ad-Hoc: `4.0 hrs`
  - Available Buffer: `6.5 hrs` (16.2% bandwidth remaining)

### 4.2 Interactive Kanban Board (`#dev-kanban-board`)
- **4 Columns**:
  1. `TODO`
  2. `IN_PROGRESS`
  3. `IN_REVIEW`
  4. `COMPLETED`
- **Task Cards**:
  - Task Title, Category pill, Squad badge.
  - Priority indicator (`P0` Urgent to `P3` Low).
  - Estimated hours vs Logged hours bar.
  - Blocked Alert Banner (if `is_blocked = true`).
  - Action buttons: "Start Timer", "Report Blocker", "Move to Review", "Complete".

### 4.3 Live Stopwatch Timer (`#dev-timer-widget`)
- Persistent floating or docked timer bar:
  - Active Task Title display.
  - Elapsed Time Counter: `HH:MM:SS` (live tick).
  - Control Buttons:
    - **Pause** / **Resume**
    - **Log & Stop** (opens modal to review hours and submit work notes)
  - Auto-pause behavior when task is blocked.

### 4.4 Blocker Report Modal (`#modal-report-blocker`)
- **1-Click Preset Chips**:
  - `[API Keys Missing]` `[Database Lag]` `[PR Review Stuck]` `[CI/CD Failure]` `[Vendor Outage]`
- Clicking a chip auto-fills:
  - Category & Severity.
  - Reason description template.
  - Business impact template.
  - Mitigation recommendation.
- Submit button triggers `POST /api/blockers`.

---

## 5. UI Component Hierarchy & File Mapping

| UI Section | Prototype Selector (`index.html`) | Next.js Component Location (Planned) |
|------------|-----------------------------------|--------------------------------------|
| App Header & Navigation | `#app-header` | `src/components/layout/Navbar.jsx` |
| Manager Heatmap | `#tab-content-capacity` | `src/components/manager/CapacityHeatmap.jsx` |
| Squads Hub | `#tab-content-squads` | `src/components/manager/SquadsHub.jsx` |
| Blockers Registry | `#tab-content-blockers` | `src/components/manager/BlockerRegistry.jsx` |
| Task Templates | `#tab-content-templates` | `src/components/manager/TemplateLibrary.jsx` |
| Developer Kanban | `#dev-kanban-board` | `src/components/developer/KanbanBoard.jsx` |
| Live Stopwatch Widget | `#dev-timer-display` | `src/components/developer/ActiveTimer.jsx` |
| Blocker Report Modal | `#modal-report-blocker` | `src/components/modals/ReportBlockerModal.jsx` |
| Log Time Modal | `#modal-log-time` | `src/components/modals/LogTimeModal.jsx` |
