# Module: Blocker Presets

> File path: `src/modules/blocker-presets/`

---

## 1. Purpose

Blocker Presets are 1-click quick-fill chips shown in the blocker report modal. When a developer clicks a preset chip, it auto-populates the reason, business_impact, and mitigation_action fields. This reduces friction when reporting common impediments.

---

## 2. Files

| File | Role |
|------|------|
| `blockerPresets.controller.js` | HTTP handler: list all presets |
| `blockerPresets.service.js` | Simple pass-through to repository |
| `blockerPresets.repository.js` | SQL query on `workdash.blocker_presets` |

---

## 3. Database Table

```sql
CREATE TABLE workdash.blocker_presets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_slug             VARCHAR(64) NOT NULL UNIQUE,
  label                VARCHAR(100) NOT NULL,
  category             workdash.blocker_category_type NOT NULL DEFAULT 'TECHNICAL_IMPEDIMENT',
  severity             workdash.blocker_severity_level NOT NULL DEFAULT 'CRITICAL_BLOCKER',
  description_template TEXT NOT NULL,
  impact_template      TEXT NOT NULL,
  mitigation_template  TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Built-in Presets (Seed Data)

| key_slug | Label | Category | Severity |
|----------|-------|----------|---------|
| `api_keys` | API Keys | TECHNICAL_IMPEDIMENT | CRITICAL_BLOCKER |
| `db_lag` | Database Lag | INFRASTRUCTURE | HIGH_DELIVERY_RISK |
| `pr_review` | PR Review | REVIEW_BOTTLENECK | HIGH_DELIVERY_RISK |
| `cicd_failure` | CI/CD Failure | INFRASTRUCTURE | CRITICAL_BLOCKER |
| `outage_3rdparty` | 3rd Party Outage | DEPENDENCY | CRITICAL_BLOCKER |

---

## 5. API Endpoints

### GET /api/blocker-presets — List All Presets

**Response 200:**
```json
[
  {
    "id": "preset-uuid",
    "key_slug": "api_keys",
    "label": "API Keys",
    "category": "TECHNICAL_IMPEDIMENT",
    "severity": "CRITICAL_BLOCKER",
    "description_template": "Production API keys for [SERVICE] have not been provisioned or are expired.",
    "impact_template": "Integration with [SERVICE] is blocked. Feature delivery halted.",
    "mitigation_template": "Escalated to DevOps team. Awaiting key provisioning. ETA: [DATE]."
  }
]
```

---

## 6. How Presets Work (UI Flow)

```
Developer opens blocker report modal
    ↓
Frontend calls GET /api/blocker-presets
    ↓
Preset chips rendered: [API Keys] [Database Lag] [PR Review] ...
    ↓
Developer clicks "API Keys" chip
    ↓
Frontend copies preset fields into form inputs:
  - reason field ← description_template
  - business_impact field ← impact_template
  - mitigation_action field ← mitigation_template
  - category field ← preset.category
  - severity field ← preset.severity
    ↓
Developer reviews and edits the pre-filled text
    ↓
Developer submits → POST /api/tasks/:taskId/blockers
```

---

## 7. Repository SQL Queries

```js
// Get all presets (ordered by label for chip rendering)
async function findAll() {
  const result = await pool.query(
    "SELECT * FROM blocker_presets ORDER BY label ASC"
  );
  return result.rows;
}

// Get preset by key_slug
async function findBySlug(keySlug) {
  const result = await pool.query(
    "SELECT * FROM blocker_presets WHERE key_slug = $1",
    [keySlug]
  );
  return result.rows[0] ?? null;
}
```

---

## 8. Business Rules

1. **Read-only for most users** — presets are system-defined seed data.
2. **Managers can add custom presets** (future feature) via POST /api/blocker-presets.
3. **Templates contain placeholders** like `[SERVICE]`, `[DATE]` — developers are expected to replace these.
4. **key_slug is unique** — used as stable identifier in the frontend.

---

## 9. Testing

```bash
# List all presets
curl http://localhost:3000/api/blocker-presets

# Verify seed data exists in DB
psql workdashboard -c "SELECT key_slug, label, severity FROM workdash.blocker_presets;"
```
