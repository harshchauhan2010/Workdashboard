const VALID_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 */
export function isValidUUID(id) {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

/**
 * Validate Create Recurring Routine payload
 */
export function validateCreateRoutine(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Request body must be a valid JSON object"],
    };
  }

  // title
  if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
    errors.push("title is required and must be a non-empty string");
  } else if (data.title.trim().length > 255) {
    errors.push("title must not exceed 255 characters");
  }

  // schedule_label / scheduleLabel
  const scheduleLabel = data.schedule_label || data.scheduleLabel;
  if (
    !scheduleLabel ||
    typeof scheduleLabel !== "string" ||
    !scheduleLabel.trim()
  ) {
    errors.push("schedule_label is required and must be a non-empty string");
  } else if (scheduleLabel.trim().length > 100) {
    errors.push("schedule_label must not exceed 100 characters");
  }

  // frequency
  if (data.frequency !== undefined) {
    if (!VALID_FREQUENCIES.includes(data.frequency)) {
      errors.push(
        `frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`
      );
    }
  }

  // allocated_hours / allocatedHours
  const hours =
    data.allocated_hours !== undefined
      ? data.allocated_hours
      : data.allocatedHours;
  if (hours !== undefined) {
    const num = Number(hours);
    if (isNaN(num) || num <= 0 || num > 40) {
      errors.push("allocated_hours must be a positive number up to 40.00");
    }
  }

  // user_id
  const userId = data.user_id || data.userId;
  if (userId !== undefined && userId !== null && !isValidUUID(userId)) {
    errors.push("user_id must be a valid UUID");
  }

  // squad_id
  const squadId = data.squad_id || data.squadId;
  if (squadId !== undefined && squadId !== null && squadId !== "" && !isValidUUID(squadId)) {
    errors.push("squad_id must be a valid UUID");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Update Recurring Routine payload
 */
export function validateUpdateRoutine(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Request body must be a valid JSON object"],
    };
  }

  // title
  if (data.title !== undefined) {
    if (typeof data.title !== "string" || !data.title.trim()) {
      errors.push("title must be a non-empty string");
    } else if (data.title.trim().length > 255) {
      errors.push("title must not exceed 255 characters");
    }
  }

  // schedule_label / scheduleLabel
  const scheduleLabel = data.schedule_label || data.scheduleLabel;
  if (scheduleLabel !== undefined) {
    if (typeof scheduleLabel !== "string" || !scheduleLabel.trim()) {
      errors.push("schedule_label must be a non-empty string");
    } else if (scheduleLabel.trim().length > 100) {
      errors.push("schedule_label must not exceed 100 characters");
    }
  }

  // frequency
  if (data.frequency !== undefined) {
    if (!VALID_FREQUENCIES.includes(data.frequency)) {
      errors.push(
        `frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`
      );
    }
  }

  // allocated_hours / allocatedHours
  const hours =
    data.allocated_hours !== undefined
      ? data.allocated_hours
      : data.allocatedHours;
  if (hours !== undefined) {
    const num = Number(hours);
    if (isNaN(num) || num <= 0 || num > 40) {
      errors.push("allocated_hours must be a positive number up to 40.00");
    }
  }

  // squad_id
  const squadId = data.squad_id || data.squadId;
  if (squadId !== undefined && squadId !== null && squadId !== "" && !isValidUUID(squadId)) {
    errors.push("squad_id must be a valid UUID");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
