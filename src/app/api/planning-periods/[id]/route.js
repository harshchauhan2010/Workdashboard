import {
  getPeriodByIdController,
  updatePeriodController,
  deletePeriodController,
} from "@/modules/planning-periods/planning-periods.controller";

/**
 * GET /api/planning-periods/:id - Get period by ID
 */
export async function GET(request, context) {
  return getPeriodByIdController(request, context);
}

/**
 * PUT /api/planning-periods/:id - Update period
 */
export async function PUT(request, context) {
  return updatePeriodController(request, context);
}

/**
 * DELETE /api/planning-periods/:id - Delete period
 */
export async function DELETE(request, context) {
  return deletePeriodController(request, context);
}
