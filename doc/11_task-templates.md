# Module: Task Templates (Blueprints Library)

> File path: `src/modules/task-templates/`

---

## 1. Purpose

The Task Templates module manages standard operational blueprints for engineering tasks. It allows engineering managers to create, maintain, and instantiate 1-click task blueprints (e.g., standard feature development, production hotfixes, QA test suites, database migrations, CI/CD setup). When a template is selected during task creation, default attributes (title prefix, category, workload type, estimated hours, priority) are automatically populated.

---

## 2. Layered Architecture & Files

```
API Routes (src/app/api/task-templates/...)
        ↓
Controller (src/modules/task-templates/taskTemplates.controller.js)
        ↓
Service    (src/modules/task-templates/taskTemplates.service.js)
        ↓
Repository (src/modules/task-templates/taskTemplates.repository.js)
        ↓
Database   (workdash.task_templates)
```

| File | Role |
|------|------|
| `taskTemplates.controller.js` | HTTP request handling, role-checking (manager vs dev), response formatting |
| `taskTemplates.service.js` | Business logic: template validation, system template protection rules |
| `taskTemplates.repository.js` | Direct SQL operations on `workdash.task_templates` |

---

## 3. Database Schema

```sql
CREATE TABLE workdash.task_templates (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    VARCHAR(150) NOT NULL,
  default_task_title      VARCHAR(255) NOT NULL,
  category                workdash.task_category_type NOT NULL DEFAULT 'DEVELOPMENT',
  task_type               workdash.task_workload_type NOT NULL DEFAULT 'PRE_PLANNING',
  recurrence_frequency    workdash.recurrence_freq,
  default_estimated_hours NUMERIC(4, 2) NOT NULL DEFAULT 4.00 CHECK (default_estimated_hours > 0.00),
  default_priority        workdash.task_priority_level NOT NULL DEFAULT 'P2_MEDIUM',
  is_system               BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id      UUID REFERENCES workdash.users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_templates_category ON workdash.task_templates(category);
CREATE INDEX idx_task_templates_is_system ON workdash.task_templates(is_system);
```

### System vs Custom Templates
- **System Templates (`is_system = true`)**: Default blueprints pre-seeded into the platform (e.g., `feature`, `bugfix`, `qa`, `reporting`, `devops`). They cannot be deleted or mutated by standard users.
- **Custom Templates (`is_system = false`)**: Created by Managers to streamline squad-specific repetitive workflows. Can be edited and deleted by managers.

---

## 4. API Specifications

### 4.1 GET /api/task-templates — List All Templates

Retrieves all available templates (system blueprints + custom blueprints), optionally filtered by category.

**Query Parameters:**
- `category` *(optional)*: `DEVELOPMENT`, `BUG_FIX`, `INFRASTRUCTURE`, `TESTING_QA`, `DOCUMENTATION`, `CODE_REVIEW`, `MEETING`, `OTHER`

**Response 200 OK:**
```json
[
  {
    "id": "tpl-uuid-1",
    "name": "Production Hotfix Blueprint",
    "default_task_title": "Hotfix: [Component/Issue Description]",
    "category": "BUG_FIX",
    "task_type": "AD_HOC_EMERGENCY",
    "recurrence_frequency": null,
    "default_estimated_hours": 3.50,
    "default_priority": "P0_URGENT",
    "is_system": true,
    "created_by_user_id": null,
    "created_at": "2026-09-01T00:00:00Z"
  },
  {
    "id": "tpl-uuid-2",
    "name": "Standard Feature Delivery",
    "default_task_title": "Feature: [Module Name] - [Scope]",
    "category": "DEVELOPMENT",
    "task_type": "PRE_PLANNING",
    "recurrence_frequency": null,
    "default_estimated_hours": 8.00,
    "default_priority": "P2_MEDIUM",
    "is_system": false,
    "created_by_user_id": "user-mgr-uuid",
    "created_at": "2026-09-10T12:00:00Z"
  }
]
```

---

### 4.2 GET /api/task-templates/:id — Get Template Details

**Response 200 OK:**
```json
{
  "id": "tpl-uuid-1",
  "name": "Production Hotfix Blueprint",
  "default_task_title": "Hotfix: [Component/Issue Description]",
  "category": "BUG_FIX",
  "task_type": "AD_HOC_EMERGENCY",
  "default_estimated_hours": 3.50,
  "default_priority": "P0_URGENT",
  "is_system": true
}
```

**Response 404 Not Found:**
```json
{
  "error": "Task template not found"
}
```

---

