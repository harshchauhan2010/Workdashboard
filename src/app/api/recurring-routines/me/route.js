import { getMyRoutinesController } from "@/modules/recurring-routines/recurring-routines.controller";

/**
 * GET /api/recurring-routines/me - Get recurring routines for authenticated user
 */
export async function GET(request) {
  return getMyRoutinesController(request);
}
