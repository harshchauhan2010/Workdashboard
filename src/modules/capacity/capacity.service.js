import * as capacityRepo from "./capacity.repository.js";
import * as usersRepo from "@/modules/users/users.repository.js";
import * as authRepo from "@/modules/auth/auth.repository.js";
import {
  formatDeveloperCapacity,
  formatSquadCapacity,
} from "./capacityEngine.utils.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id) {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

// Helper to resolve user from auth context (Clerk ID or DB user ID)
async function resolveDbUser(authUserId) {
  if (!authUserId) return null;
  let user = await authRepo.findUserByClerkId(authUserId);
  if (!user && isValidUUID(authUserId)) {
    user = await usersRepo.findById(authUserId);
  }
  return user;
}

/**
 * Get developer capacity heatmap (list of all active developers)
 */
export async function getDeveloperHeatmap(filters = {}) {
  const rows = await capacityRepo.getDeveloperCapacitySummaries(filters);
  return rows.map(formatDeveloperCapacity);
}

/**
 * Get capacity statistics for the current authenticated developer
 */
export async function getMyCapacity(authUserId) {
  const user = await resolveDbUser(authUserId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const row = await capacityRepo.getDeveloperCapacityById(user.id);
  if (!row) {
    // If not found in view (e.g. manager or user without records), build default
    return {
      user_id: user.id,
      developer_name: user.full_name,
      email: user.email,
      role_title: user.role_title,
      weekly_capacity_hours: Number(user.weekly_capacity_hours) || 40.0,
      recurring_hours: Number(user.recurring_overhead_hours) || 0.0,
      pre_planning_hours: 0.0,
      adhoc_hours: 0.0,
      pending_hours: 0.0,
      total_load_hours: Number(user.recurring_overhead_hours) || 0.0,
      utilization_pct: 0.0,
      available_buffer_hours: Number(user.weekly_capacity_hours) || 40.0,
      overage_hours: 0.0,
      is_overallocated: false,
      load_band: "UNDERLOADED",
      band_color: "emerald",
      band_description: "Has bandwidth for extra tasks",
    };
  }

  return formatDeveloperCapacity(row);
}

/**
 * Get capacity statistics for a specific developer by ID
 */
export async function getDeveloperCapacity(userId) {
  if (!isValidUUID(userId)) {
    const error = new Error("Invalid user ID format");
    error.statusCode = 400;
    throw error;
  }

  const row = await capacityRepo.getDeveloperCapacityById(userId);
  if (!row) {
    const error = new Error("Developer capacity summary not found");
    error.statusCode = 404;
    throw error;
  }

  return formatDeveloperCapacity(row);
}

/**
 * Get squad capacity rollups across all squads
 */
export async function getSquadsCapacity(filters = {}) {
  const rows = await capacityRepo.getSquadCapacitySummaries(filters);
  return rows.map(formatSquadCapacity);
}

/**
 * Get capacity statistics for a single squad by ID
 */
export async function getSquadCapacity(squadId) {
  if (!isValidUUID(squadId)) {
    const error = new Error("Invalid squad ID format");
    error.statusCode = 400;
    throw error;
  }

  const row = await capacityRepo.getSquadCapacityById(squadId);
  if (!row) {
    const error = new Error("Squad capacity summary not found");
    error.statusCode = 404;
    throw error;
  }

  return formatSquadCapacity(row);
}
