import * as periodsRepo from "./planning-periods.repository.js";
import {
  validateCreatePeriod,
  validateUpdatePeriod,
  isValidUUID,
} from "./planning-periods.validator.js";

/**
 * Get all planning periods
 */
export async function getAllPeriods() {
  return await periodsRepo.findAllPeriods();
}

/**
 * Get the currently active planning period
 */
export async function getCurrentPeriod() {
  const current = await periodsRepo.findCurrentPeriod();
  if (!current) {
    return null;
  }
  return current;
}

/**
 * Get a single planning period by ID
 */
export async function getPeriodById(id) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid period ID format");
    error.statusCode = 400;
    throw error;
  }

  const period = await periodsRepo.findById(id);
  if (!period) {
    const error = new Error("Planning period not found");
    error.statusCode = 404;
    throw error;
  }

  return period;
}

/**
 * Create a new planning period
 */
export async function createPeriod(authUserId, payload = {}) {
  const validation = validateCreatePeriod(payload);
  if (!validation.isValid) {
    const error = new Error(`Validation Error: ${validation.errors.join("; ")}`);
    error.statusCode = 400;
    throw error;
  }

  const startDate = payload.start_date || payload.startDate;
  const endDate = payload.end_date || payload.endDate;
  const isCurrent =
    payload.is_current !== undefined
      ? payload.is_current
      : payload.isCurrent !== undefined
      ? payload.isCurrent
      : false;

  return await periodsRepo.createPeriod({
    name: payload.name.trim(),
    startDate: startDate.trim(),
    endDate: endDate.trim(),
    isCurrent,
  });
}

/**
 * Set a specific planning period as active (is_current = true)
 */
export async function setCurrentPeriod(authUserId, id) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid period ID format");
    error.statusCode = 400;
    throw error;
  }

  const existing = await periodsRepo.findById(id);
  if (!existing) {
    const error = new Error("Planning period not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await periodsRepo.setCurrentPeriod(id);
  return {
    message: "Current planning period updated",
    active_period_id: id,
    period: updated,
  };
}

/**
 * Update planning period fields
 */
export async function updatePeriod(authUserId, id, payload = {}) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid period ID format");
    error.statusCode = 400;
    throw error;
  }

  const existing = await periodsRepo.findById(id);
  if (!existing) {
    const error = new Error("Planning period not found");
    error.statusCode = 404;
    throw error;
  }

  const validation = validateUpdatePeriod(payload, existing);
  if (!validation.isValid) {
    const error = new Error(`Validation Error: ${validation.errors.join("; ")}`);
    error.statusCode = 400;
    throw error;
  }

  const updateFields = {};
  if (payload.name !== undefined) updateFields.name = payload.name.trim();
  if (payload.start_date !== undefined) updateFields.start_date = payload.start_date.trim();
  if (payload.startDate !== undefined) updateFields.start_date = payload.startDate.trim();
  if (payload.end_date !== undefined) updateFields.end_date = payload.end_date.trim();
  if (payload.endDate !== undefined) updateFields.end_date = payload.endDate.trim();
  if (payload.is_current !== undefined) updateFields.is_current = Boolean(payload.is_current);
  if (payload.isCurrent !== undefined) updateFields.is_current = Boolean(payload.isCurrent);

  return await periodsRepo.updatePeriod(id, updateFields);
}

/**
 * Delete a planning period
 */
export async function deletePeriod(authUserId, id) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid period ID format");
    error.statusCode = 400;
    throw error;
  }

  const existing = await periodsRepo.findById(id);
  if (!existing) {
    const error = new Error("Planning period not found");
    error.statusCode = 404;
    throw error;
  }

  await periodsRepo.deletePeriod(id);
  return { message: "Planning period removed", deleted_id: id };
}
