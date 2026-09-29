import { getUserWorkLogsController } from "@/modules/work-logs/work-logs.controller";

/**
 * GET /api/users/:id/work-logs - List all timesheets logged by a developer
 */
export async function GET(request, context) {
  return getUserWorkLogsController(request, context);
}
