import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as periodsService from "./planning-periods.service";

/**
 * GET /api/planning-periods - List all planning periods
 */
export async function listPeriodsController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const periods = await periodsService.getAllPeriods();
    return NextResponse.json({
      status: "success",
      count: periods.length,
      data: periods,
    });
  } catch (err) {
    console.error("[planningPeriods.controller.listPeriods] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/planning-periods/current - Get currently active planning period
 */
export async function getCurrentPeriodController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const current = await periodsService.getCurrentPeriod();
    if (!current) {
      return NextResponse.json(
        { status: "success", message: "No active planning period found", data: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: current,
    });
  } catch (err) {
    console.error("[planningPeriods.controller.getCurrentPeriod] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/planning-periods/:id - Get planning period by ID
 */
export async function getPeriodByIdController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Period ID is required" }, { status: 400 });
    }

    const period = await periodsService.getPeriodById(id);
    return NextResponse.json({
      status: "success",
      data: period,
    });
  } catch (err) {
    console.error("[planningPeriods.controller.getPeriodById] Error:", err);
    const statusCode = err.statusCode || (err.message === "Planning period not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/planning-periods - Create new planning period
 */
export async function createPeriodController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const created = await periodsService.createPeriod(authUserId, body);

    return NextResponse.json(
      {
        status: "success",
        message: "Planning period created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[planningPeriods.controller.createPeriod] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * PATCH /api/planning-periods/:id/set-current - Switch active sprint
 */
export async function setCurrentPeriodController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Period ID is required" }, { status: 400 });
    }

    const result = await periodsService.setCurrentPeriod(authUserId, id);
    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (err) {
    console.error("[planningPeriods.controller.setCurrentPeriod] Error:", err);
    const statusCode = err.statusCode || (err.message === "Planning period not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/planning-periods/:id - Update planning period
 */
export async function updatePeriodController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Period ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const updated = await periodsService.updatePeriod(authUserId, id, body);

    return NextResponse.json({
      status: "success",
      message: "Planning period updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("[planningPeriods.controller.updatePeriod] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/planning-periods/:id - Delete planning period
 */
export async function deletePeriodController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Period ID is required" }, { status: 400 });
    }

    const result = await periodsService.deletePeriod(authUserId, id);
    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (err) {
    console.error("[planningPeriods.controller.deletePeriod] Error:", err);
    const statusCode = err.statusCode || (err.message === "Planning period not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}
