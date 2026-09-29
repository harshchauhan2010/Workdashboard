import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as tasksService from "./tasks.service.js";
import { validateCreateTask, validateUpdateTask } from "./tasks.validator.js";

// GET /api/tasks - List tasks with filters
export async function listTasksController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {};

    if (searchParams.get("squad_id")) {
      filters.squad_id = searchParams.get("squad_id");
    }
    if (searchParams.get("status")) {
      filters.status = searchParams.get("status").toUpperCase();
    }
    if (searchParams.get("task_type")) {
      filters.task_type = searchParams.get("task_type").toUpperCase();
    }
    if (searchParams.get("assigned_user_id")) {
      filters.assigned_user_id = searchParams.get("assigned_user_id");
    }
    if (searchParams.get("is_blocked") !== null) {
      const blockedVal = searchParams.get("is_blocked");
      if (blockedVal === "true") filters.is_blocked = true;
      if (blockedVal === "false") filters.is_blocked = false;
    }

    const tasks = await tasksService.getAllTasks(filters);
    return NextResponse.json({
      status: "success",
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    console.error("[tasks.controller.listTasks] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// GET /api/tasks/:id - Get single task by ID
export async function getTaskByIdController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await tasksService.getTaskById(id);
    return NextResponse.json({
      status: "success",
      data: task,
    });
  } catch (err) {
    console.error("[tasks.controller.getTaskById] Error:", err);
    if (err.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
export async function createTaskController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationError = validateCreateTask(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const newTask = await tasksService.createTask(body, authUserId);
    return NextResponse.json(
      {
        status: "success",
        message: "Task created successfully",
        data: newTask,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[tasks.controller.createTask] Error:", err);
    if (
      err.message === "Squad not found" ||
      err.message === "Creator user not found" ||
      err.message?.includes("Cannot create tasks")
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/:id - Update task fields
export async function updateTaskController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validationError = validateUpdateTask(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updatedTask = await tasksService.updateTask(id, body);
    return NextResponse.json({
      status: "success",
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (err) {
    console.error("[tasks.controller.updateTask] Error:", err);
    if (err.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (err.message === "Squad not found") {
      return NextResponse.json({ error: "Squad not found" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/:id - Delete task
export async function deleteTaskController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const deletedTask = await tasksService.deleteTask(id);
    return NextResponse.json({
      status: "success",
      message: "Task deleted successfully",
      data: deletedTask,
    });
  } catch (err) {
    console.error("[tasks.controller.deleteTask] Error:", err);
    if (err.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
