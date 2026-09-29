import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as assignmentsService from "./assignments.service.js";
import { validateCreateAssignments } from "./assignments.validator.js";

// GET /api/tasks/:id/assignments - List assignments for a task
export async function getTaskAssignmentsController(request, context) {
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

    const assignments = await assignmentsService.getAssignmentsForTask(taskId);
    return NextResponse.json({
      status: "success",
      count: assignments.length,
      data: assignments,
    });
  } catch (err) {
    console.error("[assignments.controller.getTaskAssignments] Error:", err);
    if (err.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks/:id/assignments - Assign developer(s) to a task
export async function createTaskAssignmentsController(request, context) {
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
    const validationError = validateCreateAssignments(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const assignments = await assignmentsService.createTaskAssignments(taskId, body);
    return NextResponse.json(
      {
        status: "success",
        message: "Developer(s) assigned to task successfully",
        count: assignments.length,
        data: assignments,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[assignments.controller.createTaskAssignments] Error:", err);
    if (err.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (
      err.message?.includes("No active members") ||
      err.message?.includes("not found")
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/:id - Delete assignment
export async function deleteAssignmentController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    const deleted = await assignmentsService.deleteAssignment(id);
    return NextResponse.json({
      status: "success",
      message: "Assignment removed successfully",
      data: deleted,
    });
  } catch (err) {
    console.error("[assignments.controller.deleteAssignment] Error:", err);
    if (err.message === "Assignment not found") {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
