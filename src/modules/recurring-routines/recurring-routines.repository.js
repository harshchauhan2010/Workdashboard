import pool from "@/lib/db";

/**
 * Find routines by user ID with joined squad metadata
 */
export async function findRoutinesByUserId(userId) {
  const result = await pool.query(
    `SELECT 
       r.*,
       s.name AS squad_name,
       s.badge_code AS squad_badge_code,
       u.full_name AS developer_name,
       u.email AS developer_email
     FROM workdash.recurring_routines r
     JOIN workdash.users u ON r.user_id = u.id
     LEFT JOIN workdash.squads s ON r.squad_id = s.id
     WHERE r.user_id = $1
     ORDER BY r.created_at ASC`,
    [userId]
  );
  return result.rows;
}

/**
 * Find all routines with optional filters (userId, squadId, frequency)
 */
export async function findAll(filters = {}) {
  let query = `
    SELECT 
       r.*,
       s.name AS squad_name,
       s.badge_code AS squad_badge_code,
       u.full_name AS developer_name,
       u.email AS developer_email
     FROM workdash.recurring_routines r
     JOIN workdash.users u ON r.user_id = u.id
     LEFT JOIN workdash.squads s ON r.squad_id = s.id
     WHERE 1=1
  `;
  const params = [];

  if (filters.userId) {
    params.push(filters.userId);
    query += ` AND r.user_id = $${params.length}`;
  }

  if (filters.squadId) {
    params.push(filters.squadId);
    query += ` AND r.squad_id = $${params.length}`;
  }

  if (filters.frequency) {
    params.push(filters.frequency);
    query += ` AND r.frequency = $${params.length}`;
  }

  query += ` ORDER BY r.created_at ASC`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Find single routine by ID
 */
export async function findById(id) {
  const result = await pool.query(
    `SELECT 
       r.*,
       s.name AS squad_name,
       s.badge_code AS squad_badge_code,
       u.full_name AS developer_name,
       u.email AS developer_email
     FROM workdash.recurring_routines r
     JOIN workdash.users u ON r.user_id = u.id
     LEFT JOIN workdash.squads s ON r.squad_id = s.id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new recurring routine
 */
export async function createRoutine({
  userId,
  squadId,
  title,
  frequency,
  scheduleLabel,
  allocatedHours,
}) {
  const result = await pool.query(
    `INSERT INTO workdash.recurring_routines (
       user_id,
       squad_id,
       title,
       frequency,
       schedule_label,
       allocated_hours
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      userId,
      squadId || null,
      title,
      frequency || "DAILY",
      scheduleLabel,
      allocatedHours || 2.5,
    ]
  );
  return result.rows[0];
}

/**
 * Update an existing recurring routine
 */
export async function updateRoutine(id, fields = {}) {
  const allowedCols = {
    title: "title",
    frequency: "frequency",
    schedule_label: "schedule_label",
    scheduleLabel: "schedule_label",
    allocated_hours: "allocated_hours",
    allocatedHours: "allocated_hours",
    squad_id: "squad_id",
    squadId: "squad_id",
  };

  const setClauses = [];
  const values = [];

  for (const [key, col] of Object.entries(allowedCols)) {
    if (fields[key] !== undefined && !setClauses.some((c) => c.startsWith(`${col} =`))) {
      values.push(fields[key]);
      setClauses.push(`${col} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return await findById(id);
  }

  values.push(id);

  const query = `
    UPDATE workdash.recurring_routines
    SET ${setClauses.join(", ")}
    WHERE id = $${values.length}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete a recurring routine
 */
export async function deleteRoutine(id) {
  const result = await pool.query(
    "DELETE FROM workdash.recurring_routines WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}
