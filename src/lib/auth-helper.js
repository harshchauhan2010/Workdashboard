import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";

// Helper to get authenticated user ID from Clerk or local dev header
export async function getAuthUserId(request) {
  // 1. Check real Clerk session
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch (err) {
    // Auth context not available
  }

  // 2. Development testing support for Postman
  if (process.env.NODE_ENV !== "production" && request) {
    const devUserId = request.headers.get("x-dev-user-id");
    if (devUserId) return devUserId;

    if (request.headers.get("x-dev-user") === "true") {
      try {
        const result = await pool.query(
          "SELECT clerk_id FROM users WHERE is_active = true ORDER BY created_at ASC LIMIT 1"
        );
        if (result.rows[0]?.clerk_id) {
          return result.rows[0].clerk_id;
        }
      } catch (e) {
        // Fallback if db query fails
      }
      return "user_dev_test_fallback";
    }
  }

  return null;
}
