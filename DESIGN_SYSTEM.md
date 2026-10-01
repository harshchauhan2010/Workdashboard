# 🏛️ WorkDashboard Design System & Mockup UI Specifications (v5.0)

> **Single Source of Truth** for all UI layouts, typography, exact colors, spacing, dimensions, modals, cards, badges, and backend integration rules.  
> Refer directly to this file for any design or frontend development task to ensure 100% fidelity with the reference mockup UI without re-reading large asset bundles.

---

## 🎨 1. Core Visual Philosophy & Design Tokens

### **1.1 The "Ledger" Aesthetic**
* **Theme**: Warm-neutral paper canvas with crisp ink typography and deep ink-teal primary accents.
* **Canvas Background**: `#F8F7F4` (subtle gradient `#F8F8F8` to `#F7F7F7`).
* **Surfaces / Cards**: `#ffffff` with warm subtle borders (`#E7E3DA` / `#EBE7E0` / `#F0EDE7`).
* **Text / Ink**: Primary `#201C17`, Secondary `#4A4239`, Muted `#667785`, Tertiary `#98A7B3`.

### **1.2 Typography Hierarchy**
* **Display / Headings**: `'Sora', 'Inter', sans-serif` (`--font-display`)
  * H1: `28px - 32px`, font-weight `700`, tracking `-0.035em`
  * H2: `20px - 22px`, font-weight `700`, tracking `-0.025em`
  * H3 / Modal Title: `17px`, font-weight `700`, tracking `-0.02em`
* **Body / UI Elements**: `'Inter', sans-serif` (`--font-sans`)
  * Body Text: `13px - 14px`, font-weight `500` / `600`, line-height `1.5`
  * Subtext / Meta: `11px - 12px`, font-weight `500`, color `#667785` or `#98A7B3`
* **Data / Form Labels / Numbers**: `'JetBrains Mono', monospace` (`--font-mono`)
  * **Form Labels**: `10px`, font-weight `700` or `800`, tracking `0.08em` to `0.1em`, `text-transform: uppercase`, color `#667785`
  * **KPI Values**: `28px - 30px`, font-weight `700`, tracking `-0.04em`
  * **Tabular Metrics / Badges**: `10px - 11px`, font-weight `600` / `700`

### **1.3 Color Palette (Exact Hex Codes)**

| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#F8F7F4` / `#F7F6F5` | Main viewport & page background |
| **Surface Card** | `#FFFFFF` | Card & modal background |
| **Surface Muted** | `#FAFAFA` / `#FDFDFC` | Input backgrounds & inner container wells |
| **Border Subtle** | `#F3F2F0` / `#F1EFEB` | Modal header/footer dividers, card separators |
| **Border Default** | `#E7E3DA` / `#EBE7E0` | Standard inputs, selects, and card outlines |
| **Border Hover/Focus**| `#85B4DB` / `#D0CABE` | Interactive input hover/focus rings |
| **Primary Brand Blue**| `#285691` / `#428CC8` | Primary buttons, active nav items, key badges |
| **Primary Blue Hover**| `#1F4373` / `#3378B1` | Button hover state |
| **Primary Blue Light**| `#EEF3FB` / `#F0F5FA` | Active nav background, selected card wells |
| **Success Forest Green**| `#326A45` / `#166534` | Under-capacity, completed tasks, buffer badges |
| **Success Subtle** | `#DCFCE7` / `#EEF6F0` | Free buffer badge backgrounds (`2.5h free`) |
| **Danger Rose / Brick**| `#BE123C` / `#883828` | Capacity breach, blocker critical, overbooking |
| **Danger Subtle** | `#FFE4E6` / `#FFF5F5` | Overcapacity pill background, error notices |
| **Warning Gold / Amber**| `#8F5D24` / `#92400E` | High workload warning, medium blocker risks |
| **Warning Subtle** | `#FEF3C7` / `#FBF3E7` | 90%+ squad load badge background |
| **Indigo / Squad Brand**| `#4338CA` / `#6366F1` | Team/Squad hub headers, pod metrics, team assignments |
| **Indigo Subtle** | `#EEF2FF` / `#F5F7FF` | Squad card container wells, squad load badges |

---

## 🪟 2. Universal Modal Specifications

All dialogs and modals in the application share a strictly standardized container geometry and styling:

