// Validate payload for adding member to squad
export function validateAddMember(data) {
  if (!data || typeof data !== "object") {
    return "Request body is required";
  }

  if (!data.user_id || typeof data.user_id !== "string" || !data.user_id.trim()) {
    return "user_id is required";
  }

  if (data.allocation_percentage !== undefined) {
    const alloc = Number(data.allocation_percentage);
    if (isNaN(alloc) || alloc < 10 || alloc > 100) {
      return "allocation_percentage must be an integer between 10 and 100";
    }
  }

  return null;
}

// Validate payload for updating member allocation
export function validateUpdateAllocation(data) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return "Update payload cannot be empty";
  }

  if (data.allocation_percentage === undefined) {
    return "allocation_percentage is required";
  }

  const alloc = Number(data.allocation_percentage);
  if (isNaN(alloc) || alloc < 10 || alloc > 100) {
    return "allocation_percentage must be an integer between 10 and 100";
  }

  return null;
}
