import pool from "@/lib/db";

// List all unresolved blockers with task, squad, and reporter context (Manager View)
export async function findAllUnresolved() {
  const result = await pool.query(
    `SELECT 
       tb.*,
       t.title AS task_title,
       s.name AS squad_name,
       s.badge_code,
       u.full_name AS reporter_name,
       u.email AS reporter_email
     FROM workdash.task_blockers tb
     JOIN workdash.tasks t ON tb.task_id = t.id
     JOIN workdash.squads s ON t.squad_id = s.id
     JOIN workdash.users u ON tb.reported_by_user_id = u.id
     WHERE tb.is_resolved = false
     ORDER BY 
       CASE tb.severity WHEN 'CRITICAL_BLOCKER' THEN 1 ELSE 2 END,
       tb.created_at DESC`
  );
  return result.rows;
}

// List all blockers for a specific task
export async function findByTaskId(taskId) {
  const result = await pool.query(
    `SELECT 
       tb.*,
       u.full_name AS reporter_name,
       u.email AS reporter_email,
       ru.full_name AS resolver_name
     FROM workdash.task_blockers tb
     JOIN workdash.users u ON tb.reported_by_user_id = u.id
     LEFT JOIN workdash.users ru ON tb.resolved_by_user_id = ru.id
     WHERE tb.task_id = $1
     ORDER BY tb.created_at DESC`,
    [taskId]
  );
  return result.rows;
}

// Find single blocker by ID
export async function findById(id) {
  const result = await pool.query(
    `SELECT 
       tb.*,
       t.title AS task_title,
       s.name AS squad_name,
       s.badge_code,
       u.full_name AS reporter_name,
       u.email AS reporter_email,
       ru.full_name AS resolver_name,
       ru.email AS resolver_email
     FROM workdash.task_blockers tb
     JOIN workdash.tasks t ON tb.task_id = t.id
     JOIN workdash.squads s ON t.squad_id = s.id
     JOIN workdash.users u ON tb.reported_by_user_id = u.id
     LEFT JOIN workdash.users ru ON tb.resolved_by_user_id = ru.id
     WHERE tb.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Create new blocker
export async function createBlocker({
  taskId,
  reportedByUserId,
  category = "TECHNICAL_IMPEDIMENT",
  severity = "CRITICAL_BLOCKER",
  reason,
  businessImpact,
  mitigationAction = null,
  expectedResolutionDate = null,
}) {
  const result = await pool.query(
    `INSERT INTO workdash.task_blockers (
       task_id,
       reported_by_user_id,
       category,
       severity,
       reason,
       business_impact,
       mitigation_action,
       expected_resolution_date
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      taskId,
      reportedByUserId,
      category,
      severity,
      reason,
      businessImpact,
      mitigationAction,
      expectedResolutionDate,
    ]
  );
  return result.rows[0];
}

// Resolve an existing blocker
export async function resolveBlocker(id, { resolvedByUserId, mitigationAction = null }) {
  const result = await pool.query(
    `UPDATE workdash.task_blockers
     SET is_resolved = true,
         resolved_at = CURRENT_TIMESTAMP,
         resolved_by_user_id = $2,
         mitigation_action = COALESCE($3, mitigation_action),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id, resolvedByUserId, mitigationAction]
  );
  return result.rows[0] || null;
}

// Delete blocker
export async function deleteBlocker(id) {
  const result = await pool.query(
    `DELETE FROM workdash.task_blockers
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}
