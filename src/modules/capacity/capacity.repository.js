import pool from "@/lib/db";

/**
 * Get all developer capacity summaries from database view
 */
export async function getDeveloperCapacitySummaries(filters = {}) {
  let query = `
    SELECT *
    FROM workdash.v_developer_capacity_summary
    WHERE 1=1
  `;
  const params = [];

  if (filters.squadId) {
    params.push(filters.squadId);
    query += ` AND squad_id = $${params.length}`;
  }

  query += ` ORDER BY utilization_pct DESC, full_name ASC`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get capacity summary for a specific developer by ID
 */
export async function getDeveloperCapacityById(userId) {
  const result = await pool.query(
    `SELECT *
     FROM workdash.v_developer_capacity_summary
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Get all squad capacity summaries from database view
 */
export async function getSquadCapacitySummaries(filters = {}) {
  let query = `
    SELECT *
    FROM workdash.v_squad_capacity_summary
    WHERE 1=1
  `;
  const params = [];

  if (filters.squadId) {
    params.push(filters.squadId);
    query += ` AND squad_id = $${params.length}`;
  }

  query += ` ORDER BY squad_utilization_pct DESC, squad_name ASC`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get squad capacity summary by squad ID
 */
export async function getSquadCapacityById(squadId) {
  const result = await pool.query(
    `SELECT *
     FROM workdash.v_squad_capacity_summary
     WHERE squad_id = $1`,
    [squadId]
  );
  return result.rows[0] || null;
}