```css
/* Modal Overlay */
position: fixed;
inset: 0;
z-index: 9999;
display: flex;
align-items: center;
justify-content: center;
padding: 16px;
background: rgba(32, 27, 23, 0.58);
backdrop-filter: blur(10px) saturate(115%);
-webkit-backdrop-filter: blur(10px) saturate(115%);

/* Modal Container */
width: min(700px, calc(100vw - 32px));
max-width: 700px; /* Task modal: 700-760px; Dev modal: 660px; Squad modal: 700px */
height: min(760px, calc(100vh - 32px));
min-height: min(740px, calc(100vh - 40px));
max-height: min(760px, calc(100vh - 32px));
background: #ffffff;
border-radius: 22px;
border: 1px solid rgba(231, 227, 218, 0.95);
box-shadow: 0 28px 80px rgba(32, 27, 23, 0.24);
overflow: hidden;
display: flex;
flex-direction: column;
```

### **2.1 Modal Anatomy**
1. **Header (`flex-shrink: 0`)**:
   - Padding: `22px 26px 18px`
   - Border bottom: `1px solid #F3F2F0`
   - Icon Box: `40px × 40px`, `border-radius: 12px`, background `#F7F7F6`, icon color `#428CC8`, font-size `17px`
   - Title: `17px`, Sora, font-weight `700`, color `#201C17`
   - Subtitle: `11px`, JetBrains Mono, color `#98A7B3`, line-height `1.35`, margin-top `3px`
   - Close Button: `32px × 32px`, `border-radius: 10px`, background `#FAFAFA`, hover `#F0EEEA`
2. **Body (`flex: 1`, `overflow-y: auto`, `no-scrollbar`)**:
   - Padding: `22px 26px 20px`
   - Gap between rows: `16px - 18px`
   - Background: `#ffffff`
3. **Form Controls & Inputs**:
   - Label: `font-family: JetBrains Mono`, `font-size: 10px`, `font-weight: 700`, `letter-spacing: 0.08em`, `text-transform: uppercase`, `color: #667785`, `margin-bottom: 7px`
   - Input/Select: `min-height: 44px`, `padding: 0 14px`, `border-radius: 10px`, `border: 1px solid #EBE7E0`, `background: #FDFDFC`, `font-size: 12px - 13px`, `font-weight: 600`, `color: #201C17`
   - Input Focus: `background: #ffffff; border-color: #85B4DB; box-shadow: 0 0 0 4px rgba(40, 86, 145, 0.11);`
4. **Footer (`flex-shrink: 0`)**:
   - Padding: `15px 26px 18px`
   - Background: `#FDFDFC`
   - Border top: `1px solid #F1EFEB`
   - Left Notice: `font-size: 10px`, `color: #98A7B3`, JetBrains Mono, shield icon with `#428CC8`
   - Cancel Button: `min-height: 42px`, `padding: 0 18px`, `border-radius: 10px`, `background: #F1EFE9`, `color: #4A4239`, font-weight `700`, `font-size: 12px`
   - Primary Submit Button: `min-height: 42px`, `padding: 0 20px`, `border-radius: 10px`, `background: #285691`, `color: #ffffff`, font-weight `700`, `font-size: 12px`, `box-shadow: 0 6px 14px rgba(40, 86, 145, 0.22)`

---

## 📋 3. Specific Modal Implementations

### **3.1 Pre-Flight Task Assignment Modal (`AssignTaskModal`)**
* **Template Dropdown Bar**:
  * Well container: `background: #FAFAFA; border: 1px solid #EFECE6; border-radius: 12px; padding: 10px 14px;`
  * Bolt Badge: `24px × 24px`, `#EEF3FB`, text `#285691`
  * Dynamic Templates: Fetched from `/api/task-templates` DB table
* **Fields**:
  * Row 1: Task Title (`min-height: 46px; font-size: 13px;`)
  * Row 2: Assigned By (PM/Tech Leads) + Task Category (7 categories with emoji icons)
  * Row 3: Workload Type (`PRE_PLANNING`, `AD_HOC_EMERGENCY`, `RECURRING_ROUTINE`) + Estimated Hours
  * Row 4: Priority (`P1_HIGH`, `P2_MEDIUM`, `P3_LOW`) + Due Date (`datetime-local`)
* **Assignment Target Selector (Pill Segmented Control)**:
  * Container: `background: #F5F4F2; border-radius: 14px; padding: 6px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;`
  * Active Pill: `background: #ffffff; color: #285691; font-weight: 700; box-shadow: 0 2px 6px rgba(32, 27, 23, 0.08);`
  * Inactive Pill: `color: #667785; font-weight: 600;`
* **Mode 1 — Single Developer**:
  * Dropdowns: Filter by Squad + Assignee
  * Pre-flight Capacity Bar: Blue (current) + Emerald/Rose (simulated added task), text `14.0h / 40h`, buffer remaining or overbooked notice
