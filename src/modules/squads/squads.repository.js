import pool from "@/lib/db";

// Get all active squads with lead engineer details and member count
export async function findAllActive() {
  const result = await pool.query(
    `SELECT 
      s.id,
      s.name,
      s.badge_code,
      s.focus_domain,
      s.lead_user_id,
      s.budget_hours,
      s.spent_hours,
      s.health,
      s.is_active,
      s.created_at,
      s.updated_at,
      u.full_name AS lead_name,
      u.email AS lead_email,
      u.role_title AS lead_role_title,
      COALESCE((
        SELECT COUNT(*)::int 
        FROM squad_members sm 
        WHERE sm.squad_id = s.id AND sm.left_at IS NULL
      ), 0) AS member_count
    FROM squads s
    JOIN users u ON u.id = s.lead_user_id
    WHERE s.is_active = true
    ORDER BY s.name ASC`
  );
  return result.rows;
}

// Get single squad by ID
export async function findById(id) {
  const result = await pool.query(
    `SELECT 
      s.id,
      s.name,
      s.badge_code,
      s.focus_domain,
      s.lead_user_id,
      s.budget_hours,
      s.spent_hours,
      s.health,
      s.is_active,
      s.created_at,
      s.updated_at,
      u.full_name AS lead_name,
      u.email AS lead_email,
      u.role_title AS lead_role_title
    FROM squads s
    JOIN users u ON u.id = s.lead_user_id
    WHERE s.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

// Get squad details including active members list and task counts
export async function findByIdWithDetails(id) {
  const squad = await findById(id);
  if (!squad) return null;

  // Active members
  const membersResult = await pool.query(
    `SELECT 
      sm.id AS membership_id,
      sm.user_id,
      sm.allocation_percentage,
      sm.joined_at,
      u.full_name,
      u.email,
      u.role_title,
      u.seniority,
      u.skills
    FROM squad_members sm
    JOIN users u ON u.id = sm.user_id
    WHERE sm.squad_id = $1 AND sm.left_at IS NULL AND u.is_active = true
    ORDER BY u.full_name ASC`,
    [id]
  );

  // Task statistics
  const taskStatsResult = await pool.query(
    `SELECT 
      COUNT(*)::int AS total_tasks,
      COUNT(CASE WHEN status != 'COMPLETED' THEN 1 END)::int AS active_tasks_count,
      COUNT(CASE WHEN is_blocked = true THEN 1 END)::int AS blocked_tasks_count,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int AS completed_tasks_count
    FROM tasks 
    WHERE squad_id = $1`,
    [id]
  );

  return {
    ...squad,
    members: membersResult.rows,
    stats: taskStatsResult.rows[0] || {
      total_tasks: 0,
      active_tasks_count: 0,
      blocked_tasks_count: 0,
      completed_tasks_count: 0,
    },
  };
}

// Create a new squad
export async function createSquad(data) {
  const result = await pool.query(
    `INSERT INTO squads (
      name,
      badge_code,
      focus_domain,
      lead_user_id,
      budget_hours,
      spent_hours,
      health
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.name,
      data.badge_code,
      data.focus_domain,
      data.lead_user_id,
      data.budget_hours,
      data.spent_hours ?? 0.0,
      data.health ?? "HEALTHY",
    ]
  );
  return result.rows[0];
}

// Update squad details dynamically (PATCH)
export async function updateSquad(id, data) {
  const fields = [];
  const values = [];
  let index = 1;

  const allowedFields = [
    "name",
    "badge_code",
    "focus_domain",
    "lead_user_id",
    "budget_hours",
    "spent_hours",
    "health",
    "is_active",
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${index}`);
      values.push(data[field]);
      index++;
    }
  }

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE squads 
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] ?? null;
}

// Soft delete squad
export async function deactivateSquad(id) {
  const result = await pool.query(
    `UPDATE squads 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}
