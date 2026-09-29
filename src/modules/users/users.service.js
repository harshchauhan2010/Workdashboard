import * as usersRepo from "./users.repository.js";

// Role blueprints with default values
export const ROLE_DEFAULTS = {
  MANAGER: {
    system_role: "MANAGER",
    role_title: "Engineering Manager",
    seniority: "LEAD",
    weekly_capacity_hours: 40.0,
    recurring_overhead_hours: 8.0,
    skills: ["Capacity Planning", "Agile", "Delivery Management"],
  },
  DEVELOPER: {
    system_role: "DEVELOPER",
    role_title: "Software Engineer",
    seniority: "L3_SENIOR",
    weekly_capacity_hours: 40.0,
    recurring_overhead_hours: 6.0,
    skills: [],
  },
};

// Get all active users
export async function getAllActiveUsers() {
  return await usersRepo.findAllActive();
}

// Get user by internal ID
export async function getUserById(id) {
  return await usersRepo.findById(id);
}

// Get user by Clerk ID
export async function getUserByClerkId(clerkId) {
  return await usersRepo.findByClerkId(clerkId);
}

// Create new user with role defaults
export async function createUser(payload) {
  const existingByClerk = await usersRepo.findByClerkId(payload.clerk_id);
  if (existingByClerk) {
    throw new Error("A user with this clerk_id already exists");
  }

  const existingByEmail = await usersRepo.findByEmail(payload.email);
  if (existingByEmail) {
    throw new Error("A user with this email already exists");
  }

  const targetRole = payload.system_role?.toUpperCase() === "MANAGER" ? "MANAGER" : "DEVELOPER";
  const defaults = ROLE_DEFAULTS[targetRole];

  const normalizedData = {
    clerk_id: payload.clerk_id.trim(),
    full_name: payload.full_name.trim(),
    email: payload.email.trim().toLowerCase(),
    system_role: targetRole,
    role_title: (payload.role_title && payload.role_title.trim()) || defaults.role_title,
    seniority: payload.seniority || defaults.seniority,
    weekly_capacity_hours: Number(payload.weekly_capacity_hours ?? defaults.weekly_capacity_hours),
    recurring_overhead_hours: Number(payload.recurring_overhead_hours ?? defaults.recurring_overhead_hours),
    skills: Array.isArray(payload.skills) && payload.skills.length > 0
      ? payload.skills.map((s) => String(s).trim()).filter(Boolean)
      : defaults.skills,
  };

  return await usersRepo.createUser(normalizedData);
}

// Update user details (PATCH)
export async function updateUser(id, payload) {
  const existing = await usersRepo.findById(id);
  if (!existing) {
    throw new Error("User not found");
  }

  const updateData = {};

  if (payload.full_name !== undefined) updateData.full_name = payload.full_name.trim();
  if (payload.email !== undefined) updateData.email = payload.email.trim().toLowerCase();
  if (payload.role_title !== undefined) updateData.role_title = payload.role_title.trim();
  if (payload.system_role !== undefined) updateData.system_role = payload.system_role;
  if (payload.seniority !== undefined) updateData.seniority = payload.seniority;
  if (payload.weekly_capacity_hours !== undefined) updateData.weekly_capacity_hours = Number(payload.weekly_capacity_hours);
  if (payload.recurring_overhead_hours !== undefined) updateData.recurring_overhead_hours = Number(payload.recurring_overhead_hours);
  if (payload.skills !== undefined) {
    updateData.skills = payload.skills.map((s) => String(s).trim()).filter(Boolean);
  }
  if (payload.is_active !== undefined) updateData.is_active = Boolean(payload.is_active);

  // If full_name is updated and user has a real Clerk ID, sync to Clerk Cloud
  if (updateData.full_name && existing.clerk_id?.startsWith("user_")) {
    try {
      const { createClerkClient } = await import("@clerk/nextjs/server");
      const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const parts = updateData.full_name.split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      await client.users.updateUser(existing.clerk_id, {
        firstName,
        lastName,
      });
    } catch (clerkErr) {
      console.warn("[users.service.updateUser] Clerk cloud sync warning:", clerkErr.message);
    }
  }

  return await usersRepo.updateUser(id, updateData);
}

// Soft delete user
export async function deactivateUser(id) {
  const existing = await usersRepo.findById(id);
  if (!existing) {
    throw new Error("User not found");
  }
  return await usersRepo.deactivateUser(id);
}

// Auto-create user on first login
export async function ensureUserFromClerk({ clerkId, email, fullName, rolePreference }) {
  let user = await usersRepo.findByClerkId(clerkId);
  if (user) return user;

  if (email) {
    const existingByEmail = await usersRepo.findByEmail(email);
    if (existingByEmail) {
      return await usersRepo.updateUser(existingByEmail.id, { clerk_id: clerkId });
    }
  }

  const totalCount = await usersRepo.countUsers();
  const isFirstUser = totalCount === 0;

  const targetRole = isFirstUser 
    ? "MANAGER" 
    : (rolePreference?.toUpperCase() === "MANAGER" ? "MANAGER" : "DEVELOPER");

  const defaults = ROLE_DEFAULTS[targetRole];

  return await usersRepo.createUser({
    clerk_id: clerkId,
    full_name: fullName || (email ? email.split("@")[0] : "New Team Member"),
    email: email || `${clerkId}@internal.workdash`,
    system_role: defaults.system_role,
    role_title: defaults.role_title,
    seniority: defaults.seniority,
    weekly_capacity_hours: defaults.weekly_capacity_hours,
    recurring_overhead_hours: defaults.recurring_overhead_hours,
    skills: defaults.skills,
  });
}
