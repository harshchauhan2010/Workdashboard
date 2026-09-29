const VALID_CATEGORIES = [
  "DEVELOPMENT",
  "TESTING_QA",
  "BUG_FIX",
  "REPORTING",
  "UI_UX",
  "DEVOPS",
  "MEETING",
];

const VALID_TASK_TYPES = [
  "PRE_PLANNING",
  "AD_HOC_EMERGENCY",
  "RECURRING_ROUTINE",
];

const VALID_PRIORITIES = ["P1_HIGH", "P2_MEDIUM", "P3_LOW"];

const VALID_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate Create Task Template payload
 */
export function validateCreateTemplate(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Request body must be a valid JSON object"],
    };
  }

  // name
  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    errors.push("name is required and must be a non-empty string");
  } else if (data.name.trim().length > 150) {
    errors.push("name must not exceed 150 characters");
  }

  // default_task_title
  if (
    !data.default_task_title ||
    typeof data.default_task_title !== "string" ||
    !data.default_task_title.trim()
  ) {
    errors.push("default_task_title is required and must be a non-empty string");
  } else if (data.default_task_title.trim().length > 255) {
    errors.push("default_task_title must not exceed 255 characters");
  }

  // category
  if (data.category !== undefined) {
    if (!VALID_CATEGORIES.includes(data.category)) {
      errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }
  }

  // task_type
  if (data.task_type !== undefined) {
    if (!VALID_TASK_TYPES.includes(data.task_type)) {
      errors.push(`task_type must be one of: ${VALID_TASK_TYPES.join(", ")}`);
    }
  }

  // recurrence_frequency
  if (
    data.recurrence_frequency !== undefined &&
    data.recurrence_frequency !== null &&
    data.recurrence_frequency !== ""
  ) {
    if (!VALID_FREQUENCIES.includes(data.recurrence_frequency)) {
      errors.push(
        `recurrence_frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`
      );
    }
  }

  // default_estimated_hours
  if (data.default_estimated_hours !== undefined) {
    const num = Number(data.default_estimated_hours);
    if (isNaN(num) || num <= 0 || num > 100) {
      errors.push(
        "default_estimated_hours must be a positive number up to 100.00"
      );
    }
  }

  // default_priority
  if (data.default_priority !== undefined) {
    if (!VALID_PRIORITIES.includes(data.default_priority)) {
      errors.push(
        `default_priority must be one of: ${VALID_PRIORITIES.join(", ")}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Update Task Template payload
 */
export function validateUpdateTemplate(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Request body must be a valid JSON object"],
    };
  }

  // name
  if (data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      errors.push("name must be a non-empty string");
    } else if (data.name.trim().length > 150) {
      errors.push("name must not exceed 150 characters");
    }
  }

  // default_task_title
  if (data.default_task_title !== undefined) {
    if (
      typeof data.default_task_title !== "string" ||
      !data.default_task_title.trim()
    ) {
      errors.push("default_task_title must be a non-empty string");
    } else if (data.default_task_title.trim().length > 255) {
      errors.push("default_task_title must not exceed 255 characters");
    }
  }

  // category
  if (data.category !== undefined) {
    if (!VALID_CATEGORIES.includes(data.category)) {
      errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }
  }

  // task_type
  if (data.task_type !== undefined) {
    if (!VALID_TASK_TYPES.includes(data.task_type)) {
      errors.push(`task_type must be one of: ${VALID_TASK_TYPES.join(", ")}`);
    }
  }

  // recurrence_frequency
  if (
    data.recurrence_frequency !== undefined &&
    data.recurrence_frequency !== null &&
    data.recurrence_frequency !== ""
  ) {
    if (!VALID_FREQUENCIES.includes(data.recurrence_frequency)) {
      errors.push(
        `recurrence_frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`
      );
    }
  }

  // default_estimated_hours
  if (data.default_estimated_hours !== undefined) {
    const num = Number(data.default_estimated_hours);
    if (isNaN(num) || num <= 0 || num > 100) {
      errors.push(
        "default_estimated_hours must be a positive number up to 100.00"
      );
    }
  }

  // default_priority
  if (data.default_priority !== undefined) {
    if (!VALID_PRIORITIES.includes(data.default_priority)) {
      errors.push(
        `default_priority must be one of: ${VALID_PRIORITIES.join(", ")}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate template ID
 */
export function isValidUUID(id) {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}
