import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as routinesService from "@/modules/recurring-routines/recurring-routines.service";

/**
 * POST /api/recurring-routines/:id/log - 1-Click quick log time on a recurring routine
 */
export async function POST(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const routineId = params?.id;
    if (!routineId) {
      return NextResponse.json({ error: "Routine ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await routinesService.logRoutineHours(authUserId, routineId, body);

    return NextResponse.json(
      {
        status: "success",
        ...result,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[recurringRoutines.log] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to log routine hours" },
      { status: 500 }
    );
  }
}
