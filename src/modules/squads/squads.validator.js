const VALID_HEALTH_STATUSES = ["HEALTHY", "AT_RISK", "CRITICAL"];

// Validate payload for creating a new squad
export function validateCreateSquad(data) {
  if (!data || typeof data !== "object") {
    return "Request body is required";
  }

  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    return "Squad name is required";
  }
  if (data.name.length > 150) {
    return "Squad name must not exceed 150 characters";
  }

  if (!data.badge_code || typeof data.badge_code !== "string" || !data.badge_code.trim()) {
    return "badge_code is required (e.g. 'ALPHA', 'BETA')";
  }
  if (data.badge_code.length > 32) {
    return "badge_code must not exceed 32 characters";
  }

  if (!data.focus_domain || typeof data.focus_domain !== "string" || !data.focus_domain.trim()) {
    return "focus_domain is required";
  }
  if (data.focus_domain.length > 255) {
    return "focus_domain must not exceed 255 characters";
  }

  if (!data.lead_user_id || typeof data.lead_user_id !== "string" || !data.lead_user_id.trim()) {
    return "lead_user_id is required";
  }

  if (data.budget_hours !== undefined) {
    const budget = Number(data.budget_hours);
    if (isNaN(budget) || budget < 0) {
      return "budget_hours must be a non-negative number";
    }
  }

  if (data.health && !VALID_HEALTH_STATUSES.includes(data.health)) {
    return `health must be one of: ${VALID_HEALTH_STATUSES.join(", ")}`;
  }

  return null;
}

// Validate payload for updating a squad (PATCH)
export function validateUpdateSquad(data) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return "Update payload cannot be empty";
  }

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      return "Squad name cannot be empty";
    }
    if (data.name.length > 150) {
      return "Squad name must not exceed 150 characters";
    }
  }

  if (data.badge_code !== undefined) {
    if (typeof data.badge_code !== "string" || !data.badge_code.trim()) {
      return "badge_code cannot be empty";
    }
    if (data.badge_code.length > 32) {
      return "badge_code must not exceed 32 characters";
    }
  }

  if (data.focus_domain !== undefined) {
    if (typeof data.focus_domain !== "string" || !data.focus_domain.trim()) {
      return "focus_domain cannot be empty";
    }
    if (data.focus_domain.length > 255) {
      return "focus_domain must not exceed 255 characters";
    }
  }

  if (data.lead_user_id !== undefined) {
    if (typeof data.lead_user_id !== "string" || !data.lead_user_id.trim()) {
      return "lead_user_id cannot be empty";
    }
  }

  if (data.budget_hours !== undefined) {
    const budget = Number(data.budget_hours);
    if (isNaN(budget) || budget < 0) {
      return "budget_hours must be a non-negative number";
    }
  }

  if (data.spent_hours !== undefined) {
    const spent = Number(data.spent_hours);
    if (isNaN(spent) || spent < 0) {
      return "spent_hours must be a non-negative number";
    }
  }

  if (data.health !== undefined && !VALID_HEALTH_STATUSES.includes(data.health)) {
    return `health must be one of: ${VALID_HEALTH_STATUSES.join(", ")}`;
  }

  if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
    return "is_active must be a boolean";
  }

  return null;
}
