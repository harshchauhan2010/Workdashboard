import {
  listRoutinesController,
  createRoutineController,
} from "@/modules/recurring-routines/recurring-routines.controller";

/**
 * GET /api/recurring-routines - List routines with optional filters
 */
export async function GET(request) {
  return listRoutinesController(request);
}

/**
 * POST /api/recurring-routines - Create a new recurring routine
 */
export async function POST(request) {
  return createRoutineController(request);
}
