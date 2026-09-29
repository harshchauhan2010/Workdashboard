import {
  getMyTimerController,
  discardTimerController,
} from "@/modules/timers/timers.controller";

/**
 * GET /api/timers/me - Get current developer's active timer
 */
export async function GET(request) {
  return getMyTimerController(request);
}

/**
 * DELETE /api/timers/me - Discard current developer's active timer
 */
export async function DELETE(request) {
  return discardTimerController(request);
}
