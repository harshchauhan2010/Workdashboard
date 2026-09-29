export function validateCreateWorkLog(data) {
  if (!data || typeof data !== "object") {
    return "Request body must be a valid JSON object";
  }

  if (data.hours === undefined || data.hours === null) {
    return "hours is required";
  }

  const hours = Number(data.hours);
  if (isNaN(hours) || hours <= 0 || hours > 24.0) {
    return "hours must be a positive number between 0.01 and 24.00";
  }

  if (!data.notes || typeof data.notes !== "string" || data.notes.trim().length < 3) {
    return "notes is required and must be at least 3 characters";
  }

  if (data.notes.trim().length > 2000) {
    return "notes cannot exceed 2000 characters";
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (data.user_id && !UUID_REGEX.test(data.user_id)) {
    return "user_id must be a valid UUID";
  }

  if (data.log_timestamp && isNaN(Date.parse(data.log_timestamp))) {
    return "log_timestamp must be a valid ISO date string";
  }

  return null;
}
