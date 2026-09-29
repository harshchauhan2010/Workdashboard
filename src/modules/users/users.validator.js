const VALID_SYSTEM_ROLES = ["MANAGER", "DEVELOPER"];
const VALID_SENIORITY_LEVELS = [
  "L1_JUNIOR",
  "L2_MID",
  "L3_SENIOR",
  "L4_STAFF",
  "L5_PRINCIPAL",
  "LEAD",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate payload for creating a new user
export function validateCreateUser(data) {
  if (!data || typeof data !== "object") {
    return "Request body is required";
  }

  if (!data.clerk_id || typeof data.clerk_id !== "string" || !data.clerk_id.trim()) {
    return "clerk_id is required";
  }

  if (!data.full_name || typeof data.full_name !== "string" || !data.full_name.trim()) {
    return "full_name is required";
  }
  if (data.full_name.length > 150) {
    return "full_name must not exceed 150 characters";
  }

  if (!data.email || typeof data.email !== "string" || !EMAIL_REGEX.test(data.email.trim())) {
    return "A valid email address is required";
  }

  if (data.role_title !== undefined) {
    if (typeof data.role_title !== "string" || !data.role_title.trim()) {
      return "role_title cannot be empty if provided";
    }
    if (data.role_title.length > 150) {
      return "role_title must not exceed 150 characters";
    }
  }

  if (data.system_role && !VALID_SYSTEM_ROLES.includes(data.system_role)) {
    return `system_role must be one of: ${VALID_SYSTEM_ROLES.join(", ")}`;
  }

  if (data.seniority && !VALID_SENIORITY_LEVELS.includes(data.seniority)) {
    return `seniority must be one of: ${VALID_SENIORITY_LEVELS.join(", ")}`;
  }

  if (data.weekly_capacity_hours !== undefined) {
    const cap = Number(data.weekly_capacity_hours);
    if (isNaN(cap) || cap < 10.0 || cap > 80.0) {
      return "weekly_capacity_hours must be a number between 10.0 and 80.0";
    }
  }

  if (data.recurring_overhead_hours !== undefined) {
    const ovh = Number(data.recurring_overhead_hours);
    if (isNaN(ovh) || ovh < 0.0 || ovh > 40.0) {
      return "recurring_overhead_hours must be a number between 0.0 and 40.0";
    }
  }

  if (data.skills !== undefined && !Array.isArray(data.skills)) {
    return "skills must be an array of string tags";
  }

  return null;
}

// Validate payload for updating an existing user (PATCH)
export function validateUpdateUser(data) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return "Update payload cannot be empty";
  }

  if (data.full_name !== undefined) {
    if (typeof data.full_name !== "string" || !data.full_name.trim()) {
      return "full_name cannot be empty";
    }
    if (data.full_name.length > 150) {
      return "full_name must not exceed 150 characters";
    }
  }

  if (data.email !== undefined) {
    if (typeof data.email !== "string" || !EMAIL_REGEX.test(data.email.trim())) {
      return "A valid email address is required";
    }
  }

  if (data.role_title !== undefined) {
    if (typeof data.role_title !== "string" || !data.role_title.trim()) {
      return "role_title cannot be empty";
    }
    if (data.role_title.length > 150) {
      return "role_title must not exceed 150 characters";
    }
  }

  if (data.system_role !== undefined && !VALID_SYSTEM_ROLES.includes(data.system_role)) {
    return `system_role must be one of: ${VALID_SYSTEM_ROLES.join(", ")}`;
  }

  if (data.seniority !== undefined && !VALID_SENIORITY_LEVELS.includes(data.seniority)) {
    return `seniority must be one of: ${VALID_SENIORITY_LEVELS.join(", ")}`;
  }

  if (data.weekly_capacity_hours !== undefined) {
    const cap = Number(data.weekly_capacity_hours);
    if (isNaN(cap) || cap < 10.0 || cap > 80.0) {
      return "weekly_capacity_hours must be a number between 10.0 and 80.0";
    }
  }

  if (data.recurring_overhead_hours !== undefined) {
    const ovh = Number(data.recurring_overhead_hours);
    if (isNaN(ovh) || ovh < 0.0 || ovh > 40.0) {
      return "recurring_overhead_hours must be a number between 0.0 and 40.0";
    }
  }

  if (data.skills !== undefined && !Array.isArray(data.skills)) {
    return "skills must be an array of string tags";
  }

  if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
    return "is_active must be a boolean";
  }

  return null;
}
