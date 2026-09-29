import { startTimerController } from "@/modules/timers/timers.controller";

/**
 * POST /api/timers/start - Start timer on a task
 */
export async function POST(request) {
  return startTimerController(request);
}
