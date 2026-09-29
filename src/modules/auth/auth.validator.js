// Auth validation helpers
export function validateClerkId(clerkId) {
  if (!clerkId || typeof clerkId !== "string" || !clerkId.trim()) {
    return { valid: false, error: "Clerk ID is required" };
  }
  return { valid: true };
}
