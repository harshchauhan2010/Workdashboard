import { getDeveloperCapacityByIdController } from "@/modules/capacity/capacity.controller";

/**
 * GET /api/capacity/developers/:id - Get capacity metrics for a specific developer
 */
export async function GET(request, context) {
  return getDeveloperCapacityByIdController(request, context);
}
