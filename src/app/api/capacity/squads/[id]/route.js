import { getSquadCapacityByIdController } from "@/modules/capacity/capacity.controller";

/**
 * GET /api/capacity/squads/:id - Get capacity summary for a specific squad
 */
export async function GET(request, context) {
  return getSquadCapacityByIdController(request, context);
}
