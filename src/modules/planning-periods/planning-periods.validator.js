const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Check if string is a valid UUID
 */
export function isValidUUID(id) {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

/**
 * Check if string is a valid ISO date (YYYY-MM-DD)
 */
export function isValidDateString(dateStr) {
  if (typeof dateStr !== "string" || !DATE_REGEX.test(dateStr.trim())) {
    return false;
  }
  const date = new Date(dateStr.trim());
  return !isNaN(date.getTime());
}

/**
 * Validate Create Planning Period payload
 */
export function validateCreatePeriod(data) {
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
  } else if (data.name.trim().length > 100) {
    errors.push("name must not exceed 100 characters");
  }

  // start_date / startDate
  const startDate = data.start_date || data.startDate;
  if (!startDate || !isValidDateString(startDate)) {
    errors.push("start_date is required and must be a valid date format (YYYY-MM-DD)");
  }

  // end_date / endDate
  const endDate = data.end_date || data.endDate;
  if (!endDate || !isValidDateString(endDate)) {
    errors.push("end_date is required and must be a valid date format (YYYY-MM-DD)");
  }

  // Date comparison: end_date >= start_date
  if (startDate && endDate && isValidDateString(startDate) && isValidDateString(endDate)) {
    if (new Date(endDate.trim()) < new Date(startDate.trim())) {
      errors.push("end_date must be greater than or equal to start_date");
    }
  }

  // is_current / isCurrent
  const isCurrent = data.is_current !== undefined ? data.is_current : data.isCurrent;
  if (isCurrent !== undefined && typeof isCurrent !== "boolean") {
    errors.push("is_current must be a boolean value");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Update Planning Period payload
 */
export function validateUpdatePeriod(data, existingRecord = null) {
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
    } else if (data.name.trim().length > 100) {
      errors.push("name must not exceed 100 characters");
    }
  }

  // start_date
  const startDate = data.start_date !== undefined ? data.start_date : data.startDate;
  if (startDate !== undefined) {
    if (!isValidDateString(startDate)) {
      errors.push("start_date must be a valid date format (YYYY-MM-DD)");
    }
  }

  // end_date
  const endDate = data.end_date !== undefined ? data.end_date : data.endDate;
  if (endDate !== undefined) {
    if (!isValidDateString(endDate)) {
      errors.push("end_date must be a valid date format (YYYY-MM-DD)");
    }
  }

  // Check date relationship with existing or incoming values
  const effectiveStart = startDate || existingRecord?.start_date;
  const effectiveEnd = endDate || existingRecord?.end_date;

  if (
    effectiveStart &&
    effectiveEnd &&
    isValidDateString(effectiveStart) &&
    isValidDateString(effectiveEnd)
  ) {
    if (new Date(effectiveEnd) < new Date(effectiveStart)) {
      errors.push("end_date must be greater than or equal to start_date");
    }
  }

  // is_current
  const isCurrent = data.is_current !== undefined ? data.is_current : data.isCurrent;
  if (isCurrent !== undefined && typeof isCurrent !== "boolean") {
    errors.push("is_current must be a boolean value");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
