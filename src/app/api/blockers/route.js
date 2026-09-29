import { listUnresolvedBlockersController } from "@/modules/blockers/blockers.controller";

/**
 * GET /api/blockers - List all unresolved blockers (Manager view)
 */
export async function GET(request) {
  return listUnresolvedBlockersController(request);
}
