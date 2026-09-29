import { getMyCapacityController } from "@/modules/capacity/capacity.controller";

/**
 * GET /api/capacity/me - Get personal capacity stats for current authenticated developer
 */
export async function GET(request) {
  return getMyCapacityController(request);
}
