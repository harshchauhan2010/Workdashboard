import pool from "@/lib/db";

// Find all tasks with optional filters and joined metadata
export async function findAll(filters = {}) {
  let query = `
    SELECT 
      t.*,
      s.name AS squad_name,
      s.badge_code AS squad_badge_code,
      u.full_name AS assigned_by_name,
      u.role_title AS assigned_by_role,
      COALESCE(
        json_agg(
          json_build_object(
            'user_id', ta.user_id,
            'full_name', dev.full_name,
            'role_title', dev.role_title,
            'assigned_hours', ta.assigned_hours,
            'split_mode', ta.split_mode
          )
        ) FILTER (WHERE ta.id IS NOT NULL), 
        '[]'
      ) AS assigned_developers
    FROM workdash.tasks t
    JOIN workdash.squads s ON t.squad_id = s.id
    JOIN workdash.users u ON t.assigned_by_user_id = u.id
    LEFT JOIN workdash.task_assignments ta ON t.id = ta.task_id
    LEFT JOIN workdash.users dev ON ta.user_id = dev.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.squad_id) {
    params.push(filters.squad_id);
    query += ` AND t.squad_id = $${params.length}`;
  }

  if (filters.status) {
    params.push(filters.status);
    query += ` AND t.status = $${params.length}`;
  }

  if (filters.task_type) {
    params.push(filters.task_type);
    query += ` AND t.task_type = $${params.length}`;
  }

  if (filters.is_blocked !== undefined) {
    params.push(filters.is_blocked);
    query += ` AND t.is_blocked = $${params.length}`;
  }

  if (filters.assigned_user_id) {
    params.push(filters.assigned_user_id);
    query += ` AND ta.user_id = $${params.length}`;
  }

  if (filters.due_date || filters.date) {
    params.push(filters.due_date || filters.date);
    query += ` AND (t.due_date::date = $${params.length}::date OR t.created_at::date = $${params.length}::date)`;
  }

  if (filters.from_date) {
    params.push(filters.from_date);
    query += ` AND (t.due_date::date >= $${params.length}::date)`;
  }

  if (filters.to_date) {
    params.push(filters.to_date);
    query += ` AND (t.due_date::date <= $${params.length}::date)`;
  }

  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    query += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
  }

  query += `
    GROUP BY t.id, s.id, u.id
    ORDER BY 
      CASE t.priority 
        WHEN 'P1_HIGH' THEN 1 
        WHEN 'P2_MEDIUM' THEN 2 
        WHEN 'P3_LOW' THEN 3 
        ELSE 4 
      END ASC,
      t.assigned_at DESC
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

// Helper to find tasks assigned to a specific user
export async function findAssignedTasks(userId) {
  return findAll({ assigned_user_id: userId });
}

// Find single task by ID with assigned developers and active blockers
export async function findById(id) {
  const query = `
    SELECT 
      t.*,
      s.name AS squad_name,
      s.badge_code AS squad_badge_code,
      u.full_name AS assigned_by_name,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', ta.id,
              'user_id', ta.user_id,
              'full_name', dev.full_name,
              'role_title', dev.role_title,
              'assigned_hours', ta.assigned_hours,
              'split_mode', ta.split_mode
            )
          )
          FROM workdash.task_assignments ta
          JOIN workdash.users dev ON ta.user_id = dev.id
          WHERE ta.task_id = t.id
        ),
        '[]'
      ) AS assignments,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', tb.id,
              'severity', tb.severity,
              'reason', tb.reason,
              'business_impact', tb.business_impact,
              'is_resolved', tb.is_resolved,
              'created_at', tb.created_at
            )
          )
          FROM workdash.task_blockers tb
          WHERE tb.task_id = t.id
        ),
        '[]'
      ) AS blockers
    FROM workdash.tasks t
    JOIN workdash.squads s ON t.squad_id = s.id
    JOIN workdash.users u ON t.assigned_by_user_id = u.id
    WHERE t.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// Create new task
export async function createTask(data) {
  const result = await pool.query(
    `INSERT INTO workdash.tasks (
       title,
       description,
       squad_id,
       task_type,
       category,
       priority,
       status,
       estimated_hours,
       recurrence_frequency,
       assigned_by_user_id,
       due_date
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.title,
      data.description || null,
      data.squad_id,
      data.task_type || "PRE_PLANNING",
      data.category || "DEVELOPMENT",
      data.priority || "P2_MEDIUM",
      data.status || "IN_PROGRESS",
      data.estimated_hours || 4.0,
      data.recurrence_frequency || null,
      data.assigned_by_user_id,
      data.due_date || null,
    ]
  );
  return result.rows[0];
}

// Update task dynamically
export async function updateTask(id, fields) {
  const allowedCols = [
    "title",
    "description",
    "squad_id",
    "task_type",
    "category",
    "priority",
    "status",
    "estimated_hours",
    "recurrence_frequency",
    "due_date",
    "is_blocked",
  ];

  const setClauses = [];
  const values = [];

  for (const [key, value] of Object.entries(fields)) {
    if (allowedCols.includes(key)) {
      values.push(value);
      setClauses.push(`${key} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return await findById(id);
  }

  values.push(id);
  const query = `
    UPDATE workdash.tasks
    SET ${setClauses.join(", ")}, updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

// Hard delete task
export async function deleteTask(id) {
  const result = await pool.query(
    "DELETE FROM workdash.tasks WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}
