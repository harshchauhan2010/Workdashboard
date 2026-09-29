const VALID_CATEGORIES = [
  "TECHNICAL_IMPEDIMENT",
  "DEPENDENCY",
  "REVIEW_BOTTLENECK",
  "RESOURCE_CAPACITY",
  "SCOPE_CREEP",
  "INFRASTRUCTURE",
];

const VALID_SEVERITIES = [
  "CRITICAL_BLOCKER",
  "HIGH_DELIVERY_RISK",
];

// Validate blocker creation input
export function validateCreateBlocker(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Request body must be a valid JSON object"] };
  }

  // Reason validation
  if (!data.reason || typeof data.reason !== "string" || data.reason.trim().length === 0) {
    errors.push("Reason is required and cannot be empty");
  }

  // Business impact validation
  if (!data.business_impact || typeof data.business_impact !== "string" || data.business_impact.trim().length === 0) {
    errors.push("Business impact is required and cannot be empty");
  }

  // Category validation
  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`Invalid category: ${data.category}. Valid values are: ${VALID_CATEGORIES.join(", ")}`);
  }

  // Severity validation
  if (data.severity && !VALID_SEVERITIES.includes(data.severity)) {
    errors.push(`Invalid severity: ${data.severity}. Valid values are: ${VALID_SEVERITIES.join(", ")}`);
  }

  // Expected resolution date validation
  if (data.expected_resolution_date) {
    const d = new Date(data.expected_resolution_date);
    if (isNaN(d.getTime())) {
      errors.push("expected_resolution_date must be a valid ISO date format (e.g. YYYY-MM-DD)");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate blocker resolution input
export function validateResolveBlocker(data) {
  const errors = [];

  if (data && data.mitigation_action && typeof data.mitigation_action !== "string") {
    errors.push("mitigation_action must be a string");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
