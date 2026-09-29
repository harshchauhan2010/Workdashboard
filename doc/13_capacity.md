# Module: Capacity Engine

> File path: `src/modules/capacity/`

---

## 1. Purpose

The Capacity Engine is the core calculation and analytics engine of WorkDashboard. It computes real-time workload, allocation percentages, buffer hours, and overage thresholds for both individual developers and entire squads.

It powers:
- **Manager Command Center**: Capacity Heatmap, Squad Allocation Cards, Overbooking Alerts, Planning Rebalancing.
- **Developer Workspace**: Personal workload breakdown (Recurring vs Planned vs Ad-Hoc vs Available Buffer).

---

## 2. Capacity Mathematical Formulas & Banding

### 2.1 Developer Capacity Formulas

| Metric | Formula |
|--------|---------|
| `weekly_capacity_hours` | Contractual hours from `users.weekly_capacity_hours` (default: 40.0h) |
| `recurring_hours` | Fixed overhead from `users.recurring_overhead_hours` or sum of routines |
| `pre_planning_hours` | $\sum \text{assigned\_hours}$ for non-completed `PRE_PLANNING` tasks |
| `adhoc_hours` | $\sum \text{assigned\_hours}$ for non-completed `AD_HOC_EMERGENCY` tasks |
| `total_load_hours` | $\text{recurring\_hours} + \text{pre\_planning\_hours} + \text{adhoc\_hours}$ |
| `utilization_pct` | $\left(\frac{\text{total\_load\_hours}}{\text{weekly\_capacity\_hours}}\right) \times 100$ (rounded to 1 decimal place) |
| `available_buffer_hours` | $\max(0, \text{weekly\_capacity\_hours} - \text{total\_load\_hours})$ |
| `overage_hours` | $\max(0, \text{total\_load\_hours} - \text{weekly\_capacity\_hours})$ |
| `is_overallocated` | $\text{total\_load\_hours} > \text{weekly\_capacity\_hours}$ (boolean) |

### 2.2 Heatmap Color Thresholds

```
   0% ──────────── 70% ──────────── 90% ──────────── 100% ───────────> 120%+
 [ Under-allocated ]  [    Optimal    ]  [ Heavy Load  ] [  OVERALLOCATED  ]
   Emerald / Low        Teal / Good        Amber / Warn      Rose / Danger
```

| Range | Status | UI Color / Badge | Meaning |
|-------|--------|-----------------|---------|
| `0% - 70%` | UNDERLOADED | `text-emerald-400 bg-emerald-950` | Has bandwidth for extra tasks |
| `71% - 90%` | OPTIMAL | `text-cyan-400 bg-cyan-950` | Safe operational sweet spot |
| `91% - 100%` | HEAVY LOAD | `text-amber-400 bg-amber-950` | Near capacity; risk of slip |
| `> 100%` | OVERALLOCATED | `text-rose-400 bg-rose-950` | Immediate manager intervention needed |

---

## 3. Database Views Supporting Capacity

### 3.1 `v_developer_capacity_summary`

```sql
CREATE OR REPLACE VIEW workdash.v_developer_capacity_summary AS
SELECT
  u.id AS user_id,
  u.name AS developer_name,
  u.email AS developer_email,
  u.role_title,
  u.weekly_capacity_hours,
  u.recurring_overhead_hours AS recurring_hours,
  
  -- Active pre-planned hours
  COALESCE(SUM(ta.assigned_hours) FILTER (
    WHERE t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED'
  ), 0.00) AS pre_planning_hours,

  -- Active ad-hoc/emergency hours
  COALESCE(SUM(ta.assigned_hours) FILTER (
    WHERE t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED'
  ), 0.00) AS adhoc_hours,

  -- Total load
  (u.recurring_overhead_hours + 
   COALESCE(SUM(ta.assigned_hours) FILTER (WHERE t.status != 'COMPLETED'), 0.00)
  ) AS total_load_hours,

  -- Utilization %
  ROUND(
    ((u.recurring_overhead_hours + COALESCE(SUM(ta.assigned_hours) FILTER (WHERE t.status != 'COMPLETED'), 0.00))
     / NULLIF(u.weekly_capacity_hours, 0.00)) * 100.0, 1
  ) AS utilization_pct,

  -- Available buffer hours
  GREATEST(0.00, u.weekly_capacity_hours - (
    u.recurring_overhead_hours + COALESCE(SUM(ta.assigned_hours) FILTER (WHERE t.status != 'COMPLETED'), 0.00)
  )) AS available_buffer_hours,

  -- Overage hours
  GREATEST(0.00, (
    u.recurring_overhead_hours + COALESCE(SUM(ta.assigned_hours) FILTER (WHERE t.status != 'COMPLETED'), 0.00)
  ) - u.weekly_capacity_hours) AS overage_hours,

  -- Overallocated flag
  ((u.recurring_overhead_hours + COALESCE(SUM(ta.assigned_hours) FILTER (WHERE t.status != 'COMPLETED'), 0.00)) 
   > u.weekly_capacity_hours) AS is_overallocated

FROM workdash.users u
LEFT JOIN workdash.task_assignments ta ON ta.user_id = u.id
LEFT JOIN workdash.tasks t ON t.id = ta.task_id
WHERE u.system_role = 'DEVELOPER' AND u.status = 'ACTIVE'
GROUP BY u.id, u.name, u.email, u.role_title, u.weekly_capacity_hours, u.recurring_overhead_hours;
```

---

### 3.2 `v_squad_capacity_summary`

Calculates aggregate squad capacity, rollups, and overbooked engineer headcounts.

