import {
  getMyTimerController,
  discardTimerController,
} from "@/modules/timers/timers.controller";

/**
 * GET /api/timers - Get active timer
 */
export async function GET(request) {
  return getMyTimerController(request);
}

/**
 * DELETE /api/timers - Discard active timer without logging
 */
export async function DELETE(request) {
  return discardTimerController(request);
}
