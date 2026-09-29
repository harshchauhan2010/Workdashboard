import { getSquadsCapacityController } from "@/modules/capacity/capacity.controller";

/**
 * GET /api/capacity/squads - Get capacity summaries across all squads
 */
export async function GET(request) {
  return getSquadsCapacityController(request);
}
