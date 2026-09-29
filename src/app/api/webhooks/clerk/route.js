import { headers } from "next/headers";
import { Webhook } from "svix";
import pool from "@/lib/db";
import { ROLE_DEFAULTS } from "@/modules/users/users.service";

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || process.env.SIGNING_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("[webhooks/clerk] Error: Missing CLERK_WEBHOOK_SECRET in environment variables.");
    return new Response("Missing CLERK_WEBHOOK_SECRET in .env.local", { status: 500 });
  }

  // 1. Retrieve Svix cryptographic headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing required Svix verification headers", { status: 400 });
  }

  // 2. Get payload as JSON and stringify for accurate cryptographic verification
  let payload;
  try {
    payload = await req.json();
  } catch (parseErr) {
    return new Response("Invalid JSON payload", { status: 400 });
  }
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("[webhooks/clerk] Signature verification failed:", err.message);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  // Fallback to parsed payload if evt is not an object
  if (!evt || typeof evt !== "object") {
    evt = payload;
  }

  const eventType = evt.type;
  const data = evt.data || {};
  const clerkId = data.id;

  console.log(`[webhooks/clerk] 🔔 Received verified event: "${eventType}" for Clerk User ID: ${clerkId}`);

  try {
    // ---------------------------------------------------------------------------
    // EVENT 1: user.created (User registers in Clerk)
    // ---------------------------------------------------------------------------
    if (eventType === "user.created") {
      const email = data.email_addresses?.[0]?.email_address?.toLowerCase()?.trim();
      const firstName = data.first_name || "";
      const lastName = data.last_name || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || email?.split("@")[0] || "Team Member";
      const rolePref = (data.public_metadata?.role || data.unsafe_metadata?.role || "DEVELOPER").toUpperCase();
      const systemRole = rolePref === "MANAGER" ? "MANAGER" : "DEVELOPER";
      const defaults = ROLE_DEFAULTS[systemRole] || ROLE_DEFAULTS.DEVELOPER;

      if (email) {
        // Check if user already exists by email or clerk_id
        const existingRes = await pool.query(
          "SELECT id FROM workdash.users WHERE LOWER(email) = LOWER($1) OR clerk_id = $2",
          [email, clerkId]
        );

        if (existingRes.rows.length > 0) {
          // Update existing user with new clerk_id
          await pool.query(
            `UPDATE workdash.users 
             SET clerk_id = $1, full_name = $2, is_active = true, updated_at = NOW()
             WHERE id = $3`,
            [clerkId, fullName, existingRes.rows[0].id]
          );
          console.log(`[webhooks/clerk] ✅ Linked existing PostgreSQL user: ${fullName} (${email}) to Clerk ID: ${clerkId}`);
        } else {
          // Insert new user into PostgreSQL
          await pool.query(
            `INSERT INTO workdash.users (
              clerk_id, email, full_name, system_role, role_title, seniority,
              weekly_capacity_hours, recurring_overhead_hours, skills, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
            [
              clerkId,
              email,
              fullName,
              systemRole,
              defaults.role_title,
              defaults.seniority,
              defaults.weekly_capacity_hours,
              defaults.recurring_overhead_hours,
              defaults.skills,
            ]
          );
          console.log(`[webhooks/clerk] ✨ Inserted new user into PostgreSQL: ${fullName} (${email})`);
        }
      }
    }

    // ---------------------------------------------------------------------------
    // EVENT 2: user.updated (User updates name/email/role in Clerk)
    // ---------------------------------------------------------------------------
    if (eventType === "user.updated") {
      const email = data.email_addresses?.[0]?.email_address?.toLowerCase()?.trim();
      const firstName = data.first_name || "";
      const lastName = data.last_name || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || (email ? email.split("@")[0] : null);
      const rolePref = (data.public_metadata?.role || data.unsafe_metadata?.role)?.toUpperCase();

      let query = "UPDATE workdash.users SET updated_at = NOW()";
      const params = [];

      if (fullName) {
        params.push(fullName);
        query += `, full_name = $${params.length}`;
      }
      if (email) {
        params.push(email);
        query += `, email = $${params.length}`;
      }
      if (rolePref && (rolePref === "MANAGER" || rolePref === "DEVELOPER")) {
        params.push(rolePref);
        query += `, system_role = $${params.length}`;
      }

      params.push(clerkId);
      query += ` WHERE clerk_id = $${params.length}`;

      await pool.query(query, params);
      console.log(`[webhooks/clerk] 🔄 Updated profile in PostgreSQL for Clerk ID: ${clerkId} (${fullName})`);
    }

    // ---------------------------------------------------------------------------
    // EVENT 3: user.deleted (Soft-Delete user in PostgreSQL)
    // ---------------------------------------------------------------------------
    if (eventType === "user.deleted") {
      // Soft delete: Mark user as inactive (preserves historical work logs, tasks, and sprint metrics)
      const updateRes = await pool.query(
        `UPDATE workdash.users 
         SET is_active = false, updated_at = NOW() 
         WHERE clerk_id = $1 
         RETURNING id, full_name, email`,
        [clerkId]
      );

      if (updateRes.rows.length > 0) {
        console.log(`[webhooks/clerk] ⏸️ Soft-deleted (deactivated) user: ${updateRes.rows[0].full_name} (${clerkId})`);
      } else {
        console.log(`[webhooks/clerk] User with Clerk ID ${clerkId} was already inactive or not found.`);
      }
    }

    return new Response(JSON.stringify({ success: true, event: eventType }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (dbErr) {
    console.error("[webhooks/clerk] Database error processing event:", dbErr);
    return new Response("Internal Server Error processing webhook", { status: 500 });
  }
}