```sql
CREATE OR REPLACE VIEW workdash.v_squad_capacity_summary AS
SELECT
  s.id AS squad_id,
  s.name AS squad_name,
  s.badge_code,
  s.focus_domain,
  COUNT(DISTINCT sm.user_id) AS total_engineers,
  COALESCE(SUM(u.weekly_capacity_hours), 0.00) AS total_capacity_hours,
  COALESCE(SUM(v_dev.total_load_hours), 0.00) AS allocated_load_hours,
  
  ROUND(
    (COALESCE(SUM(v_dev.total_load_hours), 0.00) / NULLIF(SUM(u.weekly_capacity_hours), 0.00)) * 100.0, 1
  ) AS squad_utilization_pct,

  COUNT(DISTINCT sm.user_id) FILTER (WHERE v_dev.is_overallocated = true) AS overbooked_engineers_count,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status != 'COMPLETED') AS active_tasks_count,
  COUNT(DISTINCT t.id) FILTER (WHERE t.is_blocked = true AND t.status != 'COMPLETED') AS blocked_tasks_count

FROM workdash.squads s
LEFT JOIN workdash.squad_members sm ON sm.squad_id = s.id
LEFT JOIN workdash.users u ON u.id = sm.user_id AND u.status = 'ACTIVE'
LEFT JOIN workdash.v_developer_capacity_summary v_dev ON v_dev.user_id = sm.user_id
LEFT JOIN workdash.tasks t ON t.squad_id = s.id
GROUP BY s.id, s.name, s.badge_code, s.focus_domain;
```

---

## 4. API Endpoints

### 4.1 GET /api/capacity/developers — Developer Heatmap Data

**Response 200 OK:**
```json
[
  {
    "user_id": "dev-uuid-1",
    "developer_name": "Sarah Jenkins",
    "role_title": "Senior Frontend Engineer",
    "weekly_capacity_hours": 40.00,
    "recurring_hours": 5.50,
    "pre_planning_hours": 24.00,
    "adhoc_hours": 8.00,
    "total_load_hours": 37.50,
    "utilization_pct": 93.8,
    "available_buffer_hours": 2.50,
    "overage_hours": 0.00,
    "is_overallocated": false,
    "squad_name": "Squad Alpha",
    "squad_badge": "ALPHA"
  },
  {
    "user_id": "dev-uuid-2",
    "developer_name": "Marcus Vance",
    "role_title": "Backend Tech Lead",
    "weekly_capacity_hours": 40.00,
    "recurring_hours": 6.00,
    "pre_planning_hours": 30.00,
    "adhoc_hours": 12.00,
    "total_load_hours": 48.00,
    "utilization_pct": 120.0,
    "available_buffer_hours": 0.00,
    "overage_hours": 8.00,
    "is_overallocated": true,
    "squad_name": "Squad Bravo",
    "squad_badge": "BRAVO"
  }
]
```

---

### 4.2 GET /api/capacity/squads — Squad Capacity Summary

**Response 200 OK:**
```json
[
  {
    "squad_id": "squad-alpha-uuid",
    "squad_name": "Squad Alpha",
    "badge_code": "ALPHA",
    "focus_domain": "Core Engine & Billing",
    "total_engineers": 4,
    "total_capacity_hours": 160.00,
    "allocated_load_hours": 142.50,
    "squad_utilization_pct": 89.1,
    "overbooked_engineers_count": 0,
    "active_tasks_count": 12,
    "blocked_tasks_count": 1
  }
]
```

---

### 4.3 GET /api/capacity/me — Developer's Personal Capacity Stats

**Response 200 OK:**
```json
{
  "weekly_capacity_hours": 40.00,
  "recurring_hours": 5.50,
  "pre_planning_hours": 20.00,
  "adhoc_hours": 6.00,
  "total_load_hours": 31.50,
  "utilization_pct": 78.8,
  "available_buffer_hours": 8.50,
  "overage_hours": 0.00,
  "is_overallocated": false
}
```

---

## 5. Repository Layer

```javascript
// src/modules/capacity/capacity.repository.js
import { pool } from '@/lib/db';

export async function getDeveloperCapacitySummaries() {
  const query = `
    SELECT v.*, s.name as squad_name, s.badge_code as squad_badge
    FROM v_developer_capacity_summary v
    LEFT JOIN squad_members sm ON sm.user_id = v.user_id
    LEFT JOIN squads s ON s.id = sm.squad_id
    ORDER BY v.utilization_pct DESC
  `;
  const res = await pool.query(query);
  return res.rows;
}

export async function getSquadCapacitySummaries() {
  const query = `
    SELECT * FROM v_squad_capacity_summary
    ORDER BY squad_utilization_pct DESC
  `;
  const res = await pool.query(query);
  return res.rows;
}

export async function getCapacityByUserId(userId) {
  const query = `
    SELECT * FROM v_developer_capacity_summary
    WHERE user_id = $1
  `;
  const res = await pool.query(query, [userId]);
  return res.rows[0] || null;
}
```

---

## 6. Testing

```bash
# 1. Fetch Developer Capacity Heatmap data
curl http://localhost:3000/api/capacity/developers

# 2. Fetch Squad Summaries
curl http://localhost:3000/api/capacity/squads

# 3. Direct DB View verification
psql workdashboard -c "SELECT developer_name, total_load_hours, utilization_pct, is_overallocated FROM workdash.v_developer_capacity_summary;"
psql workdashboard -c "SELECT squad_name, total_engineers, squad_utilization_pct, overbooked_engineers_count FROM workdash.v_squad_capacity_summary;"
```
