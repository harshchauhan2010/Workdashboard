import {
  getTaskAssignmentsController,
  createTaskAssignmentsController,
} from "@/modules/assignments/assignments.controller";

/**
 * GET /api/tasks/:id/assignments - List all assigned developers for a task
 */
export async function GET(request, context) {
  return getTaskAssignmentsController(request, context);
}

/**
 * POST /api/tasks/:id/assignments - Assign developer(s) to a task (Single / Multi / Entire Team)
 */
export async function POST(request, context) {
  return createTaskAssignmentsController(request, context);
}
