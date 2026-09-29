import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import { getCurrentUser } from "./auth.service.js";

// GET /api/auth/me - Get current logged-in user profile
export async function getMeController(request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCurrentUser(userId);
    if (!user) {
      return NextResponse.json(
        { 
          error: "User not found in database",
          clerk_id: userId,
          message: "No matching profile found in database."
        },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "User account is deactivated" }, { status: 403 });
    }

    return NextResponse.json({
      status: "success",
      data: user,
    });
  } catch (err) {
    console.error("[auth.controller.getMeController] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
