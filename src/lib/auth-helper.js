import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";

/**
 * Robust helper to get authenticated user ID (Clerk ID).
 * Returns null if the user is signed out or unauthenticated.
 * 
 * Supports:
 * 1. Standard Clerk auth() session context
 * 2. Authorization Bearer JWT token decoding (verified unexpired)
 * 3. __session cookie fallback decoding (verified unexpired)
 * 4. Explicit x-dev-user-id / x-dev-user test headers for Postman/CLI
 */
export async function getAuthUserId(request) {
  // 1. Check real Clerk session
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch (err) {
    // Auth context not available or thrown
  }

  if (!request) return null;

  // 2. Check Authorization Bearer header
  try {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.slice(7).trim();
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
        const payload = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);
        // Reject if token is expired
        if (payload?.exp && payload.exp < now) {
          return null;
        }
        if (payload?.sub) {
          return payload.sub;
        }
      }
    }
  } catch (err) {
    // JWT parse failed
  }

  // 3. Check __session cookie from request
  try {
    let sessionToken = null;
    if (typeof request.cookies?.get === "function") {
      sessionToken = request.cookies.get("__session")?.value;
    } else {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/__session=([^;]+)/);
      if (match) sessionToken = match[1];
    }

    if (sessionToken) {
      const parts = sessionToken.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
        const payload = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);
        // Reject if cookie token is expired
        if (payload?.exp && payload.exp < now) {
          return null;
        }
        if (payload?.sub) {
          return payload.sub;
        }
      }
    }
  } catch (err) {
    // Cookie parse failed
  }

  // 4. Explicit developer testing support for automated tests / Postman
  if (process.env.NODE_ENV !== "production") {
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
      } catch (e) {}
      return "user_dev_test_fallback";
    }
  }

  // User is signed out / unauthenticated
  return null;
}
