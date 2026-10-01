import pool from "@/lib/db";

/**
 * Find routines by user ID with joined squad metadata and dynamic logged_hours calculation
 */
export async function findRoutinesByUserId(userId) {
  let result = await pool.query(
    `SELECT 
       r.*,
       s.name AS squad_name,
       s.badge_code AS squad_badge_code,
       u.full_name AS developer_name,
       u.email AS developer_email,
       COALESCE((
         SELECT SUM(wl.hours)
         FROM workdash.work_logs wl
         JOIN workdash.tasks t ON wl.task_id = t.id
         WHERE wl.user_id = r.user_id 
           AND (
             t.title ILIKE '%' || r.title || '%' 
             OR r.title ILIKE '%' || t.title || '%'
             OR (t.task_type = 'RECURRING_ROUTINE' AND t.recurrence_frequency::text = r.frequency::text)
           )
       ), 0.0) AS logged_hours
     FROM workdash.recurring_routines r
     JOIN workdash.users u ON r.user_id = u.id
     LEFT JOIN workdash.squads s ON r.squad_id = s.id
     WHERE r.user_id = $1
     ORDER BY r.created_at ASC`,
    [userId]
  );

  // If developer has no routines in the database yet, auto-seed baseline routine rows
  if (result.rows.length === 0) {
    const defaultRoutines = [
      { title: "Daily Standup & Squad Sync", frequency: "DAILY", schedule_label: "Every day · 9:30 AM", allocated_hours: 2.5 },
      { title: "PR Reviews & Mentoring Devs", frequency: "DAILY", schedule_label: "Every afternoon · 4:00 PM", allocated_hours: 3.5 },
      { title: "Sprint Planning & Backlog Grooming", frequency: "WEEKLY", schedule_label: "Mondays · 11:00 AM", allocated_hours: 1.0 },
      { title: "Backend Architecture & API Sync", frequency: "WEEKLY", schedule_label: "Thursdays · 3:00 PM", allocated_hours: 1.0 },
      { title: "Engineering All-Hands Meeting", frequency: "MONTHLY", schedule_label: "1st Monday of month", allocated_hours: 2.0 },
      { title: "Quarterly OKR Review", frequency: "MONTHLY", schedule_label: "Last Friday of month", allocated_hours: 1.5 },
    ];

    for (const dr of defaultRoutines) {
      await pool.query(
        `INSERT INTO workdash.recurring_routines (user_id, title, frequency, schedule_label, allocated_hours)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, dr.title, dr.frequency, dr.schedule_label, dr.allocated_hours]
      );
    }

    result = await pool.query(
      `SELECT 
         r.*,
         s.name AS squad_name,
         s.badge_code AS squad_badge_code,
         u.full_name AS developer_name,
         u.email AS developer_email,
         0.0 AS logged_hours
       FROM workdash.recurring_routines r
       JOIN workdash.users u ON r.user_id = u.id
       LEFT JOIN workdash.squads s ON r.squad_id = s.id
       WHERE r.user_id = $1
       ORDER BY r.created_at ASC`,
      [userId]
    );
  }

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
       u.email AS developer_email,
       COALESCE((
         SELECT SUM(wl.hours)
         FROM workdash.work_logs wl
         JOIN workdash.tasks t ON wl.task_id = t.id
         WHERE wl.user_id = r.user_id 
           AND (
             t.title ILIKE '%' || r.title || '%' 
             OR r.title ILIKE '%' || t.title || '%'
             OR (t.task_type = 'RECURRING_ROUTINE' AND t.recurrence_frequency::text = r.frequency::text)
           )
       ), 0.0) AS logged_hours
     FROM workdash.recurring_routines r
     JOIN workdash.users u ON r.user_id = u.id
     LEFT JOIN workdash.squads s ON r.squad_id = s.id
     WHERE r.title IS NOT NULL AND TRIM(r.title) != ''
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
    params.push(filters.frequency.toUpperCase());
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
  const cleanTitle = (title || "").trim();

  // Deduplicate: check if routine with same title already exists for this user
  if (userId && cleanTitle) {
    const existing = await pool.query(
      `SELECT id FROM workdash.recurring_routines WHERE user_id = $1 AND title ILIKE $2 LIMIT 1`,
      [userId, cleanTitle]
    );
    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE workdash.recurring_routines
         SET frequency = COALESCE($1, frequency),
             schedule_label = COALESCE($2, schedule_label),
             allocated_hours = COALESCE($3, allocated_hours),
             squad_id = COALESCE($4, squad_id)
         WHERE id = $5
         RETURNING *`,
        [frequency, scheduleLabel, allocatedHours, squadId, existing.rows[0].id]
      );
      return updated.rows[0];
    }
  }

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
      cleanTitle,
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
 * Log work hours against a recurring routine
 */
export async function logRoutineTime({ userId, routineId, hours, notes }) {
  const routine = await findById(routineId);
  if (!routine) return null;

  // Resolve squad_id to satisfy NOT NULL constraint on workdash.tasks
  let squadId = routine.squad_id;
  if (!squadId && userId) {
    const userSquadRes = await pool.query(
      `SELECT squad_id FROM workdash.squad_members WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (userSquadRes.rows.length > 0) {
      squadId = userSquadRes.rows[0].squad_id;
    }
  }
  if (!squadId) {
    const anySquadRes = await pool.query(`SELECT id FROM workdash.squads LIMIT 1`);
    if (anySquadRes.rows.length > 0) {
      squadId = anySquadRes.rows[0].id;
    }
  }

  // Find or create matching recurring task deliverable in tasks table
  let routineTask = await pool.query(
    `SELECT id FROM workdash.tasks WHERE title = $1 AND task_type = 'RECURRING_ROUTINE' LIMIT 1`,
    [routine.title]
  );

  let taskId;
  if (routineTask.rows.length > 0) {
    taskId = routineTask.rows[0].id;
  } else {
    const inserted = await pool.query(
      `INSERT INTO workdash.tasks (title, description, task_type, recurrence_frequency, status, estimated_hours, squad_id, assigned_by_user_id)
       VALUES ($1, $2, 'RECURRING_ROUTINE', $3, 'COMPLETED', $4, $5, $6) RETURNING id`,
      [
        routine.title,
        `Automated routine tracking for ${routine.title}`,
        routine.frequency,
        routine.allocated_hours || hours,
        squadId,
        userId || null,
      ]
    );
    taskId = inserted.rows[0].id;
  }

  // Insert into workdash.work_logs
  const logResult = await pool.query(
    `INSERT INTO workdash.work_logs (task_id, user_id, hours, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [taskId, userId, hours, notes]
  );

  return logResult.rows[0];
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