* **Mode 2 — Multiple Developers (Pod)**:
  * Dropdowns: Filter by Squad + Hour Distribution (`Divide hours evenly` vs `Assign full hours`)
  * Search Bar: Search input with magnifying glass
  * Developer Checklist: Scrollable max-height 160px with checkbox, 28px initials badge (`AC`), name, role + squad subtitle, and capacity pill (`2.5h free` green / `+2.0h over` red)
  * Pod Audit Box: Summary of N engineers + status pill (`✅ All Within Capacity` / `⚠️ Capacity Breach`) + individual dev cards
* **Mode 3 — Entire Team / Squad**:
  * Squad Dropdown
  * Team Capacity Card: Squad Name, Tech Lead name, Active engineer count, `66% Squad Load` badge, 3-row metric box (`Squad Total Capacity`, `Allocated Load`, `Available Buffer`), and queue notice

---

### **3.2 Developer Onboarding Modal (`AddDeveloperModal`)**
* **Dimensions**: `width: min(660px, calc(100vw - 32px))`, `max-height: min(760px, calc(100vh - 32px))`
* **Header**: User Plus Icon (`fa-user-plus`), "Onboard New Developer", "Provision a new engineer..."
* **Sections**:
  1. Profile Identity: Full Name & Email Address (grid-cols-2)
  2. Team Allocation: Primary Squad & Seniority Level (Junior, Mid, Senior, Lead, Principal)
  3. Role Title: Input with quick-fill suggestion pill tags (`Frontend`, `Backend`, `Full Stack`, `DevOps`, `QA`, `UI/UX`)
  4. Weekly Capacity & Max Active Tasks: Grouped well container (`background: #FAFAFA; border: 1px solid #F0EDE7; padding: 15px; border-radius: 14px;`)
  5. Primary Skills: Comma-separated tag field with prompt

---

### **3.3 Team / Squad Creation Modal (`CreateSquadModal`)**
* **Dimensions**: `width: min(700px, calc(100vw - 32px))`, `max-height: min(760px, calc(100vh - 32px))`
* **Header**: People Group Icon (`fa-people-group`), "Create Team / Squad", "Form a new engineering squad..."
* **Sections**:
  1. Squad Identity: Squad Name & Project / Jira Code (e.g. `ALPHA`)
  2. Ownership & Color: Squad Tech Lead select + 8-swatch circular Color Picker (`#2563EB`, `#6366F1`, `#059669`, `#D97706`, `#E11D48`, `#7C3AED`, `#0D9488`, `#0891B2`)
  3. Engineers Allocation: Search bar + Member Count Badge + Scrollable checklist with initials avatars and buffer badges
* **Backend Payload**: Submits to `POST /api/squads` with `name`, `project_code`, `color_hex`, `lead_user_id`, `member_user_ids`.

---

### **3.4 Raise / Edit Blocker Modal (`BlockerModal`)**
* **Header**: Triangle Exclamation Icon (`fa-triangle-exclamation` in `#FEF2F2`, text `#DC2626`)
* **1-Click Preset Dropdown**: Auto-populates title, risk level, and category from common blockers
* **Fields**: Blocker Title, Impacted Developer, Associated Task, Risk Level (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), Root Cause Category (`TECHNICAL`, `DEPENDENCY`, `SCOPE`, `ENVIRONMENT`, `EXTERNAL`), Resolution ETA, and Description.

---

### **3.5 Log Time Modal (`LogTimeModal`)**
* **Dimensions**: `max-width: 440px`, `border-radius: 20px`
* **Header**: Clock Icon (`fa-clock text-blue-500`), "Log Hours"
* **Active Task Well**: Shows Engineer name and active task title in light container
* **1-Click Presets**: Pill buttons for `+30m`, `+1.0h`, `+2.0h`, `+4.0h`, `+8.0h (Full Day)`
* **Inputs**: Numeric hours input + Notes & Accomplishment textarea

---

## 📊 4. Dashboard View & Component Architecture

### **4.1 Layout Shell (`DashboardLayout`)**
* **Sidebar**: `width: 272px`, fixed height `100vh`, border-right `1px solid #E7E3DA`, background `#ffffff`.
  * Logo container: `height: 68px - 72px`, icon box `#285691`, `WorkDashboard` in Sora bold.
  * Search Bar: `⌘K` trigger button.
  * Navigation Section: `Operations` header, rounded `10px` nav buttons with icon + badge, active state with blue tint and inset left border `box-shadow: inset 3px 0 0 #285691`.
  * Footer: User card with avatar, name, role, and logout button.
