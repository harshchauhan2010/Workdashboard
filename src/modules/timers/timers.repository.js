import pool from "@/lib/db";

// Find active timer for a user with joined task and squad metadata
export async function findByUserId(userId) {
  const result = await pool.query(
    `SELECT 
       at.*,
       t.title AS task_title,
       t.status AS task_status,
       t.is_blocked,
       t.estimated_hours,
       t.logged_hours,
       s.id AS squad_id,
       s.name AS squad_name,
       s.badge_code
     FROM workdash.active_timers at
     JOIN workdash.tasks t ON at.task_id = t.id
     JOIN workdash.squads s ON t.squad_id = s.id
     WHERE at.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

// Find timer by ID
export async function findById(id) {
  const result = await pool.query(
    `SELECT 
       at.*,
       t.title AS task_title,
       t.status AS task_status,
       t.is_blocked
     FROM workdash.active_timers at
     JOIN workdash.tasks t ON at.task_id = t.id
     WHERE at.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Start new timer
export async function startTimer({ userId, taskId }) {
  const result = await pool.query(
    `INSERT INTO workdash.active_timers (user_id, task_id, seconds_elapsed, is_running, started_at)
     VALUES ($1, $2, 0, true, CURRENT_TIMESTAMP)
     RETURNING *`,
    [userId, taskId]
  );
  return result.rows[0];
}

// Update timer state (pause, resume, or update seconds)
export async function updateTimer(userId, { secondsElapsed, isRunning }) {
  const result = await pool.query(
    `UPDATE workdash.active_timers
     SET seconds_elapsed = COALESCE($2, seconds_elapsed),
         is_running = COALESCE($3, is_running)
     WHERE user_id = $1
     RETURNING *`,
    [userId, secondsElapsed !== undefined ? secondsElapsed : null, isRunning !== undefined ? isRunning : null]
  );
  return result.rows[0] || null;
}

// Delete active timer for a user (stop / discard)
export async function deleteTimer(userId) {
  const result = await pool.query(
    `DELETE FROM workdash.active_timers
     WHERE user_id = $1
     RETURNING *`,
    [userId]
  );
  return result.rows[0] || null;
}
