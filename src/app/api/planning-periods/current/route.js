import { getCurrentPeriodController } from "@/modules/planning-periods/planning-periods.controller";

/**
 * GET /api/planning-periods/current - Get active planning period
 */
export async function GET(request) {
  return getCurrentPeriodController(request);
}
