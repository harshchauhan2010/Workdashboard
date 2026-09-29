import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as squadsService from "./squads.service.js";
import { validateCreateSquad, validateUpdateSquad } from "./squads.validator.js";

// GET /api/squads - List all active squads
export async function listSquadsController(request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const squads = await squadsService.getAllActiveSquads();
    return NextResponse.json({
      status: "success",
      count: squads.length,
      data: squads,
    });
  } catch (err) {
    console.error("[squads.controller.listSquads] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// GET /api/squads/:id - Get squad details with active members and task stats
export async function getSquadByIdController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Squad ID is required" }, { status: 400 });
    }

    const squad = await squadsService.getSquadDetails(id);
    if (!squad) {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      data: squad,
    });
  } catch (err) {
    console.error("[squads.controller.getSquadById] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/squads - Create new squad
export async function createSquadController(request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationError = validateCreateSquad(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const newSquad = await squadsService.createSquad(body);
    return NextResponse.json(
      {
        status: "success",
        message: "Squad created successfully",
        data: newSquad,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[squads.controller.createSquad] Error:", err);
    if (err.message?.includes("Lead user not found")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/squads/:id - Update squad
export async function updateSquadController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Squad ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validationError = validateUpdateSquad(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updatedSquad = await squadsService.updateSquad(id, body);
    return NextResponse.json({
      status: "success",
      message: "Squad updated successfully",
      data: updatedSquad,
    });
  } catch (err) {
    console.error("[squads.controller.updateSquad] Error:", err);
    if (err.message === "Squad not found") {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 });
    }
    if (err.message?.includes("Lead user not found")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/squads/:id - Soft-delete squad
export async function deleteSquadController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Squad ID is required" }, { status: 400 });
    }

    const deactivatedSquad = await squadsService.deactivateSquad(id);
    return NextResponse.json({
      status: "success",
      message: "Squad deactivated successfully",
      data: deactivatedSquad,
    });
  } catch (err) {
    console.error("[squads.controller.deleteSquad] Error:", err);
    if (err.message === "Squad not found") {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
