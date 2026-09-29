import {
  getSquadByIdController,
  updateSquadController,
  deleteSquadController,
} from "@/modules/squads/squads.controller";

// GET /api/squads/:id - Get squad details with active members & task statistics
export async function GET(request, context) {
  return getSquadByIdController(request, context);
}

// PATCH /api/squads/:id - Update squad info, budget, or health
export async function PATCH(request, context) {
  return updateSquadController(request, context);
}

// DELETE /api/squads/:id - Soft-delete / deactivate squad
export async function DELETE(request, context) {
  return deleteSquadController(request, context);
}
