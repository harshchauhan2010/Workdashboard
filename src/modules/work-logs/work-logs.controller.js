import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as workLogsService from "./work-logs.service.js";
import { validateCreateWorkLog } from "./work-logs.validator.js";

// GET /api/work-logs - List work logs across all or filtered by user/task
export async function listAllWorkLogsController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      userId: searchParams.get("user_id") || searchParams.get("developer_id") || null,
      taskId: searchParams.get("task_id") || null,
      fromDate: searchParams.get("from_date") || null,
      toDate: searchParams.get("to_date") || null,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit"), 10) : 50,
    };

    const logs = await workLogsService.getAllWorkLogs(filters);
    return NextResponse.json({
      status: "success",
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    console.error("[workLogs.controller.listAllWorkLogs] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// GET /api/tasks/:id/work-logs - List logs for a task
export async function getTaskWorkLogsController(request, context) {
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

    const logs = await workLogsService.getLogsForTask(taskId);
    return NextResponse.json({
      status: "success",
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    console.error("[workLogs.controller.getTaskWorkLogs] Error:", err);
    if (err.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks/:id/work-logs - Log hours on a task
export async function createTaskWorkLogController(request, context) {
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
    const validationError = validateCreateWorkLog(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const newLog = await workLogsService.createWorkLog(taskId, authUserId, body);
    return NextResponse.json(
      {
        status: "success",
        message: "Work hours logged successfully",
        data: newLog,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[workLogs.controller.createTaskWorkLog] Error:", err);
    if (err.message === "Task not found" || err.message === "User not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// GET /api/users/:id/work-logs - List all timesheets for a developer
export async function getUserWorkLogsController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const userId = params?.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      fromDate: searchParams.get("from_date") || null,
      toDate: searchParams.get("to_date") || null,
    };

    const logs = await workLogsService.getLogsForUser(userId, filters);
    return NextResponse.json({
      status: "success",
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    console.error("[workLogs.controller.getUserWorkLogs] Error:", err);
    if (err.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/work-logs/:id - Delete a work log entry
export async function deleteWorkLogController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Work log ID is required" }, { status: 400 });
    }

    const deleted = await workLogsService.deleteWorkLog(id, authUserId);
    return NextResponse.json({
      status: "success",
      message: "Work log removed successfully",
      data: deleted,
    });
  } catch (err) {
    console.error("[workLogs.controller.deleteWorkLog] Error:", err);
    if (err.message === "Work log not found") {
      return NextResponse.json({ error: "Work log not found" }, { status: 404 });
    }
    if (err.message?.includes("Forbidden")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
