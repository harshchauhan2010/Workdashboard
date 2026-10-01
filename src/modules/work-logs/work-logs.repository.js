import pool from "@/lib/db";

// Find all work logs with filters (developer/user, task, squad, date)
export async function findAll(filters = {}) {
  let query = `
    SELECT 
      wl.*,
      u.full_name,
      u.email,
      u.role_title,
      t.title AS task_title,
      t.category AS task_category,
      t.priority AS task_priority,
      t.task_type,
      t.squad_id,
      COALESCE(s.badge_code, 'ALPHA') AS squad_badge_code,
      s.name AS squad_name
    FROM workdash.work_logs wl
    JOIN workdash.users u ON wl.user_id = u.id
    JOIN workdash.tasks t ON wl.task_id = t.id
    LEFT JOIN workdash.squads s ON t.squad_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.userId) {
    params.push(filters.userId);
    query += ` AND wl.user_id = $${params.length}`;
  }

  if (filters.taskId) {
    params.push(filters.taskId);
    query += ` AND wl.task_id = $${params.length}`;
  }

  if (filters.fromDate) {
    params.push(filters.fromDate);
    query += ` AND wl.log_timestamp >= $${params.length}`;
  }

  if (filters.toDate) {
    params.push(filters.toDate);
    query += ` AND wl.log_timestamp <= $${params.length}`;
  }

  query += ` ORDER BY wl.log_timestamp DESC`;

  if (filters.limit) {
    params.push(filters.limit);
    query += ` LIMIT $${params.length}`;
  }

  const result = await pool.query(query, params);
  return result.rows;
}

// Find all work logs for a specific task
export async function findByTaskId(taskId) {
  const result = await pool.query(
    `SELECT 
       wl.*,
       u.full_name,
       u.email,
       u.role_title
     FROM workdash.work_logs wl
     JOIN workdash.users u ON wl.user_id = u.id
     WHERE wl.task_id = $1
     ORDER BY wl.log_timestamp DESC`,
    [taskId]
  );
  return result.rows;
}

// Find all work logs for a specific user with optional date range filters
export async function findByUserId(userId, filters = {}) {
  let query = `
    SELECT 
      wl.*,
      t.title AS task_title,
      t.category AS task_category,
      t.priority AS task_priority,
      t.squad_id,
      s.name AS squad_name,
      s.badge_code AS squad_badge_code
    FROM workdash.work_logs wl
    JOIN workdash.tasks t ON wl.task_id = t.id
    JOIN workdash.squads s ON t.squad_id = s.id
    WHERE wl.user_id = $1
  `;
  const params = [userId];

  if (filters.fromDate) {
    params.push(filters.fromDate);
    query += ` AND wl.log_timestamp >= $${params.length}`;
  }

  if (filters.toDate) {
    params.push(filters.toDate);
    query += ` AND wl.log_timestamp <= $${params.length}`;
  }

  query += ` ORDER BY wl.log_timestamp DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

// Find single work log by ID
export async function findById(id) {
  const result = await pool.query(
    `SELECT 
       wl.*,
       u.full_name,
       u.email,
       t.title AS task_title
     FROM workdash.work_logs wl
     JOIN workdash.users u ON wl.user_id = u.id
     JOIN workdash.tasks t ON wl.task_id = t.id
     WHERE wl.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Create new work log
export async function createWorkLog({ taskId, userId, hours, notes, logTimestamp }) {
  const result = await pool.query(
    `INSERT INTO workdash.work_logs (task_id, user_id, hours, notes, log_timestamp)
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP))
     RETURNING *`,
    [taskId, userId, hours, notes, logTimestamp || null]
  );
  return result.rows[0];
}

// Delete a work log
export async function deleteWorkLog(id) {
  const result = await pool.query(
    "DELETE FROM workdash.work_logs WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}
