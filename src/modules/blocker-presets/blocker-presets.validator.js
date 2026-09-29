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

// Validate blocker preset creation payload
export function validateCreatePreset(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Request body must be a valid JSON object"] };
  }

  // Key slug validation
  if (!data.key_slug || typeof data.key_slug !== "string" || data.key_slug.trim().length === 0) {
    errors.push("key_slug is required (e.g. 'api_keys', 'database_timeout')");
  } else {
    const slugRegex = /^[a-z0-9_-]+$/i;
    if (!slugRegex.test(data.key_slug.trim())) {
      errors.push("key_slug must contain only alphanumeric characters, dashes, or underscores");
    }
  }

  // Label validation
  if (!data.label || typeof data.label !== "string" || data.label.trim().length === 0) {
    errors.push("label is required (e.g. 'API Keys', 'DB Replica Lag')");
  }

  // Category validation
  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`Invalid category: ${data.category}. Valid values are: ${VALID_CATEGORIES.join(", ")}`);
  }

  // Severity validation
  if (data.severity && !VALID_SEVERITIES.includes(data.severity)) {
    errors.push(`Invalid severity: ${data.severity}. Valid values are: ${VALID_SEVERITIES.join(", ")}`);
  }

  // Template fields validation
  if (!data.description_template || typeof data.description_template !== "string" || data.description_template.trim().length === 0) {
    errors.push("description_template is required");
  }

  if (!data.impact_template || typeof data.impact_template !== "string" || data.impact_template.trim().length === 0) {
    errors.push("impact_template is required");
  }

  if (!data.mitigation_template || typeof data.mitigation_template !== "string" || data.mitigation_template.trim().length === 0) {
    errors.push("mitigation_template is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
