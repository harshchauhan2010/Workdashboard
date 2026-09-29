import {
  listPeriodsController,
  createPeriodController,
} from "@/modules/planning-periods/planning-periods.controller";

/**
 * GET /api/planning-periods - List all planning periods
 */
export async function GET(request) {
  return listPeriodsController(request);
}

/**
 * POST /api/planning-periods - Create a new planning period
 */
export async function POST(request) {
  return createPeriodController(request);
}
