import * as tasksRepo from "./tasks.repository.js";
import * as squadsRepo from "@/modules/squads/squads.repository.js";
import * as authRepo from "@/modules/auth/auth.repository.js";
import * as usersRepo from "@/modules/users/users.repository.js";

// Get list of tasks with filters
export async function getAllTasks(filters = {}) {
  return await tasksRepo.findAll(filters);
}

// Get single task by ID
export async function getTaskById(id) {
  const task = await tasksRepo.findById(id);
  if (!task) {
    throw new Error("Task not found");
  }
  return task;
}

// Create new task
export async function createTask(payload, authUserId) {
  // Resolve creator user
  let creator = await authRepo.findUserByClerkId(authUserId);
  if (!creator) {
    creator = await usersRepo.findById(authUserId);
  }
  if (!creator) {
    throw new Error("Creator user not found");
  }

  // Verify squad exists and is active
  const squad = await squadsRepo.findByIdWithDetails(payload.squad_id);
  if (!squad) {
    throw new Error("Squad not found");
  }
  if (!squad.is_active) {
    throw new Error("Cannot create tasks in an inactive squad");
  }

  const normalizedTaskType = (payload.task_type || "PRE_PLANNING").toUpperCase();
  const normalizedCategory = (payload.category || "DEVELOPMENT").toUpperCase();
  const normalizedPriority = (payload.priority || "P2_MEDIUM").toUpperCase();
  const normalizedStatus = (payload.status || "IN_PROGRESS").toUpperCase();

  const taskData = {
    title: payload.title.trim(),
    description: payload.description ? payload.description.trim() : null,
    squad_id: payload.squad_id,
    task_type: normalizedTaskType,
    category: normalizedCategory,
    priority: normalizedPriority,
    status: normalizedStatus,
    estimated_hours: payload.estimated_hours ? Number(payload.estimated_hours) : 4.0,
    recurrence_frequency:
      normalizedTaskType === "RECURRING_ROUTINE" && payload.recurrence_frequency
        ? payload.recurrence_frequency.toUpperCase()
        : null,
    assigned_by_user_id: creator.id,
    due_date: payload.due_date || null,
  };

  return await tasksRepo.createTask(taskData);
}

// Update task
export async function updateTask(id, payload) {
  const existing = await tasksRepo.findById(id);
  if (!existing) {
    throw new Error("Task not found");
  }

  if (payload.squad_id) {
    const squad = await squadsRepo.findByIdWithDetails(payload.squad_id);
    if (!squad) {
      throw new Error("Squad not found");
    }
  }

  const normalized = {};

  if (payload.title !== undefined) normalized.title = payload.title.trim();
  if (payload.description !== undefined) normalized.description = payload.description?.trim() || null;
  if (payload.squad_id !== undefined) normalized.squad_id = payload.squad_id;
  if (payload.task_type !== undefined) normalized.task_type = payload.task_type.toUpperCase();
  if (payload.category !== undefined) normalized.category = payload.category.toUpperCase();
  if (payload.priority !== undefined) normalized.priority = payload.priority.toUpperCase();
  if (payload.status !== undefined) normalized.status = payload.status.toUpperCase();
  if (payload.recurrence_frequency !== undefined) {
    normalized.recurrence_frequency = payload.recurrence_frequency
      ? payload.recurrence_frequency.toUpperCase()
      : null;
  }
  if (payload.estimated_hours !== undefined) normalized.estimated_hours = Number(payload.estimated_hours);
  if (payload.is_blocked !== undefined) normalized.is_blocked = Boolean(payload.is_blocked);
  if (payload.due_date !== undefined) normalized.due_date = payload.due_date;

  return await tasksRepo.updateTask(id, normalized);
}

// Delete task
export async function deleteTask(id) {
  const existing = await tasksRepo.findById(id);
  if (!existing) {
    throw new Error("Task not found");
  }

  return await tasksRepo.deleteTask(id);
}