* **Header**: `height: 68px - 72px`, glass blur `rgba(255, 255, 255, 0.94)`, breadcrumbs, title, View Switcher (`Manager View` / `Developer View`), date indicator, notifications bell.
* **Main Canvas**: `max-width: 1440px`, `padding: 26px 30px 40px`, flex column with `gap: 24px`.

### **4.2 KPI Metric Cards (`.kpi-card`)**
* Container: `background: #ffffff; border: 1px solid #E7E3DA; border-radius: 16px; padding: 20px 22px; min-height: 140px;`
* Top Row: Uppercase label (`10px`, JetBrains Mono, color `#667785`) + Accent Icon Box (`36px × 36px`, rounded `10px`)
* Value: `28px - 30px`, Sora bold, tracking `-0.035em`, color `#201C17`
* Subtitle / Trend: `11px - 12px`, color `#667785`, with trend arrow indicator

### **4.3 Developer Capacity Heatmap Grid (`CapacityCardGrid`)**
* Card: `background: #ffffff; border: 1px solid #E7E3DA; border-radius: 16px; padding: 18px;`
* Developer Header:
  * Avatar: Initials in rounded box (`#EAE8E3`, text `#4A4239`)
  * Info: Full name (Sora bold), Role subtitle (`11px font-mono`), Squad tag
  * Status Dot: Live pulsing dot (`#326A45` for available, `#883828` for blocked/overallocated)
* Capacity Progress Bar: Multi-colored stacked bar showing Planned (`#428CC8`), Emergency (`#E11D48`), Routine (`#8B5CF6`), and Remaining Buffer (`#EFECE6`).
* Buffer Badge: Green pill `✓ 12.5h buffer` or red warning pill `⚠️ +4.0h Overbooked`.
* Actions: "Assign Task" button & "Inspect 360°" drawer trigger.

### **4.4 Developer Inspector Drawer (`DeveloperInspectorDrawer`)**
* Drawer: Slide-in from right (`width: min(520px, 100vw)`), backdrop blur.
* Header: Large avatar, developer name, role, squad badge, capacity gauge.
* Tabs: `Active Tasks`, `Weekly Breakdown`, `Logged Hours`, `Blockers & Dependencies`.
* Quick Action Bar: "Assign Task" trigger button in footer.

---

## 🔌 5. Backend REST API Endpoints & Contracts

| Endpoint | Method | Purpose | Key Request / Response Fields |
| :--- | :--- | :--- | :--- |
| `/api/tasks` | `GET` | List tasks with filters | `?squad_id=&assigned_user_id=&status=&task_type=` |
| `/api/tasks` | `POST` | Create/Assign new task | `{ title, squad_id, assigned_to_user_id, task_type, category, priority, estimated_hours, due_date, status }` |
| `/api/task-templates` | `GET` | List 1-click task blueprints | Returns `[{ id, name, default_task_title, category, task_type, default_estimated_hours, default_priority }]` |
| `/api/developers` | `GET` | Fetch all devs with capacity load | Returns `[{ id, developer_name, role_title, squad_id, weekly_capacity_hours, total_load_hours, available_buffer_hours }]` |
| `/api/developers` | `POST` | Onboard new engineer | `{ full_name, email, squad_id, seniority_level, role_title, weekly_capacity_hours, max_concurrent_tasks, skills }` |
| `/api/squads` | `GET` | Fetch all squads with stats | Returns `[{ id, name, project_code, color_hex, lead_user_id, lead_name, member_count }]` |
| `/api/squads` | `POST` | Create new squad & allocate devs | `{ name, project_code, color_hex, lead_user_id, member_user_ids }` |
| `/api/blockers` | `GET` | Fetch blockers & risks | Returns list of blockers with risk level, impacted dev, and status |
| `/api/blockers` | `POST` | Log new impediment/risk | `{ title, developer_id, task_id, risk_level, category, resolution_eta, notes }` |

---

## 🎯 6. Developer Guidelines for UI Replication

1. **Never use generic blue/red/green**: Always use the curated hex values (`#285691`, `#428CC8`, `#326A45`, `#BE123C`, `#8F5D24`, `#6366F1`).
2. **Never center modals relative to main content area**: Always use `createPortal(..., document.body)` with `fixed inset-0` so sidebar dimensions never shift modal alignment.
3. **Typography rule**: Use uppercase JetBrains Mono `10px` with `tracking: 0.08em` for all form labels and tabular subtitles.
4. **Scrollbars**: Apply `.no-scrollbar` (or `scrollbar-width: thin`) to all modal bodies and scrollable lists to keep panels clean.
5. **Simulations & Pre-flight checks**: Always calculate workload additions live and display instant visual feedback with buffer/overload badges.
