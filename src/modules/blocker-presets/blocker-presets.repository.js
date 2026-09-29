import pool from "@/lib/db";

// Find all blocker presets created by manager
export async function findAll() {
  const result = await pool.query(
    `SELECT * FROM workdash.blocker_presets ORDER BY label ASC`
  );
  return result.rows;
}

// Find single preset by key_slug
export async function findBySlug(keySlug) {
  const result = await pool.query(
    `SELECT * FROM workdash.blocker_presets WHERE key_slug = $1`,
    [keySlug]
  );
  return result.rows[0] || null;
}

// Find single preset by ID
export async function findById(id) {
  const result = await pool.query(
    `SELECT * FROM workdash.blocker_presets WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Create new blocker preset template (Manager Action)
export async function createPreset({
  keySlug,
  label,
  category = "TECHNICAL_IMPEDIMENT",
  severity = "CRITICAL_BLOCKER",
  descriptionTemplate,
  impactTemplate,
  mitigationTemplate,
}) {
  const result = await pool.query(
    `INSERT INTO workdash.blocker_presets (
       key_slug,
       label,
       category,
       severity,
       description_template,
       impact_template,
       mitigation_template
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      keySlug,
      label,
      category,
      severity,
      descriptionTemplate,
      impactTemplate,
      mitigationTemplate,
    ]
  );
  return result.rows[0];
}

// Delete a blocker preset by ID or slug
export async function deletePreset(identifier) {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      identifier
    );

  const query = isUuid
    ? `DELETE FROM workdash.blocker_presets WHERE id = $1 RETURNING *`
    : `DELETE FROM workdash.blocker_presets WHERE key_slug = $1 RETURNING *`;

  const result = await pool.query(query, [identifier]);
  return result.rows[0] || null;
}
