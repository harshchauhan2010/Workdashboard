import { resumeTimerController } from "@/modules/timers/timers.controller";

/**
 * PATCH /api/timers/resume - Resume paused timer
 */
export async function PATCH(request) {
  return resumeTimerController(request);
}

/**
 * POST /api/timers/resume - Resume paused timer (alternative method)
 */
export async function POST(request) {
  return resumeTimerController(request);
}
