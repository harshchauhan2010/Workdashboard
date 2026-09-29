import pool from "@/lib/db";

// Get all active users ordered by name
export async function findAllActive() {
  const result = await pool.query(
    `SELECT 
      id, clerk_id, full_name, email, role_title, system_role,
      seniority, weekly_capacity_hours, recurring_overhead_hours,
      skills, is_active, created_at, updated_at
    FROM users 
    WHERE is_active = true 
    ORDER BY full_name ASC`
  );
  return result.rows;
}

// Get single user by internal UUID
export async function findById(id) {
  const result = await pool.query(
    `SELECT 
      id, clerk_id, full_name, email, role_title, system_role,
      seniority, weekly_capacity_hours, recurring_overhead_hours,
      skills, is_active, created_at, updated_at
    FROM users 
    WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

// Get user by Clerk ID
export async function findByClerkId(clerkId) {
  const result = await pool.query(
    `SELECT 
      id, clerk_id, full_name, email, role_title, system_role,
      seniority, weekly_capacity_hours, recurring_overhead_hours,
      skills, is_active, created_at, updated_at
    FROM users 
    WHERE clerk_id = $1`,
    [clerkId]
  );
  return result.rows[0] ?? null;
}

// Get user by email
export async function findByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  return result.rows[0] ?? null;
}

// Count total users in database
export async function countUsers() {
  const result = await pool.query("SELECT COUNT(*) as count FROM users");
  return parseInt(result.rows[0].count, 10);
}

// Create a new user profile
export async function createUser(data) {
  const result = await pool.query(
    `INSERT INTO users (
      clerk_id, full_name, email, role_title, system_role,
      seniority, weekly_capacity_hours, recurring_overhead_hours, skills
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      data.clerk_id,
      data.full_name,
      data.email,
      data.role_title,
      data.system_role,
      data.seniority,
      data.weekly_capacity_hours,
      data.recurring_overhead_hours,
      data.skills,
    ]
  );
  return result.rows[0];
}

// Update user fields dynamically (PATCH)
export async function updateUser(id, data) {
  const fields = [];
  const values = [];
  let index = 1;

  const allowedFields = [
    "full_name",
    "email",
    "role_title",
    "system_role",
    "seniority",
    "weekly_capacity_hours",
    "recurring_overhead_hours",
    "skills",
    "is_active",
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${index}`);
      values.push(data[field]);
      index++;
    }
  }

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE users 
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] ?? null;
}

// Soft delete / deactivate user
export async function deactivateUser(id) {
  const result = await pool.query(
    `UPDATE users 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}
