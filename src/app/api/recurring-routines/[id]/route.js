import {
  getRoutineByIdController,
  updateRoutineController,
  deleteRoutineController,
} from "@/modules/recurring-routines/recurring-routines.controller";

/**
 * GET /api/recurring-routines/:id - Get routine by ID
 */
export async function GET(request, context) {
  return getRoutineByIdController(request, context);
}

/**
 * PUT /api/recurring-routines/:id - Update routine
 */
export async function PUT(request, context) {
  return updateRoutineController(request, context);
}

/**
 * DELETE /api/recurring-routines/:id - Delete routine
 */
export async function DELETE(request, context) {
  return deleteRoutineController(request, context);
}
