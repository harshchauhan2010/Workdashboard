import * as squadsRepo from "./squads.repository.js";
import { getUserById } from "@/modules/users/users.service.js";

// Auto-calculate squad health based on budget utilization
export function calculateSquadHealth(budgetHours, spentHours) {
  const budget = Number(budgetHours);
  const spent = Number(spentHours);

  if (budget <= 0) return "HEALTHY";

  const ratio = spent / budget;
  if (ratio < 0.8) return "HEALTHY";
  if (ratio <= 1.0) return "AT_RISK";
  return "CRITICAL";
}

// Get all active squads
export async function getAllActiveSquads() {
  return await squadsRepo.findAllActive();
}

// Get single squad by ID
export async function getSquadById(id) {
  return await squadsRepo.findById(id);
}

// Get squad with full details (members, task statistics)
export async function getSquadDetails(id) {
  return await squadsRepo.findByIdWithDetails(id);
}

// Create new squad
export async function createSquad(payload) {
  // 1. Verify lead user exists
  const leadUser = await getUserById(payload.lead_user_id);
  if (!leadUser) {
    throw new Error("Lead user not found with provided lead_user_id");
  }

  const budgetHours = Number(payload.budget_hours ?? 320.0);
  const spentHours = Number(payload.spent_hours ?? 0.0);
  const health = payload.health || calculateSquadHealth(budgetHours, spentHours);

  const normalizedData = {
    name: payload.name.trim(),
    badge_code: payload.badge_code.trim().toUpperCase(),
    focus_domain: payload.focus_domain.trim(),
    lead_user_id: payload.lead_user_id,
    budget_hours: budgetHours,
    spent_hours: spentHours,
    health: health,
  };

  return await squadsRepo.createSquad(normalizedData);
}

// Update squad details (PATCH)
export async function updateSquad(id, payload) {
  const existing = await squadsRepo.findById(id);
  if (!existing) {
    throw new Error("Squad not found");
  }

  if (payload.lead_user_id) {
    const leadUser = await getUserById(payload.lead_user_id);
    if (!leadUser) {
      throw new Error("Lead user not found with provided lead_user_id");
    }
  }

  const updateData = {};

  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.badge_code !== undefined) updateData.badge_code = payload.badge_code.trim().toUpperCase();
  if (payload.focus_domain !== undefined) updateData.focus_domain = payload.focus_domain.trim();
  if (payload.lead_user_id !== undefined) updateData.lead_user_id = payload.lead_user_id;
  if (payload.budget_hours !== undefined) updateData.budget_hours = Number(payload.budget_hours);
  if (payload.spent_hours !== undefined) updateData.spent_hours = Number(payload.spent_hours);

  // Auto-calculate health if budget or spent changed and health not explicitly specified
  if (payload.health !== undefined) {
    updateData.health = payload.health;
  } else if (payload.budget_hours !== undefined || payload.spent_hours !== undefined) {
    const budget = payload.budget_hours !== undefined ? payload.budget_hours : existing.budget_hours;
    const spent = payload.spent_hours !== undefined ? payload.spent_hours : existing.spent_hours;
    updateData.health = calculateSquadHealth(budget, spent);
  }

  if (payload.is_active !== undefined) updateData.is_active = Boolean(payload.is_active);

  return await squadsRepo.updateSquad(id, updateData);
}

// Soft delete squad
export async function deactivateSquad(id) {
  const existing = await squadsRepo.findById(id);
  if (!existing) {
    throw new Error("Squad not found");
  }
  return await squadsRepo.deactivateSquad(id);
}
