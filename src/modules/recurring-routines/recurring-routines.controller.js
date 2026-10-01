import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as routinesService from "./recurring-routines.service";

/**
 * GET /api/recurring-routines/me - Get routines for current authenticated developer
 */
export async function getMyRoutinesController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const routines = await routinesService.getMyRoutines(authUserId);
    return NextResponse.json({
      status: "success",
      count: routines.length,
      data: routines,
    });
  } catch (err) {
    console.error("[recurringRoutines.controller.getMyRoutines] Error:", err);
    const statusCode = err.statusCode || (err.message === "User not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/recurring-routines - List routines with optional filters (?userId=, ?squadId=, ?frequency=)
 */
export async function listRoutinesController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId") || searchParams.get("user_id");
    const squadId = searchParams.get("squadId") || searchParams.get("squad_id");
    const frequency = searchParams.get("frequency");

    // Strictly scope routines to the authenticated developer if no explicit userId requested
    if (!userId) {
      const dbUser = await routinesService.resolveDbUser(authUserId);
      if (dbUser) {
        userId = dbUser.id;
      }
    }

    const routines = await routinesService.getAllRoutines({
      userId,
      squadId,
      frequency,
    });

    return NextResponse.json({
      status: "success",
      count: routines.length,
      data: routines,
    });
  } catch (err) {
    console.error("[recurringRoutines.controller.listRoutines] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recurring-routines/:id - Get single routine by ID
 */
export async function getRoutineByIdController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Routine ID is required" }, { status: 400 });
    }

    const routine = await routinesService.getRoutineById(id);
    return NextResponse.json({
      status: "success",
      data: routine,
    });
  } catch (err) {
    console.error("[recurringRoutines.controller.getRoutineById] Error:", err);
    const statusCode = err.statusCode || (err.message === "Recurring routine not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/recurring-routines - Create new recurring routine
 */
export async function createRoutineController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const created = await routinesService.createRoutine(authUserId, body);

    return NextResponse.json(
      {
        status: "success",
        message: "Recurring routine created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[recurringRoutines.controller.createRoutine] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/recurring-routines/:id - Update routine details
 */
export async function updateRoutineController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Routine ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const updated = await routinesService.updateRoutine(id, body);

    return NextResponse.json({
      status: "success",
      message: "Recurring routine updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("[recurringRoutines.controller.updateRoutine] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/recurring-routines/:id - Delete routine
 */
export async function deleteRoutineController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Routine ID is required" }, { status: 400 });
    }

    const result = await routinesService.deleteRoutine(id);
    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (err) {
    console.error("[recurringRoutines.controller.deleteRoutine] Error:", err);
    const statusCode = err.statusCode || (err.message === "Recurring routine not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}
