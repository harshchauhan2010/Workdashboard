import { listAllWorkLogsController } from "@/modules/work-logs/work-logs.controller";

/**
 * GET /api/work-logs - List all work log entries with optional filters (?user_id=, ?task_id=, ?limit=)
 */
export async function GET(request) {
  return listAllWorkLogsController(request);
}
