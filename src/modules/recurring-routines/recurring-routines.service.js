import * as routinesRepo from "./recurring-routines.repository.js";
import * as usersRepo from "@/modules/users/users.repository.js";
import * as authRepo from "@/modules/auth/auth.repository.js";
import * as squadsRepo from "@/modules/squads/squads.repository.js";
import {
  validateCreateRoutine,
  validateUpdateRoutine,
  isValidUUID,
} from "./recurring-routines.validator.js";

// Helper to resolve user from auth context (Clerk ID or DB user ID)
export async function resolveDbUser(authUserId, explicitUserId = null) {
  if (explicitUserId && isValidUUID(explicitUserId)) {
    const explicit = await usersRepo.findById(explicitUserId);
    if (explicit) return explicit;
  }
  if (!authUserId) return null;
  let user = await authRepo.findUserByClerkId(authUserId);
  if (!user && isValidUUID(authUserId)) {
    user = await usersRepo.findById(authUserId);
  }
  return user;
}

/**
 * Get recurring routines for current authenticated developer
 */
export async function getMyRoutines(authUserId) {
  const user = await resolveDbUser(authUserId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return await routinesRepo.findRoutinesByUserId(user.id);
}

/**
 * Get routines for a specific user ID
 */
export async function getRoutinesByUser(authUserId, targetUserId) {
  if (!isValidUUID(targetUserId)) {
    const error = new Error("Invalid user ID format");
    error.statusCode = 400;
    throw error;
  }

  const user = await usersRepo.findById(targetUserId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return await routinesRepo.findRoutinesByUserId(user.id);
}

/**
 * Get all routines with optional filters (userId, squadId, frequency)
 */
export async function getAllRoutines(filters = {}) {
  return await routinesRepo.findAll(filters);
}

/**
 * Get single routine by ID
 */
export async function getRoutineById(id) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid routine ID format");
    error.statusCode = 400;
    throw error;
  }

  const routine = await routinesRepo.findById(id);
  if (!routine) {
    const error = new Error("Recurring routine not found");
    error.statusCode = 404;
    throw error;
  }

  return routine;
}

/**
 * Log work hours directly on a routine
 */
export async function logRoutineHours(authUserId, routineId, payload = {}) {
  if (!isValidUUID(routineId)) {
    const error = new Error("Invalid routine ID format");
    error.statusCode = 400;
    throw error;
  }

  const user = await resolveDbUser(authUserId, payload.user_id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const routine = await routinesRepo.findById(routineId);
  if (!routine) {
    const error = new Error("Recurring routine not found");
    error.statusCode = 404;
    throw error;
  }

  const hours = Number(payload.hours) || (routine.frequency === "DAILY" ? 0.5 : 1.0);
  const notes = payload.notes || `Completed ${routine.frequency.toLowerCase()} routine: ${routine.title}`;

  const workLog = await routinesRepo.logRoutineTime({
    userId: user.id,
    routineId,
    hours,
    notes,
  });

  return {
    message: `Logged ${hours}h for ${routine.title}`,
    work_log: workLog,
    routine_id: routineId,
  };
}

/**
 * Create a new recurring routine
 */
export async function createRoutine(authUserId, payload = {}) {
  const validation = validateCreateRoutine(payload);
  if (!validation.isValid) {
    const error = new Error(`Validation Error: ${validation.errors.join("; ")}`);
    error.statusCode = 400;
    throw error;
  }

  const explicitUserId = payload.user_id || payload.userId;
  const user = await resolveDbUser(authUserId, explicitUserId);
  if (!user) {
    const error = new Error("Target user not found");
    error.statusCode = 404;
    throw error;
  }

  const squadId = payload.squad_id || payload.squadId || null;
  if (squadId) {
    const squad = await squadsRepo.findByIdWithDetails(squadId);
    if (!squad) {
      const error = new Error("Squad not found");
      error.statusCode = 404;
      throw error;
    }
  }

  const hours =
    payload.allocated_hours !== undefined
      ? Number(payload.allocated_hours)
      : payload.allocatedHours !== undefined
      ? Number(payload.allocatedHours)
      : 2.5;

  const scheduleLabel = (payload.schedule_label || payload.scheduleLabel).trim();

  return await routinesRepo.createRoutine({
    userId: user.id,
    squadId,
    title: payload.title.trim(),
    frequency: payload.frequency || "DAILY",
    scheduleLabel,
    allocatedHours: hours,
  });
}

/**
 * Update an existing recurring routine
 */
export async function updateRoutine(id, payload = {}) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid routine ID format");
    error.statusCode = 400;
    throw error;
  }

  const existing = await routinesRepo.findById(id);
  if (!existing) {
    const error = new Error("Recurring routine not found");
    error.statusCode = 404;
    throw error;
  }

  const validation = validateUpdateRoutine(payload);
  if (!validation.isValid) {
    const error = new Error(`Validation Error: ${validation.errors.join("; ")}`);
    error.statusCode = 400;
    throw error;
  }

  const updateFields = {};
  if (payload.title !== undefined) updateFields.title = payload.title.trim();
  if (payload.frequency !== undefined) updateFields.frequency = payload.frequency;
  if (payload.schedule_label !== undefined)
    updateFields.schedule_label = payload.schedule_label.trim();
  if (payload.scheduleLabel !== undefined)
    updateFields.schedule_label = payload.scheduleLabel.trim();
  if (payload.allocated_hours !== undefined)
    updateFields.allocated_hours = Number(payload.allocated_hours);
  if (payload.allocatedHours !== undefined)
    updateFields.allocated_hours = Number(payload.allocatedHours);
  if (payload.squad_id !== undefined) updateFields.squad_id = payload.squad_id;
  if (payload.squadId !== undefined) updateFields.squad_id = payload.squadId;

  return await routinesRepo.updateRoutine(id, updateFields);
}

/**
 * Delete a recurring routine
 */
export async function deleteRoutine(id) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid routine ID format");
    error.statusCode = 400;
    throw error;
  }

  const existing = await routinesRepo.findById(id);
  if (!existing) {
    const error = new Error("Recurring routine not found");
    error.statusCode = 404;
    throw error;
  }

  await routinesRepo.deleteRoutine(id);
  return { message: "Recurring routine removed", deleted_id: id };
}
