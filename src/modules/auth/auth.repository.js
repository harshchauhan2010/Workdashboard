import pool from "@/lib/db";

/**
 * Find user by Clerk ID
 */
export async function findUserByClerkId(clerkId) {
  const result = await pool.query(
    `SELECT 
      id,
      clerk_id,
      full_name,
      email,
      role_title,
      system_role,
      seniority,
      weekly_capacity_hours,
      recurring_overhead_hours,
      skills,
      is_active,
      created_at,
      updated_at
    FROM users 
    WHERE clerk_id = $1`,
    [clerkId]
  );
  return result.rows[0] ?? null;
}
