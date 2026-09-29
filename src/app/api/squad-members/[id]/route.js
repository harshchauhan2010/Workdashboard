import {
  updateMemberAllocationController,
  removeSquadMemberController,
} from "@/modules/squad-members/squad-members.controller";

// PATCH /api/squad-members/:id - Update member allocation percentage
export async function PATCH(request, context) {
  return updateMemberAllocationController(request, context);
}

// DELETE /api/squad-members/:id - Soft remove member from squad
export async function DELETE(request, context) {
  return removeSquadMemberController(request, context);
}
