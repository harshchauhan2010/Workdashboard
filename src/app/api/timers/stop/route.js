import { stopTimerController } from "@/modules/timers/timers.controller";

/**
 * POST /api/timers/stop - Stop timer and auto-create timesheet work log
 */
export async function POST(request) {
  return stopTimerController(request);
}
