import * as blockersRepo from "./blockers.repository";
import * as tasksRepo from "@/modules/tasks/tasks.repository";
import * as usersRepo from "@/modules/users/users.repository";
import * as authRepo from "@/modules/auth/auth.repository";
import { validateCreateBlocker, validateResolveBlocker } from "./blockers.validator";

// Helper to resolve user from auth context (Clerk ID or DB UUID)
async function resolveDbUser(authUserId) {
  if (!authUserId) return null;
  let user = await authRepo.findUserByClerkId(authUserId);
  if (!user) {
    user = await usersRepo.findById(authUserId);
  }
  return user;
}

// List all unresolved blockers for manager view
export async function listAllUnresolvedBlockers() {
  return await blockersRepo.findAllUnresolved();
}

// List all blockers for a specific task
export async function listTaskBlockers(taskId) {
  const task = await tasksRepo.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  return await blockersRepo.findByTaskId(taskId);
}

// Get single blocker by ID
export async function getBlockerById(id) {
  const blocker = await blockersRepo.findById(id);
  if (!blocker) {
    throw new Error("Blocker not found");
  }
  return blocker;
}

// Report a new blocker on a task
export async function reportBlocker(taskId, authUserId, payload) {
  const validation = validateCreateBlocker(payload);
  if (!validation.isValid) {
    throw new Error(`Validation Error: ${validation.errors.join("; ")}`);
  }

  const task = await tasksRepo.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  if (task.status === "COMPLETED") {
    throw new Error("Cannot report a blocker on a completed task");
  }

  let reporterUser = null;
  if (payload.reported_by_user_id) {
    reporterUser = await usersRepo.findById(payload.reported_by_user_id);
    if (!reporterUser) {
      throw new Error(`User with ID ${payload.reported_by_user_id} not found`);
    }
  } else {
    reporterUser = await resolveDbUser(authUserId);
    if (!reporterUser) {
      throw new Error("Reporter user not found");
    }
  }

  const blocker = await blockersRepo.createBlocker({
    taskId,
    reportedByUserId: reporterUser.id,
    category: payload.category || "TECHNICAL_IMPEDIMENT",
    severity: payload.severity || "CRITICAL_BLOCKER",
    reason: payload.reason.trim(),
    businessImpact: payload.business_impact.trim(),
    mitigationAction: payload.mitigation_action ? payload.mitigation_action.trim() : null,
    expectedResolutionDate: payload.expected_resolution_date || null,
  });

  return blocker;
}

// Resolve an open blocker
export async function resolveBlocker(id, authUserId, payload = {}) {
  const validation = validateResolveBlocker(payload);
  if (!validation.isValid) {
    throw new Error(`Validation Error: ${validation.errors.join("; ")}`);
  }

  const existingBlocker = await blockersRepo.findById(id);
  if (!existingBlocker) {
    throw new Error("Blocker not found");
  }

  if (existingBlocker.is_resolved) {
    throw new Error("Blocker is already resolved");
  }

  let resolverUser = null;
  if (payload.resolved_by_user_id) {
    resolverUser = await usersRepo.findById(payload.resolved_by_user_id);
    if (!resolverUser) {
      throw new Error(`User with ID ${payload.resolved_by_user_id} not found`);
    }
  } else {
    resolverUser = await resolveDbUser(authUserId);
  }

  const resolved = await blockersRepo.resolveBlocker(id, {
    resolvedByUserId: resolverUser ? resolverUser.id : null,
    mitigationAction: payload.mitigation_action ? payload.mitigation_action.trim() : null,
  });

  return resolved;
}

// Delete blocker
export async function deleteBlocker(id, authUserId) {
  const existingBlocker = await blockersRepo.findById(id);
  if (!existingBlocker) {
    throw new Error("Blocker not found");
  }

  return await blockersRepo.deleteBlocker(id);
}