### 4.3 POST /api/task-templates — Create Custom Template (Manager Only)

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "API Microservice Scaffold",
  "default_task_title": "Scaffold: [Service Name] REST Endpoints",
  "category": "DEVELOPMENT",
  "task_type": "PRE_PLANNING",
  "default_estimated_hours": 6.00,
  "default_priority": "P2_MEDIUM"
}
```

**Validation Rules:**
- `name`: Required, max 150 chars.
- `default_task_title`: Required, max 255 chars.
- `default_estimated_hours`: Numeric > 0.
- `category` & `task_type`: Must match valid enum types.
- `is_system`: Cannot be set to `true` by API callers (always `false` for user-created templates).

**Response 201 Created:**
```json
{
  "id": "new-tpl-uuid",
  "name": "API Microservice Scaffold",
  "default_task_title": "Scaffold: [Service Name] REST Endpoints",
  "category": "DEVELOPMENT",
  "task_type": "PRE_PLANNING",
  "default_estimated_hours": 6.00,
  "default_priority": "P2_MEDIUM",
  "is_system": false,
  "created_by_user_id": "user-mgr-uuid",
  "created_at": "2026-09-15T10:45:00Z"
}
```

---

### 4.4 PUT /api/task-templates/:id — Update Custom Template (Manager Only)

**Request Body:**
```json
{
  "name": "API Microservice Scaffold v2",
  "default_estimated_hours": 7.50,
  "default_priority": "P1_HIGH"
}
```

**Error 403 Forbidden:**
```json
{
  "error": "System templates cannot be modified"
}
```

**Response 200 OK:**
```json
{
  "id": "tpl-uuid",
  "name": "API Microservice Scaffold v2",
  "default_estimated_hours": 7.50,
  "default_priority": "P1_HIGH",
  "updated_at": "2026-09-15T11:00:00Z"
}
```

---

### 4.5 DELETE /api/task-templates/:id — Delete Custom Template (Manager Only)

**Error 403 Forbidden:**
```json
{
  "error": "System templates cannot be deleted"
}
```

**Response 200 OK:**
```json
{
  "message": "Task template deleted successfully",
  "deleted_id": "tpl-uuid"
}
```

---

## 5. End-to-End Request & Instantiation Flow

```
1. Manager/Developer selects "Create Task from Template" on UI
2. GET /api/task-templates is fetched → UI renders blueprint cards
3. User clicks "Production Hotfix Blueprint"
4. Task modal form auto-populates with:
   - title: "Hotfix: "
   - category: "BUG_FIX"
   - task_type: "AD_HOC_EMERGENCY"
   - estimated_hours: 3.5
   - priority: "P0_URGENT"
5. User completes title & assigns developer → POST /api/tasks
6. Task is saved with reference to workdash schema
```

---

## 6. Repository Implementation Snippets

```javascript
// src/modules/task-templates/taskTemplates.repository.js
import { pool } from '@/lib/db';

export async function findAllTemplates(category = null) {
  let query = 'SELECT * FROM task_templates';
  const params = [];
  if (category) {
    query += ' WHERE category = $1';
    params.push(category);
  }
  query += ' ORDER BY is_system DESC, name ASC';
  const res = await pool.query(query, params);
  return res.rows;
}

export async function findTemplateById(id) {
  const res = await pool.query('SELECT * FROM task_templates WHERE id = $1', [id]);
  return res.rows[0] || null;
}

export async function createTemplate({ name, default_task_title, category, task_type, recurrence_frequency, default_estimated_hours, default_priority, created_by_user_id }) {
  const res = await pool.query(
    `INSERT INTO task_templates 
     (name, default_task_title, category, task_type, recurrence_frequency, default_estimated_hours, default_priority, is_system, created_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
     RETURNING *`,
    [name, default_task_title, category, task_type, recurrence_frequency, default_estimated_hours, default_priority, created_by_user_id]
  );
  return res.rows[0];
}

export async function deleteTemplate(id) {
  const res = await pool.query('DELETE FROM task_templates WHERE id = $1 AND is_system = false RETURNING id', [id]);
  return res.rows[0];
}
```

---

## 7. Testing Guide

```bash
# 1. Fetch all templates
curl -X GET http://localhost:3000/api/task-templates

# 2. Filter templates by category
curl -X GET "http://localhost:3000/api/task-templates?category=BUG_FIX"

# 3. Create a custom template (as Manager)
curl -X POST http://localhost:3000/api/task-templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Database Migration Script",
    "default_task_title": "DB: Migrate schema for [Feature]",
    "category": "INFRASTRUCTURE",
    "task_type": "PRE_PLANNING",
    "default_estimated_hours": 4.0,
    "default_priority": "P1_HIGH"
  }'

# 4. Verify in PostgreSQL
psql workdashboard -c "SELECT id, name, category, default_estimated_hours, is_system FROM workdash.task_templates;"
```
