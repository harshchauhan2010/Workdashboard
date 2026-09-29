import { getMeController } from "@/modules/auth/auth.controller";

/**
 * GET /api/auth/me
 * Retrieves current authenticated user details from database
 */
export async function GET(request) {
  return getMeController(request);
}
