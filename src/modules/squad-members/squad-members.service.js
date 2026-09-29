import * as squadMembersRepo from "./squad-members.repository.js";
import { getSquadById } from "@/modules/squads/squads.service.js";
import { getUserById } from "@/modules/users/users.service.js";

// List active members of a squad
export async function getActiveMembersBySquadId(squadId) {
  const squad = await getSquadById(squadId);
  if (!squad) {
    throw new Error("Squad not found");
  }
  return await squadMembersRepo.findActiveBySquadId(squadId);
}

// Add user to squad
export async function addMemberToSquad(squadId, payload) {
  // 1. Verify squad exists
  const squad = await getSquadById(squadId);
  if (!squad) {
    throw new Error("Squad not found");
  }

  // 2. Verify user exists
  const user = await getUserById(payload.user_id);
  if (!user) {
    throw new Error("User not found with provided user_id");
  }

  const allocationPercentage = Number(payload.allocation_percentage ?? 100);

  return await squadMembersRepo.addMember(squadId, payload.user_id, allocationPercentage);
}

// Update allocation percentage of a squad member
export async function updateMemberAllocation(memberId, payload) {
  const member = await squadMembersRepo.findById(memberId);
  if (!member || member.left_at !== null) {
    throw new Error("Active squad membership not found");
  }

  const allocationPercentage = Number(payload.allocation_percentage);
  return await squadMembersRepo.updateAllocation(memberId, allocationPercentage);
}

// Soft remove member from squad
export async function removeMemberFromSquad(memberId) {
  const member = await squadMembersRepo.findById(memberId);
  if (!member || member.left_at !== null) {
    throw new Error("Active squad membership not found");
  }

  return await squadMembersRepo.removeMember(memberId);
}

// Get all squads a user currently belongs to
export async function getUserSquads(userId) {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return await squadMembersRepo.findSquadsByUserId(userId);
}
