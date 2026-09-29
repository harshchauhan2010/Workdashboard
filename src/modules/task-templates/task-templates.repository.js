import pool from "@/lib/db";

/**
 * Find all task templates with optional category filter
 */
export async function findAll(filters = {}) {
  let query = `
    SELECT 
      tt.*,
      u.full_name AS created_by_name,
      u.email AS created_by_email
    FROM workdash.task_templates tt
    LEFT JOIN workdash.users u ON tt.created_by_user_id = u.id
  `;
  const params = [];

  if (filters.category) {
    params.push(filters.category);
    query += ` WHERE tt.category = $${params.length}`;
  }

  query += ` ORDER BY tt.is_system DESC, tt.name ASC`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Find template by UUID
 */
export async function findById(id) {
  const result = await pool.query(
    `SELECT 
       tt.*,
       u.full_name AS created_by_name,
       u.email AS created_by_email
     FROM workdash.task_templates tt
     LEFT JOIN workdash.users u ON tt.created_by_user_id = u.id
     WHERE tt.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new task template (always is_system = false for custom user creations)
 */
export async function createTemplate({
  name,
  default_task_title,
  category,
  task_type,
  recurrence_frequency,
  default_estimated_hours,
  default_priority,
  created_by_user_id,
}) {
  const result = await pool.query(
    `INSERT INTO workdash.task_templates (
       name,
       default_task_title,
       category,
       task_type,
       recurrence_frequency,
       default_estimated_hours,
       default_priority,
       is_system,
       created_by_user_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
     RETURNING *`,
    [
      name,
      default_task_title,
      category,
      task_type || "PRE_PLANNING",
      recurrence_frequency || null,
      default_estimated_hours || 4.0,
      default_priority || "P2_MEDIUM",
      created_by_user_id || null,
    ]
  );
  return result.rows[0];
}

/**
 * Update an existing task template
 */
export async function updateTemplate(id, fields = {}) {
  const allowedCols = [
    "name",
    "default_task_title",
    "category",
    "task_type",
    "recurrence_frequency",
    "default_estimated_hours",
    "default_priority",
  ];

  const setClauses = [];
  const values = [];

  for (const col of allowedCols) {
    if (fields[col] !== undefined) {
      values.push(fields[col]);
      setClauses.push(`${col} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return await findById(id);
  }

  setClauses.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const query = `
    UPDATE workdash.task_templates
    SET ${setClauses.join(", ")}
    WHERE id = $${values.length}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete a template by ID
 */
export async function deleteTemplate(id) {
  const result = await pool.query(
    "DELETE FROM workdash.task_templates WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}
