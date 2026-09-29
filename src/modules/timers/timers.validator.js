// UUID regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Validate timer start payload
export function validateStartTimer(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Request body must be a valid JSON object"] };
  }

  if (!data.task_id || typeof data.task_id !== "string" || !UUID_REGEX.test(data.task_id.trim())) {
    errors.push("task_id is required and must be a valid UUID");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate timer pause payload
export function validatePauseTimer(data) {
  const errors = [];

  if (data && data.seconds_elapsed !== undefined) {
    const s = Number(data.seconds_elapsed);
    if (!Number.isInteger(s) || s < 0) {
      errors.push("seconds_elapsed must be a non-negative integer");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate timer stop payload
export function validateStopTimer(data) {
  const errors = [];

  if (data && data.seconds_elapsed !== undefined) {
    const s = Number(data.seconds_elapsed);
    if (!Number.isInteger(s) || s < 0) {
      errors.push("seconds_elapsed must be a non-negative integer");
    }
  }

  if (data && data.notes !== undefined && typeof data.notes !== "string") {
    errors.push("notes must be a string");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
