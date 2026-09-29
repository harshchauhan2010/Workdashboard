// Route: GET /api/health
// Comprehensive DB diagnostic — shows connection status, schema, and all tables.
// Visit http://localhost:3000/api/health in your browser anytime to verify.

import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // 1. Basic connectivity check — get DB server time
    const timeResult = await pool.query("SELECT NOW() as db_time");

    // 2. Which database + schema are we connected to?
    const dbResult = await pool.query(
      "SELECT current_database() as database, current_schema() as active_schema"
    );
    // SHOW search_path must be a standalone query (not inside SELECT)
    const searchPathResult = await pool.query("SHOW search_path");
    return NextResponse.json({
      status: "✅ Connected",
      db_time: timeResult.rows[0].db_time,
      connected_to: {
        database: dbResult.rows[0].database,
        active_schema: dbResult.rows[0].active_schema,
        search_path: searchPathResult.rows[0].search_path,
      },
    });
  } catch (error) {
    console.error("[health] DB error:", error);
    return NextResponse.json(
      { status: "❌ Error", message: error.message },
      { status: 500 }
    );
  }
}
