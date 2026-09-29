import {
  getBlockerByIdController,
  resolveBlockerController,
  deleteBlockerController,
} from "@/modules/blockers/blockers.controller";

/**
 * GET /api/blockers/:id - Get blocker details
 */
export async function GET(request, context) {
  return getBlockerByIdController(request, context);
}

/**
 * PATCH /api/blockers/:id - Resolve blocker
 */
export async function PATCH(request, context) {
  return resolveBlockerController(request, context);
}

/**
 * DELETE /api/blockers/:id - Delete blocker
 */
export async function DELETE(request, context) {
  return deleteBlockerController(request, context);
}
