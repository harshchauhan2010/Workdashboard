import { pauseTimerController } from "@/modules/timers/timers.controller";

/**
 * PATCH /api/timers/pause - Pause running timer
 */
export async function PATCH(request) {
  return pauseTimerController(request);
}

/**
 * POST /api/timers/pause - Pause running timer (alternative method)
 */
export async function POST(request) {
  return pauseTimerController(request);
}
