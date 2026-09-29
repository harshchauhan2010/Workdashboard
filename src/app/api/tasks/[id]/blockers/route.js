import {
  getTaskBlockersController,
  reportTaskBlockerController,
} from "@/modules/blockers/blockers.controller";

/**
 * GET /api/tasks/:id/blockers - List all blockers on a task
 */
export async function GET(request, context) {
  return getTaskBlockersController(request, context);
}

/**
 * POST /api/tasks/:id/blockers - Report a new blocker on a task
 */
export async function POST(request, context) {
  return reportTaskBlockerController(request, context);
}
