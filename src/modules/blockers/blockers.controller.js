import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as blockersService from "./blockers.service";

// GET /api/blockers - List all unresolved blockers (Manager View)
export async function listUnresolvedBlockersController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blockers = await blockersService.listAllUnresolvedBlockers();
    return NextResponse.json({
      status: "success",
      count: blockers.length,
      data: blockers,
    });
  } catch (err) {
    console.error("[blockers.controller.listUnresolvedBlockers] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// GET /api/tasks/:id/blockers - List all blockers for a task
export async function getTaskBlockersController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const taskId = params?.id;
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const blockers = await blockersService.listTaskBlockers(taskId);
    return NextResponse.json({
      status: "success",
      count: blockers.length,
      data: blockers,
    });
  } catch (err) {
    console.error("[blockers.controller.getTaskBlockers] Error:", err);
    if (err.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks/:id/blockers - Report a new blocker on a task
export async function reportTaskBlockerController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const taskId = params?.id;
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const blocker = await blockersService.reportBlocker(taskId, authUserId, body);

    return NextResponse.json(
      {
        status: "success",
        message: "Blocker reported successfully",
        data: blocker,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[blockers.controller.reportTaskBlocker] Error:", err);
    if (err.message === "Task not found" || err.message?.includes("Reporter user not found")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (
      err.message?.startsWith("Validation Error") ||
      err.message === "Cannot report a blocker on a completed task"
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// GET /api/blockers/:id - Get single blocker by ID
export async function getBlockerByIdController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Blocker ID is required" }, { status: 400 });
    }

    const blocker = await blockersService.getBlockerById(id);
    return NextResponse.json({
      status: "success",
      data: blocker,
    });
  } catch (err) {
    console.error("[blockers.controller.getBlockerById] Error:", err);
    if (err.message === "Blocker not found") {
      return NextResponse.json({ error: "Blocker not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/blockers/:id/resolve (or PATCH /api/blockers/:id) - Resolve a blocker
export async function resolveBlockerController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Blocker ID is required" }, { status: 400 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body is optional
    }

    const resolved = await blockersService.resolveBlocker(id, authUserId, body);
    return NextResponse.json({
      status: "success",
      message: "Blocker resolved successfully",
      data: resolved,
    });
  } catch (err) {
    console.error("[blockers.controller.resolveBlocker] Error:", err);
    if (err.message === "Blocker not found" || err.message?.includes("not found")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (
      err.message === "Blocker is already resolved" ||
      err.message?.startsWith("Validation Error")
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/blockers/:id - Delete a blocker
export async function deleteBlockerController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Blocker ID is required" }, { status: 400 });
    }

    const deleted = await blockersService.deleteBlocker(id, authUserId);
    return NextResponse.json({
      status: "success",
      message: "Blocker deleted successfully",
      data: deleted,
    });
  } catch (err) {
    console.error("[blockers.controller.deleteBlocker] Error:", err);
    if (err.message === "Blocker not found") {
      return NextResponse.json({ error: "Blocker not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
