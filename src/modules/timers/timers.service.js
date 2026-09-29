import * as timersRepo from "./timers.repository";
import * as tasksRepo from "@/modules/tasks/tasks.repository";
import * as usersRepo from "@/modules/users/users.repository";
import * as authRepo from "@/modules/auth/auth.repository";
import * as workLogsRepo from "@/modules/work-logs/work-logs.repository";
import {
  validateStartTimer,
  validatePauseTimer,
  validateStopTimer,
} from "./timers.validator";

// UUID regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Helper to resolve user from auth context (Clerk ID, direct DB ID, or explicit body user_id)
async function resolveDbUser(authUserId, explicitUserId = null) {
  if (explicitUserId) {
    if (typeof explicitUserId === "string" && UUID_REGEX.test(explicitUserId.trim())) {
      const explicit = await usersRepo.findById(explicitUserId);
      if (explicit) return explicit;
    }
    const explicitByClerk = await authRepo.findUserByClerkId(explicitUserId);
    if (explicitByClerk) return explicitByClerk;
  }
  if (!authUserId) return null;
  let user = await authRepo.findUserByClerkId(authUserId);
  if (!user && typeof authUserId === "string" && UUID_REGEX.test(authUserId.trim())) {
    user = await usersRepo.findById(authUserId);
  }
  return user;
}

// Get current active timer for developer
export async function getActiveTimer(authUserId, explicitUserId = null) {
  const user = await resolveDbUser(authUserId, explicitUserId);
  if (!user) {
    throw new Error("User not found");
  }

  return await timersRepo.findByUserId(user.id);
}

// Start timer on a task
export async function startTimer(authUserId, payload) {
  const validation = validateStartTimer(payload);
  if (!validation.isValid) {
    throw new Error(`Validation Error: ${validation.errors.join("; ")}`);
  }

  const user = await resolveDbUser(authUserId, payload.user_id);
  if (!user) {
    throw new Error("User not found");
  }

  // Enforce 1 active timer per developer
  const existingTimer = await timersRepo.findByUserId(user.id);
  if (existingTimer) {
    const error = new Error(
      `You already have an active timer on task: "${existingTimer.task_title}". Stop it before starting a new one.`
    );
    error.statusCode = 409;
    throw error;
  }

  // Verify task exists
  const task = await tasksRepo.findById(payload.task_id);
  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  if (task.status === "COMPLETED") {
    const error = new Error("Cannot start a timer on a completed task");
    error.statusCode = 400;
    throw error;
  }

  if (task.is_blocked) {
    const error = new Error("Task is blocked — cannot start timer on a blocked task");
    error.statusCode = 403;
    throw error;
  }

  return await timersRepo.startTimer({
    userId: user.id,
    taskId: task.id,
  });
}

// Pause running timer
export async function pauseTimer(authUserId, payload = {}) {
  const validation = validatePauseTimer(payload);
  if (!validation.isValid) {
    throw new Error(`Validation Error: ${validation.errors.join("; ")}`);
  }

  const user = await resolveDbUser(authUserId, payload.user_id);
  if (!user) {
    throw new Error("User not found");
  }

  const existingTimer = await timersRepo.findByUserId(user.id);
  if (!existingTimer) {
    const error = new Error("No active timer found to pause");
    error.statusCode = 404;
    throw error;
  }

  const secondsElapsed =
    payload.seconds_elapsed !== undefined
      ? Number(payload.seconds_elapsed)
      : existingTimer.seconds_elapsed;

  return await timersRepo.updateTimer(user.id, {
    secondsElapsed,
    isRunning: false,
  });
}

// Resume paused timer
export async function resumeTimer(authUserId, payload = {}) {
  const user = await resolveDbUser(authUserId, payload.user_id);
  if (!user) {
    throw new Error("User not found");
  }

  const existingTimer = await timersRepo.findByUserId(user.id);
  if (!existingTimer) {
    const error = new Error("No active timer found to resume");
    error.statusCode = 404;
    throw error;
  }

  if (existingTimer.is_blocked) {
    const error = new Error("Cannot resume timer — task is currently blocked");
    error.statusCode = 403;
    throw error;
  }

  const secondsElapsed =
    payload.seconds_elapsed !== undefined
      ? Number(payload.seconds_elapsed)
      : existingTimer.seconds_elapsed;

  return await timersRepo.updateTimer(user.id, {
    secondsElapsed,
    isRunning: true,
  });
}

// Stop timer and automatically convert elapsed time into a work log
export async function stopTimer(authUserId, payload = {}) {
  const validation = validateStopTimer(payload);
  if (!validation.isValid) {
    throw new Error(`Validation Error: ${validation.errors.join("; ")}`);
  }

  const user = await resolveDbUser(authUserId, payload.user_id);
  if (!user) {
    throw new Error("User not found");
  }

  const existingTimer = await timersRepo.findByUserId(user.id);
  if (!existingTimer) {
    const error = new Error("No active timer found to stop");
    error.statusCode = 404;
    throw error;
  }

  const totalSeconds =
    payload.seconds_elapsed !== undefined
      ? Number(payload.seconds_elapsed)
      : existingTimer.seconds_elapsed;

  // Convert seconds to decimal hours (minimum 0.01 hours for non-zero time)
  let hours = 0.01;
  if (totalSeconds > 0) {
    hours = Math.max(0.01, Math.round((totalSeconds / 3600) * 100) / 100);
  }

  const notes =
    payload.notes && payload.notes.trim().length > 0
      ? payload.notes.trim()
      : `Stopwatch session on task: ${existingTimer.task_title}`;

  // 1. Insert completed work log
  const workLog = await workLogsRepo.createWorkLog({
    taskId: existingTimer.task_id,
    userId: user.id,
    hours,
    notes,
  });

  // 2. Delete temporary active timer
  await timersRepo.deleteTimer(user.id);

  return {
    message: "Timer stopped and work logged successfully",
    hours_logged: hours,
    seconds_recorded: totalSeconds,
    work_log: workLog,
  };
}

// Discard active timer without logging work
export async function discardTimer(authUserId, explicitUserId = null) {
  const user = await resolveDbUser(authUserId, explicitUserId);
  if (!user) {
    throw new Error("User not found");
  }

  const existingTimer = await timersRepo.findByUserId(user.id);
  if (!existingTimer) {
    const error = new Error("No active timer found to discard");
    error.statusCode = 404;
    throw error;
  }

  return await timersRepo.deleteTimer(user.id);
}
