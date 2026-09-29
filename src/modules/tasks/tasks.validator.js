const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_TASK_TYPES = ["PRE_PLANNING", "AD_HOC_EMERGENCY", "RECURRING_ROUTINE"];
const VALID_CATEGORIES = [
  "DEVELOPMENT",
  "TESTING_QA",
  "BUG_FIX",
  "REPORTING",
  "UI_UX",
  "DEVOPS",
  "MEETING",
];
const VALID_PRIORITIES = ["P1_HIGH", "P2_MEDIUM", "P3_LOW"];
const VALID_STATUSES = ["TO_DO", "IN_PROGRESS", "PENDING_REVIEW", "COMPLETED"];
const VALID_RECURRENCES = ["DAILY", "WEEKLY", "MONTHLY"];

// Validate task creation input
export function validateCreateTask(data) {
  if (!data || typeof data !== "object") {
    return "Request body must be a valid JSON object";
  }

  if (!data.title || typeof data.title !== "string" || data.title.trim().length < 3) {
    return "Task title is required and must be at least 3 characters";
  }

  if (data.title.trim().length > 255) {
    return "Task title cannot exceed 255 characters";
  }

  if (!data.squad_id || !UUID_REGEX.test(data.squad_id)) {
    return "A valid squad_id (UUID) is required";
  }

  if (data.task_type && !VALID_TASK_TYPES.includes(data.task_type.toUpperCase())) {
    return `Invalid task_type. Must be one of: ${VALID_TASK_TYPES.join(", ")}`;
  }

  const normalizedTaskType = (data.task_type || "PRE_PLANNING").toUpperCase();

  if (normalizedTaskType === "RECURRING_ROUTINE") {
    if (!data.recurrence_frequency || !VALID_RECURRENCES.includes(data.recurrence_frequency.toUpperCase())) {
      return `recurrence_frequency is required for RECURRING_ROUTINE tasks. Must be one of: ${VALID_RECURRENCES.join(", ")}`;
    }
  }

  if (data.category && !VALID_CATEGORIES.includes(data.category.toUpperCase())) {
    return `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`;
  }

  if (data.priority && !VALID_PRIORITIES.includes(data.priority.toUpperCase())) {
    return `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`;
  }

  if (data.status && !VALID_STATUSES.includes(data.status.toUpperCase())) {
    return `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`;
  }

  if (data.estimated_hours !== undefined) {
    const hours = Number(data.estimated_hours);
    if (isNaN(hours) || hours <= 0 || hours > 500) {
      return "estimated_hours must be a positive number between 0.25 and 500.0";
    }
  }

  if (data.due_date && isNaN(Date.parse(data.due_date))) {
    return "due_date must be a valid ISO timestamp";
  }

  return null;
}

// Validate task update input
export function validateUpdateTask(data) {
  if (!data || typeof data !== "object") {
    return "Request body must be a valid JSON object";
  }

  if (data.title !== undefined) {
    if (typeof data.title !== "string" || data.title.trim().length < 3) {
      return "Task title must be at least 3 characters";
    }
    if (data.title.trim().length > 255) {
      return "Task title cannot exceed 255 characters";
    }
  }

  if (data.squad_id !== undefined && !UUID_REGEX.test(data.squad_id)) {
    return "squad_id must be a valid UUID";
  }

  if (data.task_type && !VALID_TASK_TYPES.includes(data.task_type.toUpperCase())) {
    return `Invalid task_type. Must be one of: ${VALID_TASK_TYPES.join(", ")}`;
  }

  if (data.category && !VALID_CATEGORIES.includes(data.category.toUpperCase())) {
    return `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`;
  }

  if (data.priority && !VALID_PRIORITIES.includes(data.priority.toUpperCase())) {
    return `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`;
  }

  if (data.status && !VALID_STATUSES.includes(data.status.toUpperCase())) {
    return `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`;
  }

  if (data.recurrence_frequency && !VALID_RECURRENCES.includes(data.recurrence_frequency.toUpperCase())) {
    return `Invalid recurrence_frequency. Must be one of: ${VALID_RECURRENCES.join(", ")}`;
  }

  if (data.estimated_hours !== undefined) {
    const hours = Number(data.estimated_hours);
    if (isNaN(hours) || hours <= 0 || hours > 500) {
      return "estimated_hours must be a positive number between 0.25 and 500.0";
    }
  }

  if (data.is_blocked !== undefined && typeof data.is_blocked !== "boolean") {
    return "is_blocked must be a boolean";
  }

  if (data.due_date && isNaN(Date.parse(data.due_date))) {
    return "due_date must be a valid ISO timestamp";
  }

  return null;
}
