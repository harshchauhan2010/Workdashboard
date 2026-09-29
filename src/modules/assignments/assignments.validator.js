const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_SPLIT_MODES = [
  "SINGLE_DEVELOPER",
  "MULTIPLE_DEVELOPERS",
  "ENTIRE_TEAM",
];

export function validateCreateAssignments(data) {
  if (!data || typeof data !== "object") {
    return "Request body must be a valid JSON object";
  }

  const splitMode = (data.split_mode || "SINGLE_DEVELOPER").toUpperCase();
  if (!VALID_SPLIT_MODES.includes(splitMode)) {
    return `Invalid split_mode. Must be one of: ${VALID_SPLIT_MODES.join(", ")}`;
  }

  if (splitMode === "ENTIRE_TEAM") {
    const hoursPerPerson = Number(data.assigned_hours_per_person);
    if (isNaN(hoursPerPerson) || hoursPerPerson <= 0 || hoursPerPerson > 500) {
      return "assigned_hours_per_person must be a positive number between 0.25 and 500.0 for ENTIRE_TEAM mode";
    }
    return null;
  }

  // For SINGLE_DEVELOPER and MULTIPLE_DEVELOPERS
  if (!Array.isArray(data.assignments) || data.assignments.length === 0) {
    return "assignments must be a non-empty array of developer assignments";
  }

  if (splitMode === "SINGLE_DEVELOPER" && data.assignments.length !== 1) {
    return "SINGLE_DEVELOPER mode requires exactly 1 assignment in the assignments array";
  }

  if (splitMode === "MULTIPLE_DEVELOPERS" && data.assignments.length < 2) {
    return "MULTIPLE_DEVELOPERS mode requires at least 2 assignments in the assignments array";
  }

  const seenUserIds = new Set();

  for (let i = 0; i < data.assignments.length; i++) {
    const item = data.assignments[i];
    if (!item || typeof item !== "object") {
      return `assignments[${i}] must be a valid object`;
    }

    if (!item.user_id || !UUID_REGEX.test(item.user_id)) {
      return `assignments[${i}].user_id must be a valid UUID`;
    }

    if (seenUserIds.has(item.user_id)) {
      return `Duplicate user_id '${item.user_id}' detected in assignments. Each developer can only be assigned once per task.`;
    }
    seenUserIds.add(item.user_id);

    const hours = Number(item.assigned_hours);
    if (isNaN(hours) || hours <= 0 || hours > 500) {
      return `assignments[${i}].assigned_hours must be a positive number between 0.25 and 500.0`;
    }
  }

  return null;
}
