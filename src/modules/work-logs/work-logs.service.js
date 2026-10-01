import * as workLogsRepo from "./work-logs.repository.js";
import * as tasksRepo from "@/modules/tasks/tasks.repository.js";
import * as usersRepo from "@/modules/users/users.repository.js";
import * as authRepo from "@/modules/auth/auth.repository.js";

// List all work logs with optional filters
export async function getAllWorkLogs(filters = {}) {
  return await workLogsRepo.findAll(filters);
}

// List all work logs for a task
export async function getLogsForTask(taskId) {
  const task = await tasksRepo.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  return await workLogsRepo.findByTaskId(taskId);
}

// List all work logs for a developer
export async function getLogsForUser(userId, filters = {}) {
  const user = await usersRepo.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return await workLogsRepo.findByUserId(userId, filters);
}

// Create a new work log entry
export async function createWorkLog(taskId, authUserId, payload) {
  let targetUserId = null;

  if (payload.user_id) {
    const targetUser = await usersRepo.findById(payload.user_id);
    if (!targetUser) {
      throw new Error(`User with ID ${payload.user_id} not found`);
    }
    targetUserId = targetUser.id;
  } else {
    let authUser = await authRepo.findUserByClerkId(authUserId);
    if (!authUser) {
      authUser = await usersRepo.findById(authUserId);
    }
    if (!authUser) {
      throw new Error("User not found");
    }
    targetUserId = authUser.id;
  }

  const task = await tasksRepo.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  return await workLogsRepo.createWorkLog({
    taskId,
    userId: targetUserId,
    hours: Number(payload.hours),
    notes: payload.notes.trim(),
    logTimestamp: payload.log_timestamp || null,
  });
}

// Delete a work log entry (with ownership check)
export async function deleteWorkLog(id, authUserId) {
  let user = await authRepo.findUserByClerkId(authUserId);
  if (!user) {
    user = await usersRepo.findById(authUserId);
  }
  if (!user) {
    throw new Error("User not found");
  }

  const log = await workLogsRepo.findById(id);
  if (!log) {
    throw new Error("Work log not found");
  }

  // Only the author or a manager can delete a work log
  if (log.user_id !== user.id && user.system_role !== "MANAGER") {
    throw new Error("Forbidden: You can only delete your own work logs");
  }

  return await workLogsRepo.deleteWorkLog(id);
}
