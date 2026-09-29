import pool from "@/lib/db";

// Get all assignments for a task with user details
export async function findByTaskId(taskId) {
  const result = await pool.query(
    `SELECT 
       ta.*,
       u.full_name,
       u.email,
       u.role_title,
       u.seniority,
       u.skills
     FROM workdash.task_assignments ta
     JOIN workdash.users u ON ta.user_id = u.id
     WHERE ta.task_id = $1
     ORDER BY ta.assigned_at ASC`,
    [taskId]
  );
  return result.rows;
}

// Get single assignment by ID
export async function findById(id) {
  const result = await pool.query(
    `SELECT 
       ta.*,
       u.full_name,
       u.email,
       u.role_title
     FROM workdash.task_assignments ta
     JOIN workdash.users u ON ta.user_id = u.id
     WHERE ta.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Upsert assignment (insert or update on conflict)
export async function upsertAssignment({ taskId, userId, assignedHours, splitMode }) {
  const result = await pool.query(
    `INSERT INTO workdash.task_assignments (task_id, user_id, assigned_hours, split_mode)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (task_id, user_id) 
     DO UPDATE SET 
       assigned_hours = EXCLUDED.assigned_hours,
       split_mode = EXCLUDED.split_mode,
       assigned_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [taskId, userId, assignedHours, splitMode || "SINGLE_DEVELOPER"]
  );
  return result.rows[0];
}

// Delete assignment by ID
export async function deleteAssignment(id) {
  const result = await pool.query(
    "DELETE FROM workdash.task_assignments WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

// Delete all assignments for a task
export async function deleteByTaskId(taskId) {
  const result = await pool.query(
    "DELETE FROM workdash.task_assignments WHERE task_id = $1 RETURNING *",
    [taskId]
  );
  return result.rows;
}
