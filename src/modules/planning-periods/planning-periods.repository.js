import pool from "@/lib/db";

/**
 * Find all planning periods ordered by start_date DESC
 */
export async function findAllPeriods() {
  const result = await pool.query(
    `SELECT *
     FROM workdash.planning_periods
     ORDER BY start_date DESC, created_at DESC`
  );
  return result.rows;
}

/**
 * Find the currently active planning period (is_current = true)
 */
export async function findCurrentPeriod() {
  const result = await pool.query(
    `SELECT *
     FROM workdash.planning_periods
     WHERE is_current = true
     LIMIT 1`
  );
  return result.rows[0] || null;
}

/**
 * Find a planning period by UUID
 */
export async function findById(id) {
  const result = await pool.query(
    `SELECT *
     FROM workdash.planning_periods
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new planning period.
 * If isCurrent is true, resets all other periods' is_current to false in a transaction.
 */
export async function createPeriod({ name, startDate, endDate, isCurrent = false }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (isCurrent) {
      await client.query(
        "UPDATE workdash.planning_periods SET is_current = false WHERE is_current = true"
      );
    }

    const result = await client.query(
      `INSERT INTO workdash.planning_periods (name, start_date, end_date, is_current)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, startDate, endDate, Boolean(isCurrent)]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Atomically switch the active planning period.
 * Sets all periods to is_current = false and flags target id as is_current = true.
 */
export async function setCurrentPeriod(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE workdash.planning_periods SET is_current = false WHERE is_current = true"
    );

    const result = await client.query(
      `UPDATE workdash.planning_periods
       SET is_current = true
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Update planning period fields
 */
export async function updatePeriod(id, fields = {}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (fields.is_current === true || fields.isCurrent === true) {
      await client.query(
        "UPDATE workdash.planning_periods SET is_current = false WHERE is_current = true"
      );
    }

    const allowedCols = {
      name: "name",
      start_date: "start_date",
      startDate: "start_date",
      end_date: "end_date",
      endDate: "end_date",
      is_current: "is_current",
      isCurrent: "is_current",
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
      await client.query("COMMIT");
      return await findById(id);
    }

    values.push(id);

    const query = `
      UPDATE workdash.planning_periods
      SET ${setClauses.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await client.query(query, values);
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Delete a planning period
 */
export async function deletePeriod(id) {
  const result = await pool.query(
    "DELETE FROM workdash.planning_periods WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}
