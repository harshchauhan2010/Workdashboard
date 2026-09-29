import {
  getTaskWorkLogsController,
  createTaskWorkLogController,
} from "@/modules/work-logs/work-logs.controller";

/**
 * GET /api/tasks/:id/work-logs - List all time logs for a task
 */
export async function GET(request, context) {
  return getTaskWorkLogsController(request, context);
}

/**
 * POST /api/tasks/:id/work-logs - Log hours worked on a task
 */
export async function POST(request, context) {
  return createTaskWorkLogController(request, context);
}
