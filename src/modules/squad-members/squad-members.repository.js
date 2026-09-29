import pool from "@/lib/db";

// Get active members of a squad
export async function findActiveBySquadId(squadId) {
  const result = await pool.query(
    `SELECT 
      sm.id,
      sm.squad_id,
      sm.user_id,
      sm.allocation_percentage,
      sm.joined_at,
      sm.left_at,
      u.full_name,
      u.email,
      u.seniority,
      u.role_title,
      u.skills,
      u.weekly_capacity_hours
    FROM squad_members sm
    JOIN users u ON u.id = sm.user_id
    WHERE sm.squad_id = $1 AND sm.left_at IS NULL AND u.is_active = true
    ORDER BY sm.joined_at ASC`,
    [squadId]
  );
  return result.rows;
}

// Get single membership row by ID
export async function findById(memberId) {
  const result = await pool.query(
    `SELECT 
      sm.id,
      sm.squad_id,
      sm.user_id,
      sm.allocation_percentage,
      sm.joined_at,
      sm.left_at,
      u.full_name,
      u.email,
      u.seniority,
      u.role_title,
      s.name AS squad_name,
      s.badge_code AS squad_badge_code
    FROM squad_members sm
    JOIN users u ON u.id = sm.user_id
    JOIN squads s ON s.id = sm.squad_id
    WHERE sm.id = $1`,
    [memberId]
  );
  return result.rows[0] ?? null;
}

// Find membership by squad_id and user_id (active or inactive)
export async function findBySquadAndUser(squadId, userId) {
  const result = await pool.query(
    `SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2`,
    [squadId, userId]
  );
  return result.rows[0] ?? null;
}

// Add user to squad (or reactivate if previously left)
export async function addMember(squadId, userId, allocationPercentage) {
  const existing = await findBySquadAndUser(squadId, userId);

  if (existing) {
    if (existing.left_at === null) {
      throw new Error("User is already an active member of this squad");
    }
    // Reactivate previously left membership
    const updated = await pool.query(
      `UPDATE squad_members 
       SET allocation_percentage = $1, joined_at = CURRENT_TIMESTAMP, left_at = NULL 
       WHERE id = $2 
       RETURNING *`,
      [allocationPercentage, existing.id]
    );
    return updated.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO squad_members (squad_id, user_id, allocation_percentage)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [squadId, userId, allocationPercentage]
  );
  return result.rows[0];
}

// Update allocation percentage
export async function updateAllocation(memberId, allocationPercentage) {
  const result = await pool.query(
    `UPDATE squad_members 
     SET allocation_percentage = $1 
     WHERE id = $2 AND left_at IS NULL 
     RETURNING *`,
    [allocationPercentage, memberId]
  );
  return result.rows[0] ?? null;
}

// Soft remove member from squad
export async function removeMember(memberId) {
  const result = await pool.query(
    `UPDATE squad_members 
     SET left_at = CURRENT_TIMESTAMP 
     WHERE id = $1 AND left_at IS NULL 
     RETURNING *`,
    [memberId]
  );
  return result.rows[0] ?? null;
}

// Get all squads a user belongs to
export async function findSquadsByUserId(userId) {
  const result = await pool.query(
    `SELECT 
      sm.id AS membership_id,
      sm.squad_id,
      sm.allocation_percentage,
      sm.joined_at,
      s.name AS squad_name,
      s.badge_code,
      s.focus_domain,
      s.health
    FROM squad_members sm
    JOIN squads s ON s.id = sm.squad_id
    WHERE sm.user_id = $1 AND sm.left_at IS NULL AND s.is_active = true
    ORDER BY sm.joined_at ASC`,
    [userId]
  );
  return result.rows;
}
